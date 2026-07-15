# 単体テスト仕様書

## 1. 概要

- 対象工程: 03-implementation
- テスト実施: 2026-07-15
- 対象モジュール: 認証, カート, 注文, チケット, エラーハンドリング
- テストフレームワーク: Jest + ts-jest

---

## 2. テストケース仕様

### 2.1 認証モジュール (FR-001 / FR-002)

#### UT-001: 会員登録 - 正常系

| 項目 | 値 |
|---|---|
| TC-ID | UT-001 |
| 機能 | FR-001: 会員登録 |
| 観点 | 正常系：有効なメール・パスワード |
| 前提条件 | ユーザーが未登録、データベース接続可 |
| 入力 | `{ email: "user@example.com", password: "Test1234" }` |
| 期待結果 | ステータスコード 201、ユーザーID返却、bcrypt hash で保存 |
| 検証ポイント | - パスワードが bcrypt cost=12 で hash化 <br> - ユーザーが DB に保存 <br> - 返却値に userId, email 含む |

#### UT-002: 会員登録 - パスワード境界値テスト（最小）

| 項目 | 値 |
|---|---|
| TC-ID | UT-002 |
| 機能 | FR-001: 会員登録 |
| 観点 | 境界値：パスワード 8文字（最小有効） |
| 前提条件 | ユーザーが未登録 |
| 入力 | `{ email: "min@example.com", password: "Pass1234" }` |
| 期待結果 | ステータスコード 201、正常登録 |
| 検証ポイント | - 8文字で受け入れ <br> - 7文字は 400 エラー |

#### UT-003: 会員登録 - パスワード境界値テスト（最大）

| 項目 | 値 |
|---|---|
| TC-ID | UT-003 |
| 機能 | FR-001: 会員登録 |
| 観点 | 境界値：パスワード 64文字（最大有効） |
| 前提条件 | ユーザーが未登録 |
| 入力 | `{ email: "max@example.com", password: "A".repeat(64) }` |
| 期待結果 | ステータスコード 201、正常登録 |
| 検証ポイント | - 64文字で受け入れ <br> - 65文字は 400 エラー |

#### UT-004: 会員登録 - メールアドレス重複

| 項目 | 値 |
|---|---|
| TC-ID | UT-004 |
| 機能 | FR-001: 会員登録 |
| 観点 | 異常系：メールアドレス一意性違反 |
| 前提条件 | user@example.com が既に登録済み |
| 入力 | `{ email: "user@example.com", password: "Test1234" }` |
| 期待結果 | ステータスコード 409、DuplicateEmailError |
| 検証ポイント | - エラーメッセージに "既に登録済み" <br> - HTTP 409 Conflict |

#### UT-005: ログイン - 正常系

| 項目 | 値 |
|---|---|
| TC-ID | UT-005 |
| 機能 | FR-002: ログイン |
| 観点 | 正常系：正しいメール・パスワード |
| 前提条件 | ユーザー登録済み（user@example.com / Test1234） |
| 入力 | `{ email: "user@example.com", password: "Test1234" }` |
| 期待結果 | ステータスコード 200、JWT Token + HttpOnly Cookie 設定 |
| 検証ポイント | - JWT Token に userId, email 含む <br> - Token 有効期限 24時間 <br> - Cookie SameSite=Strict <br> - Cookie HttpOnly=true |

#### UT-006: ログイン - 異常系（汎用エラーメッセージ）

| 項目 | 値 |
|---|---|
| TC-ID | UT-006 |
| 機能 | FR-002: ログイン (NFR-SEC-006) |
| 観点 | 異常系：錯誤メール・パスワード（汎用メッセージ） |
| 前提条件 | ユーザー登録済み |
| 入力 | Case A: `{ email: "wrong@example.com", password: "Test1234" }` <br> Case B: `{ email: "user@example.com", password: "WrongPass" }` <br> Case C: `{ email: "user@example.com", password: "" }` |
| 期待結果 | ステータスコード 401、メッセージ = "メールアドレスまたはパスワードが正しくありません" |
| 検証ポイント | - 存在しないメール、不正パスワード、空白 で全て同じメッセージ |

