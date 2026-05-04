data "aws_caller_identity" "current" {}

# ─── EventBridge → Firehose ───────────────────────────────────────────────────

resource "aws_iam_role" "eventbridge_firehose" {
  name = "${var.project_name}-eventbridge-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "eventbridge_firehose" {
  name = "${var.project_name}-eventbridge-firehose-policy"
  role = aws_iam_role.eventbridge_firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "firehose:PutRecord",
        "firehose:PutRecordBatch"
      ]
      Resource = aws_kinesis_firehose_delivery_stream.security_hub_to_splunk.arn
    }]
  })
}

# ─── Firehose → S3 + CloudWatch Logs ─────────────────────────────────────────

resource "aws_iam_role" "firehose_delivery" {
  name = "${var.project_name}-firehose-delivery-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "firehose.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "sts:ExternalId" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "firehose_s3" {
  name = "${var.project_name}-firehose-s3-policy"
  role = aws_iam_role.firehose_delivery.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:PutObject"
      ]
      Resource = [
        aws_s3_bucket.firehose_backup.arn,
        "${aws_s3_bucket.firehose_backup.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy" "firehose_cloudwatch" {
  name = "${var.project_name}-firehose-cloudwatch-policy"
  role = aws_iam_role.firehose_delivery.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["logs:PutLogEvents"]
      Resource = [
        aws_cloudwatch_log_group.firehose.arn,
        "${aws_cloudwatch_log_group.firehose.arn}:*"
      ]
    }]
  })
}
