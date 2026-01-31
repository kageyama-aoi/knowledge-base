import re
from pathlib import Path
from bs4 import BeautifulSoup

html_dir = Path(".")
output_file = Path("html_h1_list_ascii_filename_only.tsv")

filename_pattern = re.compile(r"^[A-Za-z0-9_]+\.html$")

rows = []
rows.append("filename\th1_id\th1_text")

for path in html_dir.glob("*.html"):
    # ファイル名チェック（英字・数字・_ のみ）
    if not filename_pattern.match(path.name):
        continue

    with path.open(encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    h1 = soup.find("h1")

    h1_id = h1.get("id", "") if h1 else ""
    h1_text = h1.get_text(strip=True) if h1 else ""

    rows.append(f"{path.name}\t{h1_id}\t{h1_text}")

output_file.write_text("\n".join(rows), encoding="utf-8")
