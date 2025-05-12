variable "supabase_url" {
  description = "The URL for the Supabase instance"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "The anonymous key for Supabase authentication"
  type        = string
  sensitive   = true
}

variable "vercel_project_id" {
  description = "The ID of the Vercel project"
  type        = string
}

variable "vercel_org_id" {
  description = "The ID of the Vercel organization"
  type        = string
}

variable "vercel_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
} 