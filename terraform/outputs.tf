output "project_name" {
  value       = data.vercel_project.stockify.name
  description = "The name of the Vercel project"
}

output "project_url" {
  value       = vercel_project_domain.stockify_domain.domain
  description = "The URL of the deployed project"
}

output "deployment_id" {
  value       = vercel_deployment.production.id
  description = "The ID of the production deployment"
} 