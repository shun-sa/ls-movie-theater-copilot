# 結合テスト仕様書

## 1. 対象

- 工程: 05-integration-test
- テスト実施: 2026-07-15
- 対象モジュール: Express API ルーター、Prisma トランザクション、フロントエンド API 連携
- テストフレームワーク: Jest + Supertest（API テスト）、Prisma Client

---

## 2. テスト環境構成

### 2.1 前提条件

| 項目 | 値 |
|---|---|
| **Node.js** | v20.x |
| **Database** | PostgreSQL 14+ または SQLite テスト用 |
| **バックエンドサーバー** | localhost:3000 起動状態 |
| **フロントエンドサーバー** | localhost:5174 起動状態 |
| **DATABASE_URL** | postgresql://user:password@localhost:5432/movie_theater_test |

### 2.2 テストデータ

**初期データ（seed.ts より）**:

| エンティティ | 件数 | 詳細 |
|---|---|---|
| User | 1 | test@example.com / password (bcrypt hashed) |
| Movie | 2 | 「テスト映画A」「テスト映画B」 |
| Product | 4 | グッズA〜D（在庫: 10〜50） |
| Screening | 3 | 残席: 50, 30, 100 |
| Cart | — | テスト前にクリア |
| Order | — | テスト前にクリア |

### 2.3 テスト実行スケジュール

```bash
# 1. DB マイグレーション＆シード投入
npx prisma migrate deploy
npm run db:seed

# 2. バックエンド起動
npm run dev &

# 3. テスト実行
npm run test:integration

# 4. テスト終了後クリーンアップ
npx prisma migrate reset
```

---

## 3. テストシナリオ

### シナリオ 1: 会員登録 → ログイン → ホーム (E2E)

#### IT-001: 会員登録 - 正常系

| 項目 | 値 |
|---|---|
| TC-ID | IT-001 |
| シナリオ | FR-001: 会員登録 |
| 観点 | 正常系：有効なメール・パスワード |
| 前提条件 | — |
| **手順** | 1. POST /api/v1/auth/register<br>2. payload: `{ email: "newuser@example.com", password: "NewPass123" }`<br>3. 期待値: status 201 |
| **期待結果** | - status: 201<br> - body.data.userId: 存在<br> - body.data.email: "newuser@example.com"<br> - JWT Cookie: Set-Cookie ヘッダーに token 含む |
| 検証ポイント | - DB に User レコード作成<br> - パスワードが bcrypt hash 化<br> - HttpOnly Cookie 設定 |

#### IT-002: ログイン - 正常系 (JWT Cookie 検証)

| 項目 | 値 |
|---|---|
| TC-ID | IT-002 |
| シナリオ | FR-002: ログイン |
| 観点 | 正常系：正しいメール・パスワード |
| 前提条件 | test@example.com ユーザー登録済み（IT-001 完了） |
| **手順** | 1. POST /api/v1/auth/login<br>2. payload: `{ email: "newuser@example.com", password: "NewPass123" }`<br>3. response: 200 + JWT Cookie |
| **期待結果** | - status: 200<br> - JWT Token: payload に { userId, email, exp }<br> - Cookie: HttpOnly, SameSite=Strict<br> - body.data.email: 返却 |
| 検証ポイント | - JWT 有効性: 署名検証<br> - Cookie SameSite 設定（ADR-002）<br> - Token 有効期限: 24h |

#### IT-003: 認証ガード - 未認証時 401

| 項目 | 値 |
|---|---|
| TC-ID | IT-003 |
| シナリオ | C-AUTH-003: RequireAuth ガード |
| 観点 | 異常系：Cookie 未設定時 |
| 前提条件 | — |
| **手順** | 1. GET /api/v1/cart<br>2. Cookie: 未設定<br>3. Authorization ヘッダー: 未設定 |
| **期待結果** | - status: 401<br> - code: "UNAUTHORIZED"<br> - message: "認証が必要です" |
| 検証ポイント | - 認証なしで cart 取得不可 |

---

### シナリオ 2: 映画検索 → 詳細 → 関連商品 (E2E)

