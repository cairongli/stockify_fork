# Stockify

## Backend

This project uses Supabase as the backend service. Supabase provides:

- Authentication
- Database
- Real-time subscriptions
- Storage
- Edge Functions

## Frontend

The frontend is built with Next.js and deployed on Vercel.

## Infrastructure as Code

This project uses Terraform to manage infrastructure on Vercel. The Terraform configuration can be found in the `terraform/` directory.

### Key Features

- Automated infrastructure provisioning
- Environment variable management
- Domain configuration
- Deployment settings

For detailed information on infrastructure management, see [terraform/README.md](terraform/README.md)

## CI/CD Workflows

GitHub Actions workflows automate the testing, infrastructure provisioning, and deployment processes:

1. `test.yml` - Runs tests for the application
2. `terraform.yml` - Manages infrastructure when Terraform files change
3. `deploy.yml` - Deploys the application to Vercel

## Testing Setup

This project uses:

- Frontend: Jest + React Testing Library
- Continuous Integration via GitHub Actions

### Quick Start

```bash
# Frontend Tests
cd frontend
npm test

# Run tests in watch mode
npm run test:watch
```

For detailed testing information, see [TESTING.md](TESTING.md)

## Deployment

The application is automatically deployed to Vercel when changes are pushed to the main branch.

### Manual Deployment

You can manually trigger a deployment using the GitHub Actions workflow:

1. Go to Actions tab in the GitHub repository
2. Select "Deploy to Vercel" workflow
3. Click "Run workflow"

# Install the new dependencies

npm install

# Run tests once

npm test

# Run tests in watch mode

npm run test:watch
