PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS manufacturers (
  manufacturer_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country_code TEXT,
  website_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  brand_id INTEGER PRIMARY KEY,
  manufacturer_id INTEGER REFERENCES manufacturers(manufacturer_id),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
  source_id INTEGER PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('official', 'retailer', 'marketplace', 'manual_review', 'other')),
  url TEXT NOT NULL UNIQUE,
  terms_note TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY,
  brand_id INTEGER NOT NULL REFERENCES brands(brand_id),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  market_country TEXT NOT NULL DEFAULT 'JP' CHECK (market_country = 'JP'),
  product_form TEXT NOT NULL DEFAULT 'dry' CHECK (product_form = 'dry'),
  nutrition_type TEXT CHECK (nutrition_type IN ('complete_balanced', 'general_food', 'unknown')) DEFAULT 'unknown',
  sale_status TEXT NOT NULL CHECK (sale_status IN ('active', 'limited', 'discontinued', 'unknown')) DEFAULT 'unknown',
  prescription_required INTEGER NOT NULL DEFAULT 0 CHECK (prescription_required = 0),
  official_product_url TEXT,
  image_url TEXT,
  short_description TEXT,
  label_claims TEXT,
  data_quality_status TEXT NOT NULL CHECK (data_quality_status IN ('raw', 'normalized', 'verified', 'needs_review')) DEFAULT 'raw',
  first_seen_at TEXT,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (brand_id, normalized_name, market_country)
);

CREATE TABLE IF NOT EXISTS sales_channels (
  sales_channel_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_sales_channels (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  sales_channel_id INTEGER NOT NULL REFERENCES sales_channels(sales_channel_id),
  is_exclusive INTEGER NOT NULL DEFAULT 0 CHECK (is_exclusive IN (0, 1)),
  source_kind TEXT CHECK (source_kind IN ('label', 'manufacturer_filter', 'retailer', 'manual_review')) DEFAULT 'manual_review',
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  PRIMARY KEY (product_id, sales_channel_id)
);

CREATE TABLE IF NOT EXISTS product_sources (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  source_id INTEGER NOT NULL REFERENCES sources(source_id),
  source_product_url TEXT NOT NULL,
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  evidence_note TEXT,
  PRIMARY KEY (product_id, source_id, source_product_url)
);

CREATE TABLE IF NOT EXISTS skus (
  sku_id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  sku_name TEXT NOT NULL,
  gtin TEXT,
  package_size_text TEXT,
  net_weight_g REAL,
  unit_count INTEGER,
  sale_status TEXT NOT NULL CHECK (sale_status IN ('active', 'limited', 'discontinued', 'unknown')) DEFAULT 'unknown',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, sku_name, package_size_text)
);

CREATE TABLE IF NOT EXISTS retailers (
  retailer_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  url TEXT,
  country_code TEXT DEFAULT 'JP'
);

