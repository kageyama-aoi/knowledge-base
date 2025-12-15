from pathlib import Path

pages_dir = Path("pages")
html_files = sorted(
    [f for f in pages_dir.glob("*.html") if f.name != "index.html"],
    reverse=True
)

lines = [
    "<!doctype html>",
    "<html><head>",
    "<meta charset='utf-8'>",
    "<meta name='viewport' content='width=device-width, initial-scale=1'>",
    "<title>資料一覧</title>",
    "</head><body>",
    "<h1>資料一覧</h1>",
    "<ul>"
]

for f in html_files:
    title = f.stem.replace("_", " ")
    lines.append(f"<li><a href='{f.name}'>{title}</a></li>")

lines += [
    "</ul>",
    "</body></html>"
]

(pages_dir / "index.html").write_text("\n".join(lines), encoding="utf-8")

