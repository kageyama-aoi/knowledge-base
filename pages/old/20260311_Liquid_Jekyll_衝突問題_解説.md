---
render_with_liquid: false
---
# Jekyllのビルドエラー「Liquid構文エラー」とは何か

**対象ファイル:** `pages/old/20251221_n8n_Git連動_集約版.md`
**エラー:** `Liquid syntax error (line 156): Variable '{{ ... }}' was not properly terminated`
**修正:** ファイル全体を `{% raw %}...{% endraw %}` で囲む

---

## レベル1：中学生・高校生向け

### ルールがぶつかってしまった話

プログラムの世界には、**文章の中に「命令」を埋め込む仕組み**がたくさんあります。

たとえば学校の通知プリントで、こういうテンプレートを想像してください。

{% raw %}
```
保護者の方へ

{{生徒の名前}} さんは、{{日付}} に欠席しました。
```
{% endraw %}

この `{{ }}` の中は「あとで実際の値に置き換える場所」です。先生が名前と日付を入力すると、自動でプリントが完成します。

---

今回の問題は「**同じ記号を別々のツールが使っていた**」ことです。

| ツール | 役割 | `{{ }}` の意味 |
|--------|------|--------------|
| **Jekyll** | ウェブページを作るツール | ここに値を入れてね（Liquid記法） |
| **n8n** | 自動化ツール | ここに値を入れてね（n8n記法） |

Jekyllがn8nのメモを読んだとき、「あ、`{{ }}` がある！これは私への命令だな」と勘違いしてしまいました。でもn8n用の書き方なので、Jekyllには理解できず、エラーになりました。

### 解決策

Jekyllに「この部分は読まなくていいよ」と伝える特別な印をつけました。

```
{{ "{% raw " }}%}
（ここにn8nのメモ）
{{ "{% endraw " }}%}
```

`raw（ロウ）` は「生のまま」という意味で、「この中は加工しないでそのまま表示してね」という合図です。

---

## レベル2：社会人向け

### テンプレートエンジンの競合

GitHubのウェブサイト公開機能（GitHub Pages）は、**Jekyll**というツールでMarkdownファイルをHTMLに変換します。

Jekyllは内部で **Liquid（リキッド）** というテンプレートエンジンを使っており、`{{ 変数名 }}` という記法でページ内の動的な値を処理します。

一方、ナレッジベースに保存していたドキュメントは **n8n**（ノーコード自動化ツール）の設定メモで、n8nのExpression構文も同じ `{{ }}` 記号を使います。

```
// n8nの式（ドキュメントに記載していた内容）
{% raw %}{{ $json.body.commits[0].message }}{% endraw %}
```

Jekyllがこのファイルをビルドしようとした際、n8n用の `{{ }}` をLiquidの変数として解釈しようとし、構文が不正なためエラーで停止しました。

### なぜ `render_with_liquid: false` では解決しなかったのか

Jekyllには `render_with_liquid: false` というフロントマター設定があり、本来はLiquid処理をスキップできます。しかし、GitHub Pages環境（github-pages gem v232 / Jekyll 3.10.0）では、この設定が期待通りに機能しないケースがあります。

### 採用した解決策

より確実なLiquidの組み込みタグ `{% raw %}...{% endraw %}` を使いました。これはLiquidエンジン自体が「この範囲は処理しない」と認識する公式の方法です。

```
{{ "{% raw " }}%}
（Liquidと衝突するn8nの式が含まれるコンテンツ）
{{ "{% endraw " }}%}
```

ファイル全体に20箇所以上 `{{ }}` が散在していたため、ファイルボディ全体を一括でラップする方針を採りました。

---

## レベル3：IT技術者向け

### 問題の技術的背景

GitHub Pages は Jekyll 3.10.0 + github-pages gem v232 で動作しており、ビルドパイプラインは以下の順で処理します。

```
Pre-Render Hooks
→ Rendering Liquid   ← ここでLiquidテンプレートを評価
→ Rendering Markup   ← Markdown → HTML 変換
→ Rendering Layout   ← テーマレイアウトへの埋め込み
```

問題のファイルには n8n Expression 構文が含まれていました。

{% raw %}
```javascript
// n8nのJavaScript-like Expression
{{
  [
    ...$json.body.commits[0].added,
    ...$json.body.commits[0].modified,
    ...$json.body.commits[0].removed
  ]
  .map(file => `  - ${file}`)
  .join('\n')
}}
```
{% endraw %}

LiquidパーサーはMarkdownコードブロック（` ``` `）の中身も含めてファイル全体をスキャンするため、コードフェンス内であっても `{{ }}` を変数トークンとして認識してしまいます。

### `render_with_liquid: false` が効かなかった理由

Jekyll のソースコードレベルでは `render_with_liquid: false` は `Page#render` の中で判定されますが、`jekyll-optional-front-matter` や他のプラグインのフック処理タイミングによって、フロントマターのパース前にLiquidレンダリングが走るケースがあります。

GitHub Pages 環境では複数の公式プラグインが有効になっているため（`jekyll-commonmark-ghpages`, `jekyll-github-metadata` 等）、この競合が発生しやすい状況にありました。

ビルドログからも `render_with_liquid: false` の設定後も `Rendering Liquid:` ステップが実行されていることが確認できます。

### 採用した修正

Liquidエンジン自体が持つ `raw` タグを使用しました。これはLiquidパーサーのレキサー段階で処理されるため、いかなるプラグイン・設定よりも確実に動作します。

```liquid
{{ "{% raw " }}%}
... n8nのExpression構文を含むコンテンツ ...
{{ "{% endraw " }}%}
```

**修正のポイント:**
- `render_with_liquid: false` は残置（設定の意図を明示するため）
- `{% raw %}` はフロントマットの直後に配置（ファイル全体をカバー）
- `{% endraw %}` はファイル末尾に配置
- ネストされた `{% raw %}` は使用不可なため、部分ラップは使わず全体ラップを採用

### 同様の問題が起きるケース

| ドキュメントの種類 | 衝突する記号 |
|-----------------|------------|
| n8n Expression | `{{ }}` |
| Vue.js テンプレート | `{{ }}` |
| Handlebars / Mustache | `{{ }}` |
| Ansible Jinja2 テンプレート | `{{ }}` |
| GitHub Actions の式 | `${{ }}` （`{{` 部分が反応することがある） |

これらを含むMarkdownをJekyllでビルドする場合は、`{% raw %}...{% endraw %}` で囲む対応が最も確実です。
