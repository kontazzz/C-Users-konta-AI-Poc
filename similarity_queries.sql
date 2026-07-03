-- Similar price band products for a given :product_id.
SELECT
  target.product_id AS target_product_id,
  candidate.product_id AS candidate_product_id,
  candidate.brand_name,
  candidate.product_name,
  candidate.price_band,
  candidate.avg_price_per_kg
FROM v_in_scope_products target
JOIN v_in_scope_products candidate
  ON candidate.product_id <> target.product_id
 AND candidate.market_country = target.market_country
 AND candidate.price_band = target.price_band
WHERE target.product_id = :product_id
ORDER BY
  ABS(COALESCE(candidate.avg_price_per_kg, 0) - COALESCE(target.avg_price_per_kg, 0)),
  candidate.brand_name,
  candidate.product_name;

-- Ingredient Jaccard similarity for a given :product_id.
WITH target_ingredients AS (
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
ORDER BY ingredient_similarity_score DESC, b.name, p.name;

-- Products from the same manufacturer for a given :product_id.
SELECT
  p2.product_id,
  m.name AS manufacturer_name,
  b2.name AS brand_name,
  p2.name AS product_name,
  p2.product_form,
  p2.nutrition_type
FROM products p1
JOIN brands b1 ON b1.brand_id = p1.brand_id
JOIN manufacturers m ON m.manufacturer_id = b1.manufacturer_id
JOIN brands b2 ON b2.manufacturer_id = m.manufacturer_id
JOIN products p2 ON p2.brand_id = b2.brand_id
WHERE p1.product_id = :product_id
  AND p2.product_id <> p1.product_id
  AND p1.product_id IN (SELECT product_id FROM v_in_scope_products)
  AND p2.product_id IN (SELECT product_id FROM v_in_scope_products)
ORDER BY b2.name, p2.name;

-- Potential allergen search. Bind :allergen_name, e.g. '鶏'.
SELECT
  p.product_id,
  b.name AS brand_name,
  p.name AS product_name,
  ag.name AS allergen_name,
  paa.assertion,
  paa.assertion_source,
  paa.confidence
FROM product_allergen_assertions paa
JOIN allergen_groups ag ON ag.allergen_group_id = paa.allergen_group_id
JOIN products p ON p.product_id = paa.product_id
JOIN brands b ON b.brand_id = p.brand_id
WHERE ag.name = :allergen_name
  AND paa.assertion IN ('contains', 'may_contain')
  AND p.product_id IN (SELECT product_id FROM v_in_scope_products)
ORDER BY paa.confidence DESC, b.name, p.name;
