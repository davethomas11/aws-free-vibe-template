# Web Vibe Starter — Project Rules & Architecture Guidelines

This project is designed for rapid "vibe coding" using a **100% Always-Free Cloud Stack**:
- **Frontend Hosting:** GitHub Pages (`frontend/`)
- **Backend Compute:** AWS Lambda with **Lambda Function URLs** (`backend/`)
- **Backend Database:** Amazon DynamoDB in **Provisioned Free Tier Mode** (`backend/template.yaml`)
- **AWS Region:** `us-west-2` (Account `654446971678`, IAM User `programmatic-access`)

---

## Mandatory Cost & Architecture Rules (Strict $0.00 AWS Free Tier)

Whenever writing code, adding cloud resources, or deploying infrastructure in this repository, you **MUST** obey these rules:

### 1. AWS Lambda (Always Free Tier: 1M requests/mo, 400,000 GB-s/mo)
- **Use Lambda Function URLs (`FunctionUrlConfig`) instead of API Gateway.**
  - API Gateway's free tier expires after 12 months. Lambda Function URLs are **Always Free** and provide a dedicated HTTPS endpoint (`https://<url-id>.lambda-url.us-west-2.on.aws/`).
  - Always configure CORS on `FunctionUrlConfig` (AND/OR return CORS headers in responses) so the GitHub Pages frontend can call the endpoint from browser `fetch()`.
- **Memory & Timeout:** Default to `MemorySize: 128` MB and `Timeout: 10` seconds unless a task explicitly requires more.
- **No VPCs or NAT Gateways:** **NEVER** place Lambda functions inside a VPC or create an `AWS::EC2::NatGateway` or `AWS::EC2::EIP`. Default Lambda networking has free outbound internet and DynamoDB access.
- **Zero-Dependency Runtime:** Use `nodejs20.x` (or `nodejs22.x`) ESM handlers (`.mjs`). The AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`) is pre-installed in the Lambda Node.js runtime.

### 2. Amazon DynamoDB (Always Free Tier: 25 GB + 25 RCU + 25 WCU)
- **ALWAYS use `BillingMode: PROVISIONED`.**
  - **NEVER** use `PAY_PER_REQUEST` (On-Demand), because AWS's Always-Free 25 RCU / 25 WCU allowance applies **only** to `PROVISIONED` capacity.
- **Capacity Limits:** Set `ReadCapacityUnits: 5` and `WriteCapacityUnits: 5` per table (and ensure total provisioned capacity across the entire AWS account stays `<= 25 RCU` and `<= 25 WCU`).
- **Keep It Simple:** Prefer a single DynamoDB table (`pk` / `sk` string keys) per project so you don't fragment provisioned capacity across multiple tables.
- **No Paid Add-ons:** Do not enable DynamoDB Streams, Global Tables, Point-in-Time Recovery (PITR), or DAX unless explicitly requested by the user, as those incur charges outside the free tier.

### 3. Amazon S3 (Optional Storage)
- The account has an existing bucket (`dt-store`). Do not create public buckets or enable paid S3 features (like S3 Intelligent-Tiering monitoring or Replication) unless asked.

### 4. GitHub Pages Frontend (`frontend/`)
- Keep `base: './'` in `frontend/vite.config.js` so static assets resolve properly on GitHub Pages (`https://davethomas11.github.io/<repo-name>/`) without hardcoding the repository name.
- Read the Lambda Function URL from `import.meta.env.VITE_API_URL` (falling back to `http://localhost:3001` during local dev).

### 5. Local Development & Deployment Workflow
- **Local Dev (Zero AWS Calls):** Run `npm run dev` from the root to start both the local Lambda simulator (`http://localhost:3001` with in-memory DynamoDB mock fallback) and the Vite frontend (`http://localhost:5173`).
- **Cloud Deployment:** Use AWS SAM inside `backend/` (note: skip `sam build` since zero-dependency `.mjs` handlers package directly with `sam deploy`):
  ```powershell
  cd backend
  sam deploy --stack-name web-vibe-starter --region us-west-2 --resolve-s3 --capabilities CAPABILITY_IAM --no-confirm-changeset --no-fail-on-empty-changeset
  ```
- **Cleanup / Teardown:** To delete all AWS resources for a stack:
  ```powershell
  cd backend
  sam delete --stack-name <project-stack-name> --no-prompts
  ```
