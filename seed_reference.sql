PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO manufacturers (manufacturer_id, name, country_code, website_url, notes) VALUES
  (1, 'Royal Canin', 'FR', 'https://www.royalcanin.com/jp', 'Japan official product pages expose dog product categories and life stage navigation. Therapeutic and veterinary-exclusive products are out of scope.'),
  (2, 'Hill''s Pet Nutrition', 'US', 'https://www.hills.co.jp', 'Japan official dog food listing exposes condition, life stage, breed size, product type, and brand filters. Therapeutic and veterinary-exclusive products are out of scope.'),
  (3, 'Petline', 'JP', 'https://www.petline.co.jp', 'Japan official dog food listing exposes product families, age filters, purpose filters, and sales channels.');

INSERT OR IGNORE INTO brands (brand_id, manufacturer_id, name, website_url) VALUES
  (1, 1, 'Royal Canin', 'https://www.royalcanin.com/jp/dogs/products'),
  (2, 2, 'Science Diet', 'https://www.hills.co.jp/dog-food'),
  (3, 3, 'Medicoat', 'https://www.petline.co.jp/dog/'),
  (4, 3, 'Professional Balance', 'https://www.petline.co.jp/dog/');

INSERT OR IGNORE INTO sources (source_id, source_name, source_kind, url, terms_note, last_checked_at) VALUES
  (1, 'Royal Canin Japan dog products', 'official', 'https://www.royalcanin.com/jp/dogs/products', 'Use as canonical source for Japanese dry dog food existence and manufacturer taxonomy; exclude therapeutic and veterinary-exclusive products; check crawling terms before automation.', '2026-07-03'),
  (2, 'Hill''s Japan dog food products', 'official', 'https://www.hills.co.jp/dog-food', 'Use as canonical source for Japanese dry dog food existence, product filters, and high-level claims; exclude therapeutic and veterinary-exclusive products; check crawling terms before automation.', '2026-07-03'),
  (3, 'Petline Japan dog food listing', 'official', 'https://www.petline.co.jp/dog/', 'Use as canonical source for Japanese dry dog food product family existence and manufacturer taxonomy; exclude wet, snacks, therapeutic, and veterinary-exclusive products; check crawling terms before automation.', '2026-07-03');

INSERT OR IGNORE INTO life_stages (life_stage_id, code, name, min_age_months, max_age_months, notes) VALUES
  (1, 'puppy', '子犬', 0, 12, 'Manufacturer definitions vary by breed size.'),
  (2, 'adult', '成犬', 12, 84, 'Default adult range; manufacturer labels may define smaller ranges.'),
  (3, 'senior_7_plus', '高齢犬 7歳以上', 84, NULL, NULL),
  (4, 'senior_10_plus', '高齢犬 10歳以上', 120, NULL, NULL),
  (5, 'all_life_stages', '全年齢', NULL, NULL, NULL);

INSERT OR IGNORE INTO breed_sizes (breed_size_id, code, name, min_adult_weight_kg, max_adult_weight_kg) VALUES
  (1, 'toy_small', '超小型・小型犬', 0, 10),
  (2, 'medium', '中型犬', 10, 25),
  (3, 'large', '大型犬', 25, 45),
  (4, 'giant', '超大型犬', 45, NULL);

INSERT OR IGNORE INTO sales_channels (sales_channel_id, code, name, notes) VALUES
  (1, 'mass_retail', '一般量販店', 'General retail stores, supermarkets, drugstores, and mass retailers.'),
  (2, 'specialty_store', 'ペット専門店', 'Pet specialty stores.'),
  (3, 'official_online', '公式オンライン', 'Manufacturer or brand official online shop.'),
  (4, 'veterinary_clinic', '動物病院', 'Veterinary clinics. If is_exclusive = 1, the product is outside this app scope.');