#### UT-007: ログイン - パスワード比較検証

| 項目 | 値 |
|---|---|
| TC-ID | UT-007 |
| 機能 | FR-002: ログイン |
| 観点 | 正常系：bcrypt.compare() で hash 比較 |
| 前提条件 | ユーザー hash パスワード = bcrypt.hash("Test1234", 12) |
| 入力 | 平文パスワード: "Test1234" |
| 期待結果 | bcrypt.compare() = true |
| 検証ポイント | - hash 化されたパスワードと平文パスワードが正しく照合 |

---

### 2.2 カート・注文モジュール (FR-006 / FR-007 / FR-008 / ADR-003 / ADR-004)

#### UT-008: カート追加 - 正常系

| 項目 | 値 |
|---|---|
| TC-ID | UT-008 |
| 機能 | FR-006: カート追加 |
| 観点 | 正常系：有効な商品・数量 |
| 前提条件 | ユーザーログイン済み、商品 A（在庫: 10）存在 |
| 入力 | `{ productId: "prod-001", quantity: 2 }` |
| 期待結果 | CartItem 作成、ステータスコード 201 |
| 検証ポイント | - CartItem.quantity = 2 <br> - Cart.totalPrice 更新 |

#### UT-009: カート追加 - 在庫超過（異常系）

| 項目 | 値 |
|---|---|
| TC-ID | UT-009 |
| 機能 | FR-006: カート追加 |
| 観点 | 異常系：在庫不足 |
| 前提条件 | 商品 A（在庫: 5） |
| 入力 | `{ productId: "prod-001", quantity: 10 }` |
| 期待結果 | ステータスコード 409、InsufficientStockError |
| 検証ポイント | - メッセージ = "在庫が不足しています" |

#### UT-010: カート更新 - 正常系

| 項目 | 値 |
|---|---|
| TC-ID | UT-010 |
| 機能 | FR-007: カート更新 |
| 観点 | 正常系：数量更新 |
| 前提条件 | カート内に CartItem（quantity: 2）存在 |
| 入力 | `{ productId: "prod-001", quantity: 5 }` |
| 期待結果 | CartItem.quantity = 5, ステータスコード 200 |
| 検証ポイント | - DB に反映 |

#### UT-011: カート削除 - 数量 0 指定

| 項目 | 値 |
|---|---|
| TC-ID | UT-011 |
| 機能 | FR-007: カート削除 |
| 観点 | 正常系：数量を 0 に指定（削除） |
| 前提条件 | CartItem（quantity: 2）存在 |
| 入力 | `{ productId: "prod-001", quantity: 0 }` |
| 期待結果 | CartItem 削除, ステータスコード 200 |
| 検証ポイント | - DB から削除 |

#### UT-012: 注文確定 - 排他制御（正常系）

| 項目 | 値 |
|---|---|
| TC-ID | UT-012 |
| 機能 | FR-008: 注文確定（ADR-003: 排他制御） |
| 観点 | 正常系：複数商品注文の排他制御 |
| 前提条件 | ユーザーログイン済み、カート内に商品 A（在庫: 10）, B（在庫: 5）|
| 入力 | - Cart に CartItem × 2（productId=A qty=2, productId=B qty=3） |
| 期待結果 | Order 作成、Status = pending_payment、OrderItem × 2、在庫減算（A: 8, B: 2） |
| 検証ポイント | - `SELECT FOR UPDATE` 実行（Prisma $queryRaw） <br> - Transaction コミット <br> - Product.stock 減算正確 <br> - OrderItem スナップショット保存（ADR-004） |

#### UT-013: 注文確定 - ロールバック（異常系）

| 項目 | 値 |
|---|---|
| TC-ID | UT-013 |
| 機能 | FR-008: 注文確定（ADR-003: ロールバック） |
| 観点 | 異常系：2商品目で在庫不足 → トランザクション全ロールバック |
| 前提条件 | カート内に商品 A（在庫: 10, qty: 2）, B（在庫: 2, qty: 5） |
| 入力 | 注文確定リクエスト |
| 期待結果 | ステータスコード 409、Order 未作成、Product.stock 変更なし、InsufficientStockError |
| 検証ポイント | - Transaction ロールバック <br> - A の在庫が 10 のままで減算されない（全ロール<br> - エラーメッセージに "残り在庫: 2" 含む |

