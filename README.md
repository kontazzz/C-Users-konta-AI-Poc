# 次世代AIネイティブSOC 基盤構築（フェーズ1）

AWS Security Hub の検知結果を Kinesis Data Firehose 経由で Splunk HEC へ転送するインフラを Terraform で構築します。

## アーキテクチャ

```
AWS Security Hub
      │
      ▼
EventBridge Rule
(aws.securityhub / Security Hub Findings - Imported)
      │
      ▼
Kinesis Data Firehose
      │                    │ 配信失敗時
      ▼                    ▼
Splunk HEC           S3 Bucket（暗号化・バックアップ）
```

## ディレクトリ構成

```
.
├── terraform/
│   ├── main.tf                    # EventBridge, Firehose, CloudWatch Logs
│   ├── variables.tf               # 変数定義
│   ├── outputs.tf                 # リソースARN等の出力
│   ├── iam.tf                     # IAMロール・ポリシー
│   ├── s3.tf                      # バックアップ用S3バケット
│   └── terraform.tfvars.example   # 変数サンプル（要コピー）
└── README.md
```

## 前提条件

- Terraform >= 1.0
- AWS CLI が設定済みであること（`aws configure`）
- デプロイ先 AWS アカウントで Security Hub が有効化済みであること
- Splunk の HTTP イベントコレクター（HEC）が設定済みであること

## デプロイ手順

### 1. 変数ファイルを作成する

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` を編集し、Splunk HEC の URL とトークンを設定します。

```hcl
splunk_hec_url   = "https://your-splunk-instance:8088"
splunk_hec_token = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

> **重要**: `terraform.tfvars` には機密情報が含まれます。**絶対にリポジトリへコミットしないでください。**

### 2. .gitignore を設定する

```bash
echo "terraform/terraform.tfvars" >> .gitignore
echo "terraform/.terraform/" >> .gitignore
echo "terraform/*.tfstate" >> .gitignore
echo "terraform/*.tfstate.backup" >> .gitignore
```

### 3. Terraform を初期化する

```bash
cd terraform
terraform init
```

### 4. 実行計画を確認する

```bash
terraform plan
```

リソースの作成内容を確認してください。

### 5. インフラを適用する

```bash
terraform apply
```

`yes` と入力して適用を開始します。

### 6. 出力値を確認する

適用完了後、以下のコマンドで作成されたリソースの情報を確認できます。

```bash
terraform output
```

## 動作確認

1. AWS コンソールで以下のリソースが作成されていることを確認します。
   - EventBridge → ルール
   - Kinesis Data Firehose → デリバリーストリーム
   - S3 → バックアップバケット

2. Security Hub でテスト検知を生成します（AWS CLI を使用）。

   ```bash
   aws securityhub get-findings --max-results 1
   ```

3. Splunk の検索画面で、Security Hub のイベントが受信されていることを確認します。

   ```
   index=* sourcetype=aws:securityhub
   ```

## リソース削除

```bash
cd terraform
terraform destroy
```

> **注意**: S3 バケットにオブジェクトが残っている場合、削除に失敗することがあります。
> 事前に `aws s3 rm s3://<bucket-name> --recursive` でオブジェクトを削除してください。

## フェーズ2への拡張予定

フェーズ2では、Firehose からのデータを受け取る Go 言語製の AI 解析バックエンドを追加予定です。
Firehose の `processing_configuration` ブロックを使用して Lambda 関数を前処理に挟むことも可能です。

## タグ

すべての AWS リソースには以下のタグが付与されています。

| キー        | 値              |
|-------------|-----------------|
| Project     | AI-Native-SOC   |
| Environment | （変数で指定）  |
| ManagedBy   | Terraform       |
