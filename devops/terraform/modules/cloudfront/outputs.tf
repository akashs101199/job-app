output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "oai_id" {
  description = "CloudFront Origin Access Identity ID"
  value       = aws_cloudfront_origin_access_identity.s3_oai.id
}

output "oai_iam_arn" {
  description = "CloudFront OAI IAM ARN"
  value       = aws_cloudfront_origin_access_identity.s3_oai.iam_arn
}
