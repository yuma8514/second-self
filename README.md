# Second Self

あなた専用の思索AIと対話できるチャットアプリケーション。

## 技術スタック

- Vite + 素のJavaScript
- Supabase (Database)
- OpenAI API (gpt-4o-mini)
- Express (APIサーバー)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI（サーバー側で使用）
OPENAI_API_KEY=your_openai_api_key

# APIサーバーのURL（オプション、デフォルトは http://localhost:3001）
VITE_API_URL=http://localhost:3001

# 開発/本番のAPIベースURL
# 開発: VITE_API_BASE=http://localhost:3001
# 本番: VITE_API_BASE=https://<デプロイしたAPIのURL>
```

### 3. Supabaseデータベースのセットアップ

SupabaseのSQL Editorで以下のSQLを実行してください：

```sql
-- messagesテーブルの作成（既存の場合はconversation_idカラムを追加）
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid,
  role text not null check (role in ('user','ai')),
  content text not null,
  created_at timestamptz not null default now()
);

-- conversation_idカラムを追加（既存テーブルの場合）
alter table public.messages
add column if not exists conversation_id uuid;

-- インデックスの作成
create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);
create index if not exists messages_created_at_idx
  on public.messages (created_at);
```

### 4. 開発サーバーの起動

**オプション1: フロントエンドとAPIサーバーを同時に起動**

```bash
npm run dev:all
```

**オプション2: 別々に起動**

ターミナル1（フロントエンド）:
```bash
npm run dev
```

ターミナル2（APIサーバー）:
```bash
npm run server
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開いてください。

## 機能

### チャット機能
- ChatGPT/LINEのようなチャットUI
- ユーザーメッセージは右寄せ（青色）
- AIメッセージは左寄せ（白色）
- メッセージはSupabaseに永続保存
- 直近40件のメッセージを文脈として使用（最大20,000文字）

### AIの特徴
- 「第二の自分」として、淡々と対話
- 整理 → 視点 → 問い の構造で返答
- 過去の対話パターンを考慮

## デプロイ

### フロントエンド（Vite）
```bash
npm run build
```
`dist`フォルダが生成されます。Vercel、Netlify等にデプロイ可能です。

### APIサーバー
本番環境では以下のいずれかを使用：
- Vercel Functions
- Supabase Edge Functions
- Railway / Render 等のPaaS

## 注意事項

- OpenAI APIキーはサーバー側でのみ使用（環境変数に設定）
- 開発用のExpressサーバー（`server.js`）は本番環境では別の方法を使用してください
