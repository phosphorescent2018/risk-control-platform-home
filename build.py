#!/usr/bin/env python3
"""构建单文件页面：src/index.template.html + src/app.css + src/app.js + logo。"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).parent
logo = base64.b64encode((ROOT / "assets/logofull.svg").read_bytes()).decode()
tpl = (ROOT / "src/index.template.html").read_text(encoding="utf-8")
css = (ROOT / "src/app.css").read_text(encoding="utf-8")
js = (ROOT / "src/app.js").read_text(encoding="utf-8")

html = tpl.replace("{{CSS}}", css).replace("{{JS}}", js).replace("{{LOGO}}", logo)
(ROOT / "index.html").write_text(html, encoding="utf-8")
print("wrote", ROOT / "index.html", len(html))