INSERT OR IGNORE INTO features (feature_id, code, name, feature_group) VALUES
  (1, 'digestive_support', '消化サポート', 'health'),
  (2, 'weight_management', '体重管理', 'health'),
  (3, 'skin_coat', '皮膚・被毛ケア', 'health'),
  (4, 'urinary_support', '下部尿路ケア', 'health'),
  (5, 'joint_support', '関節ケア', 'health'),
  (6, 'grain_free', 'グレインフリー', 'ingredient'),
  (7, 'dental_care', 'デンタルケア', 'health'),
  (8, 'allergy_care', '食物アレルギー配慮', 'health'),
  (9, 'specialty_store_channel', '専門店取扱', 'sales_channel'),
  (10, 'mass_retail_channel', '一般量販店取扱', 'sales_channel'),
  (11, 'official_online_channel', '公式オンライン取扱', 'sales_channel');

INSERT OR IGNORE INTO allergen_groups (allergen_group_id, name, notes) VALUES
  (1, '鶏', 'Chicken and chicken-derived ingredients.'),
  (2, '牛', 'Beef and beef-derived ingredients.'),
  (3, '豚', 'Pork and pork-derived ingredients.'),
  (4, '魚', 'Fish and fish-derived ingredients.'),
  (5, 'ラム', 'Lamb and lamb-derived ingredients.'),
  (6, '卵', 'Egg and egg-derived ingredients.'),
  (7, '乳', 'Milk and dairy-derived ingredients.'),
  (8, '小麦・グルテン', 'Wheat, gluten, and related grains where applicable.'),
  (9, '大豆', 'Soy and soy-derived ingredients.'),
  (10, 'とうもろこし', 'Corn and corn-derived ingredients.');

INSERT OR IGNORE INTO ingredients (ingredient_id, canonical_name, ingredient_group) VALUES
  (1, 'chicken', 'animal_protein'),
  (2, 'lamb', 'animal_protein'),
  (3, 'fish', 'fish_protein'),
  (4, 'rice', 'grain'),
  (5, 'potato', 'other'),
  (6, 'egg', 'animal_protein'),
  (7, 'wheat', 'grain'),
  (8, 'soy', 'plant_protein'),
  (9, 'corn', 'grain'),
  (10, 'fish_oil', 'oil_fat');

INSERT OR IGNORE INTO ingredient_allergen_map (ingredient_id, allergen_group_id, mapping_kind, confidence) VALUES
  (1, 1, 'direct', 1.0),
  (2, 5, 'direct', 1.0),
  (3, 4, 'direct', 1.0),
  (6, 6, 'direct', 1.0),
  (7, 8, 'direct', 0.95),
  (8, 9, 'direct', 1.0),
  (9, 10, 'direct', 1.0),
  (10, 4, 'derived', 0.9);

INSERT OR IGNORE INTO products (
  product_id, brand_id, name, normalized_name, market_country, product_form, nutrition_type,
  sale_status, prescription_required, official_product_url, short_description, label_claims,
  data_quality_status, first_seen_at, last_seen_at
) VALUES
  (1, 2, 'アダルト 1～6歳 小粒 成犬用 ラム＆ライス', 'science diet adult 1-6 small bites lamb rice', 'JP', 'dry', 'complete_balanced',
   'active', 0, 'https://www.hills.co.jp/dog-food', '成犬向けラム＆ライスの小粒ドライ。', '成犬の消化、筋肉、免疫力の健康維持。', 'needs_review', '2026-07-03', '2026-07-03'),
  (2, 2, 'シニア 7歳以上 小粒 高齢犬用 チキン', 'science diet senior 7 small bites chicken', 'JP', 'dry', 'complete_balanced',
   'active', 0, 'https://www.hills.co.jp/dog-food', '高齢犬向けチキンの小粒ドライ。', '高齢犬の活力、臓器、免疫力の健康維持。', 'needs_review', '2026-07-03', '2026-07-03'),
  (3, 3, 'メディコート お腹から健康サポート ドライ', 'medicoat digestive support dry', 'JP', 'dry', 'complete_balanced',
   'active', 0, 'https://www.petline.co.jp/dog/', 'お腹の健康維持をサポートするドライフード。', '腸内フローラを整え、健康維持をお腹からサポート。', 'needs_review', '2026-07-03', '2026-07-03'),
  (4, 4, 'プロフェッショナル・バランス 犬用ドライ', 'professional balance dog dry', 'JP', 'dry', 'complete_balanced',
   'active', 0, 'https://www.petline.co.jp/dog/', '日本で暮らす犬向けの国産ドライ。', '健康維持、免疫力維持をサポート。', 'needs_review', '2026-07-03', '2026-07-03');

