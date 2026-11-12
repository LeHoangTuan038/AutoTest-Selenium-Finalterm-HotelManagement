"""Hạ tầng kiểm thử: Chrome, nhật ký từng bước, ảnh chụp màn hình, ghi nhận lỗi và báo cáo."""

import json
import logging
import re
import time
from datetime import datetime
from html import escape
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = Path(__file__).parent
RESULTS = ROOT / "results"
RUN_ID = datetime.now().strftime("%Y%m%d_%H%M%S")
LOG_DIR = RESULTS / "logs"
SHOT_DIR = RESULTS / "screenshots" / RUN_ID
LOG_FILE = LOG_DIR / f"test-run_{RUN_ID}.log"

SEVERITIES = ("Critical", "Major", "Minor", "Trivial")
_records = {}
_run_started = None

log = logging.getLogger("qa")


class Bug:
    """Lỗi tiềm năng gắn với một bước kiểm tra; chỉ được ghi nhận khi bước đó thất bại."""

    def __init__(self, title, severity="Major", component="", priority=None):
        assert severity in SEVERITIES, severity
        self.title = title
        self.severity = severity
        self.component = component
        self.priority = priority or {"Critical": "Highest", "Major": "High", "Minor": "Medium", "Trivial": "Low"}[severity]


class Recorder:
    """Ghi từng bước, input, kết quả mong đợi/thực tế của một test case vào log và báo cáo."""

    def __init__(self, item, driver_getter):
        meta = item.get_closest_marker("tc")
        self.tc_id, self.title = meta.args[0], meta.args[1]
        self.technique = meta.kwargs.get("technique", "")
        callspec = getattr(item, "callspec", None)
        self.case = callspec.id if callspec else item.originalname.removeprefix("test_")
        self.case_id = f"{self.tc_id}-{getattr(item, '_case_no', 1):02d}"
        self.nodeid = item.nodeid
        self._driver = driver_getter
        self.steps, self.checks, self.screenshots, self.inputs = [], [], [], {}
        self.defect = None
        self._n = 0

    # -- ghi log
    def _log(self, level, msg):
        log.log(level, msg, extra={"tc": self.case_id})

    def step(self, text):
        self._n += 1
        self.steps.append(f"Bước {self._n}: {text}")
        self._log(logging.INFO, f"BƯỚC {self._n}: {text}")

    def input(self, **data):
        self.inputs.update({k: str(v) for k, v in data.items()})
        for key, value in data.items():
            self._log(logging.INFO, f"   INPUT  {key} = {value!r}")

    def note(self, text):
        self._log(logging.INFO, f"   GHI CHÚ {text}")

    def shot(self, name):
        driver = self._driver()
        if driver is None:
            return None
        SHOT_DIR.mkdir(parents=True, exist_ok=True)
        safe = re.sub(r"[^\w.-]+", "_", f"{self.case_id}_{len(self.screenshots) + 1:02d}_{name}")
        path = SHOT_DIR / f"{safe}.png"
        try:
            driver.save_screenshot(str(path))
        except Exception as exc:  # trình duyệt đã đóng
            self._log(logging.WARNING, f"   Không chụp được màn hình: {exc}")
            return None
        rel = path.relative_to(ROOT).as_posix()
        self.screenshots.append(rel)
        self._log(logging.INFO, f"   ẢNH    {rel}")
        return rel

    def check(self, condition, expected, actual, bug=None):
        """So sánh kết quả; nếu sai thì chụp màn hình, ghi lỗi (nếu có Bug) và dừng test."""
        ok = bool(condition)
        self.checks.append({"expected": expected, "actual": str(actual), "passed": ok})
        self._log(logging.INFO, f"   MONG ĐỢI: {expected}")
        self._log(logging.INFO if ok else logging.ERROR, f"   THỰC TẾ : {actual}  => {'PASS' if ok else 'FAIL'}")
        if not ok:
            shot = self.shot("FAIL")
            if bug is not None:
                self.defect = {
                    "title": bug.title,
                    "severity": bug.severity,
                    "priority": bug.priority,
                    "component": bug.component,
                    "expected": expected,
                    "actual": str(actual),
                    "screenshot": shot,
                }
                self._log(logging.ERROR, f"   LỖI    [{bug.severity}] {bug.title}")
            raise AssertionError(f"Mong đợi: {expected} | Thực tế: {actual}")