#### IT-004: 映画リスト取得 (C-DATA-001 検証)

| 項目 | 値 |
|---|---|
| TC-ID | IT-004 |
| シナリオ | FR-003: 映画検索 |
| 観点 | 正常系：公開ステータス=published のみ |
| 前提条件 | Movie × 2 投入済み（status: published） |
| **手順** | 1. GET /api/v1/movies?page=1&perPage=20<br>2. 検索条件: キーワード & ジャンル |
| **期待結果** | - status: 200<br> - items: 配列（2 件）<br> - 各 item: { id, name, description, genre, releaseDate }<br> - pagination: { page: 1, perPage: 20, total: 2, totalPages: 1 } |
| 検証ポイント | - C-DATA-001: published のみ表示<br> - ページネーション正確性<br> - 20 件制限（NFR-PERF-003） |

#### IT-005: 映画詳細 + 関連商品・上映回

| 項目 | 値 |
|---|---|
| TC-ID | IT-005 |
| シナリオ | FR-004: 映画詳細 |
| 観点 | 正常系：詳細情報取得 |
| 前提条件 | movie@1 が存在 |
| **手順** | 1. GET /api/v1/movies/:id<br>2. path param: id = movie@1 |
| **期待結果** | - status: 200<br> - data: { id, name, director, description, genre, releaseDate }<br> - relatedProducts: [ { id, name, price, stock } ]<br> - screenings: [ { id, startsAt, venue, remainingSeats } ] |
| 検証ポイント | - 関連商品リスト（C-UI-005） <br> - 上映回リスト<br> - C-DATA-002: isAvailable フラグ設定 |

---

### シナリオ 3: 商品検索 → 在庫チェック → カート (E2E)

#### IT-006: 商品リスト取得 (在庫フィルター)

| 項目 | 値 |
|---|---|
| TC-ID | IT-006 |
| シナリオ | FR-005: 商品検索 |
| 観点 | 正常系：在庫フィルター |
| 前提条件 | Product × 4（在庫: 50, 30, 0, 10） |
| **手順** | 1. GET /api/v1/products?page=1&inStockOnly=true |
| **期待結果** | - status: 200<br> - items: 3 件（在庫>0 のみ）<br> - 各 item: { id, name, price, stock, status }<br> - 在庫0 の商品は除外 |
| 検証ポイント | - in-stock filter<br> - C-DATA-001: published のみ<br> - C-UI-004: 価格 3 桁区切り表示 |

#### IT-007: カート追加 - 正常系

| 項目 | 値 |
|---|---|
| TC-ID | IT-007 |
| シナリオ | FR-006: カート追加 |
| 観点 | 正常系：有効な商品・数量 |
| 前提条件 | ユーザーログイン済み、Product { stock: 50 } 存在 |
| **手順** | 1. POST /api/v1/cart/items<br>2. auth: Cookie + JWT<br>3. payload: `{ productId: "prod1", quantity: 2 }`<br>4. 再度 cart 取得 |
| **期待結果** | - 追加時: status 201<br> - 取得時: items.length = 1, totalPrice = product.price × 2<br> - DB: CartItem レコード作成 |
| 検証ポイント | - cart 所属性検証（userId）<br> - 数量・価格計算正確性 |

#### IT-008: カート更新 - 在庫超過エラー

| 項目 | 値 |
|---|---|
| TC-ID | IT-008 |
| シナリオ | FR-007: カート更新 |
| 観点 | 異常系：在庫不足 |
| 前提条件 | cart に CartItem { stock: 5, quantity: 2 } 存在 |
| **手順** | 1. PATCH /api/v1/cart/items/:productId<br>2. payload: `{ quantity: 10 }`（在庫5を超過） |
| **期待結果** | - status: 409<br> - code: "INSUFFICIENT_STOCK"<br> - message: "在庫が不足しています" |
| 検証ポイント | - ERR-003 エラー確認 |

---

### シナリオ 4: 注文確定 - 排他制御・ロールバック (E2E)

#### IT-009: 注文確定 - 複数商品の排他制御 (ADR-003)

