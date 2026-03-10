---
render_with_liquid: false
---

# Git & GitHub 操作ガイド集

集約元:
- `20260107_gitフックでnode.html` — Gitフック + Node.js連携
- `20260120_Git_pre-push_学び振り返り.html` — pre-pushフック実装の振り返り
- `20260214_Issue運用とghメモ.html` — GitHub Issue運用ルール
- `20260221_ghコマンド_cli_教材.html` — gh CLIコマンド実践教材

---

## 第1章：Gitフック（pre-push）でテストを自動実行する

このドキュメントは、**Gitフック（pre-push）を使って Node.js のテストを自動実行する**ための、最小構成・手順ベースのまとめです。

### ゴール

- `git push` を実行した瞬間に
- Node.js のテストが自動で走り
- テストが失敗したら **push が止まる**

### 全体の流れ（イメージ）

```
git push
  ↓
pre-push フックが起動
  ↓
node test/logic.test.js 実行
  ↓
OK → push 続行
NG → push 中断
```

### 手順① フォルダ構成

```
project/
├─ gas/
│  └─ logic.js        # GASとNodeで共通のロジック
├─ test/
│  └─ logic.test.js   # Node.jsで実行するテスト
└─ .git/
   └─ hooks/
      └─ pre-push     # Gitフック（自動実行される）
```

> `.git/hooks` 配下のファイルは、Gitが自動的に実行します。

### 手順② テスト対象のロジックを書く

```javascript
// gas/logic.js
function double(values) {
  return values.map(v => v * 2);
}

// Node.js から使えるように公開
if (typeof module !== 'undefined') {
  module.exports = { double };
}
```

- `double` という関数を定義
- 配列の各要素を2倍にするロジック
- `module.exports` は **Node.js 用**（GASでは無視される）

### 手順③ Node.js のテストを書く

```javascript
// test/logic.test.js
const { double } = require('../gas/logic');

console.assert(
  JSON.stringify(double([1, 2, 3])) === JSON.stringify([2, 4, 6]),
  '❌ double の結果が違う'
);

console.log('✅ ロジックテストOK');
```

### 手順④ 手動でテストを実行する（重要）

まずは Gitフックを使わず、**直接 Node.js で実行**して動作確認します。

```bash
node test/logic.test.js
```

実行結果：
- 成功時: `✅ ロジックテストOK`
- 失敗時: `Assertion failed: ❌ double の結果が違う`

> ここが動かない場合、Gitフックでも動きません。

### 手順⑤ Gitフック（pre-push）を書く

ファイル: `.git/hooks/pre-push`

```sh
#!/bin/sh
node test/logic.test.js || exit 1
```

実行権限を付与（必須）：

```bash
chmod +x .git/hooks/pre-push
```

`exit 1` を返すと Git が異常終了を検知して push を中断します。

### 手順⑥ git push で動作確認

```bash
git push
```

- テスト成功 → push 続行
- テスト失敗 → push 中断（リモートに送られない）

### 補足：よくある誤解

- Gitフックは難しい仕組みではない（中身は「node を1行実行しているだけ」）
- GAS全体をテストする必要はなく、守りたいロジックだけ守れれば十分
- CI（GitHub Actions）より手前で止められる

### 次に進むとしたら

- husky を使って Gitフックをリポジトリ管理する
- テストを `npm test` にまとめる
- 既存GASを「ロジック / I/O」で分解する

---

## 第2章：Gitフック実装の振り返り

### 今日やったこと（事実）

- Git フック（`pre-push`）を実装した
- `git push` 時に `pytest` を自動実行する仕組みを作成
- テストが失敗すると **push 自体が中断される** ことを実体験
- PowerShell と Bash の違いによるエラーを経験
- 既存テストの import エラーで push が止まる事象を確認
- テスト対象ディレクトリを限定して pre-push を制御
- import を構造に合わせて修正し、挙動を統一

### 技術的な学び（表面）

