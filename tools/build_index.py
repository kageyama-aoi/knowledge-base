import html
import re
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

pages_dir = Path("pages")
index_file = pages_dir / "index.html"
style_css = "knowledge-style.css"
ui_js = "knowledge-ui.js"

html_files = sorted(
    [
        f
        for f in pages_dir.glob("*.html")
        if f.name not in {"index.html", ui_js, style_css}
    ],
    reverse=True,
)


def extract_title(path: Path) -> str:
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        content = ""
    match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
    if match:
        title = re.sub(r"\s+", " ", match.group(1)).strip()
        if title:
            return title

    stem = path.stem
    stem = re.sub(r"^\d{8}_", "", stem)
    stem = re.sub(r"^\d{6}_", "", stem)
    stem = re.sub(r"^\d{4}-\d{2}-\d{2}_", "", stem)
    return stem.replace("_", " ").strip()


def extract_date_label(name: str) -> str:
    match = re.match(r"(\d{4})(\d{2})(\d{2})", name)
    if match:
        y, m, d = match.groups()
        return f"{y}-{m}-{d}"
    match = re.match(r"(\d{4})(\d{2})", name)
    if match:
        y, m = match.groups()
        return f"{y}-{m}"
    return ""


def is_new(path: Path) -> bool:
    try:
        mtime = datetime.fromtimestamp(path.stat().st_mtime)
    except OSError:
        return False
    return datetime.now() - mtime <= timedelta(days=7)

def archive_id(label: str) -> str:
    if label == "その他":
        return "archive-other"
    match = re.match(r"(\d{4})年(\d{2})月", label)
    if match:
        return f"archive-{match.group(1)}{match.group(2)}"
    return "archive-unknown"


latest_files = html_files[:10]
archives = defaultdict(list)
for f in html_files:
    match = re.match(r"(\d{4})(\d{2})", f.name)
    if match:
        year, month = match.groups()
        key = f"{year}年{month}月"
    else:
        key = "その他"
    archives[key].append(f)


def render_item(file_path: Path) -> str:
    title = extract_title(file_path)
    date_label = extract_date_label(file_path.name)
    escaped_title = html.escape(title)
    escaped_name = html.escape(file_path.name)
    escaped_search = html.escape(f"{title} {file_path.stem}")

    parts = [
        f"<a class='doc-link' href='{escaped_name}' data-title='{escaped_title}' data-search='{escaped_search}'>"
    ]
    if date_label:
        parts.append(f"<span class='doc-date'>{html.escape(date_label)}</span>")
    parts.append(f"<span class='doc-title'>{escaped_title}</span>")
    if is_new(file_path):
        parts.append("<span class='doc-badge new'>NEW</span>")
    parts.append("</a>")
    return "<li class='doc-item'>" + "".join(parts) + "</li>"


lines = [
    "<!doctype html>",
    "<html lang='ja'>",
    "<head>",
    "<meta charset='utf-8'>",
    "<meta name='viewport' content='width=device-width, initial-scale=1'>",
    "<title>資料一覧</title>",
    f"<link rel='stylesheet' href='{style_css}'>",
    "</head>",
    "<body>",
    "<div class='wrap'>",
    "<h1>📚 資料一覧</h1>",
    "<div class='sub'>自動生成されたドキュメント・インデックスです。</div>",
    "<br>",
    "<div class='toolbar search-toolbar'>",
    "  <div class='search-box'>",
    "    <input type='search' id='searchDocs' placeholder='資料を検索...' aria-label='資料を検索'>",
    "    <button type='button' id='clearSearch' class='search-clear' aria-label='検索をクリア'>×</button>",
    "  </div>",
    "  <div class='search-actions'>",
    "    <button type='button' id='openAll'>すべて開く</button>",
    "    <button type='button' id='closeAll'>すべて閉じる</button>",
    "  </div>",
    "</div>",
    "<div id='search-status' class='search-status'></div>",
    "<br>",
]

lines.append("<details id='latest' open>")
lines.append(f"<summary><strong>🆕 最新の資料</strong> <span class='tag'>{len(latest_files)}件</span></summary>")
lines.append("<div class='content'><ul>")
for f in latest_files:
    lines.append(render_item(f))
lines.append("</ul></div>")
lines.append("</details>")

lines.append("<br>")
lines.append("<h2>🗂 月別アーカイブ</h2>")
sorted_keys = sorted(
    archives.keys(), key=lambda k: k if k != "その他" else "0000", reverse=True
)

lines.append("<div class='archive-jump'>")
lines.append("<span class='archive-jump-label'>月別へジャンプ:</span>")
for key in sorted_keys:
    lines.append(
        f"<a class='archive-link' href='#{archive_id(key)}'>{html.escape(key)}</a>"
    )
lines.append("</div>")


for key in sorted_keys:
    files = archives[key]
    details_id = archive_id(key)
    lines.append(
        f"<details id='{details_id}' open>" if key != "その他" else f"<details id='{details_id}'>"
    )
    lines.append(
        f"<summary><strong>{html.escape(key)}</strong> <span class='tag'>{len(files)}件</span></summary>"
    )
    lines.append("<div class='content'><ul>")
    for f in files:
        lines.append(render_item(f))
    lines.append("</ul></div>")
    lines.append("</details>")

lines += [
    "<footer>",
    "<hr>",
    f"<p>最終更新: {Path(__file__).stem} により自動生成</p>",
    "</footer>",
    "</div>",
    f"<script src='{ui_js}?v=2'></script>",
    "</body></html>",
]

index_file.write_text("\n".join(lines), encoding="utf-8")
print(f"Successfully updated: {index_file}")