def pytest_addoption(parser):
    parser.addoption("--headed", action="store_true", default=False, help="Hiện cửa sổ Chrome khi chạy.")


def pytest_configure(config):
    global _run_started
    _run_started = time.time()
    config.addinivalue_line("markers", "tc(id, title, technique=''): gắn test với Test Case ID trong Test Plan")
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-7s | %(tc)-14s | %(message)s", "%Y-%m-%d %H:%M:%S"))
    log.addHandler(handler)
    log.setLevel(logging.INFO)
    log.propagate = False
    log.info("=" * 70, extra={"tc": "RUN"})
    log.info(f"BẮT ĐẦU LẦN CHẠY {RUN_ID} - QuanTriKhachSanN5 (User/Guest)", extra={"tc": "RUN"})
    log.info("Frontend http://localhost:5173 | Backend http://localhost:5070 | Selenium + pytest", extra={"tc": "RUN"})
    log.info("=" * 70, extra={"tc": "RUN"})


@pytest.hookimpl(tryfirst=True)
def pytest_collection_modifyitems(items):
    counters = {}
    for item in items:
        marker = item.get_closest_marker("tc")
        if marker:
            counters[marker.args[0]] = counters.get(marker.args[0], 0) + 1
            item._case_no = counters[marker.args[0]]


@pytest.fixture
def driver(request):
    options = Options()
    if not request.config.getoption("--headed"):
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1000")
    options.add_argument("--disable-notifications")
    options.add_argument("--lang=vi-VN")
    drv = webdriver.Chrome(options=options)
    drv.set_page_load_timeout(30)
    request.node._driver = drv
    yield drv
    request.node._driver = None
    drv.quit()


@pytest.fixture(scope="session", autouse=True)
def prepare_test_data():
    """Chạy tests/data/prepare_test_data.sql (voucher hết hạn cho TC3.4) bằng sqlcmd nếu có."""
    import shutil
    import subprocess
    sql = ROOT / "tests" / "data" / "prepare_test_data.sql"
    if not shutil.which("sqlcmd"):
        log.warning("Không tìm thấy sqlcmd - bỏ qua chuẩn bị dữ liệu SQL", extra={"tc": "SETUP"})
        return
    res = subprocess.run(["sqlcmd", "-S", ".", "-E", "-d", "HotelManagementDB", "-b", "-i", str(sql)],
                         capture_output=True, text=True, timeout=60)
    log.info(f"Chuẩn bị dữ liệu SQL ({sql.name}): exit={res.returncode}", extra={"tc": "SETUP"})


@pytest.fixture
def guest(tc):
    """Guest mới tạo qua API (OTP test 123456) - bước chuẩn bị dữ liệu, không phải bước kiểm thử."""
    from tests.helpers import register_guest_api, unique_email
    email = unique_email("guest_")
    account = register_guest_api(f"Khách Selenium {email.split('@')[0][-6:]}", email)
    tc.note(f"Chuẩn bị dữ liệu: tạo Guest {account['email']} qua API")
    return account


@pytest.fixture
def guest_session(driver, guest, tc):
    """Trình duyệt đã đăng nhập bằng Guest mới (nạp JWT vào localStorage như LoginPage)."""
    from tests.helpers import inject_session, login_api
    body = login_api(guest["email"], guest["password"])
    inject_session(driver, body)
    tc.note("Chuẩn bị dữ liệu: nạp phiên đăng nhập Guest vào trình duyệt")
    return dict(guest, id=body["user"]["id"], token=body["token"])


