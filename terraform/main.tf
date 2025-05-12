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

# Update deployment configuration to use GitHub Actions instead
# We'll keep this commented out as reference but not use it
# since GitHub Actions is handling the actual deployment
/*
resource "vercel_deployment" "production" {
  project_id  = data.vercel_project.stockify.id
  production  = true
  ref         = "main"
}
*/ 