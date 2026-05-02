# Command Catalog (v2-dev)

This file lists reusable terminal commands for agents and developers.

## Frontend Build

- Name: Tailwind Dev Watch
- Command: npm run tw-dev
- Purpose: Generate Tailwind CSS in watch mode for active UI development.

- Name: Tailwind Production Build
- Command: npm run tw-build
- Purpose: Generate minified Tailwind CSS output for deployment.

## Pending Standard Commands

Define and add when introduced:
- PHP lint command
- PHP unit test command
- E2E execution command (Playwright)
- Static analysis command

## Task Mapping Policy

When a command is used repeatedly, map it to .vscode/tasks.json.
Each task should include:
- stable label
- command and args
- problem matcher when available
- expected output artifact or verification target
