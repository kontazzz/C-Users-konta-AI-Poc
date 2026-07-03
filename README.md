# Dog Food Database

犬フード比較アプリ用の初期データベース設計です。対象は日本市場 `JP` のドライドッグフードのみです。動物病院専売品、療法食、ウェットフード、おやつ、サプリはアプリ対象外にします。

## 重要な前提

「いま販売中の全商品」はECモール、公式通販、終売直前品、容量違いで変わります。このリポジトリでは、網羅データそのものではなく、日本市場の非・動物病院専売ドライフードを継続収集できるDBの器を作っています。

アレルギー判定は医療判断に近い領域です。アプリでは「含有可能性」「メーカー表示」「原材料からの推定」を分けて表示してください。療法食と動物病院専売品は対象外です。

## 作成物

- `schema.sql`: SQLite用スキーマ。商品、SKU、価格、原材料、アレルゲン、犬種サイズ、ライフステージ、特徴、類似スコアを管理します。
- `seed_reference.sql`: 日本・ドライ・非動物病院専売に合わせた初期マスタと少量サンプルデータです。網羅済みデータではありません。
- `similarity_queries.sql`: 価格帯、原材料、同一メーカー、アレルゲン検索の基本SQLです。
- `sources.csv`: 継続収集に使う候補ソース一覧です。
- `build_database.py`: `dog_food_jp.sqlite` を生成します。

## アプリで判定できること

- 原材料: `ingredients`, `product_ingredients`
- アレルギー: `allergen_groups`, `ingredient_allergen_map`, `product_allergen_assertions`
- おすすめ犬種・犬種サイズ: `breeds`, `breed_sizes`, `product_breed_*`
- おすすめライフステージ: `life_stages`, `product_life_stages`
- 価格帯: `skus`, `price_observations`, `v_product_price_summary`
- アプリ対象商品: `v_in_scope_products`
- 似ている価格帯のフード: `v_in_scope_products`, `v_product_price_summary`, `similarity_queries.sql`
- 似ている原材料や特徴のフード: `product_ingredients`, `product_features`, `product_similarity_scores`
- 同じメーカーの商品: `manufacturers`, `brands`, `products`

## 収集方針

1. 公式メーカーサイトを商品存在・原材料・対象ライフステージの正本にする。
2. 価格は公式通販、Amazon、楽天、Yahoo、ヨドバシなど複数店の観測値として保存する。
3. 「商品」と「SKU」を分ける。例: 同じ商品でも 800g、1.5kg、3kg は別SKU。
4. 容量違いの価格比較は `price_per_kg` で行う。
5. 原材料は表示順を保持し、アレルゲンは「表示」「推定」「未確認」を分離する。
6. ウェット、半生、おやつ、サプリ、療法食、動物病院専売品は収集前に除外し、対象DBには入れない。
7. 終売判定は `last_seen_at` と複数ソースでの消失を使い、即削除せず `sale_status` を変更する。

## 初期ソース根拠

- Royal Canin Japan は犬用製品ページで、総合栄養食、子犬、成犬、中高齢犬などのカテゴリを提供しています。食事療法食は対象外です。
- Hill's Japan は犬用製品ページで、健康状態、ライフステージ、犬種サイズ、製品タイプ、ブランド別のフィルタを提供しています。
- Petline はドッグフード一覧で、タイプ、目的・悩み、年齢、販売先での検索軸と、一般店・専門店向けの商品群を提供しています。動物病院向け商品は対象外です。

## 生成

Python 3 が必要です。外部ライブラリは使わず、標準ライブラリの `sqlite3` だけで生成します。

```powershell
python dog_food_db/build_database.py
```

生成後、`dog_food_db/dog_food_jp.sqlite` ができます。

この作業環境では `python` / `python3` / `py` / `sqlite3` コマンドが見つからなかったため、SQLiteファイルの実体生成までは未実行です。

## 次に必要なこと

- 日本市場のメーカー・ブランド候補リストを作る。
- ドライフードのみを対象にブランド別クローラを追加する。
- 動物病院専売かどうかを判定する収集ルールを作る。
- 収集許諾と利用規約を確認する。
- `data_quality_status = verified` へ昇格するレビューフローを作る。
