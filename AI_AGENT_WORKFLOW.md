# AI Agent Workflow (Copilot)

## 1. 目的

要件定義 -> 設計(ADR) -> 実装 -> 単体テスト -> 結合テストを、工程分離で運用する。

## 2. なぜこの方式か

GitHub Copilotは単一会話でも高品質に進められるが、工程ごとに入力と出力を固定した方がハレーションを抑えやすい。

## 3. 実行ステップ

1. Requirements Agentを実行し、specification/output/requirements.mdを作る。
2. handoff/output/requirements_to_design.mdを作る。
3. Design Agent (ADR)を実行し、design/output/adr/ADR-001.mdとdesign/output/adr_index.mdを作る。
4. handoff/output/adr_to_implementation.mdを作る。
5. Implementation Agentを実行し、実装とimplementation/output/implementation_notes.mdを作る。
6. handoff/output/implementation_to_unit_test.mdを作る。
7. Unit Test Agentを実行し、testing/unit/output/unit_test_spec.mdとtesting/unit/output/unit_test_report.mdを作る。
8. handoff/output/unit_to_integration_test.mdを作る。
9. Integration Test Agentを実行し、testing/integration/output/integration_test_spec.mdとtesting/integration/output/integration_test_report.mdを作る。

## 4. 運用ルール

- 各工程の開始時に、前工程のhandoffを読む。
- 各工程の終了時に、次工程向けhandoffを更新する。
- 変更理由と未解決事項を必ず残す。

## 5. 最小成果物

- 要件: specification/output/requirements.md
- 設計(ADR): design/output/adr/ADR-001.md, design/output/adr_index.md
- 実装ノート: implementation/output/implementation_notes.md
- 単体テスト: testing/unit/output/unit_test_spec.md, testing/unit/output/unit_test_report.md
- 結合テスト: testing/integration/output/integration_test_spec.md, testing/integration/output/integration_test_report.md
- 引継ぎ: handoff/output/*.md
