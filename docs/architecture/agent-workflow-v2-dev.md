# Agent Workflow for Ambient v2-dev

## 1. Objective

Define a practical multi-agent workflow for AI-driven development in v2-dev.
This workflow aligns requirement handling, design, implementation, verification, and review with auditable outputs.

## 2. End-to-End Flow

1. Intake and triage (Orchestrator)
2. Requirement decomposition and task breakdown (Orchestrator)
3. Detailed design (Design Agent)
4. UI/UX specification when UI scope exists (UI/UX Designer)
5. Implementation and unit tests (Implementation Agent)
6. Functional, regression, and E2E verification (Test/Debug Agent)
7. Quality review and categorization (Review Agent)
8. Integrated report back to user (Orchestrator)

## 3. Workflow Diagram (Text)

- User request -> Orchestrator
- Orchestrator -> Design Agent (design handoff)
- Orchestrator -> UI/UX Designer (if UI task)
- Orchestrator -> Implementation Agent (implementation handoff)
- Orchestrator -> Test/Debug Agent (verification handoff)
- Orchestrator -> Review Agent (quality handoff)
- All outputs -> Orchestrator (aggregation)
- Orchestrator -> User (final report)

## 4. Artifacts by Stage

### Stage A: Intake

Output:
- docs/features/requests/YYYYMMDD-{topic}-orchestrator-intake.md

Includes:
- requirement summary
- assumptions
- in-scope and out-of-scope
- acceptance criteria draft

### Stage B: Design

Output:
- docs/architecture/design/YYYYMMDD-{topic}-design-spec.md

Includes:
- architecture impact
- data/interface contracts
- migration or compatibility notes
- implementation slicing proposal

### Stage C: UI/UX (Optional)

Output:
- docs/features/uiux/YYYYMMDD-{topic}-uiux-spec.md

Includes:
- screen and interaction specification
- responsive behavior
- accessibility checkpoints
- motion and visual rationale

### Stage D: Implementation

Output:
- source code changes
- test code when applicable
- docs/operations/handoffs/YYYYMMDD-{topic}-implementer-handoff.md

Includes:
- changed files list
- implementation notes
- unit test evidence

### Stage E: Test/Debug

Output:
- docs/operations/testing/YYYYMMDD-{topic}-test-plan.md
- docs/operations/test-reports/YYYYMMDD-{topic}-test-report.md
- tests/e2e/{topic}.spec.ts (when Playwright is introduced)

Includes:
- executed scenarios
- pass/fail result
- reproducible bug records
- root cause hypothesis

### Stage F: Review

Output:
- docs/operations/reviews/YYYYMMDD-{topic}-review.md

Includes:
- Must Fix
- Should Fix
- Nice to Have
- overall assessment

## 5. Handoff Message Template

Use this template in every agent-to-agent handoff.

- Task ID
- Objective
- Inputs (docs and code references)
- Constraints
- Acceptance Criteria
- Deliverables
- Timebox or priority

## 6. Decision Rules

- If requirement ambiguity is high, loop back to intake before implementation.
- If design impact crosses modules, require design stage output before coding.
- If UI changes user behavior, require UI/UX stage and manual verification points.
- If bug risk is high, require Test/Debug stage before review stage.

## 7. Initial Command Standardization

Given current repository scripts:
- npm run tw-dev
- npm run tw-build

Plan:
1. Document each command intent in docs/operations/command-catalog.md
2. Add VS Code tasks for frequent commands in .vscode/tasks.json
3. Expand catalog when php lint, unit test, and e2e commands are introduced

## 8. Recommended Next Additions

1. Define custom agent files under .github/agents/ for the 6 roles.
2. Add instructions files under .github/instructions/ for role-specific constraints.
3. Create prompt templates under .github/prompts/ for standard handoff generation.
4. Prepare reusable skill packages under .github/skills/ for test execution workflows.
