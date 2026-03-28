terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudFront Origin Access Identity (for S3)
resource "aws_cloudfront_origin_access_identity" "s3_oai" {
  comment = "OAI for ${var.project_name}-${var.environment}"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled = true

  origin {
    domain_name = "${var.alb_dns_name}"
    origin_id   = "alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = var.s3_bucket_name
    origin_id   = "s3"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.s3_oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb"

    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }

      headers = ["*"]
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # Cache behavior for S3 assets
  cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    path_pattern     = "/static/*"
    target_origin_id = "s3"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
  }

  # Security headers
  custom_error_response {
    error_code            = 403
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 404
    error_caching_min_ttl = 300
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # Uncomment to use custom SSL certificate
    # acm_certificate_arn      = var.acm_certificate_arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  # HTTP/2 and HTTP/3 support
  http_version = "http2and3"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-${var.environment}-cdn"
      Environment = var.environment
    }
  )

  depends_on = [aws_cloudfront_origin_access_identity.s3_oai]
}

# CloudFront Cache Invalidation on deployment
resource "aws_cloudfront_invalidation" "main" {
  distribution_id = aws_cloudfront_distribution.main.id
  paths           = ["/*"]

  triggers = {
    redeployment = var.deployment_id
  }
}
