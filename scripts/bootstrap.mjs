#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const shouldDeploy = args.includes("--deploy");
const nameArg = args.find((a) => !a.startsWith("--"));

const rootDir = process.cwd();
const rawName = nameArg || path.basename(rootDir);
const projectName = rawName
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");

if (!projectName) {
  console.error("Usage: npm run bootstrap -- <project-name> [--deploy]");
  process.exit(1);
}

console.log(`\n🚀 Bootstrapping project: "${projectName}"...`);

// 1. Update package.json name & SAM stack-name
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.name = projectName;
pkg.scripts["deploy:backend"] =
  `cd backend && sam deploy --stack-name ${projectName} --region us-west-2 --resolve-s3 --capabilities CAPABILITY_IAM --no-confirm-changeset --no-fail-on-empty-changeset`;
pkg.scripts["teardown:backend"] =
  `cd backend && sam delete --stack-name ${projectName} --region us-west-2 --no-prompts`;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✓ Updated package.json with stack name "${projectName}"`);

// 2. Update frontend/index.html title
const htmlPath = path.join(rootDir, "frontend", "index.html");
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, "utf8");
  html = html.replace(/Web Vibe Starter/g, projectName);
  fs.writeFileSync(htmlPath, html);
  console.log(`✓ Updated frontend/index.html title to "${projectName}"`);
}

// 3. Install frontend dependencies
console.log(`📦 Installing frontend dependencies...`);
execSync("npm --prefix frontend install", { stdio: "inherit" });

if (!shouldDeploy) {
  console.log(`\n✅ Local bootstrap complete for "${projectName}"!`);
  console.log(`Next steps:`);
  console.log(`  • Local dev:       npm run dev:backend   (and npm run dev:frontend)`);
  console.log(`  • Cloud deploy:    npm run bootstrap:cloud`);
  process.exit(0);
}

// 4. Full Cloud Bootstrap: Deploy SAM stack + Configure GitHub Pages & VITE_API_URL
console.log(`\n☁️ Deploying AWS Free-Tier Stack "${projectName}" to us-west-2...`);
execSync(pkg.scripts["deploy:backend"], { stdio: "inherit" });

// Query CloudFormation for the newly created ApiFunctionUrl
const apiUrl = execSync(
  `aws cloudformation describe-stacks --stack-name ${projectName} --region us-west-2 --query "Stacks[0].Outputs[?OutputKey=='ApiFunctionUrl'].OutputValue" --output text`,
  { encoding: "utf8" }
).trim();

console.log(`✓ Live Lambda Function URL: ${apiUrl}`);

try {
  console.log(`🔧 Setting VITE_API_URL variable on GitHub repository...`);
  execSync(`gh variable set VITE_API_URL --body "${apiUrl}"`, { stdio: "inherit" });

  console.log(`🌐 Enabling GitHub Pages (GitHub Actions workflow mode)...`);
  try {
    execSync(`gh api repos/{owner}/{repo}/pages -X POST -f build_type=workflow`, {
      stdio: "pipe",
    });
  } catch {
    // Pages may already be enabled
  }

  console.log(`🚀 Triggering GitHub Pages deployment...`);
  execSync(`gh workflow run "Deploy Frontend to GitHub Pages"`, { stdio: "inherit" });
} catch (err) {
  console.warn(
    `⚠️ Could not auto-configure GitHub Pages via 'gh' CLI (make sure this repo has a GitHub remote pushed).`
  );
}

console.log(`\n🎉 Cloud bootstrap complete!`);
console.log(`   Stack Name:   ${projectName}`);
console.log(`   Lambda URL:   ${apiUrl}`);