**Git フック**
- `pre-push` は push 直前に処理を差し込める
- `exit 1` を返すと push が中断される
- CI 前段のローカル品質ゲートとして有効

**pytest**
- `python -m pytest` は実行ディレクトリ（CWD）基準で動く
- テスト前に collection（import 解決）フェーズがある
- import エラーは実行前エラーとして扱われる

### 技術的な学び（本質）

**import はコードだけで決まらない**
実行場所（CWD）・`sys.path`・パッケージ構造の組み合わせで成否が決まる。

**pre-push は環境の甘さを可視化する**
IDE の補正・偶然のカレントディレクトリ・暗黙の `PYTHONPATH` への依存が顕在化する。

**構造に沿った import の重要性**

```python
from .src.handlers import CrowdLogHandler, TaskReportHandler
```

構造と import が一致していると、pytest / Git フック / IDE で挙動が統一される。

### つまずきと対処

| つまずき | 原因 | 対処 |
|---------|------|------|
| Set-Content エラー | PowerShell と Bash の差 | ヒアストリング使用 |
| push が止まる | import エラー | テスト対象限定 |
| handlers が見つからない | 構造不一致 | 相対 import 修正 |

### 次に活かすアクション

- pre-push / CI の役割分担設計
- `src/` レイアウト整理
- チーム共有用ガイド作成

---

## 第3章：GitHub Issue 運用方針と gh CLI 基礎

### 運用方針

- Issue で課題を可視化する
- 課題は「機能追加」だけでなく「情報設計」も対象にする
- Issue 本文に受け入れ条件とチェックリストを入れて進捗管理する

### Issue を作る手順（Web）

1. 対象リポジトリの `Issues` を開く
2. `New issue` を押す
3. タイトルと本文を貼り付ける
4. 必要なら `Labels` / `Assignees` / `Projects` を設定する
5. `Create` で作成する

### Issue 本文に入れると良い項目

- 背景
- 現在の課題
- 目的
- 受け入れ条件（Done の定義）
- タスクチェックリスト
- 関連ファイル

### コードや PR との紐づけ方

1. ファイル参照を書く（例: `README.md`, `build.py`）
2. 行番号リンクを貼る（例: `https://github.com/<owner>/<repo>/blob/<branch>/README.md#L1`）
3. PR 本文に `Closes #123` または `Fixes #123` を書いて自動クローズ
4. `- [ ] タスク名` でチェックリスト管理

### gh CLI とは

GitHub 公式の CLI ツール。ブラウザを開かなくても Issue / PR / リポジトリ操作をターミナルから実行できます。

**主な利点**
- Issue 作成・閲覧・編集を CLI で完結
- PR 作成やレビュー確認を高速化
- スクリプト化しやすく、運用を自動化しやすい

**基本コマンド**

```powershell
gh --version          # インストール確認
gh auth status        # ログイン状態確認
gh issue create       # Issue 作成（対話）
gh issue list         # Issue 一覧
gh issue view 123     # 特定 Issue を表示
```

### 推奨の次アクション

1. まず Web で Issue を 1 件作成して運用開始
2. `gh` を導入して CLI 運用に移行
3. `.github/ISSUE_TEMPLATE/` で Issue テンプレート化

---

## 第4章：gh CLI 実践教材

### コマンドには「前提状態」がある

| コマンド | 必要な前提状態 | 状態 |
|---------|--------------|------|
| `gh repo view --web` | リポジトリがあればOK | 即使える |
| `gh issue list / create` | リポジトリがあればOK | 即使える |
| `gh pr list / create` | ブランチが push されていること | 要 push |
| `gh run list / view` | Actions が最低1回実行済み | 要実行 |
| `gh workflow run` | `.github/workflows/` に yml | 要 yml |

### 認証・状態確認

```bash
gh auth status   # 認証アカウントの確認・トークン期限切れチェック
```

### --web フラグ（地味に便利）

コマンドに `--web` を付けると該当の GitHub ページをブラウザで直接開きます。