CREATE TABLE IF NOT EXISTS price_observations (
  price_observation_id INTEGER PRIMARY KEY,
  sku_id INTEGER NOT NULL REFERENCES skus(sku_id) ON DELETE CASCADE,
  retailer_id INTEGER REFERENCES retailers(retailer_id),
  price_amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  availability TEXT CHECK (availability IN ('in_stock', 'out_of_stock', 'preorder', 'unavailable', 'unknown')) DEFAULT 'unknown',
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_url TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_price_observations_sku_observed
  ON price_observations(sku_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS ingredients (
  ingredient_id INTEGER PRIMARY KEY,
  canonical_name TEXT NOT NULL UNIQUE,
  ingredient_group TEXT CHECK (ingredient_group IN (
    'animal_protein', 'fish_protein', 'plant_protein', 'grain', 'legume',
    'oil_fat', 'fiber', 'vitamin_mineral', 'additive', 'other'
  )) DEFAULT 'other',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(ingredient_id),
  display_name TEXT NOT NULL,
  ingredient_order INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  source_text TEXT,
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  PRIMARY KEY (product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient
  ON product_ingredients(ingredient_id);

CREATE TABLE IF NOT EXISTS allergen_groups (
  allergen_group_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS ingredient_allergen_map (
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
  allergen_group_id INTEGER NOT NULL REFERENCES allergen_groups(allergen_group_id) ON DELETE CASCADE,
  mapping_kind TEXT NOT NULL CHECK (mapping_kind IN ('direct', 'derived', 'may_contain')),
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  PRIMARY KEY (ingredient_id, allergen_group_id, mapping_kind)
);

CREATE TABLE IF NOT EXISTS product_allergen_assertions (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  allergen_group_id INTEGER NOT NULL REFERENCES allergen_groups(allergen_group_id) ON DELETE CASCADE,
  assertion TEXT NOT NULL CHECK (assertion IN ('contains', 'free_from_claim', 'may_contain', 'unknown')),
  assertion_source TEXT NOT NULL CHECK (assertion_source IN ('label', 'derived_from_ingredients', 'manufacturer_claim', 'manual_review')),
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  notes TEXT,
  PRIMARY KEY (product_id, allergen_group_id, assertion, assertion_source)
);

CREATE TABLE IF NOT EXISTS life_stages (
  life_stage_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_age_months INTEGER,
  max_age_months INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_life_stages (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  life_stage_id INTEGER NOT NULL REFERENCES life_stages(life_stage_id),
  recommendation_strength TEXT CHECK (recommendation_strength IN ('target', 'suitable', 'not_suitable', 'unknown')) DEFAULT 'unknown',
  source_kind TEXT CHECK (source_kind IN ('label', 'manufacturer_filter', 'derived', 'manual_review')) DEFAULT 'manual_review',
  PRIMARY KEY (product_id, life_stage_id)
);

CREATE TABLE IF NOT EXISTS breed_sizes (
  breed_size_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_adult_weight_kg REAL,
  max_adult_weight_kg REAL
);

CREATE TABLE IF NOT EXISTS breeds (
  breed_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  breed_size_id INTEGER REFERENCES breed_sizes(breed_size_id),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_breed_size_recommendations (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  breed_size_id INTEGER NOT NULL REFERENCES breed_sizes(breed_size_id),
  recommendation_strength TEXT CHECK (recommendation_strength IN ('target', 'suitable', 'not_suitable', 'unknown')) DEFAULT 'unknown',
  source_kind TEXT CHECK (source_kind IN ('label', 'manufacturer_filter', 'derived', 'manual_review')) DEFAULT 'manual_review',
  PRIMARY KEY (product_id, breed_size_id)
);

CREATE TABLE IF NOT EXISTS product_breed_recommendations (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  breed_id INTEGER NOT NULL REFERENCES breeds(breed_id),
  recommendation_strength TEXT CHECK (recommendation_strength IN ('target', 'suitable', 'not_suitable', 'unknown')) DEFAULT 'unknown',
  source_kind TEXT CHECK (source_kind IN ('label', 'manufacturer_filter', 'derived', 'manual_review')) DEFAULT 'manual_review',
  PRIMARY KEY (product_id, breed_id)
);

CREATE TABLE IF NOT EXISTS features (
  feature_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  feature_group TEXT CHECK (feature_group IN ('health', 'ingredient', 'format', 'claim', 'sales_channel', 'other')) DEFAULT 'other'
);

CREATE TABLE IF NOT EXISTS product_features (
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  feature_id INTEGER NOT NULL REFERENCES features(feature_id),
  source_kind TEXT CHECK (source_kind IN ('label', 'manufacturer_filter', 'derived', 'manual_review')) DEFAULT 'manual_review',
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  PRIMARY KEY (product_id, feature_id)
);

CREATE TABLE IF NOT EXISTS nutrition_profiles (
  product_id INTEGER PRIMARY KEY REFERENCES products(product_id) ON DELETE CASCADE,
  protein_min_pct REAL,
  fat_min_pct REAL,
  fiber_max_pct REAL,
  ash_max_pct REAL,
  moisture_max_pct REAL,
  kcal_per_100g REAL,
  calcium_pct REAL,
  phosphorus_pct REAL,
  sodium_pct REAL,
  omega3_pct REAL,
  omega6_pct REAL,
  source_text TEXT,
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE TABLE IF NOT EXISTS product_similarity_scores (
  product_id_a INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  product_id_b INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  price_similarity_score REAL CHECK (price_similarity_score >= 0 AND price_similarity_score <= 1),
  ingredient_similarity_score REAL CHECK (ingredient_similarity_score >= 0 AND ingredient_similarity_score <= 1),
  feature_similarity_score REAL CHECK (feature_similarity_score >= 0 AND feature_similarity_score <= 1),
  same_manufacturer INTEGER NOT NULL DEFAULT 0 CHECK (same_manufacturer IN (0, 1)),
  same_brand INTEGER NOT NULL DEFAULT 0 CHECK (same_brand IN (0, 1)),
  overall_score REAL CHECK (overall_score >= 0 AND overall_score <= 1),
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id_a, product_id_b),
  CHECK (product_id_a < product_id_b)
);

CREATE VIEW IF NOT EXISTS v_latest_sku_prices AS
WITH ranked AS (
  SELECT
    po.*,
    s.net_weight_g,
    r.name AS retailer_name,
    ROW_NUMBER() OVER (
      PARTITION BY po.sku_id, po.retailer_id
      ORDER BY po.observed_at DESC, po.price_observation_id DESC
    ) AS rn
  FROM price_observations po
  JOIN skus s ON s.sku_id = po.sku_id
  LEFT JOIN retailers r ON r.retailer_id = po.retailer_id
  WHERE po.availability IN ('in_stock', 'preorder', 'unknown')
)
SELECT
  price_observation_id,
  sku_id,
  retailer_id,
  retailer_name,
  price_amount,
  currency,
  availability,
  observed_at,
  source_url,
  CASE
    WHEN net_weight_g IS NOT NULL AND net_weight_g > 0
    THEN price_amount / (net_weight_g / 1000.0)
  END AS price_per_kg
FROM ranked
WHERE rn = 1;

CREATE VIEW IF NOT EXISTS v_product_price_summary AS
SELECT
  p.product_id,
  MIN(v.price_per_kg) AS min_price_per_kg,
  AVG(v.price_per_kg) AS avg_price_per_kg,
  MAX(v.price_per_kg) AS max_price_per_kg,
  COUNT(v.price_observation_id) AS price_sample_count,
  CASE
    WHEN AVG(v.price_per_kg) IS NULL THEN 'unknown'
    WHEN AVG(v.price_per_kg) < 800 THEN 'budget'
    WHEN AVG(v.price_per_kg) < 1800 THEN 'standard'
    WHEN AVG(v.price_per_kg) < 3500 THEN 'premium'
    ELSE 'super_premium'
  END AS price_band
FROM products p
LEFT JOIN skus s ON s.product_id = p.product_id
LEFT JOIN v_latest_sku_prices v ON v.sku_id = s.sku_id
GROUP BY p.product_id;

CREATE VIEW IF NOT EXISTS v_product_search AS
SELECT
  p.product_id,
  m.name AS manufacturer_name,
  b.name AS brand_name,
  p.name AS product_name,
  p.market_country,
  p.product_form,
  p.nutrition_type,
  p.sale_status,
  p.prescription_required,
  ps.price_band,
  ps.avg_price_per_kg,
  (
    SELECT GROUP_CONCAT(DISTINCT ls.name)
    FROM product_life_stages pls
    JOIN life_stages ls ON ls.life_stage_id = pls.life_stage_id
    WHERE pls.product_id = p.product_id
  ) AS life_stages,
  (
    SELECT GROUP_CONCAT(DISTINCT bs.name)
    FROM product_breed_size_recommendations pbs
    JOIN breed_sizes bs ON bs.breed_size_id = pbs.breed_size_id
    WHERE pbs.product_id = p.product_id
  ) AS breed_sizes,
  (
    SELECT GROUP_CONCAT(DISTINCT f.name)
    FROM product_features pf
    JOIN features f ON f.feature_id = pf.feature_id
    WHERE pf.product_id = p.product_id
  ) AS features,
  (
    SELECT GROUP_CONCAT(DISTINCT ag.name)
    FROM product_allergen_assertions paa
    JOIN allergen_groups ag ON ag.allergen_group_id = paa.allergen_group_id
    WHERE paa.product_id = p.product_id
      AND paa.assertion IN ('contains', 'may_contain')
  ) AS potential_allergens
FROM products p
JOIN brands b ON b.brand_id = p.brand_id
LEFT JOIN manufacturers m ON m.manufacturer_id = b.manufacturer_id
LEFT JOIN v_product_price_summary ps ON ps.product_id = p.product_id;

CREATE VIEW IF NOT EXISTS v_in_scope_products AS
SELECT
  v.*
FROM v_product_search v
JOIN products p ON p.product_id = v.product_id
WHERE p.market_country = 'JP'
  AND p.product_form = 'dry'
  AND p.prescription_required = 0
  AND NOT EXISTS (
    SELECT 1
    FROM product_sales_channels psc
    JOIN sales_channels sc ON sc.sales_channel_id = psc.sales_channel_id
    WHERE psc.product_id = p.product_id
      AND sc.code = 'veterinary_clinic'
      AND psc.is_exclusive = 1
  );
