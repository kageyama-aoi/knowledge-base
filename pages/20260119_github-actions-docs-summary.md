# GitHub Actions を用いたドキュメント自動生成の整理（本日の作業まとめ）

## 1. 目的

本リポジトリでは、以下を **人手を介さず自動生成・自動更新**することを目標としている。

- ディレクトリ構成図（README.md 内）
- JSDoc による API / クラスドキュメント
- それらを **main ブランチへの push をトリガー**として更新する

---

## 2. GitHub Actions の基本構成理解

### 2.1 ワークフロー配置ルール

- `.github/workflows/*.yml` に配置すると GitHub Actions として認識される
- ファイル名は任意（例：`test.yaml`）

### 2.2 トリガー設計

```yaml
on:
  push:
    branches:
      - main
```

- 「誰が」ではなく「**どのブランチに push されたか**」で判定される
- main 以外への push や PR 作成では実行されない

---

## 3. Python（tree_generator.py）の自動化

### 3.1 実行内容

- `python scripts/tree_generator.py -u`
- README.md 内のマーカー間を自動更新

### 3.2 GitHub Actions での実行要件

- Python 標準ライブラリのみ → `pip install` 不要
- `actions/setup-python` で Python バージョンを固定

### 3.3 タイムスタンプ問題と解決

#### 問題

- GitHub Actions 実行時の時刻が **UTC**
- README に「1:31」など意味不明な時刻が出る

#### 原因

- `datetime.now()` は実行環境のタイムゾーン依存
- GitHub Actions は UTC 固定

#### 解決

```python
from zoneinfo import ZoneInfo

def get_timestamp_str() -> str:
    now = datetime.datetime.now(ZoneInfo("Asia/Tokyo"))
    return f"Last updated: {now.strftime('%Y-%m-%d %H:%M:%S')}"
```

- Python 側で JST を明示
- ローカル / CI の差異を吸収
- 修正箇所は **1関数のみ**

---

## 4. GitHub Actions からの push 権限問題

### 4.1 発生したエラー

```
Permission to xxx denied to github-actions[bot]
```

### 4.2 原因

- GitHub Actions の `GITHUB_TOKEN` は **デフォルト read-only**

### 4.3 解決策

```yaml
permissions:
  contents: write
```

- ワークフローに明示的に付与
- 個人トークン不要
- セキュリティ的にも正解ルート

---

## 5. Git 設定（user.name / user.email）の扱い

### 方針

```bash
git config user.name "github-actions"
git config user.email "github-actions@github.com"
```

- 個人情報を含めない
- 「機械がやった commit」だと履歴で明確
- 認証とは無関係（表示用メタ情報）

---

## 6. JSDoc の GitHub Actions 自動化

### 6.1 実行自体は成功している

ログ例：

```
Run npx jsdoc -c jsdoc.json
npm warn exec jsdoc@4.0.5
```

- `npx` が一時的に jsdoc を取得
- **エラーではない**
- jsdoc コマンドは実行されている

---

### 6.2 現在つまずいている本質的ポイント

#### 問題①：成果物の出力先が曖昧

- `jsdoc.json` の `opts.destination` が不明瞭
- Actions 側で「どこに生成されたか」が掴めていない

#### 問題②：git add 対象が実在しない

```
fatal: pathspec 'generated' did not match any files
```

- 想定していたディレクトリが存在しない
- `git add` は存在しないパスを指定すると fatal

---

### 6.3 現時点での暫定方針（成功優先）

- JSDoc 出力先を **docs/** に固定
- 一旦 README / tree_generator と切り離す
- 「JSDoc 生成 → docs が commit される」成功体験を作る

---

## 7. コスト（GitHub Actions 課金）に関する整理

### 結論

- 現在の使い方は **無料枠で十分収まる**

### 理由

- Ubuntu runner（最安）
- 1実行あたり 1〜2分程度
- main push のみトリガー
- 長時間ジョブ・cron・Docker build なし

→ 月 2,000 分（Free）に対して **消費はごく僅か**

---

## 8. 現在の到達点と未完了点

### できていること

- GitHub Actions の基本構造理解
- Python スクリプトの CI 実行
- README 自動更新
- JST タイムスタンプ対応
- push 権限・commit 周りの理解
- JSDoc コマンドが Actions 上で動くことの確認

### まだできていないこと

- JSDoc の **生成物を確実に把握・commit**
- 出力ディレクトリの最終確定
- tree / jsdoc / README の統合実行

---

## 9. 次回の最短ゴール

1. `jsdoc.json` の `opts.destination` を確定
2. JSDoc 実行直後に `ls` で成果物を可視化
3. docs を commit できる状態を作る
4. その後、他の自動化と統合

---

## 10. 全体所感（設計視点）

- 方向性は **完全に正しい**
- つまずきポイントは GitHub Actions 初期で誰もが通る関門
- 今回の構成は **再利用性・安全性・コスト面すべて良好**

「まだできていない」のは事実だが、  
**理解が追いついていない状態ではなく、整理が追いついていない状態**。

この文書をベースに、  
次回は **JSDoc 単体成功 → 統合**に進めば、確実に完成する。