#### UT-014: 注文確定 - スナップショット保存（ADR-004）

| 項目 | 値 |
|---|---|
| TC-ID | UT-014 |
| 機能 | FR-008 & FR-010: スナップショット（ADR-004） |
| 観点 | 正常系：注文時点の商品情報をスナップショット保存 |
| 前提条件 | Product { name: "グッズA", unitPrice: 1000 } で購入 |
| 入力 | 注文確定 |
| 期待結果 | OrderItem.productSnapshotName = "グッズA", OrderItem.unitPrice = 1000 |
| 検証ポイント | - 後で商品削除・価格変更しても OrderItem は元の値を保持 |

#### UT-015: 注文確定 - カート クリア（ADR-005）

| 項目 | 値 |
|---|---|
| TC-ID | UT-015 |
| 機能 | FR-008: 注文確定（ADR-005: カートクリア） |
| 観点 | 正常系：注文後カートアイテムが全削除 |
| 前提条件 | カート内に CartItem × 3 |
| 入力 | 注文確定リクエスト |
| 期待結果 | Order 作成、CartItem すべて削除 |
| 検証ポイント | - Cart.items.length = 0 |

---

### 2.3 チケット購入モジュール (FR-009 / ADR-003 / OQ-002)

#### UT-016: チケット購入 - 正常系

| 項目 | 値 |
|---|---|
| TC-ID | UT-016 |
| 機能 | FR-009: チケット購入 |
| 観点 | 正常系：有効な上映・席数 |
| 前提条件 | Screening { id: "scr-001", remainingSeats: 50 } |
| 入力 | `{ screeningId: "scr-001", ticketType: "general", quantity: 5 }` |
| 期待結果 | TicketPurchase 作成、remainingSeats = 45 |
| 検証ポイント | - 排他制御 SELECT FOR UPDATE <br> - Screening.remainingSeats 減算 |

#### UT-017: チケット購入 - 残席超過（異常系）

| 項目 | 値 |
|---|---|
| TC-ID | UT-017 |
| 機能 | FR-009: チケット購入 |
| 観点 | 異常系：残席不足 |
| 前提条件 | Screening { remainingSeats: 3 } |
| 入力 | `{ screeningId: "scr-001", quantity: 5 }` |
| 期待結果 | ステータスコード 409、InsufficientSeatsError |
| 検証ポイント | - "残り枚数: 3" メッセージ <br> - remainingSeats 変更なし |

#### UT-018: チケット購入 - 販売期間チェック（OQ-002）

| 項目 | 値 |
|---|---|
| TC-ID | UT-018 |
| 機能 | FR-009: チケット購入（ADR-003 OQ-002） |
| 観点 | 異常系：販売期間外（sales_end_at 優先） |
| 前提条件 | Screening { sales_end_at: "2026-07-01T12:00:00Z", starts_at: "2026-07-15T18:00:00Z" } <br> 現在時刻: 2026-07-15T16:00:00Z |
| 入力 | チケット購入リクエスト |
| 期待結果 | ステータスコード 409、SalesOutOfPeriodError |
| 検証ポイント | - sales_end_at が優先的に判定される <br> - starts_at の時刻超過は許可（スキップ） |

#### UT-019: チケット購入 - 販売期間チェック（sales_end_at なし）

| 項目 | 値 |
|---|---|
| TC-ID | UT-019 |
| 機能 | FR-009: チケット購入（ADR-003 OQ-002） |
| 観点 | 正常系：sales_end_at なし → starts_at 基準 |
| 前提条件 | Screening { sales_end_at: null, starts_at: "2026-07-20T18:00:00Z" } <br> 現在時刻: 2026-07-15T16:00:00Z |
| 入力 | チケット購入リクエスト |
| 期待結果 | TicketPurchase 作成（正常） |
| 検証ポイント | - starts_at より前であれば購入可能 |

#### UT-020: チケット購入 - スナップショット保存（ADR-004 OQ-004）