| 項目 | 値 |
|---|---|
| TC-ID | IT-009 |
| シナリオ | FR-008: 注文確定 (ADR-003 排他制御) |
| 観点 | 正常系：複数商品の SELECT FOR UPDATE |
| 前提条件 | ユーザーログイン済み、Cart に CartItem × 2（productId=A qty=2, productId=B qty=3） |
| **手順** | 1. Cart に商品 A（在庫:10）, B（在庫:5）を追加<br>2. POST /api/v1/orders<br>3. payload: `{ recipientName: "田中太郎", ... }`<br>4. 注文完了後、Product.stock を確認 |
| **期待結果** | - status: 201<br> - Order 作成: status = "pending_payment"<br> - OrderItem × 2 作成<br> - Product A: stock = 8（10-2）<br> - Product B: stock = 2（5-3）<br> - CartItem: 全削除<br> - スナップショット保存: productSnapshotName, unitPrice |
| 検証ポイント | - SELECT FOR UPDATE 実行確認<br> - Deadlock 防止（productId 昇順ロック）<br> - Snapshot ADR-004<br> - カートクリア ADR-005<br> - トランザクション commit |

#### IT-010: 注文確定 - ロールバック（2商品目で在庫不足）

| 項目 | 値 |
|---|---|
| TC-ID | IT-010 |
| シナリオ | FR-008 (ADR-003 ロールバック) |
| 観点 | 異常系：途中失敗時トランザクション ロールバック |
| 前提条件 | Cart に商品 A（在庫:10, qty:2）, B（在庫:2, qty:5）|
| **手順** | 1. POST /api/v1/orders（2商品目で在庫不足） |
| **期待結果** | - status: 409<br> - code: "INSUFFICIENT_STOCK"<br> - Order: 未作成<br> - Product A: stock = 10（変更なし - ロールバック）<br> - Product B: stock = 2（変更なし）<br> - CartItem: 削除なし（ロールバック）<br> - 不完全注文が DB に残らない |
| 検証ポイント | - トランザクション ロールバック完全<br> - Atomicity 確認<br> - エラー応答: INSUFFICIENT_STOCK |

#### IT-011: 注文確定 - スナップショット検証 (ADR-004)

| 項目 | 値 |
|---|---|
| TC-ID | IT-011 |
| シナリオ | FR-008/010 (ADR-004 スナップショット) |
| 観点 | 正常系：OrderItem にデータ埋め込み |
| 前提条件 | IT-009 完了後 |
| **手順** | 1. 注文後、Product A の price を 1000 → 2000 に変更<br>2. GET /api/v1/orders/:id |
| **期待結果** | - OrderItem.productSnapshotName: "グッズA"（変更不可）<br> - OrderItem.unitPrice: 1000（変更不可、元の価格保持）<br> - 商品削除後も OrderItem は保持 |
| 検証ポイント | - 商品削除後の履歴表示可能<br> - 当時の価格を記録 |

#### IT-012: 注文確定 - カートクリア (ADR-005)

| 項目 | 値 |
|---|---|
| TC-ID | IT-012 |
| シナリオ | FR-008 (ADR-005 カートクリア) |
| 観点 | 正常系：注文後カート空化 |
| 前提条件 | IT-009 完了後 |
| **手順** | 1. 注文確定<br>2. GET /api/v1/cart |
| **期待結果** | - Cart.items: [] (空)<br> - Cart.totalPrice: 0 |
| 検証ポイント | - CartItem 全削除<br> - Cart 有効期限 30 日に設定（OQ-001） |

---

### シナリオ 5: チケット購入 - 排他制御 (E2E)

#### IT-013: チケット購入 - 正常系 (ADR-003)

| 項目 | 値 |
|---|---|
| TC-ID | IT-013 |
| シナリオ | FR-009: チケット購入 |
| 観点 | 正常系：販売期間内・残席十分 |
| 前提条件 | ユーザーログイン済み、Screening { remainingSeats: 50, salesEndAt: 未来 } |
| **手順** | 1. GET /api/v1/screenings/:id（残席確認）<br>2. POST /api/v1/tickets<br>3. payload: `{ screeningId, ticketType: "general", quantity: 5 }`<br>4. GET /api/v1/screenings/:id（残席再確認） |
| **期待結果** | - 購入前: remainingSeats = 50<br> - 購入後: status 201<br> - 購入後: remainingSeats = 45<br> - TicketPurchase 作成<br> - スナップショット: ticketType, unitPrice 保存 |
| 検証ポイント | - SELECT FOR UPDATE 実行<br> - 残席減算正確<br> - ADR-004 スナップショット |

