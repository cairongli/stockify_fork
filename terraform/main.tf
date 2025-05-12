terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15.0"
    }
  }
}

provider "vercel" {
  # API token from environment variable
  # Set VERCEL_API_TOKEN in your environment
}

# Reference to existing Vercel project
data "vercel_project" "stockify" {
  name = "stockify-ii3a"
}

# Project environment variables
resource "vercel_project_environment_variable" "supabase_url" {
  project_id = data.vercel_project.stockify.id
  key        = "SUPABASE_URL"
  value      = var.supabase_url
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_anon_key" {
  project_id = data.vercel_project.stockify.id
  key        = "SUPABASE_ANON_KEY"
  value      = var.supabase_anon_key
  target     = ["production", "preview", "development"]
}

# Custom domain configuration
resource "vercel_project_domain" "stockify_domain" {
  project_id = data.vercel_project.stockify.id
  domain     = "stockify-ii3a.vercel.app"
}

# Project deployment configuration
resource "vercel_deployment" "production" {
  project_id  = data.vercel_project.stockify.id
  production  = true
  files_count = 0 # This is a placeholder as we're using GitHub Actions for deployment
  ref         = "main"
} 