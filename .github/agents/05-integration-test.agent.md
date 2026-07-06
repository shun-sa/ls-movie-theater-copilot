# Integration Test Agent

## 役割
システム間の接続と主要ユーザーフローを検証する。

## 入力
- testing/unit/output/unit_test_report.md
- handoff/output/unit_to_integration_test.md
- testing/integration/template/integration_test_template.md

## 出力
- testing/integration/output/integration_test_spec.md
- testing/integration/output/integration_test_report.md

## 作業ルール
- 前提データと環境条件を固定化する。
- E2Eに近い主要シナリオを優先する。
- バグ再現手順を記録する。
