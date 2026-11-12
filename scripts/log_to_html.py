"""Chuyển file log kiểm thử (.log) thành trang HTML theo bố cục log.html của Robot Framework.

Chỉ đọc file .log, không chạy lại test và không thay đổi kết quả.
    .venv\\Scripts\\python.exe scripts\\log_to_html.py [results/logs/test-run_xxx.log]
"""

import re
import sys
from collections import OrderedDict
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINE = re.compile(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \| (\w+)\s*\| (\S+)\s*\| (.*)$")
SUITES = OrderedDict([("TS1", "Website công khai"), ("TS2", "Tài khoản khách hàng"),
                      ("TS3", "Tìm phòng và đặt phòng"), ("TS4", "Khu vực cá nhân Guest")])


def parse(path):
    run, cases = [], OrderedDict()
    for raw in path.read_text(encoding="utf-8").splitlines():
        m = LINE.match(raw)
        if not m:
            continue
        ts, level, who, msg = m.groups()
        if who in ("RUN", "SETUP"):
            if not set(msg) <= {"="}:
                run.append((ts, level, who, msg))
            continue
        c = cases.setdefault(who, {"id": who, "title": "", "technique": "", "start": ts, "end": ts,
                                   "steps": [], "pre": [], "status": "", "result": "", "bug": ""})
        c["end"] = ts
        text = msg.strip()
        if set(text) <= {"-"}:
            continue
        if text.startswith("TEST CASE "):
            head = text.split(": ", 1)[1]
            c["title"], _, c["technique"] = head.partition(" | Kỹ thuật: ")
        elif text.startswith("BƯỚC "):
            c["steps"].append({"ts": ts, "name": text.split(": ", 1)[1], "no": text.split(":")[0], "items": []})
        elif text.startswith("KẾT QUẢ: "):
            body = text[len("KẾT QUẢ: "):]
            c["status"] = body.split(" ")[0]
            c["result"] = body.partition(" - ")[2]
        else:
            kind, _, value = text.partition(" ")
            item = {"ts": ts, "level": level, "kind": kind, "value": value.strip()}
            if kind == "LỖI":
                c["bug"] = item["value"]
            (c["steps"][-1]["items"] if c["steps"] else c["pre"]).append(item)
    return run, list(cases.values())


def status_of(c):
    return {"PASSED": "PASS", "FAILED": "FAIL", "ERROR": "FAIL", "MANUAL": "SKIP", "SKIPPED": "SKIP"}.get(c["status"], "FAIL")


def step_status(step):
    return "FAIL" if any(i["level"] == "ERROR" for i in step["items"]) else "PASS"


def sort_key(case_id):
    tc, _, n = case_id.partition("-")
    return [int(x) for x in tc[2:].split(".")] + [int(n or 0)]


def badge(st):
    return f'<span class="label {st.lower()}">{st}</span>'


def render_item(i, log_dir):
    kind = {"INPUT": "INPUT", "GHI": "GHI CHÚ", "MONG": "MONG ĐỢI", "THỰC": "THỰC TẾ", "ẢNH": "ẢNH", "LỖI": "LỖI"}.get(i["kind"], i["kind"])
    value = i["value"]
    if kind == "GHI CHÚ":
        value = value.removeprefix("CHÚ ").strip()
    if kind == "MONG ĐỢI":
        value = value.removeprefix("ĐỢI:").strip()
    if kind == "THỰC TẾ":
        value = value.removeprefix("TẾ :").strip()
    level = "fail" if i["level"] == "ERROR" else ("warn" if i["level"] == "WARNING" else "info")
    body = escape(value)
    if kind == "ẢNH":
        rel = Path("../..") / value if not value.startswith("..") else Path(value)
        href = escape(Path(*[".."] * 2, value).as_posix())
        body = f'<a href="{href}" target="_blank">{escape(Path(value).name)}</a><br><img src="{href}" alt="{escape(Path(value).name)}" loading="lazy">'
    return (f'<tr class="msg {level}"><td class="time">{i["ts"][11:]}</td>'
            f'<td class="lvl {level}">{"FAIL" if level == "fail" else ("WARN" if level == "warn" else "INFO")}</td>'
            f'<td class="kind">{escape(kind)}</td><td class="text">{body}</td></tr>')


def render(run, cases, log_path):
    by_suite = OrderedDict((k, []) for k in SUITES)
    for c in sorted(cases, key=lambda c: sort_key(c["id"])):
        by_suite[f"TS{c['id'][2]}"].append(c)
    total = {s: sum(status_of(c) == s for c in cases) for s in ("PASS", "FAIL", "SKIP")}
    summary = [m for _, _, _, m in run if m.startswith(("TỔNG KẾT", "Tỷ lệ"))]
    start, end = run[0][0] if run else "", run[-1][0] if run else ""

    stat_rows = "".join(
        f"<tr><td class='name'><a href='#{k}'>{k} - {escape(v)}</a></td>"
        f"<td>{len(by_suite[k])}</td><td class='pass'>{sum(status_of(c) == 'PASS' for c in by_suite[k])}</td>"
        f"<td class='fail'>{sum(status_of(c) == 'FAIL' for c in by_suite[k])}</td>"
        f"<td class='skip'>{sum(status_of(c) == 'SKIP' for c in by_suite[k])}</td>"
        f"<td>{bar(by_suite[k])}</td></tr>" for k, v in SUITES.items())

    suites_html = []
    for key, cs in by_suite.items():
        st = "FAIL" if any(status_of(c) == "FAIL" for c in cs) else "PASS"
        tests = []
        for c in cs:
            cst = status_of(c)
            steps = "".join(
                f'<details class="kw"><summary>{badge(step_status(s))}<span class="kwtype">BƯỚC</span>'
                f'<span class="kwname">{escape(s["no"])}: {escape(s["name"])}</span><span class="ts">{s["ts"][11:]}</span></summary>'
                f'<table class="messages">{"".join(render_item(i, log_path.parent) for i in s["items"])}</table></details>'
                for s in c["steps"])
            pre = (f'<details class="kw"><summary>{badge("PASS")}<span class="kwtype">SETUP</span>'
                   f'<span class="kwname">Chuẩn bị dữ liệu</span></summary><table class="messages">'
                   f'{"".join(render_item(i, log_path.parent) for i in c["pre"])}</table></details>') if c["pre"] else ""
            info = (f'<table class="meta"><tr><th>Mã ca:</th><td>{escape(c["id"])}</td></tr>'
                    f'<tr><th>Kỹ thuật:</th><td>{escape(c["technique"])}</td></tr>'
                    f'<tr><th>Bắt đầu / Kết thúc:</th><td>{c["start"]} / {c["end"]}</td></tr>'
                    f'<tr><th>Trạng thái:</th><td>{badge(cst)} {escape(c["status"])}</td></tr>'
                    + (f'<tr><th>Thông điệp:</th><td class="fail-msg">{escape(c["result"])}</td></tr>' if c["result"] else "")
                    + (f'<tr><th>Lỗi ghi nhận:</th><td class="fail-msg">{escape(c["bug"])}</td></tr>' if c["bug"] else "")
                    + "</table>")
            tests.append(f'<details class="test {cst.lower()}" id="{escape(c["id"])}"{" open" if cst == "FAIL" and False else ""}>'
                         f'<summary>{badge(cst)}<span class="kwtype">TEST</span><span class="kwname">{escape(c["id"])} - {escape(c["title"])}</span></summary>'
                         f'<div class="body">{info}{pre}{steps}</div></details>')
        suites_html.append(f'<details class="suite" id="{key}" open><summary>{badge(st)}<span class="kwtype">SUITE</span>'
                           f'<span class="kwname">{key} - {escape(SUITES[key])}</span><span class="ts">{len(cs)} ca</span></summary>'
                           f'<div class="body">{"".join(tests)}</div></details>')

    run_rows = "".join(f'<tr class="msg {"warn" if l == "WARNING" else "info"}"><td class="time">{t[11:]}</td><td class="kind">{escape(w)}</td><td class="text">{escape(m)}</td></tr>' for t, l, w, m in run)
    overall = "fail" if total["FAIL"] else "pass"
    return f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Log QuanTriKhachSan</title>
<style>
:root{{--text:#000;--bg:#fff;--primary:#ddd;--secondary:#ccc;--link:#15c;--hl:#eee;--pass:#97bd61;--fail:#ce3e01;--warn:#fed84f;--skip:#fed84f;--pass-link:#098a09;--fail-link:#ce3e01;--warn-link:#927201}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--text:#e2e1d7;--bg:#1c2227;--primary:#26373b;--secondary:#424f5a;--link:#8cc4ff;--hl:#002b36;--pass-link:#97bd61;--warn-link:#fed84f}}}}
:root[data-theme="dark"]{{--text:#e2e1d7;--bg:#1c2227;--primary:#26373b;--secondary:#424f5a;--link:#8cc4ff;--hl:#002b36;--pass-link:#97bd61;--warn-link:#fed84f}}
*{{box-sizing:border-box}} body{{margin:0;padding:8px 16px 40px;font:13px Helvetica,Arial,sans-serif;color:var(--text);background:var(--bg)}}
a{{color:var(--link)}} h1{{margin:0;font-size:26px}} h2{{font-size:18px;margin:24px 0 8px;padding-left:8px;border-left:6px solid var(--{overall})}}
#header{{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;border-bottom:4px solid var(--{overall});padding:8px 0 12px}}
#generated{{text-align:right;font-size:12px;color:#888}}
table.details{{border-collapse:collapse;margin:8px 0}} table.details th{{text-align:left;padding:3px 12px 3px 0;white-space:nowrap;vertical-align:top}} table.details td{{padding:3px 0}}
table.stats{{width:100%;border-collapse:collapse;border:1px solid var(--secondary)}} table.stats th,table.stats td{{border:1px solid var(--secondary);padding:4px 8px;text-align:center}}
table.stats th{{background:var(--primary)}} table.stats td.name{{text-align:left}} td.pass{{color:var(--pass-link)}} td.fail{{color:var(--fail-link)}} td.skip{{color:var(--warn-link)}}
.graph{{display:flex;height:12px;border:1px solid var(--secondary);min-width:120px}} .graph span{{display:block}} .graph .p{{background:var(--pass)}} .graph .f{{background:var(--fail)}} .graph .s{{background:var(--skip)}}
details{{margin:2px 0}} details>summary{{list-style:none;cursor:pointer;padding:3px 6px;display:flex;align-items:center;gap:6px;border:1px solid var(--secondary);background:var(--primary)}}
details>summary::-webkit-details-marker{{display:none}} details>summary::before{{content:"+";font-family:monospace;width:12px}} details[open]>summary::before{{content:"−"}}
details .body{{padding:4px 0 4px 18px}} details.kw>summary{{background:var(--bg)}} details.test>summary{{background:var(--hl)}}
.label{{display:inline-block;min-width:38px;text-align:center;padding:1px 4px;border-radius:3px;font-size:11px;font-weight:bold;color:#fff}}
.label.pass{{background:var(--pass)}} .label.fail{{background:var(--fail)}} .label.skip{{background:var(--skip);color:#000}}
.kwtype{{font-weight:bold;font-size:11px;text-transform:uppercase;min-width:44px}} .kwname{{flex:1;overflow-wrap:anywhere}} .ts{{color:#888;font-size:11px;white-space:nowrap}}
table.meta{{margin:4px 0 6px}} table.meta th{{text-align:left;padding:2px 10px 2px 0;white-space:nowrap;vertical-align:top}} .fail-msg{{color:var(--fail-link)}}
table.messages{{width:100%;border-collapse:collapse;margin:2px 0 4px}} table.messages td{{padding:3px 6px;border-bottom:1px solid var(--hl);vertical-align:top}}
td.time{{width:64px;color:#888;font-family:monospace}} td.lvl{{width:44px;font-weight:bold;font-size:11px}} td.lvl.info{{color:var(--pass-link)}} td.lvl.fail{{color:var(--fail-link)}} td.lvl.warn{{color:var(--warn-link)}}
td.kind{{width:80px;font-weight:bold;font-size:11px;white-space:nowrap}} td.text{{overflow-wrap:anywhere;white-space:pre-wrap}} tr.msg.fail td.text{{color:var(--fail-link)}}
td.text img{{max-width:min(640px,100%);border:1px solid var(--secondary);margin-top:4px}}
#toolbar{{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}} #toolbar button{{font:inherit;padding:3px 10px;border:1px solid var(--secondary);background:var(--primary);color:var(--text);cursor:pointer}}
.wrap{{overflow-x:auto}}
</style></head><body>
<div id="header"><div><h1>QuanTriKhachSanN5 Test Log</h1><div>Selenium WebDriver + pytest · Role User/Guest</div></div>
<div id="generated">Nguồn: {escape(log_path.relative_to(ROOT).as_posix())}<br>Bắt đầu: {start}<br>Kết thúc: {end}<br>
<button onclick="toggleTheme()">Giao diện sáng/tối</button></div></div>
<h2>Summary Information</h2>
<table class="details">
<tr><th>Status:</th><td class="{overall}">{'Có ca không đạt' if total['FAIL'] else 'Tất cả ca đạt'}</td></tr>
{''.join(f'<tr><th>{escape(s.split(":",1)[0])}:</th><td>{escape(s.split(":",1)[1].strip())}</td></tr>' for s in summary)}
<tr><th>Start Time:</th><td>{start}</td></tr><tr><th>End Time:</th><td>{end}</td></tr>
</table>
<h2>Test Statistics</h2>
<div class="wrap"><table class="stats"><tr><th>Tổng thống kê</th><th>Tổng</th><th>Pass</th><th>Fail</th><th>Skip (thủ công)</th><th>Pass / Fail / Skip</th></tr>
<tr><td class="name">Tất cả ca kiểm thử ({len({c['id'].split('-')[0] for c in cases})} test case trong plan, tách theo EP/BVA)</td><td>{len(cases)}</td><td class="pass">{total['PASS']}</td><td class="fail">{total['FAIL']}</td><td class="skip">{total['SKIP']}</td><td>{bar(cases)}</td></tr></table></div>
<br><div class="wrap"><table class="stats"><tr><th>Thống kê theo Suite</th><th>Tổng số ca</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Pass / Fail / Skip</th></tr>{stat_rows}</table></div>
<h2>Test Execution Log</h2>
<div id="toolbar"><button onclick="setAll('details.test',true)">Mở tất cả test</button><button onclick="setAll('details',false)">Thu gọn tất cả</button>
<button onclick="openFailed()">Mở các test FAIL</button><button onclick="setAll('details',true)">Mở toàn bộ bước</button></div>
<details class="suite" open><summary>{badge(overall.upper())}<span class="kwtype">RUN</span><span class="kwname">Lần chạy và chuẩn bị dữ liệu</span></summary>
<div class="body"><table class="messages">{run_rows}</table></div></details>
{''.join(suites_html)}
<script>
function setAll(sel,open){{document.querySelectorAll(sel).forEach(d=>d.open=open);if(open)document.querySelectorAll('details.suite').forEach(d=>d.open=true);}}
function openFailed(){{setAll('details',false);document.querySelectorAll('details.suite').forEach(d=>d.open=true);
document.querySelectorAll('details.test.fail').forEach(d=>{{d.open=true;d.querySelectorAll('details.kw').forEach(k=>{{if(k.querySelector('.label.fail'))k.open=true;}});}});}}
function toggleTheme(){{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
r.dataset.theme=dark?'light':'dark';try{{localStorage.setItem('logTheme',r.dataset.theme)}}catch(e){{}}}}
try{{const t=localStorage.getItem('logTheme');if(t)document.documentElement.dataset.theme=t;}}catch(e){{}}
if(location.hash){{const d=document.getElementById(location.hash.slice(1));if(d&&d.tagName==='DETAILS')d.open=true;}}
</script></body></html>"""


def bar(cs):
    n = len(cs) or 1
    p = sum(status_of(c) == "PASS" for c in cs) * 100 / n
    f = sum(status_of(c) == "FAIL" for c in cs) * 100 / n
    s = 100 - p - f if cs else 0
    return f'<div class="graph"><span class="p" style="width:{p:.1f}%"></span><span class="f" style="width:{f:.1f}%"></span><span class="s" style="width:{s:.1f}%"></span></div>'


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    log_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else max((ROOT / "results" / "logs").glob("*.log"))
    run, cases = parse(log_path)
    out = log_path.with_suffix(".html")
    out.write_text(render(run, cases, log_path), encoding="utf-8")
    print(f"Đã tạo {out.relative_to(ROOT)} từ {log_path.name}: {len(cases)} ca")


if __name__ == "__main__":
    main()
