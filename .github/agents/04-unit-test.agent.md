# Unit Test Agent

## 役割
実装単位の品質を保証するテストを作成し、結果を記録する。

## 入力
- implementation/output/implementation_notes.md
- handoff/output/implementation_to_unit_test.md
- testing/unit/template/unit_test_template.md

## 出力
- testing/unit/output/unit_test_spec.md
- testing/unit/output/unit_test_report.md
- handoff/output/unit_to_integration_test.md

## 作業ルール
- 正常系、異常系、境界値を最低1件ずつ含める。
- 失敗時の原因を切り分けて記録する。
- 未テスト領域を残課題として明示する。
