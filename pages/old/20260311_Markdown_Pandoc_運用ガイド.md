---
render_with_liquid: false
---

# Markdown & Pandoc 運用ガイド

集約元:
- `20260107_pandoc概要説明（社内向け）.html` — Pandocドキュメント変換ツール概要
- `20260131_MDファイル運用ミニ手順書.html` — MDファイル日々の運用手順

---

## 第1章：Pandoc とは

Pandocはオープンソースのドキュメント変換ツール。Markdown・HTML・Word・PDFなど複数の文書フォーマットを相互に変換する汎用コンバーター。

軽量に記述したMarkdownを、配布・閲覧に適したHTML5やWord（docx）形式へ変換し、内容の一貫性を保ちながら成果物としての体裁を整えられる。

### 使いどころ

- GitHub Pagesなどブラウザ閲覧用のHTML5資料
- メール文や報告書をWord形式で提出
- 既存サイトの記事をMarkdownとして再利用

### メリット

- 内容と体裁の分離による二重入力削減
- 未来のメンテナンス性の向上
- GASなど他ツールと責務を分けた運用

### 実行コマンド

**Markdown → HTML**

```bash
pandoc input.md -o output.html --standalone
```

**Node環境で簡易変換（Pandocなし）**

```bash
npx marked input.md > output.html
```

---

## 第2章：MDファイルの日々の運用手順

> **目的**: 一時変数 `f` を使って作業対象をすぐ切り替え、最新の MD ファイルをすぐ把握する。

### ① 一時変数で作業対象を決める

```bash
f="codex_prompt_setup.md"
```

このセッション内だけ有効な一時変数。以降のコマンドで `$f` をそのまま使える。

### ② MD → HTML 変換（日付命名ルール込み）

```bash
[[ "$f" =~ ^[0-9]{8}_ ]] || f="$(date +%Y%m%d)_$f"
pandoc "$f" -o "${f%.md}.html" --standalone
```

- 先頭が `YYYYMMDD_` でなければ自動付与
- mdファイル自体は変更しない
- 出力はhtmlのみ

### ③ 最新タイムスタンプ順でMDを5件表示

```bash
ls -t *.md | head -n 5
```

更新日時が新しい順に上から5件表示される。

### ④ 作業の流れ（最短）

```bash
# 1. 対象を決める
f="xxxx.md"

# 2. 最近のmdを確認
ls -t *.md | head -n 5

# 3. HTML化
[[ "$f" =~ ^[0-9]{8}_ ]] || f="$(date +%Y%m%d)_$f"
pandoc "$f" -o "${f%.md}.html" --standalone
```

### なぜこの構成か

- **変数1つで思考を止めない**
- 「探す → 決める → 変換する」が一直線
- エイリアスや関数にしなくても即使える
