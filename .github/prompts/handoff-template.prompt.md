---
name: handoff-template-ja
description: "要件、制約、受け入れ条件、成果物を含むエージェント間 handoff パッケージを日本語で生成する。"
argument-hint: "タスク範囲と担当エージェントを指定"
agent: orchestrator
---
対象の専門エージェント向けに handoff パッケージを作成してください。

以下の固定セクションを必ず使い、具体的に記述してください。

## Task ID
- {YYYYMMDD-topic-shortid}

## Target Agent
- {design-agent|uiux-designer-agent|implementation-agent|test-debug-agent|review-agent}

## Context
- 背景と現在の状態

## Objective
- 達成すべきこと

## Inputs
- 関連ファイル、関連ドキュメント、現行制約

## Constraints
- スコープ境界
- 変更禁止事項
- 依存関係の制約

## Acceptance Criteria
- 合格条件
- 必要な検証エビデンス

## Deliverables
- 期待される成果物ファイルと形式

## Priority and Timebox
- 優先度
- 期限と対象範囲

## Notes for Return
- 受け手に以下を返却させる: Result Summary, Changed Files, Validation Executed, Known Risks, Next Recommended Action

