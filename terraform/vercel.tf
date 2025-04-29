resource "vercel_project" "this" {
  name = "stockify"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "https://github.com/cairongli/stockify_fork"
  }

  environment {
    key    = "NEXT_PUBLIC_SUPABASE_URL"
    value  = var.supabase_url
    target = ["production"]
  }

  environment {
    key    = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    value  = var.supabase_anon_key
    target = ["production"]
  }
}