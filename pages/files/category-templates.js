// ============================================================
// カテゴリ設定テンプレート
// 「メールをカテゴリ分類」ノードの CATEGORIES 配列に貼り付けて使用
//
// 【使い方】
// 1. 下記のテンプレートをコピー
// 2. n8nの「メールをカテゴリ分類」ノードのCodeを開く
// 3. CATEGORIES 配列の末尾（「その他重要」の前）に貼り付け
// 4. name / slackChannel / rules を編集して保存
//
// 【ルール評価順】
// 配列の先頭から順番に評価。先にマッチしたカテゴリが適用される。
// 優先度の高いカテゴリほど先に配置すること。
// ============================================================


// ========================================
// テンプレート（コピペ用）
// ========================================
{
  name: "カテゴリ名",           // Slack通知に表示されるカテゴリ名
  slackChannel: "#チャンネル名", // 通知先Slackチャンネル（事前に作成が必要）
  rules: {
    // 送信者メールアドレスの一部（部分一致・大文字小文字無視）
    // 空配列 [] にするとfromによるマッチを無効化
    from: [
      "送信者ドメイン.com",
      "prefix@"
    ],
    // 件名に含まれる文字列（部分一致）
    subject: [
      "件名キーワード1",
      "件名キーワード2"
    ],
    // 本文プレビューに含まれる文字列（部分一致）
    keywords: [
      "本文キーワード1"
    ]
  }
},


// ========================================
// 実装例集
// ========================================

// --- 例1: 銀行・金融通知 ---
{
  name: "銀行・金融",
  slackChannel: "#gmail-銀行",
  rules: {
    from: [
      "smbc.co.jp",
      "mizuhobank.co.jp",
      "rakuten-bank.co.jp",
      "mufg.jp",
      "smbcnikko.co.jp"
    ],
    subject: [
      "入出金",
      "残高",
      "振込完了",
      "取引通知",
      "ご入金"
    ],
    keywords: [
      "入金のお知らせ",
      "出金のお知らせ",
      "残高照会"
    ]
  }
},

// --- 例2: サブスクリプション・課金 ---
{
  name: "サブスク・課金",
  slackChannel: "#gmail-課金",
  rules: {
    from: [
      "noreply@anthropic.com",
      "billing@openai.com",
      "no-reply@apple.com",
      "do-not-reply@amazon.co.jp"
    ],
    subject: [
      "領収書",
      "Receipt",
      "Invoice",
      "ご利用明細",
      "お支払い確認",
      "サブスクリプション更新"
    ],
    keywords: [
      "ご請求金額",
      "お支払い完了",
      "自動更新"
    ]
  }
},

// --- 例3: 健康・医療 ---
{
  name: "健康・医療",
  slackChannel: "#gmail-医療",
  rules: {
    from: [
      "hospital",
      "clinic",
      "医院",
      "病院"
    ],
    subject: [
      "予約確認",
      "診療",
      "検診",
      "健診",
      "受診"
    ],
    keywords: [
      "予約日時",
      "来院",
      "健康診断"
    ]
  }
},

// --- 例4: 宅配・荷物 ---
{
  name: "宅配・荷物",
  slackChannel: "#gmail-荷物",
  rules: {
    from: [
      "yamato-hd.co.jp",
      "sagawa-exp.co.jp",
      "post.japanpost.jp",
      "amazon.co.jp"
    ],
    subject: [
      "お届け予定",
      "配達のご案内",
      "発送しました",
      "ご不在",
      "配達完了"
    ],
    keywords: [
      "お荷物",
      "配達日時",
      "再配達"
    ]
  }
},


// ========================================
// 初期4カテゴリ（変更・参照用）
// ※ ワークフロー本体のコードと同期すること
// ========================================

// 1. 報酬関係
{
  name: "報酬関係",
  slackChannel: "#gmail-報酬",
  rules: {
    from: ["payment@", "billing@", "invoice@", "payroll@"],
    subject: ["報酬", "給与", "支払い通知", "振込", "請求書", "インボイス"],
    keywords: ["振込", "入金", "支払い完了", "ご請求"]
  }
},

// 2. IT情報
{
  name: "IT情報",
  slackChannel: "#gmail-it",
  rules: {
    from: ["github.com", "github.io", "vercel.com", "cloudflare.com", "supabase.com", "netlify.com"],
    subject: ["Pull Request", "[PR]", "Issue", "Deploy", "Merged", "Build", "Alert", "Security"],
    keywords: ["Pull Request", "デプロイ", "障害", "セキュリティ"]
  }
},

// 3. 税務・行政
{
  name: "税務・行政",
  slackChannel: "#gmail-税務",
  rules: {
    from: ["e-tax", "nta.go.jp", "etax.nta.go.jp", "city.", "pref.", ".go.jp"],
    subject: ["確定申告", "納税", "申告", "税務", "行政", "マイナンバー", "社会保険"],
    keywords: ["国税", "地方税", "申告期限", "税務署", "役所"]
  }
},

// 4. その他重要（最後に配置・フォールバック）
{
  name: "その他重要",
  slackChannel: "#gmail-その他",
  rules: {
    from: [],
    subject: ["重要", "緊急", "【重要】", "【緊急】", "至急", "要対応", "要確認"],
    keywords: ["至急", "対応必要", "期限", "締め切り"]
  }
},
