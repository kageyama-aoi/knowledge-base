---
render_with_liquid: false
---

# n8n Gmail・Slack 自動化まとめ

集約元:
- `20260119_n8n_summary_2026-01-19.html` — メール自動分類・ラベル付けワークフロー（実装済み）
- `20260227_n8n_Gmail_Slack_自動通知_実装計画.html` — Gmail重要メール→Slack自動通知（設計済み・未実装）

---

## 第1章：実装済み — メール自動分類・ラベル付けワークフロー（2026-01-19）

### 構築したワークフロー全体像

```
Gmail Trigger → Chat Model → Code（JSONパース）→ Switch → Add Label
                                                         └→ Get Labels → Format → PostgreSQL Upsert
```

### 1. Gmail Trigger の設定

新着メールを自動取得するトリガーを設定。

### 2. Chat Model を使った構造的分類

Text Classifierノードは「Expected object, received array」エラーが発生したため断念。
`Chat Model（OpenAI gpt-4.1-mini）→ Codeノードで解析` の構成に移行。

```javascript
return items.map(item => {
  try {
    const rawText = item.json.output[0].content[0].text;
    const parsed = JSON.parse(rawText);
    return { json: parsed };
  } catch (e) {
    return { json: { error: "Parse failed", raw: item.json } };
  }
});
```

### 3. Gmail ラベルの自動付与

`Add label to message` ノードで `Message ID` と `Label ID` を動的に指定。

> **ポイント**: ラベル名ではなく「**Label ID**」が必要。名前とIDは別物。

### 4. ラベルマスタの自動抽出・PostgreSQL保存

```javascript
// ラベル一覧を整形・ソート
return items
  .map(item => ({ json: { id: item.json.id, name: item.json.name } }))
  .sort((a, b) => a.json.name.localeCompare(b.json.name));
```

```sql
-- Upsert方式で保存
INSERT INTO gmail_labels (id, name)
VALUES ({{$json["id"]}}, {{$json["name"]}})
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
```

### データ保存方式の比較検討

| 方法 | 評価 |
|------|------|
| Data Store | 可だが柔軟性・検索性に制約 |
| Data Table | EEライセンスが必要なため断念 |
| MongoDB Vector | 用途が異なる（類似検索特化） |
| **PostgreSQL**（採用） | ◎ Dockerコンテナ名で接続・最適解 |

### 実装結果

| 実装項目 | 状態 |
|---------|------|
| Gmail自動取得 | ✅ 完了 |
| ChatGPTによる分類 | ✅ 完了 |
| 分類結果のJSON変換・解析 | ✅ 完了 |
| 条件分岐（Switch）でルート制御 | ✅ 完了 |
| Gmailラベルの自動付与 | ✅ 完了 |
| ラベルマスタのPostgreSQL登録 | ✅ 完了 |

### 学んだ重要ポイント

- Text Classifierノードの限界と実運用の選定基準
- ChatGPT Structured Outputの形式制御
- Gmail APIのLabel操作における `name` と `id` の違い
- n8nにおけるDB連携のベストプラクティス（Postgres）
- Data TableはEE限定 → 自前ならPostgres活用が正解

### 次にやれること

- スケジューラーで定期的にラベルマスタ更新
- 自動分類後にフォルダ振り分け or アーカイブ
- ChatGPTと連携した履歴ベースの分類精度向上
- Notion/Slack連携で通知も可能

---

## 第2章：設計済み・未実装 — Gmail 重要メール → Slack 自動通知

> **ステータス：未実装（設計・ワークフロー・マニュアルは揃っている）**

### やりたいこと

Gmailを毎日チェックするのをやめたい。重要なメールだけを自動で拾って、カテゴリ別のSlackチャンネルに通知する仕組みをn8nで作る。

### 完成イメージ

```
Gmail
  ↓（n8n が定期取得 or 手動実行）
カテゴリ分類
  ↓
Slack へ通知

  #gmail-報酬   ← 報酬・請求・振込関連
  #gmail-it     ← GitHub / Vercel 等のIT通知
  #gmail-税務   ← 税務・行政関連
  #gmail-その他 ← 件名に「重要」「緊急」が含まれるもの
```

### トリガー

| 種類 | 動き |
|------|------|
| Schedule Trigger | 1日5回（7:00 / 11:30 / 15:00 / 18:00 / 21:00）自動実行 |
| Webhook Trigger | curl で手動実行。サーバー復旧時や緊急確認に使う |

### 処理の流れ

```
Schedule Trigger ─┐
                   ├→ 時間範囲を計算 → Gmail取得 → カテゴリ分類 → IF → Slack通知
Webhook Trigger ──┘                                               └→ Webhookレスポンス返却
```

### カテゴリ判定ルール

- `from`（送信者アドレスの部分一致）
- `subject`（件名の部分一致）
- `keywords`（本文プレビューの部分一致）

上から順に評価し、最初にマッチしたカテゴリを適用。どのカテゴリにも該当しないメールはスキップ。

### 用意されているファイル

| ファイル | 内容 |
|---------|------|
| `files/gmail-slack-workflow.json` | n8nにそのままインポートできるワークフロー本体 |
| `files/setup-guide.md` | セットアップ手順 |
| `files/operations-manual.md` | 日常運用・カテゴリ追加・トラブルシューティング |
| `files/category-templates.js` | カテゴリ追加用テンプレート |

### 実装手順（概要）

1. Slackに4チャンネルを作成（`#gmail-報酬` / `#gmail-it` / `#gmail-税務` / `#gmail-その他`）
2. n8nにGmail Credentialを登録
3. n8nにSlack Credentialを登録
4. `gmail-slack-workflow.json` をn8nにインポート
5. 各ノードにCredentialを紐づける
6. ワークフローをアクティブ化
7. curlでテスト実行してSlackに通知が来ることを確認

```bash
# テスト実行コマンド
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d '{"hours": 24}'
```

### 前提環境

- n8nが動いているサーバー（またはクラウド版n8n）
- Gmail アカウント（Google Cloud ConsoleでGmail API有効化が必要）
- Slackワークスペース

### 運用メモ

- カテゴリ判定ルールは意図的に「広め」に設定。最初の1〜2週間は誤検知を観察してルールを絞り込む
- 月1回はExecutionログと誤検知・見落としをレビュー
- Google OAuth2トークンは失効することがある → 定期的に確認が必要