| 項目 | 値 |
|---|---|
| TC-ID | UT-020 |
| 機能 | FR-009 & FR-010: チケットスナップショット（ADR-004） |
| 観点 | 正常系：チケット単価・種別をスナップショット保存 |
| 前提条件 | ticket_type = "general", unitPrice = 1800 |
| 入力 | チケット購入 |
| 期待結果 | TicketPurchaseItem { ticketType: "general", unitPrice: 1800 } 保存 |
| 検証ポイント | - 後で TICKET_PRICES 変更しても item は元の価格保持 |

---

### 2.4 エラーハンドリング (ERR-001 / ERR-002 / ERR-003 / ERR-004 / ERR-005)

#### UT-021: バリデーションエラー（ERR-001）

| 項目 | 値 |
|---|---|
| TC-ID | UT-021 |
| 機能 | エラーハンドリング（ERR-001） |
| 観点 | 正常系：Zodバリデーション失敗 |
| 前提条件 | — |
| 入力 | `{ email: "invalid-email", password: "short" }` |
| 期待結果 | ステータスコード 400、fields: { email: [...], password: [...] } |
| 検証ポイント | - fields オブジェクトに各フィールドのエラー <br> - message = "バリデーションエラー" |

#### UT-022: 認証エラー（ERR-002）

| 項目 | 値 |
|---|---|
| TC-ID | UT-022 |
| 機能 | エラーハンドリング（ERR-002） |
| 観点 | 異常系：JWT 無効 |
| 前提条件 | Authorization ヘッダーなし |
| 入力 | GET /api/v1/cart （認証必須） |
| 期待結果 | ステータスコード 401、code: "AUTHENTICATION_ERROR" |
| 検証ポイント | - message = "汎用メッセージ" |

#### UT-023: 在庫不足エラー（ERR-003）

| 項目 | 値 |
|---|---|
| TC-ID | UT-023 |
| 機能 | エラーハンドリング（ERR-003） |
| 観点 | 異常系：InsufficientStockError |
| 前提条件 | — |
| 入力 | 在庫不足で注文確定 |
| 期待結果 | ステータスコード 409、code: "INSUFFICIENT_STOCK" |
| 検証ポイント | — |

#### UT-024: 販売期間外エラー（ERR-004）

| 項目 | 値 |
|---|---|
| TC-ID | UT-024 |
| 機能 | エラーハンドリング（ERR-004） |
| 観点 | 異常系：SalesOutOfPeriodError |
| 前提条件 | — |
| 入力 | 販売期間外でチケット購入 |
| 期待結果 | ステータスコード 409、code: "SALES_OUT_OF_PERIOD" |
| 検証ポイント | — |

---

## 3. テストカバレッジサマリー

| 観点 | テストケース | 合計 |
|---|---|---|
| **正常系** | UT-001, 005, 008, 010, 012, 014, 015, 016, 019, 020 | 10 件 |
| **異常系** | UT-004, 006, 009, 013, 017, 018, 021, 022, 023, 024 | 10 件 |
| **境界値** | UT-002, 003, 007, 011 | 4 件 |
| **合計** | — | **24 件** |

---

## 4. テスト実行環境

| 項目 | 値 |
|---|---|
| OS | Windows 11 |
| Node.js | v20.x |
| TypeScript | 5.9.3 |
| Jest | TBD （インストール予定） |
| Prisma | 5.14.0 |
| データベース | SQLite (テスト用) / PostgreSQL (本番) |

---

## 5. テスト実行上の注意事項

- **DB 分離**: テスト実行用に SQLite in-memory DB を使用（マイグレーション自動） 
- **トランザクション**: Prisma `$transaction()` で各テストケース間を分離
- **モック**: JWT 検証、bcrypt はライブラリのまま（本体テスト）
- **並行実行**: Jest default serial 実行（排他制御テストのため）

---

## 6. 成果物（テスト実装後に更新）

- [ ] Jest 設定: jest.config.js + tsconfig.test.json
- [ ] テストコード: src/**/__tests__/*.test.ts
- [ ] テスト実行結果: unit_test_report.md （別途作成）