@pytest.fixture
def tc(request):
    rec = Recorder(request.node, lambda: getattr(request.node, "_driver", None))
    request.node._recorder = rec
    log.info("-" * 70, extra={"tc": rec.case_id})
    log.info(f"TEST CASE {rec.case_id}: {rec.title}" + (f" | Kỹ thuật: {rec.technique}" if rec.technique else ""), extra={"tc": rec.case_id})
    return rec


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    rec = getattr(item, "_recorder", None)
    if rec is None:
        marker = item.get_closest_marker("tc")
        if marker is None:
            return
        rec = Recorder(item, lambda: None)
        item._recorder = rec
    entry = _records.setdefault(rec.nodeid, {"rec": rec, "duration": 0.0})
    entry["duration"] += report.duration

    if report.when == "call" or (report.when == "setup" and (report.failed or report.skipped)):
        if report.skipped:
            reason = report.longrepr[2] if isinstance(report.longrepr, tuple) else str(report.longrepr)
            reason = reason.replace("Skipped: ", "")
            entry["status"] = "Manual" if reason.startswith("THỦ CÔNG") else "Skipped"
            entry["detail"] = reason
            log.warning(f"KẾT QUẢ: {entry['status'].upper()} - {reason}", extra={"tc": rec.case_id})
        elif report.passed:
            entry["status"] = "Passed"
            entry["detail"] = ""
            log.info("KẾT QUẢ: PASSED", extra={"tc": rec.case_id})
        else:
            exc = call.excinfo
            is_assert = exc is not None and exc.errisinstance(AssertionError)
            if not is_assert:
                rec.shot("ERROR")
            entry["status"] = "Failed" if is_assert else "Error"
            entry["detail"] = str(exc.value) if exc else report.longreprtext
            if is_assert:
                root = "Lỗi phần mềm (defect)" if rec.defect else "Kết quả không đạt"
            else:
                root = "Lỗi môi trường/kịch bản (không phải defect)"
            entry["root_cause"] = root
            log.error(f"KẾT QUẢ: {entry['status'].upper()} - {root}: {entry['detail'][:400]}", extra={"tc": rec.case_id})


