variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "プロジェクト名（リソース名のプレフィックスに使用）"
  type        = string
  default     = "ai-native-soc"
}

variable "environment" {
  description = "環境名（dev / staging / prod）"
  type        = string
  default     = "dev"
}

variable "splunk_hec_url" {
  description = "Splunk HEC エンドポイントURL（例: https://splunk.example.com:8088）"
  type        = string
}

variable "splunk_hec_token" {
  description = "Splunk HEC トークン（機密情報）"
  type        = string
  sensitive   = true
}

variable "splunk_hec_acknowledgment_timeout" {
  description = "Splunk HEC acknowledgment タイムアウト（秒）"
  type        = number
  default     = 600
}

variable "firehose_retry_duration" {
  description = "Firehose 配信リトライ期間（秒）"
  type        = number
  default     = 3600
}

variable "firehose_buffer_size_mb" {
  description = "Firehose バッファサイズ（MB）"
  type        = number
  default     = 5
}

variable "firehose_buffer_interval_seconds" {
  description = "Firehose バッファ間隔（秒）"
  type        = number
  default     = 300
}
