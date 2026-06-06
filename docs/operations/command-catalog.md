# Command Catalog (v2-dev)

This file lists reusable terminal commands for agents and developers.

## Frontend Build

- Name: Vite Dev Server
- Command: npm run dev
- Purpose: Start the Vite dev server for local asset development and HMR.

- Name: Vite Production Build
- Command: npm run build
- Purpose: Generate `dist/manifest.json` and `dist/assets/*` for production-style deployment.

- Name: TypeScript Type Check
- Command: npm run typecheck
- Purpose: Run TypeScript validation without emitting legacy build artifacts.

- Name: Playwright E2E
- Command: npm run test:e2e
- Purpose: Execute the standard E2E matrix for chrome, ipad, and iphone projects.

- Name: Release Start
- Command: npm run release:start -- <version>
- Purpose: Start a release branch with typecheck, build, and dist drift checks before version bumping.

- Name: Release Prepare
- Command: npm run release:prepare -- <version>
- Purpose: Build and commit dist artifacts on feature/v<version>, then merge the feature branch into dev before release:start.

- Name: Release Finish
- Command: npm run release:finish -- <version>
- Purpose: Finish a release branch, sync main back to dev, and optionally run public verification.

- Name: Playwright Public E2E (Tagged)
- Command: npm run test:e2e:public
- Purpose: Execute all public-release tagged E2E scenarios (grep: @public-release) against E2E_BASE_URL.

- Name: Release Public Verification
- Command: npm run release:verify:public
- Purpose: Run public-release tagged E2E against production base URL by default (https://amp.ka2.org/).

- Name: Release Finish Public Verification Flag
- Command: npm run release:finish -- <version> -- -RunPublicE2E
- Purpose: Run the public verification pass from the release finish flow. Use -PublicE2EBaseUrl to override the default https://amp.ka2.org/ URL.

## Pending Standard Commands

Define and add when introduced:
- PHP lint command
- Static analysis command

## Task Mapping Policy

When a command is used repeatedly, map it to .vscode/tasks.json.
Each task should include:
- stable label
- command and args
- problem matcher when available
- expected output artifact or verification target