def pytest_sessionfinish(session, exitstatus):
    if not _records:
        return
    rows = []
    for entry in _records.values():
        rec = entry["rec"]
        rows.append({
            "tc_id": rec.tc_id,
            "case_id": rec.case_id,
            "title": rec.title,
            "case": rec.case,
            "technique": rec.technique,
            "nodeid": rec.nodeid,
            "status": entry.get("status", "Error"),
            "root_cause": entry.get("root_cause", ""),
            "detail": entry.get("detail", ""),
            "duration": round(entry["duration"], 2),
            "inputs": rec.inputs,
            "steps": rec.steps,
            "checks": rec.checks,
            "screenshots": rec.screenshots,
            "defect": rec.defect,
        })
    rows.sort(key=lambda r: ([int(x) for x in r["tc_id"][2:].split(".")], r["case_id"]))

    defects, by_title = [], {}
    for r in rows:
        if not r["defect"]:
            continue
        known = by_title.get(r["defect"]["title"])
        if known:  # cùng một lỗi phát hiện ở nhiều ca: một Bug ID, ghi thêm ca tái hiện
            r["defect"]["id"] = known["id"]
            known["cases"].append(r["case_id"])
            continue
        r["defect"]["id"] = f"BUG-{len(defects) + 1:02d}"
        bug = dict(r["defect"], tc_id=r["tc_id"], case_id=r["case_id"], cases=[r["case_id"]], title_tc=r["title"],
                   steps=r["steps"], inputs=r["inputs"])
        defects.append(bug)
        by_title[bug["title"]] = bug

    metrics = compute_metrics(rows, defects)
    data = {
        "run_id": RUN_ID,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "duration_s": round(time.time() - _run_started, 1),
        "log_file": LOG_FILE.relative_to(ROOT).as_posix(),
        "metrics": metrics,
        "cases": rows,
        "defects": defects,
    }
    RESULTS.mkdir(exist_ok=True)
    (RESULTS / "test-results.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (RESULTS / "report.html").write_text(render_html(data), encoding="utf-8")

    m = metrics
    for line in (
        "=" * 70,
        f"TỔNG KẾT: {m['executed']} ca đã chạy | Passed {m['passed']} | Failed {m['failed']} | Error {m['error']} | Thủ công {m['manual']}",
        f"Tỷ lệ đạt: {m['pass_rate']}% | Số lỗi: {m['defects']} | Defect density: {m['defect_density_tc']} lỗi/TC, {m['defect_density_func']} lỗi/chức năng",
        f"Báo cáo: results/report.html | Dữ liệu: results/test-results.json | Ảnh: {SHOT_DIR.relative_to(ROOT).as_posix()}",
        "=" * 70,
    ):
        log.info(line, extra={"tc": "RUN"})


def compute_metrics(rows, defects):
    auto = [r for r in rows if r["status"] != "Manual"]
    executed = [r for r in auto if r["status"] in ("Passed", "Failed", "Error")]
    passed = sum(r["status"] == "Passed" for r in executed)
    failed = sum(r["status"] == "Failed" for r in executed)
    tc_ids = sorted({r["tc_id"] for r in rows}, key=lambda t: [int(x) for x in t[2:].split(".")])
    tc_status = {}
    for t in tc_ids:
        st = [r["status"] for r in rows if r["tc_id"] == t]
        if all(s == "Manual" for s in st):
            tc_status[t] = "Manual"
        elif "Error" in st:
            tc_status[t] = "Blocked"
        elif "Failed" in st:
            tc_status[t] = "Failed"
        else:
            tc_status[t] = "Passed"
    tcs_run = [t for t, s in tc_status.items() if s != "Manual"]
    by_sev = {s: sum(d["severity"] == s for d in defects) for s in SEVERITIES}
    functions_total = 20
    return {
        "planned_tc": len(tc_ids),
        "automated_tc": len(tcs_run),
        "manual": len(tc_ids) - len(tcs_run),
        "tc_passed": sum(s == "Passed" for s in tc_status.values()),
        "tc_failed": sum(s == "Failed" for s in tc_status.values()),
        "tc_blocked": sum(s == "Blocked" for s in tc_status.values()),
        "tc_status": tc_status,
        "executed": len(executed),
        "passed": passed,
        "failed": failed,
        "error": sum(r["status"] == "Error" for r in executed),
        "pass_rate": round(100 * passed / len(executed), 1) if executed else 0.0,
        "tc_pass_rate": round(100 * sum(s == "Passed" for s in tc_status.values()) / len(tcs_run), 1) if tcs_run else 0.0,
        "defects": len(defects),
        "defects_by_severity": by_sev,
        "defect_density_tc": round(len(defects) / len(tcs_run), 2) if tcs_run else 0.0,
        "defect_density_func": round(len(defects) / functions_total, 2),
        "functions_total": functions_total,
        "automation_coverage": round(100 * len(tcs_run) / len(tc_ids), 1) if tc_ids else 0.0,
        "execution_coverage": round(100 * len(tcs_run) / len(tc_ids), 1) if tc_ids else 0.0,
    }


def render_html(data):
    m = data["metrics"]
    status_vi = {"Passed": "Đạt", "Failed": "Không đạt", "Error": "Lỗi kịch bản", "Manual": "Thủ công", "Skipped": "Bỏ qua"}
    rows = []
    for r in data["cases"]:
        checks = "".join(
            f"<li class='{'ok' if c['passed'] else 'ko'}'><b>Mong đợi:</b> {escape(c['expected'])}<br><b>Thực tế:</b> {escape(c['actual'])}</li>"
            for c in r["checks"])
        steps = "".join(f"<li>{escape(s)}</li>" for s in r["steps"])
        inputs = ", ".join(f"{escape(k)}={escape(v)}" for k, v in r["inputs"].items())
        shots = " ".join(f"<a href='../{escape(s)}' target='_blank'>{escape(Path(s).name)}</a>" for s in r["screenshots"])
        bug = f"<span class='tag bug'>{escape(r['defect']['id'])} · {escape(r['defect']['severity'])}</span>" if r["defect"] else ""
        detail = f"<p class='why'>{escape(r['root_cause'] + ': ' if r['root_cause'] else '')}{escape(r['detail'][:600])}</p>" if r["detail"] else ""
        rows.append(f"""
<tr class="{r['status'].lower()}"><td><b>{escape(r['case_id'])}</b></td><td>{escape(r['title'])}<div class='tech'>{escape(r['case'])} · {escape(r['technique'])}</div></td>
<td><span class="tag {r['status'].lower()}">{status_vi.get(r['status'], r['status'])}</span>{bug}</td><td>{r['duration']:.1f}s</td></tr>
<tr class="detail"><td colspan="4"><details><summary>Chi tiết bước, input, kết quả</summary>
{f'<p><b>Input:</b> {inputs}</p>' if inputs else ''}<ol>{steps}</ol><ul class='checks'>{checks}</ul>{detail}{f'<p><b>Ảnh:</b> {shots}</p>' if shots else ''}</details></td></tr>""")
    def evidence(d):
        return f"<a href='../{escape(d['screenshot'])}' target='_blank'>ảnh</a>" if d.get("screenshot") else ""

    bug_rows = "".join(
        f"<tr><td><b>{escape(d['id'])}</b></td><td>{escape(d['title'])}</td><td>{escape(d['severity'])}</td><td>{escape(', '.join(d['cases']))}</td>"
        f"<td>{escape(d['expected'])}</td><td>{escape(d['actual'])}</td><td>{evidence(d)}</td></tr>"
        for d in data["defects"])
    sev = " · ".join(f"{k}: {v}" for k, v in m["defects_by_severity"].items())
    return f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Báo cáo kiểm thử QuanTriKhachSan</title>
<style>
:root{{--bg:#f4f6f9;--card:#fff;--ink:#1f2a3a;--muted:#5d6b7e;--line:#e2e7ee;--ok:#18794e;--ko:#c62828;--warn:#9a6700;--man:#5b4bb7}}
body{{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 "Segoe UI",Arial,sans-serif}}
main{{max-width:1200px;margin:0 auto;padding:24px 16px}} h1{{margin:0 0 4px}} .meta{{color:var(--muted);margin:0 0 20px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}}
.card{{background:var(--card);border-radius:8px;padding:14px 16px;box-shadow:0 1px 3px #0001}} .card b{{display:block;font-size:24px}}
table{{width:100%;border-collapse:collapse;background:var(--card);border-radius:8px;overflow:hidden;box-shadow:0 1px 3px #0001;margin-bottom:24px}}
th,td{{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}} th{{background:#1f2a3a;color:#fff}}
.tag{{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:600;margin-right:4px}}
.tag.passed{{background:#e3f4ea;color:var(--ok)}} .tag.failed{{background:#fde8e8;color:var(--ko)}} .tag.error{{background:#fff4d6;color:var(--warn)}}
.tag.manual{{background:#ece9fb;color:var(--man)}} .tag.bug{{background:#ffe0e0;color:var(--ko)}}
.tech{{color:var(--muted);font-size:12px}} tr.detail td{{background:#fafbfc;padding-top:0}} details summary{{cursor:pointer;color:var(--muted)}}
.checks li.ok{{color:var(--ok)}} .checks li.ko{{color:var(--ko)}} .why{{color:var(--ko);white-space:pre-wrap}}
.wrap{{overflow-x:auto}}
</style></head><body><main>
<h1>Báo cáo kiểm thử tự động – QuanTriKhachSanN5 (User/Guest)</h1>
<p class="meta">Selenium WebDriver + pytest · Lần chạy {escape(data['run_id'])} · {escape(data['generated_at'])} · {data['duration_s']}s · Log: {escape(data['log_file'])}</p>
<section class="grid">
<div class="card"><b>{m['planned_tc']}</b>Test case trong plan</div>
<div class="card"><b>{m['automated_tc']}</b>TC chạy tự động ({m['automation_coverage']}%)</div>
<div class="card"><b>{m['manual']}</b>TC thủ công</div>
<div class="card"><b>{m['executed']}</b>Ca kiểm thử đã chạy</div>
<div class="card" style="color:var(--ok)"><b>{m['passed']}</b>Đạt ({m['pass_rate']}%)</div>
<div class="card" style="color:var(--ko)"><b>{m['failed']}</b>Không đạt</div>
<div class="card" style="color:var(--warn)"><b>{m['error']}</b>Lỗi kịch bản/môi trường</div>
<div class="card" style="color:var(--ko)"><b>{m['defects']}</b>Lỗi ghi nhận</div>
</section>
<p><b>Theo TC:</b> Đạt {m['tc_passed']} · Không đạt {m['tc_failed']} · Blocked {m['tc_blocked']} · Thủ công {m['manual']} (tỷ lệ TC đạt {m['tc_pass_rate']}%).
<b>Mức độ lỗi:</b> {sev}. <b>Defect density:</b> {m['defect_density_tc']} lỗi/TC tự động · {m['defect_density_func']} lỗi/chức năng ({m['functions_total']} chức năng).</p>
<h2>Kết quả theo ca kiểm thử</h2>
<div class="wrap"><table><thead><tr><th style="width:130px">Mã ca</th><th>Test case</th><th style="width:190px">Kết quả</th><th style="width:70px">Thời gian</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<h2>Danh sách lỗi</h2>
<div class="wrap"><table><thead><tr><th>ID</th><th>Tiêu đề</th><th>Mức độ</th><th>Ca phát hiện</th><th>Mong đợi</th><th>Thực tế</th><th>Bằng chứng</th></tr></thead>
<tbody>{bug_rows or '<tr><td colspan=7>Không có lỗi.</td></tr>'}</tbody></table></div>
</main></body></html>"""
