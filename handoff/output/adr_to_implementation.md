# エージェント引継ぎ資料

## 1. 引継ぎ元/先

- From: 02-design Agent
- To: 03-implementation Agent
- 日時: 2026-07-15

---

## 2. 完了した作業

- specification/output/requirements.md と handoff/output/requirements_to_design.md を読み込み、要件IDとリスクを把握した
- 全5つの Open Questions（OQ-001〜005）を設計判断として解決し、ADRに記録した
- 7件のADRを作成した（ADR-001〜007）
- ADRインデックス（adr_index.md）で要件ID ↔ ADR-IDのトレーサビリティを確立した

---

## 3. 成果物

| ファイル | 説明 |
|---|---|
| design/output/adr/ADR-001.md | システムアーキテクチャ（React SPA + Express REST API + PostgreSQL/Prisma） |
| design/output/adr/ADR-002.md | 認証・セッション管理（JWT + HttpOnly Cookie） |
| design/output/adr/ADR-003.md | 在庫・残席の排他制御（SELECT FOR UPDATE + Prismaトランザクション） |
| design/output/adr/ADR-004.md | 注文・チケット購入スナップショット保持方式 |
| design/output/adr/ADR-005.md | カート永続化方式（DB永続化、有効期限30日） |
| design/output/adr/ADR-006.md | パスワードハッシュ（bcrypt、cost factor=12） |
| design/output/adr/ADR-007.md | 注文ステータス遷移設計（5値） |
| design/output/adr_index.md | ADRインデックス・トレーサビリティ表・OQ解決状況 |
| handoff/output/adr_to_implementation.md | 本引継ぎ資料 |

---

## 4. 次工程（実装）で必ず確認する点

### アーキテクチャ（ADR-001）
- バックエンドは `ルート → コントローラ → サービス → リポジトリ` の4層構造で実装する
- APIエンドポイントは `/api/v1/` プレフィクスで統一する
- ORMは Prisma を使用し、直接SQL文の記述は最小限に留める（SQLi防止）

### 認証（ADR-002）
- JWTは `HttpOnly; SameSite=Strict; Secure` Cookieで発行する（localStorageに保存しない）
- 認証ミドルウェアを `req.user` にセットし、コントローラから利用する
- 認証失敗レスポンスは `"メールアドレスまたはパスワードが正しくありません"` の汎用文言に統一する

### 在庫・残席制御（ADR-003）
- 注文確定・チケット購入確定は必ず `prisma.$transaction()` 内で行う
- `SELECT FOR UPDATE` は Prisma の `$queryRaw` で実装する
- 複数商品を同一注文に含む場合は `productId` 昇順でロックを取得（デッドロック防止）
- 在庫不足・残席不足は例外として throw し、トランザクションを自動ロールバックさせる

### スナップショット（ADR-004）
- 注文確定時に `Product` の `name`, `price_tax_included` を `OrderItem` の `product_snapshot_name`, `unit_price` にコピーする
- `product_id` は FK だが NULL 許容にする（商品削除後も履歴を保持するため）
- チケット購入時は映画名・上映日時・券種・単価を `TicketPurchaseItem` にコピーする

### カート（ADR-005）
- カート取得・追加・更新は全て `user_id` で絞り込み、他会員のカートには絶対アクセスしない
- 注文確定後は `cart_items` テーブルの該当ユーザーの全レコードを削除する

### パスワード（ADR-006）
- `bcryptjs` パッケージを使用する（`bcrypt` の Native版ではなくJS実装版）
- `bcrypt.hash(password, 12)` で登録、`bcrypt.compare(plain, hash)` で照合する
- プレーンパスワードをログに出力しない

### 注文ステータス（ADR-007）
- 初期実装では模擬決済（CON-002）のため、注文作成時に直接 `confirmed` をセットする
- ステータス値は文字列定数として TypeScript の `enum` または `const` オブジェクトで定義する

---

## 5. 既知課題/リスク

| # | リスク | ADR対応 | 残リスク |
|---|---|---|---|
| RSK-001 | 在庫減算と注文登録の非アトミック処理によるデータ不整合 | ADR-003で解決（SELECT FOR UPDATE + トランザクション） | デッドロック（複数商品時の対策が実装で必要） |
| RSK-002 | チケット残席の同時購入競合 | ADR-003で解決（SELECT FOR UPDATE） | なし |
| RSK-003 | 模擬決済から本番移行時の全面変更 | ADR-007でpending_paymentステータスを設計に組み込み将来拡張を考慮 | 本番移行時には決済サービス連携の実装が必要 |
| RSK-004 | カートDB肥大化 | ADR-005で30日有効期限を設定 | バッチ削除の実装が必要 |

---

## 6. Open Questions

すべてのOQ（OQ-001〜005）は設計工程で解決済み。

| OQ-ID | 解決内容 | 参照ADR |
|---|---|---|
| OQ-001 | カート有効期限=30日（updated_at基準）、DB永続化 | ADR-005 |
| OQ-002 | 上映回販売終了判定: `sales_end_at` 優先、未設定時は `starts_at` 基準 | ADR-003 |
| OQ-003 | 注文ステータス: `pending_payment`→`confirmed`→`shipped`→`delivered`/`cancelled` | ADR-007 |
| OQ-004 | チケット券種: 初期実装は"一般"固定、複数券種はバックログ | ADR-004 |
| OQ-005 | パスワードハッシュ: bcrypt（bcryptjs、cost factor=12） | ADR-006 |

新規Open Questions（実装工程への引き継ぎ）:

| # | 質問 | 優先度 |
|---|---|---|
| OQ-101 | Prisma の `$queryRaw` で `SELECT FOR UPDATE` を実行する場合、型安全をどう確保するか | 中 |
| OQ-102 | カートの30日バッチ削除は Azure Functions で実装するか、起動時クリーンアップで対応するか | 低 |
