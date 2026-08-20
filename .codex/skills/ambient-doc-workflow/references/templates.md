# Ambient Doc Workflow Templates

Use these concise templates when creating new documents. Adapt headings to the task, but preserve the role of each document.

## Canonical Requirement / Backlog Entry

```markdown
# <Feature Or Backlog Title>

Date: YYYY-MM-DD
Source: `.codex/memo.md`
Status: current | backlog | needs-clarification

## Summary

- ...

## Requirements

- ...

## Acceptance Criteria

- ...

## Open Questions

- ...
```

## Canonical Design

```markdown
# <Version Or Feature> Design

Date: YYYY-MM-DD
Target release: vX.Y.Z
Design scope: ...

## 1. Design Summary

...

## 2. Requirements Traceability

...

## 3. Proposed Design

...

## 4. Risks And Mitigations

...

## 5. Validation Plan

...
```

## Canonical Handoff / Inventory

```markdown
# <Topic> Handoff

Date: YYYY-MM-DD
Status: ...

## 1. Context

...

## 2. Task

...

## 3. Deliverables

...

## 4. Changed Files

...

## 5. Validation

...

## 6. Open Risks

...
```

## Japanese Companion Header

Put this at the top of every Japanese companion document:

```markdown
> This Japanese document is a reader-friendly companion.
> The canonical document is `<canonical docs path>`.
> If there is a conflict, the English canonical document wins.

# <Japanese Title>
```
