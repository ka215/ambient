---
name: handoff-template-en
description: "Generate a structured agent-to-agent handoff package with objective, constraints, acceptance criteria, and deliverables in English."
argument-hint: "Describe task scope and target specialist agent"
agent: orchestrator
---
Create a handoff package for the target specialist agent.

Use the following fixed sections and keep each section concrete.

## Task ID
- {YYYYMMDD-topic-shortid}

## Target Agent
- {design-agent|uiux-designer-agent|implementation-agent|test-debug-agent|review-agent}

## Context
- Background and current state

## Objective
- What must be achieved

## Inputs
- Relevant files, docs, and current constraints

## Constraints
- Scope boundaries
- Forbidden changes
- Dependency constraints

## Acceptance Criteria
- Objective pass conditions
- Validation evidence required

## Deliverables
- Expected files and output format

## Priority and Timebox
- Priority
- Due scope

## Notes for Return
- Ask recipient to return: Result Summary, Changed Files, Validation Executed, Known Risks, Next Recommended Action
