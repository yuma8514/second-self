# 動作確認チェックリスト

## セットアップ

- [ ] SupabaseのSQL Editorで以下のSQLを実行済み：
  ```sql
  alter table public.messages
  add column if not exists conversation_id uuid;

  create index if not exists messages_conversation_id_idx
    on public.messages (conversation_id);

  create index if not exists messages_created_at_idx
    on public.messages (created_at);
  ```

## 動作確認

### 1. 画面読み込み
- [ ] ブラウザでアプリを開く
- [ ] コンソールに `public.sessions` 関連の404エラーが出ない
- [ ] エラーが表示されない

### 2. メッセージ送信
- [ ] メッセージを入力して送信
- [ ] AIからの返信が表示される
- [ ] メッセージが正しく保存されている

### 3. 新しい対話を始める
- [ ] 「新しい対話を始める」ボタンをクリック
- [ ] 画面のチャット表示がクリアされる
- [ ] 固定AIメッセージが自動で表示される：
  ```
  今日はどこを掘る？
  ①得意 ②好き ③価値観 ④最近のモヤモヤ
  （番号だけでOK / 思いつかなければ「わからない」でもOK）
  ```
- [ ] 新しいメッセージを送信
- [ ] AIからの返信が表示される

### 4. 会話の分離確認
- [ ] Supabaseのmessagesテーブルを確認
- [ ] `conversation_id` カラムが2種類以上存在する
- [ ] 各会話のメッセージが正しく `conversation_id` で分離されている
- [ ] 会話が混ざっていない

### 5. リロード確認
- [ ] ページをリロード
- [ ] 直近の会話が復元される（localStorageの `conversation_id` が効いている）
- [ ] メッセージが正しく表示される

## トラブルシューティング

### エラーが出る場合
- [ ] SupabaseのSQLが正しく実行されているか確認
- [ ] 環境変数（`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`）が正しく設定されているか確認
- [ ] ブラウザのコンソールでエラーメッセージを確認

### メッセージが表示されない場合
- [ ] Supabaseのmessagesテーブルにデータが保存されているか確認
- [ ] `conversation_id` が正しく設定されているか確認
- [ ] ブラウザのlocalStorageに `second-self-conversation-id` が保存されているか確認

