# Repository Guidelines

## プロジェクト構成・モジュール整理
- `pages/` に公開するHTMLと共通アセット（`knowledge-style.css`, `knowledge-ui.js`）を配置します。
- `pages/index.html` は自動生成される目次です。ビルド成果物として扱ってください。
- `tools/build_index.py` が `pages/*.html` を走査し、`pages/index.html` を更新します。
- `.github/workflows/build-index.yml` が `pages/*.html` へのpushをトリガーに自動生成を実行します。
- ルートの `index.html` は `pages/` へリダイレクトする入口です。

## ビルド・テスト・開発コマンド
- `python tools/build_index.py` でローカル生成を実行します。
- `git add .`, `git commit -m "..."`, `git push` で公開と自動更新を反映します。

## コーディングスタイル・命名規則
- 新しいドキュメントは `pages/` 配下で `YYYYMMDD_` から始めます（例: `20251227_タイトル.html`）。
- 日付とタイトルの区切りはアンダースコアを使います。
- 自動生成ファイルは整形や手修正を行わず、生成元（HTML追加やPython）で調整します。

## テスト指針
- 自動テストは未整備です。
- 変更後は `pages/index.html` をブラウザで開き、最新項目と月別アーカイブの表示を確認してください。

## コミット・PRガイド
- コミットは短く具体的に記述します。CIは `auto: update pages index` を使用するため、手動コミットではこの接頭辞を避けてください。
- PRでは追加・更新内容、追加した `pages/*.html` の一覧、UI変更がある場合はスクリーンショットを添付します。

## 自動生成・注意事項
- `pages/index.html` は直接編集しません。`pages/*.html` の追加、または `tools/build_index.py` の修正で反映します。

## 連絡と言語
- 今後のやりとりは日本語で進めます。変更依頼や質問も日本語で記載してください。
