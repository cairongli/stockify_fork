output "project_name" {
  value       = data.vercel_project.stockify.name
  description = "The name of the Vercel project"
}

output "project_url" {
  value       = "${data.vercel_project.stockify.name}.vercel.app"
  description = "The URL of the deployed project"
} 