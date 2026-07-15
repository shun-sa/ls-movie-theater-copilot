# 実装ノート

## 1. 対象設計

- ADR-ID: ADR-001〜007
- 対応ブランチ: main
- 実装日: 2026-07-15

---

## 2. 実装内容

### 変更ファイル（新規作成）

**プロジェクト設定**
| ファイル | 内容 |
|---|---|
| package.json | バックエンド依存定義（Express, Prisma, bcryptjs, jsonwebtoken, zod） |
| tsconfig.json | TypeScript設定（ES2020, commonjs） |
| .env.example | 環境変数テンプレート |
| prisma/schema.prisma | データモデル定義（DM-001〜007の全エンティティ） |
| prisma/seed.ts | 開発用シードデータ |
| web/package.json | フロントエンド依存定義（React, Vite, react-router-dom） |
| web/tsconfig.json | フロントエンドTypeScript設定 |
| web/vite.config.ts | Vite設定（APIプロキシ設定） |
| web/index.html | SPAエントリーポイント |

**バックエンド**
| ファイル | 対応FR |
|---|---|
| src/shared/errors.ts | ERR-001〜005全分類のエラークラス |
| src/shared/types.ts | 注文ステータス定数・ユーティリティ関数 |
| src/shared/prisma.ts | Prismaクライアントシングルトン |
| src/shared/middleware/auth.ts | JWT認証ミドルウェア（ADR-002） |
| src/shared/middleware/errorHandler.ts | 集中エラーハンドラー |
| src/app.ts | Expressアプリ設定（CORS, Cookie, ルーター） |
| src/server.ts | サーバー起動エントリーポイント |
| src/modules/auth/auth.schema.ts | FR-001〜002 Zodバリデーション |
| src/modules/auth/auth.repository.ts | FR-001〜002 DBアクセス |
| src/modules/auth/auth.service.ts | FR-001〜002 ビジネスロジック（bcrypt） |
| src/modules/auth/auth.controller.ts | FR-001〜002 HTTPハンドラー |
| src/modules/auth/auth.router.ts | FR-001〜002 ルーター |
| src/modules/order/movie-product.repository.ts | FR-003〜005 DBアクセス |
| src/modules/order/movie-product.controller.ts | FR-003〜005 HTTPハンドラー |
| src/modules/order/cart.repository.ts | FR-006〜007 カートDBアクセス |
| src/modules/order/cart.service.ts | FR-006〜007 カートビジネスロジック |
| src/modules/order/order.schema.ts | FR-006〜008 Zodバリデーション |
| src/modules/order/order.service.ts | FR-008, FR-010 注文ビジネスロジック（ADR-003排他制御） |
| src/modules/order/order.controller.ts | FR-006〜008, FR-010 HTTPハンドラー |
| src/modules/order/order.router.ts | 映画・商品・カート・注文ルーター |
| src/modules/ticketing/ticketing.schema.ts | FR-009 Zodバリデーション |
| src/modules/ticketing/ticketing.repository.ts | FR-009〜010 チケットDBアクセス |
| src/modules/ticketing/ticketing.service.ts | FR-009〜010 チケットビジネスロジック（ADR-003排他制御） |
| src/modules/ticketing/ticketing.controller.ts | FR-009〜010 HTTPハンドラー |
| src/modules/ticketing/ticketing.router.ts | FR-009〜010 ルーター |

**フロントエンド**
| ファイル | 対応FR |
|---|---|
| web/src/api/client.ts | 全APIクライアント（fetch + credentials:include） |
| web/src/contexts/AuthContext.tsx | 認証状態管理 |
| web/src/components/Header.tsx | C-UI-001 共通ヘッダー |
| web/src/components/Layout.tsx | 共通レイアウト |
| web/src/pages/HomePage.tsx | NFR-USAB-001 トップ画面 |
| web/src/pages/RegisterPage.tsx | FR-001 会員登録 |
| web/src/pages/LoginPage.tsx | FR-002 ログイン |
| web/src/pages/MovieListPage.tsx | FR-003 映画作品検索 |
| web/src/pages/MovieDetailPage.tsx | FR-004 映画作品詳細 |
| web/src/pages/ProductListPage.tsx | FR-005 商品検索・閲覧 |
| web/src/pages/ProductDetailPage.tsx | FR-005 商品詳細 |
| web/src/pages/CartPage.tsx | FR-006〜007 カート |
| web/src/pages/CheckoutPage.tsx | FR-008 注文確定 |
| web/src/pages/TicketPurchasePage.tsx | FR-009 チケット購入 |
| web/src/pages/HistoryPage.tsx | FR-010 購入履歴 |
| web/src/App.tsx | ルーティング・認証ガード（C-AUTH-003） |
| web/src/main.tsx | Reactエントリーポイント |

