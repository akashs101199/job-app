output "repositories" {
  description = "ECR repositories"
  value = {
    backend = {
      repository_url = aws_ecr_repository.backend.repository_url
      repository_arn = aws_ecr_repository.backend.arn
    }
    frontend = {
      repository_url = aws_ecr_repository.frontend.repository_url
      repository_arn = aws_ecr_repository.frontend.arn
    }
  }
}

output "backend_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}
