output "firehose_stream_name" {
  description = "Kinesis Firehose デリバリーストリーム名"
  value       = aws_kinesis_firehose_delivery_stream.security_hub_to_splunk.name
}

output "firehose_stream_arn" {
  description = "Kinesis Firehose デリバリーストリーム ARN"
  value       = aws_kinesis_firehose_delivery_stream.security_hub_to_splunk.arn
}

output "s3_bucket_name" {
  description = "バックアップ用 S3 バケット名"
  value       = aws_s3_bucket.firehose_backup.id
}

output "s3_bucket_arn" {
  description = "バックアップ用 S3 バケット ARN"
  value       = aws_s3_bucket.firehose_backup.arn
}

output "eventbridge_rule_arn" {
  description = "EventBridge ルール ARN"
  value       = aws_cloudwatch_event_rule.security_hub_findings.arn
}

output "firehose_iam_role_arn" {
  description = "Firehose 配信用 IAM ロール ARN"
  value       = aws_iam_role.firehose_delivery.arn
}

output "eventbridge_iam_role_arn" {
  description = "EventBridge → Firehose 用 IAM ロール ARN"
  value       = aws_iam_role.eventbridge_firehose.arn
}

output "cloudwatch_log_group_name" {
  description = "Firehose ログ用 CloudWatch ロググループ名"
  value       = aws_cloudwatch_log_group.firehose.name
}