---

## 3. ADRとの差分

| 差分 | 内容 | 理由 |
|---|---|---|
| ADR-002: JWT有効期限のオプション型 | `jwt.sign()` の `expiresIn` を `as any` キャストで対応 | `jsonwebtoken` の型定義が `string` を `StringValue` に限定しているため。ライブラリ型の制約への対応 |
| ADR-003: Prisma $queryRaw の型安全 | `$queryRaw` のSQLでスネークケース列名を直接取得する際、型キャストが必要 | PrismaのqueryRaw はスキーママッピングを行わないため（OQ-101として記録済み） |
| ADR-004: チケット券種単価 | `TICKET_PRICES` 定数で一般¥1,800/学生¥1,200/シニア¥1,100を定義 | ADR-004でバックログとした複数券種を初期実装に含めた（設定テーブル不要な簡易実装） |
| ADR-005: カートの30日バッチ削除 | バッチ削除処理は未実装 | Azureのスケジューラ（OQ-102）が未設定のため。技術的負債として記録 |

---

## 4. テスト観点メモ

### FR-001 会員登録
- 正常系: name/email/password/passwordConfirmが正常値 → 201, Cookieに token がセット
- 異常系: 既存メールでの重複登録 → 409 DUPLICATE_EMAIL
- 異常系: passwordとpasswordConfirmが不一致 → 400 VALIDATION_ERROR
- 境界値: パスワード8文字（最小）、64文字（最大）

### FR-002 ログイン
- 正常系: 正しいemail/password → 200, Cookieに token がセット
- 異常系: 存在しないemail → 401 汎用メッセージ（NFR-SEC-006）
- 異常系: 誤ったpassword → 401 汎用メッセージ（NFR-SEC-006）

### FR-006〜008 カート・注文
- 正常系: 在庫内の数量でカート追加 → 201
- 異常系: 在庫超過でカート追加 → 409 INSUFFICIENT_STOCK
- 正常系: 注文確定 → 在庫減算・注文番号発行・カートクリア (NFR-AVL-001)
- 異常系: 注文確定時の在庫不足 → 409 ロールバック (NFR-AVL-003)
- 正常系: 数量0でカートアイテム更新 → 削除される (FR-007)

### FR-009 チケット購入
- 正常系: 販売期間内・残席あり → 201, 残席減算・購入番号発行 (NFR-AVL-002)
- 異常系: 残席不足 → 409 INSUFFICIENT_SEATS, ロールバック (NFR-AVL-004)
- 異常系: 上映開始後のscreening → 409 SALES_OUT_OF_PERIOD

### FR-010 購入履歴
- 正常系: 自分の履歴を降順で取得
- 異常系: 他会員のorder_idにアクセス → 404 (NFR-SEC-003)

---

## 5. 未対応/技術的負債

| ID | 内容 | 優先度 |
|---|---|---|
| TD-001 | カートの30日バッチ削除未実装（ADR-005） | 低 |
| TD-002 | 注文ステータス `shipped` / `delivered` への管理者による更新APIが未実装 | 低 |
| TD-003 | チケット購入履歴の詳細ページ（/tickets/:id）が未実装（フロント） | 低 |
| TD-004 | 商品注文の完了確認ページ（/orders/:id）が未実装（フロント） | 低 |
| TD-005 | NFR-PERF-001〜002（応答時間）の実測検証未実施 | 中 |

---

## 6. 次工程への引継ぎ事項

### 単体テストで重点確認する点
1. `auth.service.ts` の `register()` / `login()` — bcryptハッシュ・JWT生成の正常/異常系
2. `order.service.ts` の `createOrder()` — 在庫減算・スナップショット保存・ロールバック
3. `ticketing.service.ts` の `purchaseTicket()` — 残席減算・ロールバック・販売期間判定
4. `cart.service.ts` の `addItem()` / `updateItem()` — 在庫チェック・数量0の削除処理
5. `shared/types.ts` の `isScreeningSaleAvailable()` / `isProductSaleAvailable()` — 境界値

### 既知の制約
- PostgreSQL が起動していないとバックエンドは起動しない（`prisma.$connect()` が失敗）
- `.env` ファイルに `DATABASE_URL` と `JWT_SECRET` の設定が必要
- `prisma generate` を実行しないとPrismaクライアントが生成されない
