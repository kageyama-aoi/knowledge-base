# 自作資料リポジトリ

このリポジトリは、あなたが作成したHTMLドキュメントを、簡単な手順でWebサイトとして公開・整理するための自動化されたシステムです。

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

### 一覧生成スクリプト: `tools/build_index.py`

`pages/index.html`を自動生成するPythonスクリプトです。

```python
from pathlib import Path

# 1. 操作対象のディレクトリを定義
pages_dir = Path("pages")

# 2. `pages`ディレクトリから全HTMLファイルを取得し、ソートする
html_files = sorted(
    # リスト内包表記: `pages_dir`内の全HTMLファイルから...
    [f for f in pages_dir.glob("*.html") if f.name != "index.html"],
    # `index.html`自身は除外する
    reverse=True # ファイル名で逆順（新しいものが上）にソート
)

# 3. 生成するHTMLのヘッダー部分を作成
lines = [
    "<!doctype html>",
    "<html><head>",
    "<meta charset='utf-8'>",
    "<meta name='viewport' content='width=device-width, initial-scale=1'>",
    "<title>資料一覧</title>",
    "</head><body>",
    "<h1>資料一覧</h1>",
    "<ul>"
]

# 4. ファイルリストをループしてリンク(`<li>`)を生成
for f in html_files:
    # ファイル名から拡張子を除き(`stem`)、アンダースコアをスペースに置換してタイトルにする
    title = f.stem.replace("_", " ")
    lines.append(f"<li><a href='{f.name}'>{title}</a></li>")

# 5. HTMLのフッター部分を追加
lines += [
    "</ul>",
    "</body></html>"
]

# 6. すべての行を結合し、`pages/index.html`に書き込む
(pages_dir / "index.html").write_text("\n".join(lines), encoding="utf-8")
```

- **`pathlib`**: OS（Windows, Mac, Linux）の違いを吸収してくれるモダンなライブラリです。
- **`f.stem`**: ファイル名から拡張子を除いた部分（例: `2025-12-16_メモ.html` → `2025-12-16_メモ`）を取得します。
- **`write_text`**: ファイルへの書き込みを一行で、文字コード(`utf-8`)も指定して安全に行います。
