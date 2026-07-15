# ADR インデックス

作成日: 2026-07-15  
ステータス: すべて Accepted

---

## ADR一覧

| ADR-ID | タイトル | 関連REQ-ID | ステータス | 解決したOQ |
|---|---|---|---|---|
| [ADR-001](adr/ADR-001.md) | システムアーキテクチャ構成（React SPA + REST API + PostgreSQL） | C-UI-001, NFR-PERF-001〜002, NFR-SEC-004〜005 | Accepted | — |
| [ADR-002](adr/ADR-002.md) | 認証・セッション管理方式（JWT + HttpOnly Cookie） | FR-001, FR-002, C-AUTH-001〜004, NFR-SEC-001〜002, NFR-SEC-006 | Accepted | — |
| [ADR-003](adr/ADR-003.md) | 在庫・残席の排他制御方式（SELECT FOR UPDATE + Prismaトランザクション） | FR-006, FR-008, FR-009, NFR-AVL-001〜004, ERR-003, ERR-005 | Accepted | OQ-002 |
| [ADR-004](adr/ADR-004.md) | 注文・チケット購入スナップショット保持方式（明細テーブルへの埋め込み） | FR-008, FR-010, C-DATA-004, DM-005, DM-007 | Accepted | OQ-004 |
| [ADR-005](adr/ADR-005.md) | カート永続化方式（DBテーブル永続化、有効期限30日） | FR-006, FR-007, FR-008, DM-004 | Accepted | OQ-001 |
| [ADR-006](adr/ADR-006.md) | パスワードハッシュアルゴリズム（bcrypt、cost factor=12） | FR-001, FR-002, NFR-SEC-001, NFR-SEC-006 | Accepted | OQ-005 |
| [ADR-007](adr/ADR-007.md) | 注文ステータス遷移設計（5値ステートマシン） | FR-008, FR-010, DM-005, CON-003 | Accepted | OQ-003 |

---

## 要件ID → ADR-ID トレーサビリティ

| 要件ID | 対応するADR |
|---|---|
| FR-001（会員登録） | ADR-002, ADR-006 |
| FR-002（ログイン） | ADR-002, ADR-006 |
| FR-003（映画作品検索） | ADR-001 |
| FR-004（映画作品詳細閲覧） | ADR-001 |
| FR-005（商品検索・閲覧） | ADR-001 |
| FR-006（カートに追加） | ADR-003, ADR-005 |
| FR-007（カート内容変更） | ADR-005 |
| FR-008（商品注文） | ADR-003, ADR-004, ADR-005, ADR-007 |
| FR-009（映画チケット購入） | ADR-003, ADR-004 |
| FR-010（購入履歴確認） | ADR-004, ADR-007 |
| C-AUTH-001〜004 | ADR-002 |
| C-DATA-004 | ADR-004 |
| NFR-AVL-001〜004 | ADR-003 |
| NFR-SEC-001 | ADR-006 |
| NFR-SEC-002〜004 | ADR-002 |
| NFR-SEC-005 | ADR-001（Prisma ORM） |
| NFR-SEC-006 | ADR-002, ADR-006 |
| DM-004（Cart/CartItem） | ADR-005 |
| DM-005（Order/OrderItem） | ADR-004, ADR-007 |
| DM-007（TicketPurchase/TicketPurchaseItem） | ADR-004 |

---

## Open Questions 解決状況

| OQ-ID | 質問 | 解決ADR | 決定内容 |
|---|---|---|---|
| OQ-001 | カートの有効期限 | ADR-005 | DB永続化、有効期限30日（updated_at基準） |
| OQ-002 | 上映回の販売終了判定基準 | ADR-003 | `starts_at < NOW()` 基準。`sales_end_at` がある場合は優先 |
| OQ-003 | 注文ステータス遷移定義 | ADR-007 | `pending_payment` → `confirmed` → `shipped` → `delivered` / `cancelled` |
| OQ-004 | チケット券種の種類と価格 | ADR-004 | 初期実装は"一般"固定。複数券種はバックログ |
| OQ-005 | パスワードハッシュアルゴリズム | ADR-006 | bcrypt（cost factor=12） |
