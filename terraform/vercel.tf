resource "vercel_project" "this" {
  name = "stockify"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "cairongli/stockify_fork"
  }

  environment = [
    {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.supabase_url
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value  = var.supabase_anon_key
      target = ["production"]
    }
  ]
}