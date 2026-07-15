# エージェント引継ぎ資料

## 1. 引継ぎ元/先

- From: 03-implementation Agent
- To: 04-unit-test Agent
- 日時: 2026-07-15

---

## 2. 完了した作業

- design/output/adr/ と handoff/output/adr_to_implementation.md を読み込み、全7つのADRをTypeScriptコードで実装した
- バックエンド（Express.js + Prisma + Node.js） の全層を構築（4層: Router → Controller → Service → Repository）
- フロントエンド（React + Vite） の全ページをコンポーネント化し、APIクライアントと連携
- TypeCheck: バックエンド・フロントエンド共に0エラー
- Prisma スキーマのバリデーション: 構文 OK（DB接続なくても通過）
- FR-001〜010 の全機能要件を実装
- 研究用シードデータ作成（テスト映画・商品・上映回）

---

## 3. 成果物

| ファイル | 説明 |
|---|---|
| implementation/output/implementation_notes.md | 本実装ノート |
| package.json | バックエンド依存定義 |
| tsconfig.json | バックエンドTypeScript設定 |
| prisma/schema.prisma | Prismaデータモデル（DM-001〜007） |
| prisma/seed.ts | シードデータスクリプト |
| src/shared/ | 共通層（エラー・型・Prisma・ミドルウェア） |
| src/modules/auth/ | 認証モジュール（FR-001〜002） |
| src/modules/order/ | 注文・映画・商品・カートモジュール（FR-003〜008, FR-010） |
| src/modules/ticketing/ | チケット購入モジュール（FR-009〜010） |
| src/app.ts | Expressアプリケーション主体 |
| src/server.ts | サーバー起動エントリーポイント |
| web/src/api/client.ts | APIクライアント（fetch + credentials） |
| web/src/contexts/AuthContext.tsx | 認証状態管理プロバイダー |
| web/src/components/ | 共通コンポーネント（Header, Layout） |
| web/src/pages/ | ページコンポーネント（FR-001〜010各ページ） |
| web/src/App.tsx | ルーティング・認証ガード |

### 実装コード量
- バックエンド: 約1,500行（src/modules + src/shared + src/app.ts/server.ts）
- フロントエンド: 約2,000行（web/src/pages + contexts + components + api）
- スキーマ: 約200行（Prisma schema）

---

## 4. 次工程（単体テスト）で必ず確認する点

### 認証モジュール（FR-001〜002, ADR-002, ADR-006）
- **テスト対象**: `auth.service.ts::register()`, `login()`, `getMe()`
- **確認点**:
  - 会員登録時: bcrypt cost factor=12 でハッシュ化が行われるか
  - ログイン時: プレーンパスワードと保存ハッシュの比較が正しいか
  - 認証失敗時: 汎用メッセージ「メールアドレスまたはパスワードが正しくありません」が返却されるか
  - JWT: 24時間有効期限で正しく生成されるか

### カート・注文（FR-006〜008, ADR-003, ADR-004, ADR-005）
- **テスト対象**: `cart.service.ts`, `order.service.ts`
- **確認点**:
  - カート追加: 在庫チェックが行われるか
  - 注文確定時の排他制御:
    - `SELECT FOR UPDATE` でロックが取得されるか
    - 複数商品での deadlock-free な昇順ロック取得
    - 在庫不足時のトランザクションロールバック（不完全注文が残らない）
    - 減算後の在庫が正確であるか
  - スナップショット: OrderItem に productSnapshotName, unitPrice が保存されるか（ADR-004）

### チケット購入（FR-009, ADR-003）
- **テスト対象**: `ticketing.service.ts::purchaseTicket()`
- **確認点**:
  - 販売期間判定: `sales_end_at` がある場合それを優先、ない場合は `starts_at` 基準か（ADR-003: OQ-002解決）
  - 残席超過時のロールバック
  - TicketPurchaseItem への ticket_type, unit_price スナップショット保存（ADR-004: OQ-004解決）

### 検索・閲覧（FR-003〜005）
- **テスト対象**: `movie-product.repository.ts`
- **確認点**:
  - C-DATA-001: `status: 'published'` のみ表示
  - C-DATA-002: 販売期間外でも閲覧可だが `isAvailable` フラグが正しいか
  - C-DATA-003: 在庫0は「在庫なし」としてマークされるか

