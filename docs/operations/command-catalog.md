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
