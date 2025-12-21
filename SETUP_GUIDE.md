# セットアップ手順ガイド

リポジトリの初期化と最初のコミットは完了済みです。
次に、このリポジトリをGitHubにプッシュし、
GitHub Pagesを設定してWebページとして公開します。

---

### 手順1: GitHubに新しいリポジトリを作成する

まず、GitHub上で新しいリポジトリを作成してください。リポジトリ名は任意です。dd

---

### 手順2: GitHubリポジトリへプッシュする

次に、ローカルリポジトリをGitHubにプッシュします。
以下のコマンドを実行してください。`<your-github-repository-url>` の部分は、先ほど作成したリポジトリのURL（例: `https://github.com/your-username/your-repo-name.git`）に置き換えてください。

```bash
git remote add origin <your-github-repository-url>
git branch -M main
git push -u origin main
```

git remote add origin knowledge-base
git branch -M main
git push -u origin main


---

### 手順3: GitHub Pagesを設定する

最後に、公開用のWebページを有効化します。

1.  プッシュしたGitHubリポジトリのページで、`Settings` タブに移動します。
2.  左側のメニューから `Pages` を選択します。
3.  `Build and deployment` の `Source` で `Deploy from a branch` を選択します。
4.  `Branch` の設定で、ブランチを `main` 、フォルダを `/(root)` にして `Save` をクリックします。

---

### セットアップ完了後の運用

これでセットアップは完了です。

今後は、`pages` ディレクトリに新しいHTMLファイル（例: `YYYY-MM-DD_title.html`）を追加し、以下のコマンドで `git push` するたびに、GitHub Actionsが自動で一覧ページ（`pages/index.html`）を更新します。

```bash
git add .
git commit -m "新しいドキュメントを追加"
git push
```

生成されたWebサイトへは、GitHub Pagesの設定画面に表示されるURLからアクセスできます。
