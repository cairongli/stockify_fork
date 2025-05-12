# Stockify Infrastructure as Code

This directory contains Terraform configuration to manage the Vercel infrastructure for the Stockify application.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) installed locally
- Vercel account and API token
- Supabase project setup

## Environment Variables

The following environment variables are required:

- `VERCEL_API_TOKEN`: Your Vercel API token

## Configuration

Copy the example variables file and update it with your values:

```sh
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your Vercel and Supabase credentials.

## Usage

### Initialize Terraform

```sh
terraform init
```

### Plan Changes

```sh
terraform plan
```

### Apply Changes

```sh
terraform apply
```

### Destroy Infrastructure

```sh
terraform destroy
```

## Continuous Integration/Continuous Deployment

The GitHub Actions workflows in `.github/workflows/` handle the automated provisioning and deployment:

1. `terraform.yml` - Manages infrastructure changes when Terraform files are updated
2. `deploy.yml` - Deploys the application to Vercel after successful tests

## Resources Managed

- Vercel Project Configuration
- Environment Variables
- Domain Configuration
- Deployment Settings
