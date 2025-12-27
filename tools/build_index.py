import re
from pathlib import Path
from collections import defaultdict

# 1. 設定と準備
pages_dir = Path("pages")
index_file = pages_dir / "index.html"
style_css = "knowledge-style.css"

# HTMLファイルを取得し、更新日順（ファイル名順）でソート
html_files = sorted(
    [f for f in pages_dir.glob("*.html") if f.name != "index.html" and f.name != "knowledge-ui.js" and f.name != "knowledge-style.css"],
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

# 3. HTML生成開始
lines = [
    "<!doctype html>",
    "<html lang='ja'>",
    "<head>",
    "<meta charset='utf-8'>",
    "<meta name='viewport' content='width=device-width, initial-scale=1'>",
    "<title>資料一覧</title>",
    f"<link rel='stylesheet' href='{style_css}'>", # スタイル適用
    "</head>",
    "<body>",
    "<div class='wrap'>", # デザイン用のラッパー
    "<h1>📚 資料一覧</h1>",
    "<div class='sub'>自動生成されたドキュメントのインデックスです。</div>",
    "<br>",
    # --- 検索ボックス ---
    "<div class='search-box'>",
    "  <input type='search' id='searchDocs' placeholder='資料を検索...' aria-label='資料を検索'>",
    "</div>",
    "<div id='search-status' class='search-status'></div>", # 検索結果表示用
    "<br>",
]

# --- 最新の資料セクション ---
lines.append("<h2>🆕 最新の資料 (10件)</h2>")
lines.append("<ul>")
for f in latest_files:
    title = f.stem.replace("_", " ")
    lines.append(f"<li><a href='{f.name}'>{title}</a></li>")
lines.append("</ul>")

# --- 月別アーカイブセクション ---
lines.append("<br>")
lines.append("<h2>🗂️ 月別アーカイブ</h2>")

# 年月キーを降順（新しい年月順）でソート。「その他」は最後に表示。
sorted_keys = sorted(
    archives.keys(), 
    key=lambda k: k if k != "その他" else "0000", 
    reverse=True
)

for key in sorted_keys:
    files = archives[key]
    # detailsタグで折りたたみ可能なUIにする
    lines.append("<details open>" if key != "その他" else "<details>") # その他以外は最初から開いておくのもありですが、ここでは「その他」以外を閉じておくか検討。とりあえず全部閉じるなら <details>。
    lines.append(f"<summary><strong>{key}</strong> <span class='tag'>{len(files)}件</span></summary>")
    lines.append("<div class='content'><ul>")
    for f in files:
        title = f.stem.replace("_", " ")
        lines.append(f"<li><a href='{f.name}'>{title}</a></li>")
    lines.append("</ul></div>")
    lines.append("</details>")

# 4. フッターと書き込み
lines += [
    "<footer>",
    "<hr>",
    f"<p>最終更新: {Path(__file__).stem} により自動生成</p>",
    "</footer>",
    "</div>", # end wrap
    f"<script src='knowledge-ui.js?v=2'></script>",
    "</body></html>"
]

index_file.write_text("\n".join(lines), encoding="utf-8")
print(f"Successfully updated: {index_file}")