---
trigger: always_on
description: Enforce strict $0 AWS Always-Free Tier usage (Lambda Function URLs + Provisioned DynamoDB + GitHub Pages)
---

# Strict AWS Free Tier Guardrails

1. **Compute:** Only use AWS Lambda (`128 MB` memory default) exposed via **Lambda Function URLs** (`AuthType: NONE` with CORS configured). Do **not** provision API Gateway, EC2, ECS, App Runner, VPCs, NAT Gateways, or Elastic IPs.
2. **Database:** Only use Amazon DynamoDB with **`BillingMode: PROVISIONED`** (`ReadCapacityUnits: 5`, `WriteCapacityUnits: 5`). Never use `PAY_PER_REQUEST` (On-Demand), RDS, Aurora, or ElastiCache.
3. **Frontend:** Host static frontend builds on **GitHub Pages** via `.github/workflows/deploy-pages.yml` and keep Vite configured with `base: './'`.
4. **Region:** Deploy AWS resources in `us-west-2` using AWS SAM (`backend/template.yaml`).