#### IT-014: チケット購入 - 残席超過

| 項目 | 値 |
|---|---|
| TC-ID | IT-014 |
| シナリオ | FR-009 (残席不足) |
| 観点 | 異常系：残席不足 |
| 前提条件 | Screening { remainingSeats: 3 } |
| **手順** | 1. POST /api/v1/tickets<br>2. quantity: 5（残席3を超過） |
| **期待結果** | - status: 409<br> - code: "INSUFFICIENT_SEATS"<br> - message: "残席数が不足しています"<br> - remainingSeats: 3（変更なし） |
| 検証ポイント | - ERR-003 エラー |

#### IT-015: チケット購入 - 販売期間外（ADR-003 OQ-002）

| 項目 | 値 |
|---|---|
| TC-ID | IT-015 |
| シナリオ | FR-009 (ADR-003 OQ-002 販売期間判定) |
| 観点 | 異常系：販売期間外 |
| 前提条件 | Screening { salesEndAt: 過去 } |
| **手順** | 1. POST /api/v1/tickets（販売期間外） |
| **期待結果** | - status: 409<br> - code: "SALES_OUT_OF_PERIOD"<br> - message: "販売期間外のため購入できません" |
| 検証ポイント | - OQ-002: salesEndAt 優先判定 |

#### IT-016: チケット購入 - 販売開始前（startsAt 基準）

| 項目 | 値 |
|---|---|
| TC-ID | IT-016 |
| シナリオ | FR-009 (販売未開始) |
| 観点 | 異常系：販売開始前 |
| 前提条件 | Screening { startsAt: 未来、salesEndAt: null } |
| **手順** | 1. POST /api/v1/tickets（上映開始前） |
| **期待結果** | - status: 409<br> - code: "SALES_OUT_OF_PERIOD" または許可（仕様確認必要） |
| 検証ポイント | - OQ-002: startsAt フォールバック判定 |

---

### シナリオ 6: 購入履歴取得 (E2E)

#### IT-017: 注文履歴取得 (FR-010)

| 項目 | 値 |
|---|---|
| TC-ID | IT-017 |
| シナリオ | FR-010: 購入履歴 |
| 観点 | 正常系：注文リスト取得 |
| 前提条件 | IT-009 完了後（Order × 1 作成済み） |
| **手順** | 1. GET /api/v1/orders（ログイン済み） |
| **期待結果** | - status: 200<br> - items: [ { id, orderNumber, status, totalPrice, createdAt, orderItems: [ ... ] } ]<br> - 降順: createdAt（新→古）<br> - pagination: total = 1 |
| 検証ポイント | - ユーザー別フィルター<br> - スナップショット表示（商品削除後も履歴保持） |

#### IT-018: チケット履歴取得 (FR-010)

| 項目 | 値 |
|---|---|
| TC-ID | IT-018 |
| シナリオ | FR-010: チケット履歴 |
| 観点 | 正常系：チケット購入リスト取得 |
| 前提条件 | IT-013 完了後（TicketPurchase × 1 作成済み） |
| **手順** | 1. GET /api/v1/tickets（ログイン済み） |
| **期待結果** | - status: 200<br> - items: [ { id, purchaseNumber, screeningInfo, ticketItems: [ ... ], totalPrice, createdAt } ]<br> - 降順: createdAt<br> - pagination: total = 1 |
| 検証ポイント | — |

---

### シナリオ 7: 並行ユーザー処理 (ストレステスト)

#### IT-019: 複数ユーザーの同一商品注文（Deadlock テスト）

