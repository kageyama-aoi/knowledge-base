# Gmail重要メール通知システム - 運用マニュアル

## 手動実行（Webhook）

サーバー復旧時や緊急確認時に使用します。

### 基本形式

```bash
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d 'ここにJSONを入れる'
```

### パターン別コマンド例

**過去2時間分を取得（標準）**
```bash
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d '{"hours": 2}'
```

**過去6時間分を取得（サーバー長時間停止後）**
```bash
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d '{"hours": 6}'
```

**特定日時以降を取得**
```bash
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d '{"since": "2026-02-25T10:00:00"}'
```

> **メモ:** URLの `your-n8n.example.com` は自分のn8nサーバーのURLに置き換えてください。

---

## カテゴリ追加・編集

「メールをカテゴリ分類」ノードの Code を開き、`CATEGORIES` 配列を編集します。

### 新カテゴリを追加する場合

以下のテンプレートをコピーして `CATEGORIES` 配列の任意の位置に追加：

```javascript
{
  name: "カテゴリ名（Slack通知に表示される）",
  slackChannel: "#チャンネル名",
  rules: {
    // 送信者アドレスの一部（部分一致、大文字小文字無視）
    from: [
      "example.com",
      "noreply@someservice"
    ],
    // 件名に含まれる文字列（部分一致）
    subject: [
      "キーワード1",
      "キーワード2"
    ],
    // 本文（snippet）に含まれる文字列（部分一致）
    keywords: [
      "本文キーワード1"
    ]
  }
},
```

### 追加例：銀行通知カテゴリ

```javascript
{
  name: "銀行・金融",
  slackChannel: "#gmail-銀行",  // 先にSlackに作成が必要
  rules: {
    from: [
      "smbc",
      "mizuho",
      "rakuten-bank",
      "mufg"
    ],
    subject: [
      "入出金",
      "残高",
      "振込完了",
      "取引通知"
    ],
    keywords: [
      "入金のお知らせ",
      "出金のお知らせ"
    ]
  }
},
```

### ルールの評価順について

- 配列の**先頭から順番**に評価され、最初にマッチしたカテゴリが適用される
- 優先度の高いカテゴリを先に配置すること
- 現在の順: 報酬関係 → IT情報 → 税務・行政 → その他重要

### 除外ルールを追加したい場合

現在の設計は「広めに拾う」方針ですが、誤検知が多い場合は Code ノード内の `classifyEmail` 関数を拡張して除外条件を追加できます：

```javascript
// 除外リスト（ここに入ったメールはカテゴリ判定しない）
const EXCLUDE_FROM = [
  "newsletter@",
  "no-reply@promotion",
  "unsubscribe@"
];

function classifyEmail(email) {
  const from = email.from || "";
  
  // 除外チェック（先頭に追加）
  if (EXCLUDE_FROM.some(ex => from.toLowerCase().includes(ex.toLowerCase()))) {
    return null;
  }
  
  // ... 既存の判定ロジック
}
```

---

## トラブルシューティング

### Slackに通知が来ない

**確認1: ワークフローがアクティブか**
- n8n画面右上のトグルが「Active」になっているか確認

**確認2: 重要メールが存在するか**
- 手動実行で `{"hours": 48}` を試して過去2日分を確認
- n8n の Execution ログを確認（画面左メニュー「Executions」）

**確認3: Slackチャンネルが存在するか**
- `#gmail-報酬` などのチャンネルがaoikageに存在するか確認
- チャンネル名のスペルミスに注意

**確認4: Credentialの有効期限**
- GmailのOAuth2トークンが失効していないか
- Credentials画面で再認証を試みる

### Gmail取得でエラーが出る

- Google Cloud ConsoleでGmail APIが有効か確認
- OAuth同意画面のスコープに `gmail.readonly` が含まれるか確認

### サーバーが落ちていた場合

1. サーバー復旧を確認
2. 停止時間を確認（例: 3時間停止していた）
3. 手動でcurlを実行

```bash
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d '{"hours": 4}'  # 停止時間より少し多めに
```

### 誤検知が多い

「メールをカテゴリ分類」ノードの各カテゴリの `from` / `subject` / `keywords` を見直す。
マッチしすぎる広いキーワード（例: `"@"` や短すぎる文字列）を除去する。

---

## 定期メンテナンス

月1回程度、以下を確認することを推奨：

1. **Execution ログ確認:** エラーが連続していないか
2. **誤検知レビュー:** 不要なメールが通知されていないか → ルール調整
3. **見落とし確認:** Gmail本体を見て「これは通知されるべきでは？」というメールがないか → ルール追加
4. **Google OAuth更新:** トークンが失効している場合は再認証
