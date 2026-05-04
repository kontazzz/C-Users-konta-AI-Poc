terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  common_tags = {
    Project     = "AI-Native-SOC"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ─── CloudWatch Logs（Firehose 配信ログ）────────────────────────────────────

resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/firehose/${var.project_name}-security-hub-to-splunk"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_stream" "firehose_splunk" {
  name           = "SplunkDelivery"
  log_group_name = aws_cloudwatch_log_group.firehose.name
}

# ─── Kinesis Data Firehose ───────────────────────────────────────────────────

resource "aws_kinesis_firehose_delivery_stream" "security_hub_to_splunk" {
  name        = "${var.project_name}-security-hub-to-splunk"
  destination = "splunk"

  splunk_configuration {
    hec_endpoint               = var.splunk_hec_url
    hec_token                  = var.splunk_hec_token
    hec_endpoint_type          = "Event"
    hec_acknowledgment_timeout = var.splunk_hec_acknowledgment_timeout
    retry_duration             = var.firehose_retry_duration
    s3_backup_mode             = "FailedEventsOnly"

    s3_configuration {
      role_arn           = aws_iam_role.firehose_delivery.arn
      bucket_arn         = aws_s3_bucket.firehose_backup.arn
      prefix             = "firehose-backup/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
      error_output_prefix = "firehose-errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
      buffering_size     = var.firehose_buffer_size_mb
      buffering_interval = var.firehose_buffer_interval_seconds
      compression_format = "GZIP"
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = aws_cloudwatch_log_stream.firehose_splunk.name
    }
  }
}

# ─── EventBridge ─────────────────────────────────────────────────────────────

resource "aws_cloudwatch_event_rule" "security_hub_findings" {
  name        = "${var.project_name}-security-hub-findings"
  description = "Security Hub の検知結果を Firehose へ転送する"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
  })
}

resource "aws_cloudwatch_event_target" "firehose" {
  rule     = aws_cloudwatch_event_rule.security_hub_findings.name
  arn      = aws_kinesis_firehose_delivery_stream.security_hub_to_splunk.arn
  role_arn = aws_iam_role.eventbridge_firehose.arn
}
