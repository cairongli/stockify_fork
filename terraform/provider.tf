terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.12.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_token
}