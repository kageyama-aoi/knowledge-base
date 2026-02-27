# bat → PowerShell 移行ナレッジ（集約版）

> **集約元（削除候補）:**
> - `pages/20251225_bat運用からPowerShellへ：開発環境の「違和感」を解消する自動化の刷新 (1).html`
> - `pages/20251225_bat運用からPowerShellへ｜違和感を信じて正解だった話v2.html`
>
> 上記2ファイルは内容が重複（手順編・体験談編）しているため、このファイルに集約。
> 元ファイルの確認後、削除または `pages/old/` に退避すること。

---

## なぜ bat から PowerShell に移行するのか

現代の開発環境（VS Code / Python / Git / Web）は **UTF-8前提**。
一方、Windowsのbatファイルは **Shift-JIS前提**（暗黙の了解）で動作する。

この「前提のズレ」が以下の形でストレスになる：

- 保存のたびに文字コードを気にしなければならない
- スペースを含むパスやスラッシュの扱いに細心の注意が必要
- エラーの原因がコードではなく環境・文字コード
- 少し修正すると突然動かなくなる

PowerShell（.ps1）に移行することで、入口から出口までをUTF-8の世界で統一でき、開発のストレスが激減する。

---

## 前提条件

- Windows 10 / 11
- Python インストール済み（`python` コマンドが通ること）
- VS Code などのテキストエディタ
- ファイルは「UTF-8 with BOM」で保存推奨

---

## 推奨プロジェクト構成

「処理はPowerShellで安全に書き、実行は使い慣れたダブルクリックで行う」構成。

```
project/
├─ run.ps1        ← メインの処理ロジック（PowerShell）
├─ run.bat        ← ダブルクリック実行用（中身はps1を呼ぶだけ）
├─ main.py        ← 実行したいPythonプログラム
└─ error_log/     ← ログ出力先ディレクトリ
```

---

## PowerShell（.ps1）実装例

```powershell
# スクリプトの場所をカレントディレクトリに設定
Set-Location $PSScriptRoot

# 日付付きのログファイル名を生成
$datetime = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "error_$datetime.txt"
$logPath = Join-Path "error_log" $filename

# Python実行（標準エラー出力をログファイルへ飛ばす）
python main.py 2> $logPath

Write-Host "処理が完了しました"
Write-Host "エラーログ: $logPath"
Pause
```

**ポイント:**
- `$PSScriptRoot` でスクリプト自身の場所を確実に特定
- `Join-Path` でパス結合（区切り文字を気にしなくてよい）
- `Get-Date` で日付フォーマット

---

## 移行時にハマるポイント

| 問題 | 原因 | 解決 |
|---|---|---|
| パスの書き方 | Bash風の `"./dir/$file"` はPowerShellで意図通りに動かない | `Join-Path` を使う |
| 実行ポリシー | 初期状態で`.ps1`の実行が禁止されている場合がある | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| 文字コード | BOMなしUTF-8だと日本語が文字化けすることがある | UTF-8 with BOM / CRLF で統一 |
| ダブルクリック | `.ps1`はそのままダブルクリックできない（仕様） | batから呼ぶか ExecutionPolicy を調整 |

---

## 動作確認チェックリスト

- [ ] ダブルクリックでPowerShellウィンドウが立ち上がるか
- [ ] 日本語メッセージが文字化けせずに表示されているか
- [ ] `error_log` に日付入りのログファイルが生成されているか
- [ ] Python内の `print` 内容が正しく表示されるか

---

## bat → PowerShell 変換用AIプロンプト

既存の bat ファイルを変換する際に使えるプロンプトテンプレート：

```
あなたは Windows / PowerShell に精通したエンジニアです。

以下に貼り付けられる bat ファイルの内容を、PowerShell（.ps1）用のスクリプトに変換してください。

【変換ルール】
- bat の処理内容はすべて保持すること
- cd の代わりに $PSScriptRoot / Set-Location を使うこと
- パス結合は Join-Path を使用すること
- 日付・時刻は Get-Date を使用すること
- エラー出力（2>）は PowerShell で正しく再現すること
- 文字コード問題が起きないように配慮すること

【保存形式】
- ファイル名：run.ps1
- 文字コード：UTF-8 with BOM
- 改行コード：CRLF

【入力（ここに bat を貼る）】
--- ここから ---
（bat ファイルの中身を貼る）
--- ここまで ---
```

---

## まとめ

「なんとなく動いているからいいや」という違和感を放置せず、一段上のツール（PowerShell）に移行することで、メンテナンスコストが下がる。

これは単なる技術選定ではなく、**開発環境全体の「納得感」を高めるための判断**。
数か月後に読んで意味が分かるコード、人に見せられるコードになることが目標。
