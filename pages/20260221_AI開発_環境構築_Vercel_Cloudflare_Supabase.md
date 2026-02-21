# このプロジェクトのAI指示

## 開発フロー

ユーザーが要望を伝えたら、以下の順番で進めてください。

```
1. 計画を立てる（EnterPlanMode）
2. ユーザーに相談・承認をもらう
3. Issue を作成する（gh issue create）
4. 実装する
```

**計画なしに実装を始めてはいけない。**
**Issue なしに実装を始めてはいけない。**

---

## Issue作成のルール

### テンプレート選択基準
- 新しいコードを書く → 01_implementation.md
- 既存コードの品質改善 → 02_refactoring.md
- 新しい機能のアイデア → 03_feature_request.md
- 何かが壊れている → 04_bug_report.md

### 実行手順
1. .github/ISSUE_TEMPLATE/ の該当ファイルを読む
2. ユーザーの要望と承認済み計画をもとに各項目を埋める
3. /tmp/issue_body.md に書き出す
4. gh issue create --title "タイトル" --body-file /tmp/issue_body.md を実行する
5. 作成したIssueのURLをユーザーに報告する

ユーザーは要望を伝えるだけでよい。テンプレート選択や項目の補完はAIが判断する。
