# 自作資料リポジトリ

このリポジトリは、あなたが作成したHTMLドキュメントを、簡単な手順でWebサイトとして公開・整理するための自動化されたシステムです。e

## 概要

`pages`ディレクトリにHTMLファイルを追加して`git push`するだけで、目次ページが自動的に更新され、Webサイトとして公開されます。これにより、コンテンツの作成に集中し、面倒な手作業をなくすことができます。

## 特徴

- **全自動の目次更新**: `push`をトリガーに、GitHub Actionsが目次ページを自動生成します。
- **検索機能**: 資料が増えても安心。リアルタイムで絞り込み検索ができます。
- **見やすい構成**: 「🆕 最新10件」と「🗂️ 月別アーカイブ」に自動で整理されます。
- **メンテナンスフリー**: 一度設定すれば、日々の運用でインデックスを手動編集する必要はありません。
- **バージョン管理**: すべてのコンテンツと仕組みがGitで管理されているため、変更履歴を追跡できます。
- **シンプルな運用**: 日々の作業は「HTMLファイルを追加して`push`する」だけです。
- 

## 仕組み

このシステムは、あなたのローカルでの作業と、GitHub上での自動処理が連携することで機能します。

![Workflow](https://user-images.githubusercontent.com/1258256/168132932-a1a7cd03-2b99-4673-8758-e2b80a13531c.png)

1.  **あなた**: `pages`ディレクトリにHTMLファイルを追加し、`git push`します。
2.  **GitHub**:
    - `push`を検知して**GitHub Actions**が起動します。
    - Pythonスクリプト(`tools/build_index.py`)が実行され、目次(`pages/index.html`)が更新されます。
    - Actionsが更新された目次をリポジトリに自動でコミット＆プッシュします。
    - **GitHub Pages**がサイトを最新の状態に更新します。

## 使い方

日常的な作業は非常にシンプルです。

1.  `pages`ディレクトリに新しいHTMLファイルを作成します（例: `pages/2025-12-16_新しいメモ.html`）。
2.  ターミナルで以下のコマンドを実行し、変更をGitHubにプッシュします。
    ```bash
    git add .
    git commit -m "新しいメモを追加"
    git push
    ```
3.  **これだけです。** 数分後には、Webサイトの目次に新しい項目が追加されています。

---

## 技術的な詳細

この自動化の心臓部であるワークフローとPythonスクリプトの詳細です。

### GitHub Actions ワークフロー: `.github/workflows/build-index.yml`

このファイルは、`push`をきっかけに一連の自動処理を実行するようGitHubに指示します。

```yaml
name: Build pages index

# 実行のトリガー
on:
  push:
    paths:
      - 'pages/*.html' # `pages`ディレクトリ内のHTMLファイルが変更された時だけ実行

jobs:
  build:
    runs-on: ubuntu-latest # 最新のUbuntu環境で実行

    steps:
      # 1. リポジトリのコードをチェックアウト
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Python環境をセットアップ
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.x"

      # 3. 目次生成スクリプトを実行
      - name: Build index.html
        run: python tools/build_index.py

      # 4. 変更があればコミット＆プッシュ
      - name: Commit and push if changed
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git add pages/index.html
          # 差分がなければ終了、あればコミットする
          git diff --cached --quiet || git commit -m "auto: update pages index"
          git push
```

- `on.push.paths`: この設定が非常に重要です。`pages`ディレクトリ内のHTMLファイルが変更された`push`の時だけワークフローを実行することで、Actions自身がコミットした際に再度Actionsが起動する**無限ループを防いでいます**。
- `git diff --cached --quiet || git commit ...`: この一行は、「`git add`された内容（キャッシュ）に差分がなければ何もしない。差分があれば(`||`)、コミットを実行する」という意味です。これにより、目次が更新されなかった場合に不要なコミットが作られるのを防ぎます。

### UIとデザイン: `pages/knowledge-style.css`, `knowledge-ui.js`

今回のアップデートで、モダンなデザインとインタラクションが追加されました。

- **`knowledge-style.css`**: ダークモード対応のレスポンシブなデザインを提供します。変数（CSS Variables）を使用しており、テーマのカスタマイズも容易です。
- **`knowledge-ui.js`**: クライアントサイドでの動的な機能を提供します。
    - **インクリメンタルサーチ**: 文字を入力するごとに一覧をフィルタリングします。
    - **アコーディオン制御**: 検索時に月別アーカイブを自動で開閉します。
    - **テーマ切り替え**: ライトモード/ダークモードの切り替えを管理します（トグルボタンがある場合）。

`pages/index.html`を自動生成するPythonスクリプトです。ファイル名の先頭6桁（YYYYMM）を見て、月ごとのアーカイブを自動生成します。

```python
import re
from pathlib import Path
from collections import defaultdict

# 1. 設定と準備
pages_dir = Path("pages")
index_file = pages_dir / "index.html"
style_css = "knowledge-style.css"

# HTMLファイルを取得し、更新日順（ファイル名順）でソート
html_files = sorted(
    [f for f in pages_dir.glob("*.html") if f.name != "index.html" and f.name != "knowledge-ui.js"],
    reverse=True
)

# 2. データを整理
# 最新10件を抽出
latest_files = html_files[:10]

# 月別アーカイブ用に分類
archives = defaultdict(list)
for f in html_files:
    # ファイル名先頭6桁 (YYYYMM) を抽出して年月キーを作成
    match = re.match(r"(\d{4})(\d{2})", f.name)
    if match:
        year, month = match.groups()
        key = f"{year}年{month}月"
    else:
        key = "その他"
    archives[key].append(f)

# 3. HTML生成（省略: 検索ボックス、最新リスト、月別リストの生成ロジックなど）
# ...
```

- **`re.match`**: 正規表現を使ってファイル名から年月を抽出しています。
- **`defaultdict`**: 月ごとのリストを簡単に作るための便利な辞書型です。
- **検索機能**: 生成されるHTMLには検索ボックスが含まれており、JavaScriptでリアルタイムフィルタリングが行われます。
