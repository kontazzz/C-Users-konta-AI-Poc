import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// 既存 dog_food_db(schema.sql / seed_reference.sql)から build_database.py で
// 生成した SQLite を読み取り専用で利用する。DB構造は一切変更しない。
// Node.js 標準の node:sqlite を使用(ネイティブビルド不要、Node 22.5 以上)。

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    const dbPath =
      process.env.FOOD_DB_PATH ?? path.join(process.cwd(), "dog_food_jp.sqlite");
    db = new DatabaseSync(dbPath, { readOnly: true });
  }
  return db;
}

export interface ProductSummary {
  product_id: number;
  manufacturer_name: string | null;
  brand_name: string;
  product_name: string;
  price_band: string | null;
  avg_price_per_kg: number | null;
  life_stages: string | null;
  breed_sizes: string | null;
  features: string | null;
  potential_allergens: string | null;
}

export function searchProducts(query: string, limit = 20): ProductSummary[] {
  const like = `%${query}%`;
  return getDb()
    .prepare(
      `SELECT product_id, manufacturer_name, brand_name, product_name,
              price_band, avg_price_per_kg, life_stages, breed_sizes,
              features, potential_allergens
       FROM v_in_scope_products
       WHERE product_name LIKE :q OR brand_name LIKE :q OR manufacturer_name LIKE :q
       ORDER BY brand_name, product_name
       LIMIT :limit`
    )
    .all({ q: like, limit }) as unknown as ProductSummary[];
}

export function getProduct(productId: number): ProductSummary | null {
  const row = getDb()
    .prepare(`SELECT * FROM v_in_scope_products WHERE product_id = :product_id`)
    .get({ product_id: productId }) as unknown as ProductSummary | undefined;
  return row ?? null;
}

export interface ProductIngredient {
  display_name: string;
  ingredient_order: number | null;
  is_primary: number;
  confidence: number;
}

export function getProductIngredients(productId: number): ProductIngredient[] {
  return getDb()
    .prepare(
      `SELECT display_name, ingredient_order, is_primary, confidence
       FROM product_ingredients
       WHERE product_id = :product_id
       ORDER BY ingredient_order`
    )
    .all({ product_id: productId }) as unknown as ProductIngredient[];
}

export interface ProductAllergen {
  allergen_name: string;
  assertion: string;
  assertion_source: string;
  confidence: number;
}

export function getProductAllergens(productId: number): ProductAllergen[] {
  return getDb()
    .prepare(
      `SELECT ag.name AS allergen_name, paa.assertion, paa.assertion_source, paa.confidence
       FROM product_allergen_assertions paa
       JOIN allergen_groups ag ON ag.allergen_group_id = paa.allergen_group_id
       WHERE paa.product_id = :product_id`
    )
    .all({ product_id: productId }) as unknown as ProductAllergen[];
}

// 以下3クエリは similarity_queries.sql の内容をそのまま利用(LIMIT のみ追加)。

export interface SimilarFood {
  product_id: number;
  brand_name: string;
  product_name: string;
}

export function getSimilarPriceFoods(productId: number, limit = 5): SimilarFood[] {
  return getDb()
    .prepare(
      `SELECT
         candidate.product_id,
         candidate.brand_name,
         candidate.product_name
       FROM v_in_scope_products target
       JOIN v_in_scope_products candidate
         ON candidate.product_id <> target.product_id
        AND candidate.market_country = target.market_country
        AND candidate.price_band = target.price_band
       WHERE target.product_id = :product_id
       ORDER BY
         ABS(COALESCE(candidate.avg_price_per_kg, 0) - COALESCE(target.avg_price_per_kg, 0)),
         candidate.brand_name,
         candidate.product_name
       LIMIT :limit`
    )
    .all({ product_id: productId, limit }) as unknown as SimilarFood[];
}

export function getSimilarIngredientFoods(productId: number, limit = 5): SimilarFood[] {
  return getDb()
    .prepare(
      `WITH target_ingredients AS (
         SELECT ingredient_id
         FROM product_ingredients
         WHERE product_id = :product_id
           AND product_id IN (SELECT product_id FROM v_in_scope_products)
       ),
       candidate_ingredients AS (
         SELECT product_id, ingredient_id
         FROM product_ingredients
         WHERE product_id <> :product_id
           AND product_id IN (SELECT product_id FROM v_in_scope_products)
       ),
       intersection_counts AS (
         SELECT ci.product_id, COUNT(*) AS intersection_count
         FROM candidate_ingredients ci
         JOIN target_ingredients ti ON ti.ingredient_id = ci.ingredient_id
         GROUP BY ci.product_id
       ),
       union_counts AS (
         SELECT p.product_id, COUNT(DISTINCT ingredient_id) AS union_count
         FROM products p
         JOIN (
           SELECT product_id, ingredient_id FROM product_ingredients
           UNION
           SELECT p2.product_id, ti.ingredient_id
           FROM products p2
           CROSS JOIN target_ingredients ti
           WHERE p2.product_id <> :product_id
             AND p2.product_id IN (SELECT product_id FROM v_in_scope_products)
         ) u ON u.product_id = p.product_id
         WHERE p.product_id <> :product_id
           AND p.product_id IN (SELECT product_id FROM v_in_scope_products)
         GROUP BY p.product_id
       )
       SELECT
         p.product_id,
         b.name AS brand_name,
         p.name AS product_name,
         COALESCE(ic.intersection_count, 0) * 1.0 / NULLIF(uc.union_count, 0) AS ingredient_similarity_score
       FROM products p
       JOIN brands b ON b.brand_id = p.brand_id
       JOIN union_counts uc ON uc.product_id = p.product_id
       LEFT JOIN intersection_counts ic ON ic.product_id = p.product_id
       WHERE p.product_id IN (SELECT product_id FROM v_in_scope_products)
         AND COALESCE(ic.intersection_count, 0) > 0
       ORDER BY ingredient_similarity_score DESC, b.name, p.name
       LIMIT :limit`
    )
    .all({ product_id: productId, limit }) as unknown as SimilarFood[];
}

export function getSameManufacturerFoods(productId: number, limit = 5): SimilarFood[] {
  return getDb()
    .prepare(
      `SELECT
         p2.product_id,
         b2.name AS brand_name,
         p2.name AS product_name
       FROM products p1
       JOIN brands b1 ON b1.brand_id = p1.brand_id
       JOIN manufacturers m ON m.manufacturer_id = b1.manufacturer_id
       JOIN brands b2 ON b2.manufacturer_id = m.manufacturer_id
       JOIN products p2 ON p2.brand_id = b2.brand_id
       WHERE p1.product_id = :product_id
         AND p2.product_id <> p1.product_id
         AND p1.product_id IN (SELECT product_id FROM v_in_scope_products)
         AND p2.product_id IN (SELECT product_id FROM v_in_scope_products)
       ORDER BY b2.name, p2.name
       LIMIT :limit`
    )
    .all({ product_id: productId, limit }) as unknown as SimilarFood[];
}
