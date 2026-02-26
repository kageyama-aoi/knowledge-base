# n8n で作る Gmail 重要メール自動通知システム

> **ステータス：未実装（これから構築する）**
> 設計・ワークフロー・マニュアルは揃っている。あとは実際にセットアップするだけ。

---

## やりたいこと

**Gmail を毎日チェックするのをやめたい。**

重要なメールだけを自動で拾って、カテゴリ別の Slack チャンネルに通知してくれる仕組みを n8n で作る。

---

## 完成イメージ

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

---

## 仕組みの概要

### トリガー（2種類）

| 種類 | 動き |
|---|---|
| Schedule Trigger | 1日5回（7:00 / 11:30 / 15:00 / 18:00 / 21:00）自動実行 |
| Webhook Trigger | curl で手動実行。サーバー復旧時や緊急確認に使う |

### 処理の流れ

```
Schedule Trigger ─┐
                   ├→ 時間範囲を計算 → Gmail取得 → カテゴリ分類 → IF → Slack通知
Webhook Trigger ──┘                                               └→ Webhookレスポンス返却
```

### カテゴリ判定のルール

- `from`（送信者アドレスの部分一致）
- `subject`（件名の部分一致）
- `keywords`（本文プレビューの部分一致）

上から順に評価し、最初にマッチしたカテゴリが適用される。
どのカテゴリにも該当しないメールはスキップ（Slack通知しない）。

---

## 用意されているファイル

> 詳細は [`pages/files/`](./files/) を参照。

| ファイル | 内容 |
|---|---|
| [`files/gmail-slack-workflow.json`](./files/gmail-slack-workflow.json) | n8n にそのままインポートできるワークフロー本体 |
| [`files/setup-guide.md`](./files/setup-guide.md) | セットアップ手順（Slack作成 → Credential → インポート → テスト） |
| [`files/operations-manual.md`](./files/operations-manual.md) | 日常運用・カテゴリ追加・トラブルシューティング |
| [`files/category-templates.js`](./files/category-templates.js) | カテゴリ追加用テンプレート（銀行・課金・医療・宅配の実装例付き） |

---

## 実装手順（これからやること）

セットアップの流れは `files/setup-guide.md` に詳細あり。概要は以下。

- [ ] Slack に4チャンネルを作成する（`#gmail-報酬` / `#gmail-it` / `#gmail-税務` / `#gmail-その他`）
- [ ] n8n に Gmail Credential を登録する
- [ ] n8n に Slack Credential を登録する
- [ ] `gmail-slack-workflow.json` を n8n にインポートする
- [ ] 各ノードに Credential を紐づける
- [ ] Webhook URL をメモする
- [ ] ワークフローをアクティブ化する
- [ ] curl でテスト実行して Slack に通知が来ることを確認する

```bash
# テスト実行コマンド（URLは自分のn8nに合わせて変更）
curl -X POST https://your-n8n.example.com/webhook/gmail-check \
  -H "Content-Type: application/json" \
  -d '{"hours": 24}'
```

---

## カテゴリを増やしたい場合

`files/operations-manual.md` の「カテゴリ追加・編集」を参照。
`files/category-templates.js` に銀行・課金・医療・宅配の追加例がある。

---

## 前提環境

- n8n が動いているサーバー（またはクラウド版 n8n）
- Gmail アカウント（Google Cloud Console で Gmail API 有効化が必要）
- Slack ワークスペース（aoikage）

---

## メモ・検討事項

- カテゴリ判定ルールは意図的に「広め」に設定してある。最初の1〜2週間は誤検知を観察してルールを絞り込む
- 月1回は Execution ログと誤検知・見落としをレビューする（詳細は `operations-manual.md`）
- Google OAuth2 トークンは失効することがある → 定期的に確認が必要
