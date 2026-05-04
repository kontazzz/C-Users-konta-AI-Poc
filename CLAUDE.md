# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**次世代AIネイティブSOC フェーズ1**: AWS Security Hub の検知結果を Kinesis Data Firehose 経由で Splunk HEC へリアルタイム転送するインフラ。フェーズ2では Go 言語の AI 解析バックエンドを追加予定。

## Terraform Commands

```bash
cd terraform

# 初期化（初回 or プロバイダー変更後）
terraform init

# 構文・設定の検証
terraform validate

# フォーマット整形
terraform fmt -recursive

# 実行計画の確認
terraform plan

# インフラ適用
terraform apply

# インフラ削除（S3にオブジェクトが残っている場合は先に削除が必要）
terraform destroy
```

変数ファイルのセットアップ:
```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# terraform.tfvars に splunk_hec_url と splunk_hec_token を記入
```

`terraform.tfvars` は `.gitignore` で除外すること。

## Architecture

```
AWS Security Hub
      │
      ▼
EventBridge Rule  (source: aws.securityhub, detail-type: Security Hub Findings - Imported)
      │  role: eventbridge_firehose (firehose:PutRecord/PutRecordBatch のみ)
      ▼
Kinesis Data Firehose  (destination: splunk, s3_backup_mode: FailedEventsOnly)
      │                       │ 配信失敗時
      ▼                       ▼
Splunk HEC              S3 Bucket (AES256, パブリックアクセスブロック, バージョニング有効)
                               ↑
                         role: firehose_delivery (S3 + CloudWatch Logs のみ)
```

## File Responsibilities

| ファイル | 役割 |
|---|---|
| `terraform/main.tf` | プロバイダー・locals・CloudWatch Logs・Firehose・EventBridge |
| `terraform/iam.tf` | IAM ロール 2 本（EventBridge→Firehose、Firehose→S3+CWL）|
| `terraform/s3.tf` | バックアップバケット（暗号化・ライフサイクル・バージョニング） |
| `terraform/variables.tf` | 全変数定義（`splunk_hec_token` は `sensitive = true`）|
| `terraform/outputs.tf` | 全リソースの ARN・名前を出力 |

## Key Design Decisions

- **共通タグ**: `locals.common_tags`（`main.tf`）で `Project = AI-Native-SOC`、`Environment`、`ManagedBy = Terraform` を一括管理。`provider` の `default_tags` でほぼ全リソースに自動付与される（`s3.tf` の `merge()` はバケット固有の `Name` タグを追加するため）。
- **IAM の分離**: EventBridge 用と Firehose 用でロールを分けており、Firehose ロールには S3 ポリシーと CloudWatch ポリシーを別 `aws_iam_role_policy` リソースで付与している。
- **S3 バケット名の一意性**: `random_id.bucket_suffix` (4 bytes) でサフィックスを生成。`terraform state` に保持されるため再 apply でも変わらない。
- **フェーズ2拡張ポイント**: Firehose の `processing_configuration` ブロック（現在未使用）に Lambda を追加することで、Go バックエンドへのデータ前処理を差し込める。

## Terraform State

ローカル state（`terraform.tfstate`）を使用。チームでの運用や本番環境では S3 バックエンド + DynamoDB ロックへの移行が必要（`terraform { backend "s3" { ... } }`）。
