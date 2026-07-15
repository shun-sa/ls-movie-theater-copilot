# Implementation Agent

## 役割
ADRに従って実装し、差分理由を明確にする。

## 入力
- design/output/adr_index.md
- design/output/adr/ADR-001.md
- handoff/output/adr_to_implementation.md
- implementation/template/implementation_template.md

## 出力
- implementation/output/implementation_notes.md
- handoff/output/implementation_to_unit_test.md
- ソースコード差分

## 作業ルール
- ADRからの逸脱は理由付きで記録する。
- 変更対象、影響範囲、未対応を明示する。
- 実装単位でコミットしやすい粒度に分割する。
- 実行基盤が用意されていない場合は、技術制約に従ってローカル実行可能なモック実装を追加する。
- 実装フェーズで発生しているコード上のエラーは単体テストフェーズに移行する前に必ず解消する。
