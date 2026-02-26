# Gmail重要メール通知システム - セットアップガイド

## 概要

Gmail → n8n → Slack の自動通知システムです。
重要なメールだけをカテゴリ別Slackチャンネルに転送し、Gmail確認頻度を1日1回以下に削減します。

---

## Step 1: Slackチャンネル作成

aoikageワークスペースに以下の4チャンネルを作成します。

| チャンネル名   | 用途           |
|--------------|----------------|
| #gmail-報酬  | 報酬・請求・振込関連 |
| #gmail-it    | GitHub/Vercel等のIT通知 |
| #gmail-税務  | 税務・行政関連 |
| #gmail-その他 | 件名に「重要」「緊急」が含まれるメール |

**作成手順:**
1. Slackサイドバー左下の「チャンネルを追加」→「チャンネルを作成する」
2. チャンネル名を入力（例: `gmail-報酬`）→「作成」
3. 4チャンネル分繰り返す

---

## Step 2: n8n で Slack 連携を確認

既にSlack連携が設定済みの場合はスキップ。

1. n8n管理画面 → 「Credentials」→「Add Credential」
2. 「Slack」を選択
3. OAuth2で認証（aoikageワークスペースを選択）
4. ワークフロー内のSlackノードで、このCredentialを選択する

---

## Step 3: n8n で Gmail 連携を確認

既にGmail連携が設定済みの場合はスキップ。

1. n8n管理画面 → 「Credentials」→「Add Credential」
2. 「Gmail OAuth2」を選択
3. Googleアカウントで認証
4. ワークフロー内のGmailノードで、このCredentialを選択する

> **補足:** Gmail APIはGoogle Cloud Consoleで有効化が必要です。
> [Google Cloud Console](https://console.cloud.google.com/) → APIとサービス → Gmail API → 有効にする

---

## Step 4: ワークフローのインポート

1. n8n管理画面 → 左上メニュー → 「Import from file」
2. `gmail-slack-workflow.json` を選択してインポート
3. ワークフローが開いたら、各ノードのCredentialを設定
   - **Gmail メール取得** ノード → Gmail account を選択
   - **Slack通知** ノード → Slack account を選択

---

## Step 5: Webhook URL の確認

1. ワークフローを開き、「Webhook Trigger（手動実行）」ノードをクリック
2. 「Webhook URL」をコピーしてメモしておく
   - 例: `https://your-n8n.example.com/webhook/gmail-check`
3. この URL は手動実行の curl コマンドで使用する

---

## Step 6: 動作テスト

1. ワークフローをアクティブ化（右上トグルをON）
2. 以下のcurlで手動実行してテスト

```bash
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d '{"hours": 24}'
```

3. Slackチャンネルに通知が来ることを確認

---

## 設定完了チェックリスト

- [ ] #gmail-報酬 チャンネル作成済み
- [ ] #gmail-it チャンネル作成済み
- [ ] #gmail-税務 チャンネル作成済み
- [ ] #gmail-その他 チャンネル作成済み
- [ ] Slack Credential設定済み
- [ ] Gmail Credential設定済み
- [ ] ワークフローインポート済み
- [ ] Webhook URL メモ済み
- [ ] ワークフローアクティブ化済み
- [ ] テスト実行で通知確認済み