### エラーハンドリング（ERR-001〜005）
- **テスト対象**: 全コントローラ → エラーハンドラー
- **確認点**:
  - ERR-001（バリデーション失敗）: 400 + fields オブジェクト
  - ERR-002（認証失敗）: 401 + 汎用メッセージ
  - ERR-003（在庫/残席不足）: 409
  - ERR-004（販売期間外）: 409
  - ERR-005（注文失敗時ロールバック）: トランザクション内の例外が伝播するか

---

## 5. 既知課題/リスク

| # | リスク | 対応状況 | 残タスク |
|---|---|---|---|
| RSK-001 | 在庫減算のアトミック性 | ADR-003で SELECT FOR UPDATE + トランザクション対応 | 本番DB環境での deadlock テスト |
| RSK-002 | 複数商品注文のデッドロック | ADR-003で productId 昇順ロック対応 | 高並行テストケース（50+並行リクエスト） |
| RSK-003 | 模擬決済 → 本番移行 | ADR-007で pending_payment ステータスを設計に組み込み | 決済会社API連携実装（OOS-001） |
| RSK-004 | カートDB肥大化 | ADR-005で30日有効期限設定 | バッチ削除スクリプトの実装（TD-001） |
| TD-005 | 応答時間NFR検証なし | 実装時に SQL クエリの N+1 問題チェック | 負荷テスト（1000+ req/min） |

---

## 6. Open Questions / 残課題

### 実装完了のOQ
| OQ-ID | 質問 | 解決内容 |
|---|---|---|
| OQ-001 | カート有効期限 | 30日（updated_at 基準） |
| OQ-002 | 販売終了判定基準 | `sales_end_at` 優先、未設定時は `starts_at` 基準 |
| OQ-003 | 注文ステータス遷移 | `pending_payment` → `confirmed` → `shipped` → `delivered` / `cancelled` |
| OQ-004 | チケット券種・価格 | 初期実装: 一般¥1,800/学生¥1,200/シニア¥1,100 |
| OQ-005 | パスワードハッシュ | bcryptjs, cost factor=12 |

### 実装工程での新OQ（引き継ぎ）
| OQ-ID | 質問 | 優先度 | 担当 |
|---|---|---|---|
| OQ-101 | Prisma $queryRaw での型安全性（SELECT FOR UPDATE の型キャスト） | 中 | 単体テスト工程で確認 |
| OQ-102 | 30日カートバッチ削除の実装方法（Azure Functions vs 起動時） | 低 | 将来のバックログ |
| OQ-103 | `/orders/:id` (注文詳細)・`/tickets/:id` (チケット詳細) 完了ページ | 低 | 将来のバックログ |

---

## 7. セットアップ手順

### バックエンド
```bash
# 1. 依存をインストール
npm install

# 2. .env ファイルを作成（.env.example をコピー）
cp .env.example .env
# DATABASE_URL と JWT_SECRET を設定

# 3. Prismaマイグレーション（初回）
npx prisma migrate dev --name init

# 4. シードデータ投入
npm run db:seed

# 5. 開発サーバー起動
npm run dev
```

### フロントエンド
```bash
cd web
npm install
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

---

## 8. APIエンドポイント一覧（ADR-001: /api/v1/ プレフィクス）

| メソッド | エンドポイント | FR | 認証 |
|---|---|---|---|
| POST | /api/v1/auth/register | FR-001 | 不要 |
| POST | /api/v1/auth/login | FR-002 | 不要 |
| POST | /api/v1/auth/logout | — | 必須 |
| GET | /api/v1/auth/me | — | 必須 |
| GET | /api/v1/movies | FR-003 | オプション |
| GET | /api/v1/movies/:id | FR-004 | オプション |
| GET | /api/v1/products | FR-005 | オプション |
| GET | /api/v1/products/:id | FR-005 | オプション |
| GET | /api/v1/cart | FR-006 | 必須 |
| POST | /api/v1/cart/items | FR-006 | 必須 |
| PATCH | /api/v1/cart/items/:productId | FR-007 | 必須 |
| DELETE | /api/v1/cart/items/:productId | FR-007 | 必須 |
| POST | /api/v1/orders | FR-008 | 必須 |
| GET | /api/v1/orders | FR-010 | 必須 |
| GET | /api/v1/orders/:id | FR-010 | 必須 |
| POST | /api/v1/tickets | FR-009 | 必須 |
| GET | /api/v1/tickets | FR-010 | 必須 |
| GET | /api/v1/tickets/:id | FR-010 | 必須 |
