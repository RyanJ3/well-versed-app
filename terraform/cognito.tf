# terraform/cognito.tf
# Infrastructure as Code for AWS Cognito User Pool

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "well-versed"
}

variable "allowed_callback_urls" {
  description = "Allowed callback URLs for Cognito"
  type        = list(string)
}

variable "allowed_logout_urls" {
  description = "Allowed logout URLs for Cognito"
  type        = list(string)
}

# User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-${var.environment}-user-pool"

  # Password Policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # User Attributes
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    name                     = "preferred_username"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 3
      max_length = 50
    }
  }

  # Custom attributes for your app
  schema {
    name                     = "bible_version"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 0
      max_length = 50
    }
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # MFA configuration
  mfa_configuration = var.environment == "prod" ? "OPTIONAL" : "OFF"

  software_token_mfa_configuration {
    enabled = var.environment == "prod" ? true : false
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = var.environment == "prod" ? "ENFORCED" : "OFF"
  }

  # Device tracking
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = true
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
    ManagedBy   = "Terraform"
  }
}

# User Pool Client
resource "aws_cognito_user_pool_client" "web_client" {
  name         = "${var.app_name}-${var.environment}-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token configuration
  access_token_validity  = 1  # 1 hour
  id_token_validity      = 1  # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # OAuth configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  
  callback_urls = var.allowed_callback_urls
  logout_urls   = var.allowed_logout_urls

  supported_identity_providers = ["COGNITO"]

  # Authentication flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Security
  prevent_user_existence_errors = "ENABLED"

  # Read/Write attributes
  read_attributes = [
    "email",
    "email_verified",
    "preferred_username",
    "custom:bible_version"
  ]

  write_attributes = [
    "email",
    "preferred_username",
    "custom:bible_version"
  ]
}

# User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.app_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# User Groups
resource "aws_cognito_user_group" "users" {
  name         = "users"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Standard users"
  precedence   = 10
}

resource "aws_cognito_user_group" "premium" {
  name         = "premium"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Premium users with additional features"
  precedence   = 5
}

resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Admin users with full access"
  precedence   = 1
}

# Outputs
output "user_pool_id" {
  value       = aws_cognito_user_pool.main.id
  description = "The ID of the user pool"
}

output "user_pool_arn" {
  value       = aws_cognito_user_pool.main.arn
  description = "The ARN of the user pool"
}

output "client_id" {
  value       = aws_cognito_user_pool_client.web_client.id
  description = "The ID of the user pool client"
}

output "domain" {
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
  description = "The Cognito domain URL"
}

data "aws_region" "current" {}