| 項目 | 値 |
|---|---|
| TC-ID | IT-019 |
| シナリオ | ADR-003: Deadlock 防止検証 |
| 観点 | 異常系：複数ユーザーの同時注文 |
| 前提条件 | ユーザー × 2、Product A（在庫:20）|
| **手順** | 1. User-1 & User-2 が同時に<br>2. Cart に ProductA qty=15 を追加<br>3. 同時に注文確定（POST /api/v1/orders）|
| **期待結果** | - User-1: 成功（stock = 5）<br> - User-2: 409 INSUFFICIENT_STOCK<br> - Deadlock: なし<br> - DB 整合性: 保持 |
| 検証ポイント | - SELECT FOR UPDATE (productId 昇順) で deadlock 防止<br> - 在庫の Atomicity 確認 |

#### IT-020: 複数ユーザーの同一座席購入（残席管理）

| 項目 | 値 |
|---|---|
| TC-ID | IT-020 |
| シナリオ | ADR-003: 残席管理 |
| 観点 | 異常系：複数ユーザーの同時チケット購入 |
| 前提条件 | ユーザー × 2、Screening { remainingSeats: 5 } |
| **手順** | 1. User-1 qty=3, User-2 qty=3 を同時リクエスト |
| **期待結果** | - User-1: 成功（remaining = 2）<br> - User-2: 409 INSUFFICIENT_SEATS<br> - Deadlock: なし |
| 検証ポイント | — |

---

## 4. テストカバレッジ

| カテゴリ | テストケース | 合計 |
|---|---|---|
| **正常系** | IT-001, 002, 004, 005, 006, 007, 009, 011, 012, 013, 017, 018 | 12 件 |
| **異常系** | IT-003, 008, 010, 014, 015, 016, 019, 020 | 8 件 |
| **E2E シナリオ** | IT-001-002（登録ログイン）, IT-004-005（映画）, IT-006-008（商品カート）, IT-009-012（注文）, IT-013-016（チケット） | 5 シナリオ |
| **並行処理** | IT-019, 020 | 2 件 |
| **合計** | — | **20 件** |

---

## 5. テスト実行手順

### 5.1 環境セットアップ

```bash
# 1. DB 準備（PostgreSQL または SQLite）
npx prisma migrate deploy

# 2. シードデータ投入
npm run db:seed

# 3. サーバー起動（バックグラウンド）
npm run dev &

# 4. サーバーが起動するまで待機
sleep 3

# 5. テスト実行
npm run test:integration
```

### 5.2 テスト実行スクリプト

```bash
# 全テスト実行
npm run test:integration

# 特定テストスイート実行
npm run test:integration -- auth.integration.test.ts

# Watch mode
npm run test:integration:watch

# カバレッジ出力
npm run test:integration:coverage
```

### 5.3 テスト終了後のクリーンアップ

```bash
# DB リセット
npx prisma migrate reset --force

# プロセス終了
pkill -f "ts-node-dev"
```

---

## 6. テスト実行環境の仕様

| 項目 | 値 |
|---|---|
| テストフレームワーク | Jest 30.0.0 + Supertest |
| HTTP クライアント | Supertest（Express テスト用） |
| ORM | Prisma Client |
| DB (テスト用) | SQLite in-memory OR PostgreSQL test DB |
| リクエストタイムアウト | 10000ms |
| テスト実行順序 | Serial（並行処理テストのため） |

---

## 7. 期待される実行結果

| 指標 | 目標値 | 評価基準 |
|---|---|---|
| テストケース成功率 | 100% | 20/20 ✅ |
| テスト実行時間 | < 60 秒 | DB I/O 含む |
| E2E シナリオ | 5/5 | 登録→ログイン→購入完全フロー |
| 並行処理テスト | 2/2 | Deadlock なし、データ整合性 |
| エラーハンドリング | 8/8 | HTTP 400/401/409 正確 |

---

## 8. 成果物（テスト実施後に更新）

- [ ] Jest Supertest 設定: jest.config.integration.js
- [ ] テストコード: src/**/__tests__/**/*.integration.test.ts
- [ ] テスト実行結果: integration_test_report.md （別途作成）
- [ ] バグ報告書: 不具合検出時
