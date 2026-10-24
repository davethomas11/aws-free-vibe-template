# AWS Free-Tier + GitHub Pages Vibe Coding Template (`$0.00/mo`)

A reusable **GitHub Template Repository** pre-configured with AI agent guardrails (`AGENTS.md` + `.agents/rules/aws-free-tier.md`) for building full-stack apps at **$0.00/month** on AWS's **Always Free** tier and **GitHub Pages**.

---

## Architecture Stack (100% Always-Free)

| Layer | Technology | Free-Tier Allowance |
| :--- | :--- | :--- |
| **Frontend Hosting** | **GitHub Pages** (`frontend/` + GitHub Actions) | **100% Free** on public GitHub repositories |
| **Backend API** | **AWS Lambda + Function URLs** (`nodejs20.x`, `128 MB`) | **1,000,000 requests/mo** + **400,000 GB-s/mo** (Always Free, no API Gateway cost) |
| **Database** | **Amazon DynamoDB** (`PROVISIONED` mode, `5 RCU / 5 WCU`) | **25 GB storage** + **25 RCU / 25 WCU** across your AWS account (Always Free) |
| **AI Guardrails** | `AGENTS.md` & `.agents/rules/aws-free-tier.md` | Automatically enforces strict `$0` free-tier architecture in Antigravity |

---

## How to Start a New Project from This Template

### Option 1: One-Line Terminal Command (Fastest)
From `C:\Users\davet\dev` (replacing `my-new-app` with your project name):

```powershell
# 1. Create a new public GitHub repo from this template and clone it locally
gh repo create davethomas11/my-new-app --template davethomas11/aws-free-vibe-template --public --clone
cd my-new-app

# 2. Bootstrap local project name & install frontend packages (OR use `npm run bootstrap:cloud` to also deploy to AWS + Pages!)
npm run bootstrap -- my-new-app
```

### Option 2: From the GitHub Web UI
1. Open **[https://github.com/davethomas11/aws-free-vibe-template](https://github.com/davethomas11/aws-free-vibe-template)**.
2. Click the green **"Use this template"** button -> **"Create a new repository"**.
3. Clone your new repo and run:
   ```powershell
   npm run bootstrap -- <your-new-repo-name>
   ```

---

## Local Development (Zero AWS Calls)

You can build and test your entire app locally before ever deploying to AWS. The backend automatically uses an in-memory store when `TABLE_NAME` is not set:

```powershell
# Terminal 1: Start local Lambda Function URL simulator on http://localhost:3001
npm run dev:backend

# Terminal 2: Start Vite frontend on http://localhost:5173
npm run dev:frontend
```

---

## One-Command Cloud Deployment (AWS + GitHub Pages)

When you're ready to push your backend live to AWS (`us-west-2`) and wire your GitHub Pages frontend to it automatically:

```powershell
npm run bootstrap:cloud
```

What `npm run bootstrap:cloud` does automatically:
1. Sets your CloudFormation stack name in `package.json` to match your folder name.
2. Deploys your Lambda Function URL + Provisioned DynamoDB table via AWS SAM (`us-west-2`).
3. Fetches the generated `ApiFunctionUrl` from CloudFormation.
4. Saves `VITE_API_URL` into your GitHub repository's Actions variables (`gh variable set VITE_API_URL`).
5. Enables **GitHub Pages** (GitHub Actions workflow source) and triggers the frontend deployment.

### Subsequent Updates
* **Update Frontend:** `git push origin main` (GitHub Actions automatically builds and deploys `frontend/dist` to GitHub Pages).
* **Update Backend:** `npm run deploy:backend` (packages and updates your Lambda function and DynamoDB stack via SAM).
* **Tear Down Backend:** `npm run teardown:backend` (deletes the CloudFormation stack, Lambda function, and DynamoDB table completely).

---

## Keeping Your AWS Bill at $0.00

1. **DynamoDB Provisioned Capacity Pool (`25 RCU / 25 WCU` Account Limit):**
   * Each deployed template stack provisions **`5 RCU` and `5 WCU`**.
   * That means you can keep up to **5 separate project stacks** deployed simultaneously in your AWS account for **$0.00/month forever**.
   * Before deploying a 6th stack, run `npm run teardown:backend` in one of your older projects to free up its 5 RCU / 5 WCU.
2. **List All Active Stacks Anytime:**
   ```powershell
   aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[].StackName"
   ```
