# terraform/environments/dev.tfvars
environment = "dev"
app_name    = "well-versed"

allowed_callback_urls = [
  "http://localhost:4200/auth/callback",
  "http://localhost:3000/auth/callback"
]

allowed_logout_urls = [
  "http://localhost:4200/logout",
  "http://localhost:3000/logout"
]