```bash
gh repo view --web          # リポジトリのトップページを開く（前提不要）
gh issue view 42 --web     # Issue #42 のページを開く
gh pr view 15 --web        # PR #15 のページを開く
gh run view --web           # Actions 実行ページを開く
```

### Issue 操作

```bash
# 一覧
gh issue list                          # open の Issue 一覧
gh issue list --state all             # クローズ済みも含めて全件
gh issue list --label "bug"           # ラベルで絞り込み

# 作成
gh issue create --title "バグ修正" --body "詳細をここに"
gh issue create --title "タイトル" --body-file issue_body.md   # AI連携で有用

# 操作
gh issue view 42                       # 詳細表示
gh issue close 42                      # クローズ
gh issue comment 42 --body "対応完了"  # コメント追加
gh issue develop 42 --checkout        # Issue 連携ブランチを作成してチェックアウト
```

> `gh issue develop 42 --checkout` は Issue 番号がブランチ名に含まれるため、GitHub が Issue と PR を自動で関連付けてくれる。Issue → 開発フローの自動化の核心。

### PR 操作

```bash
# 作成
gh pr create --title "feature: ログイン追加" --body "Close #42"
gh pr create --draft                    # ドラフト PR
gh pr create --base main --head feature/login

# 確認・操作
gh pr list                             # オープンな PR 一覧
gh pr view 15                          # PR #15 の詳細
gh pr checkout 15                     # ローカルにチェックアウト
gh pr merge 15 --squash              # スカッシュマージ
gh pr merge 15 --merge               # 通常マージ
```

### GitHub Actions 連携

```bash
# 実行状態確認
gh run list                            # 実行一覧
gh run list --limit 5                 # 直近5件
gh run view --log                     # ログ全体（CI 失敗原因調査）
gh run watch                           # リアルタイム監視

# ワークフロー手動起動（workflow_dispatch トリガーが必要）
gh workflow run deploy.yml
gh workflow run deploy.yml --field environment=staging
gh workflow list
gh workflow enable deploy.yml
gh workflow disable deploy.yml
```

### リポジトリ操作

```bash
gh repo view                           # 基本情報
gh repo view --web                    # ブラウザで開く
gh repo clone ユーザー名/リポジトリ名   # クローン
gh repo create my-new-repo --public   # 新リポジトリ作成
```

### 自動化の組み合わせパターン

**パターン① AI 生成 Issue の自動作成**

```bash
gh issue create --title "$(cat issue_title.txt)" --body-file issue_body.md --label "auto-generated"
```

**パターン② PR 作成後 CI 完了を待つ**

```bash
gh pr create --title "fix: バグ修正" --body "Close #42"
gh run watch
```

**パターン③ Issue → ブランチ → PR を一気に進める**

```bash
gh issue develop 42 --checkout
# ... 開発作業 ...
git add . && git commit -m "fix: #42対応"
git push
gh pr create --title "fix: #42対応" --body "Close #42"
```

### 優先的に覚えるコマンド TOP 11

| 優先度 | コマンド | 前提状態 | できること |
|-------|--------|--------|-----------|
| ★★★ | `gh repo view --web` | 即使える | 最初に試すべき1コマンド |
| ★★★ | `gh issue create` | 即使える | Issue を CLI から作成 |
| ★★★ | `gh pr create` | 要 push | PR を CLI から作成 |
| ★★★ | `gh run list` | 要実行 | Actions の実行状態確認 |
| ★★☆ | `gh issue list` | 即使える | Issue 一覧確認 |
| ★★☆ | `gh pr list` | 要 push | PR 一覧確認 |
| ★★☆ | `gh run watch` | 要実行 | CI 完了まで待機・監視 |
| ★★☆ | `gh workflow run` | 要 yml | ワークフロー手動起動 |
| ★☆☆ | `gh pr checkout` | 要 push | 他人の PR をローカルで確認 |
| ★☆☆ | `gh issue develop` | Issue 存在 | Issue 連携ブランチ作成 |
| ★☆☆ | `gh run view --log` | 要実行 | CI のログ確認 |
