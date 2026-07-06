# Multi-Agent Operating Guide

## この構成でできること

GitHub Copilot上で、工程ごとに役割を分離した疑似マルチエージェント運用が可能。
完全な同時実行オーケストレーションよりも、成果物受け渡し型の順次実行に寄せるとハレーションが少ない。

## 推奨運用

1. 担当工程のagent定義を読む。
2. 対応templateから成果物を作る。
3. 成果物は各工程のoutput配下に保存する。
4. handoffを作成する。
5. 次工程へ引き継ぐ。

## Agent Definitions

- .github/agents/01-requirements.agent.md
- .github/agents/02-design.agent.md
- .github/agents/03-implementation.agent.md
- .github/agents/04-unit-test.agent.md
- .github/agents/05-integration-test.agent.md

## Prompts

- .github/prompts/requirements.prompt.md
- .github/prompts/design.prompt.md
- .github/prompts/implementation.prompt.md
- .github/prompts/unit-test.prompt.md
- .github/prompts/integration-test.prompt.md

## Artifact Templates

- specification/template/specification_template.md
- design/template/adr_template.md
- implementation/template/implementation_template.md
- testing/unit/template/unit_test_template.md
- testing/integration/template/integration_test_template.md
- handoff/template/agent_handoff_template.md

## Artifact Outputs

- specification/output/
- design/output/
- implementation/output/
- testing/unit/output/
- testing/integration/output/
- handoff/output/