INSERT OR IGNORE INTO product_sources (product_id, source_id, source_product_url, observed_at, evidence_note) VALUES
  (1, 2, 'https://www.hills.co.jp/dog-food', '2026-07-03', 'Official listing includes this product name and adult life stage.'),
  (2, 2, 'https://www.hills.co.jp/dog-food', '2026-07-03', 'Official listing includes this product name and senior life stage.'),
  (3, 3, 'https://www.petline.co.jp/dog/', '2026-07-03', 'Official listing describes Medicoat digestive support positioning.'),
  (4, 3, 'https://www.petline.co.jp/dog/', '2026-07-03', 'Official listing includes Professional Balance dog dry.');

INSERT OR IGNORE INTO product_life_stages (product_id, life_stage_id, recommendation_strength, source_kind) VALUES
  (1, 2, 'target', 'label'),
  (2, 3, 'target', 'label'),
  (3, 5, 'unknown', 'manual_review'),
  (4, 5, 'unknown', 'manual_review');

INSERT OR IGNORE INTO product_breed_size_recommendations (product_id, breed_size_id, recommendation_strength, source_kind) VALUES
  (1, 1, 'suitable', 'label'),
  (2, 1, 'suitable', 'label'),
  (3, 1, 'unknown', 'manual_review'),
  (3, 2, 'unknown', 'manual_review'),
  (4, 1, 'unknown', 'manual_review'),
  (4, 2, 'unknown', 'manual_review'),
  (4, 3, 'unknown', 'manual_review');

INSERT OR IGNORE INTO product_features (product_id, feature_id, source_kind, confidence) VALUES
  (1, 1, 'label', 0.7),
  (1, 10, 'manual_review', 0.5),
  (2, 10, 'manual_review', 0.5),
  (3, 1, 'label', 0.7),
  (3, 10, 'manual_review', 0.5),
  (4, 9, 'label', 0.7);

INSERT OR IGNORE INTO product_sales_channels (product_id, sales_channel_id, is_exclusive, source_kind, confidence) VALUES
  (1, 1, 0, 'manual_review', 0.5),
  (2, 1, 0, 'manual_review', 0.5),
  (3, 1, 0, 'manual_review', 0.5),
  (4, 2, 0, 'label', 0.7);

INSERT OR IGNORE INTO product_ingredients (product_id, ingredient_id, display_name, ingredient_order, is_primary, source_text, confidence) VALUES
  (1, 2, 'ラム', 1, 1, 'Product name contains lamb.', 0.7),
  (1, 4, 'ライス', 2, 1, 'Product name contains rice.', 0.7),
  (2, 1, 'チキン', 1, 1, 'Product name contains chicken.', 0.7);

INSERT OR IGNORE INTO product_allergen_assertions (product_id, allergen_group_id, assertion, assertion_source, confidence, notes) VALUES
  (1, 5, 'contains', 'derived_from_ingredients', 0.7, 'Derived from product name.'),
  (2, 1, 'contains', 'derived_from_ingredients', 0.7, 'Derived from product name.');

INSERT OR IGNORE INTO skus (sku_id, product_id, sku_name, package_size_text, net_weight_g, sale_status) VALUES
  (1, 1, '標準SKU 未確認', NULL, NULL, 'unknown'),
  (2, 2, '標準SKU 未確認', NULL, NULL, 'unknown'),
  (3, 3, '標準SKU 未確認', NULL, NULL, 'unknown'),
  (4, 4, '標準SKU 未確認', NULL, NULL, 'unknown');
