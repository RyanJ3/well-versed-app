# terraform/environments/prod.tfvars
environment = "prod"
app_name    = "well-versed"

allowed_callback_urls = [
  "https://wellversed.io/auth/callback",
  "https://www.wellversed.io/auth/callback"
]

allowed_logout_urls = [
  "https://wellversed.io/logout",
  "https://www.wellversed.io/logout"
]