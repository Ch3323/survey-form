# GitHub Actions Deploy

This repository deploys through `.github/workflows/ci-cd.yml`.

## Required GitHub Secrets

Create these in GitHub: **Settings > Secrets and variables > Actions > Repository secrets**.

- `DEPLOY_HOST`: server IP or domain.
- `DEPLOY_USER`: SSH user on the server.
- `DEPLOY_SSH_KEY`: private SSH key that can log in as `DEPLOY_USER`.
- `DEPLOY_PATH`: absolute path on the server, for example `/opt/survey-form`.
- `PRODUCTION_ENV`: the full production `.env` file content.

Do not commit real production values to `.github/workflows/ci-cd.yml`. The hardcoded values in the CI job are build-only placeholders, not real secrets, and should not point to Supabase or any production database.

Optional:

- `DEPLOY_PORT`: SSH port. Defaults to `22` when empty.

## PRODUCTION_ENV Example

```env
APP_PORT=3000
DATABASE_URL=postgresql://postgres:<password>@<supabase-host>:5432/postgres?sslmode=require
BETTER_AUTH_URL=https://survey.example.com
BETTER_AUTH_SECRET=<long-random-secret>
CRON_SECRET=<long-random-secret>
```

If the Supabase password contains special characters such as `@`, `#`, `/`, or `:`, URL encode it before placing it in `DATABASE_URL`.

## Server Requirements

Install these on the deploy server before the first deployment:

- Docker Engine
- Docker Compose plugin
- `rsync`

The workflow syncs the repository source to `DEPLOY_PATH`, writes `.env` from `PRODUCTION_ENV`, runs `docker compose up -d --build --remove-orphans`, and then prints `docker compose ps`.

## When It Runs

- Pull requests: lint and production build only.
- Push to `main` or `master`: lint, build, then deploy.
- Manual run: deploy through **Actions > CI/CD > Run workflow**.
