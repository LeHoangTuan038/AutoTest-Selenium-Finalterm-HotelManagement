"""Ghi kết quả lần chạy Selenium (results/test-results.json) vào Test Plan Excel và xuất file lỗi CSV.

Chạy sau pytest:
    .venv\\Scripts\\python.exe scripts\\export_results.py
"""

import csv
import json
import sys
from copy import copy
from datetime import datetime
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.hyperlink import Hyperlink

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"
PLAN = ROOT / "Hotel" / "Test-Plan-QuanTriKhachSan.xlsx"

STATUS_ITER = {"Passed": "Run - Passed", "Failed": "Run - Failed", "Blocked": "Blocked", "Manual": "Not Run"}
STATUS_VI = {"Passed": "Đạt", "Failed": "Không đạt", "Error": "Lỗi kịch bản", "Manual": "Thủ công - chưa chạy", "Skipped": "Bỏ qua"}
FILL = {"Passed": "C6EFCE", "Failed": "FFC7CE", "Error": "FFEB9C", "Manual": "E4DFEC", "Blocked": "FFEB9C",
        "Critical": "FF9999", "Major": "FFC7CE", "Minor": "FFEB9C", "Trivial": "DDEBF7"}
FONT = "Arial"


def style_header(ws, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(1, c)
        cell.font = Font(name=FONT, bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1F3864")
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    ws.freeze_panes = "A2"


def write_table(wb, name, headers, rows, widths, color_col=None):
    if name in wb.sheetnames:
        del wb[name]
    ws = wb.create_sheet(name)
    ws.append(headers)
    for row in rows:
        ws.append(row)
    style_header(ws, len(headers))
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.font = Font(name=FONT, size=10)
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        if color_col:
            key = row[color_col - 1].value
            for k, color in FILL.items():
                if key and str(key).startswith(k):
                    row[color_col - 1].fill = PatternFill("solid", fgColor=color)
    ws.auto_filter.ref = ws.dimensions
    return ws


def link(ws, col, rel_paths_by_row):
    for r, rel in rel_paths_by_row.items():
        if rel:
            cell = ws.cell(r, col)
            cell.hyperlink = Hyperlink(ref=cell.coordinate, target=str((ROOT / rel).resolve()))
            cell.font = Font(name=FONT, size=10, color="0563C1", underline="single")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    data = json.loads((RESULTS / "test-results.json").read_text(encoding="utf-8"))
    cases, defects, m = data["cases"], data["defects"], data["metrics"]
    run_date = datetime.strptime(data["generated_at"], "%Y-%m-%d %H:%M:%S")

    wb = openpyxl.load_workbook(PLAN)
    tcl = wb["Test Case List"]
    owners = {tcl.cell(r, 3).value: tcl.cell(r, 7).value for r in range(2, 27)}
    modes = {tcl.cell(r, 3).value: tcl.cell(r, 14).value for r in range(2, 27)}

    # ---- Test Iteration 1: kết quả theo TC
    it = wb["Test Iteration 1"]
    it["H1"].value = "Comments"
    for r in range(2, 27):
        tc_id = tcl.cell(r, 3).value
        tc_cases = [c for c in cases if c["tc_id"] == tc_id]
        status = m["tc_status"].get(tc_id, "Manual")
        bugs = sorted({c["defect"]["id"] for c in tc_cases if c["defect"]})
        passed = sum(c["status"] == "Passed" for c in tc_cases)
        it.cell(r, 4).value = owners[tc_id]
        it.cell(r, 5).value = STATUS_ITER[status]
        it.cell(r, 6).value = len(bugs)
        it.cell(r, 7).value = ", ".join(bugs) if bugs else None
        if status == "Manual":
            note = "Thủ công - chưa thực hiện. " + (tc_cases[0]["detail"].replace("THỦ CÔNG - ", "") if tc_cases else "")
        else:
            note = f"Selenium: {passed}/{len(tc_cases)} ca đạt ({run_date:%d/%m/%Y}, lần chạy {data['run_id']})."
            fails = [c for c in tc_cases if c["status"] in ("Failed", "Error")]
            if fails:
                note += " Không đạt: " + "; ".join(f"{c['case_id']} ({c['case']})" for c in fails)
        it.cell(r, 8).value = note
        for c in (4, 5, 6, 7, 8):
            it.cell(r, c).font = Font(name=FONT, size=10)
            it.cell(r, c).alignment = Alignment(wrap_text=True, vertical="top")
        it.cell(r, 5).fill = PatternFill("solid", fgColor=FILL[status])
    it.column_dimensions["H"].width = 70

    # ---- Execution Log: từng ca kiểm thử
    rows, shots = [], {}
    for i, c in enumerate(cases, 2):
        last = c["checks"][-1] if c["checks"] else {"expected": "", "actual": ""}
        failing = next((k for k in c["checks"] if not k["passed"]), None)
        check = failing or last
        rows.append([
            c["case_id"], c["tc_id"], c["title"], c["case"], c["technique"],
            "\n".join(f"{k} = {v}" for k, v in c["inputs"].items()),
            "\n".join(c["steps"]),
            "\n".join(f"- {k['expected']}" for k in c["checks"]) or c["detail"],
            check["actual"] if failing else ("Tất cả bước kiểm tra đạt" if c["status"] == "Passed" else c["detail"]),
            STATUS_VI.get(c["status"], c["status"]), c["root_cause"], c["duration"],
            c["defect"]["id"] if c["defect"] else None, c["screenshots"][-1] if c["screenshots"] else None,
            owners.get(c["tc_id"]), modes.get(c["tc_id"]),
        ])
        shots[i] = c["screenshots"][-1] if c["screenshots"] else None
    log = write_table(wb, "Execution Log", [
        "Mã ca", "Test Case ID", "Test case", "Ca con / phân vùng", "Kỹ thuật thiết kế", "Input", "Các bước",
        "Kết quả mong đợi", "Kết quả thực tế", "Trạng thái", "Nguyên nhân (root cause)", "Thời gian (s)", "Bug ID",
        "Ảnh chụp màn hình", "Tester", "Hình thức"],
        rows, [10, 9, 26, 22, 22, 26, 45, 45, 40, 13, 22, 9, 9, 30, 15, 10], color_col=10)
    link(log, 14, shots)
    for row in log.iter_rows(min_row=2):
        st = next((c["status"] for c in cases if c["case_id"] == row[0].value), None)
        if st:
            row[9].fill = PatternFill("solid", fgColor=FILL.get(st, "FFFFFF"))

    # ---- Bug Report
    bug_rows, bug_shots = [], {}
    for i, d in enumerate(defects, 2):
        bug_rows.append([
            d["id"], d["title"], d["component"], d["severity"], d["priority"], "Open",
            d["tc_id"], ", ".join(d["cases"]), "\n".join(d["steps"]),
            "\n".join(f"{k} = {v}" for k, v in d["inputs"].items()),
            d["expected"], d["actual"], d["screenshot"], owners.get(d["tc_id"]), run_date.strftime("%d/%m/%Y"),
            "Windows 10, Chrome (Selenium headless), Frontend http://localhost:5173, Backend http://localhost:5070",
        ])
        bug_shots[i] = d["screenshot"]
    bug_ws = write_table(wb, "Bug Report", [
        "Bug ID", "Tiêu đề", "Chức năng", "Mức độ (Severity)", "Ưu tiên (Priority)", "Trạng thái", "Test Case ID",
        "Ca phát hiện", "Các bước tái hiện", "Dữ liệu test", "Kết quả mong đợi", "Kết quả thực tế", "Ảnh chụp màn hình",
        "Người ghi nhận", "Ngày phát hiện", "Môi trường"],
        bug_rows, [8, 45, 16, 12, 11, 10, 9, 10, 45, 25, 35, 35, 30, 15, 11, 30], color_col=4)
    link(bug_ws, 13, bug_shots)

    # ---- Metrics
    sev = m["defects_by_severity"]
    metric_rows = [
        ["Tổng số test case trong plan", m["planned_tc"], "Test Case List"],
        ["Test case tự động (Selenium)", m["automated_tc"], "Hình thức thực thi = Tự động"],
        ["Test case thủ công (chưa chạy)", m["manual"], "Cần OTP email thật hoặc dữ liệu do Lễ tân/Admin tạo"],
        ["Tỷ lệ tự động hóa (%)", m["automation_coverage"], "TC tự động / tổng TC"],
        ["Số ca kiểm thử đã chạy (gồm phân vùng EP/BVA)", m["executed"], "Mỗi TC tách thành nhiều ca con"],
        ["Ca đạt", m["passed"], ""],
        ["Ca không đạt", m["failed"], ""],
        ["Ca lỗi kịch bản/môi trường", m["error"], "Không tính là defect"],
        ["% ca đạt (pass rate)", m["pass_rate"], "Ca đạt / ca đã chạy"],
        ["TC đạt / không đạt / blocked", f"{m['tc_passed']} / {m['tc_failed']} / {m['tc_blocked']}", "TC không đạt nếu có ít nhất 1 ca không đạt"],
        ["% TC đạt", m["tc_pass_rate"], "TC đạt / TC tự động"],
        ["Tổng số lỗi (defect)", m["defects"], "Sheet Bug Report"],
        ["Lỗi Critical / Major / Minor / Trivial", f"{sev['Critical']} / {sev['Major']} / {sev['Minor']} / {sev['Trivial']}", ""],
        ["Defect density (lỗi / TC tự động)", m["defect_density_tc"], ""],
        ["Defect density (lỗi / chức năng)", m["defect_density_func"], f"{m['functions_total']} chức năng User/Guest"],
        ["Độ bao phủ chức năng có TC (%)", 100.0, "20/20 chức năng có ít nhất 1 TC"],
        ["Độ bao phủ thực thi tự động (%)", m["execution_coverage"], "TC đã chạy / tổng TC"],
        ["Thời gian chạy (giây)", data["duration_s"], f"Lần chạy {data['run_id']}"],
        ["File log chi tiết", data["log_file"], "Ghi từng bước, input, mong đợi, thực tế"],
    ]
    write_table(wb, "Metrics", ["Chỉ số", "Giá trị", "Ghi chú"], metric_rows, [42, 18, 55])

    rm = wb["ReadMe"]
    rm["A14"], rm["B14"] = "Lần chạy gần nhất:", f"{data['run_id']} - {m['passed']}/{m['executed']} ca đạt ({m['pass_rate']}%), {m['defects']} lỗi. Xem sheet Execution Log, Bug Report, Metrics."
    rm["A14"].font = copy(rm["A13"].font)
    rm["B14"].font = copy(rm["B13"].font)

    out = PLAN
    try:
        wb.save(out)
    except PermissionError:
        out = RESULTS / "Test-Plan-QuanTriKhachSan.xlsx"
        wb.save(out)
        print(f"File gốc đang mở trong Excel - đã lưu bản cập nhật tại {out}")

    with open(RESULTS / "Bug-Report-Jira.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["Issue Type", "Summary", "Priority", "Component", "Labels", "Description"])
        for d in defects:
            desc = (f"*Mã lỗi:* {d['id']} | *Mức độ:* {d['severity']} | *TC:* {d['tc_id']} ({', '.join(d['cases'])})\n"
                    f"*Các bước:*\n" + "\n".join(d["steps"]) +
                    f"\n*Mong đợi:* {d['expected']}\n*Thực tế:* {d['actual']}\n*Ảnh:* {d['screenshot']}")
            w.writerow(["Bug", f"[{d['id']}] {d['title']}", d["priority"], d["component"],
                        f"selenium severity-{d['severity'].lower()}", desc])
    print(f"Đã cập nhật {out.name}: Test Iteration 1, Execution Log ({len(cases)} ca), Bug Report ({len(defects)} lỗi), Metrics")
    print(f"Đã xuất {RESULTS / 'Bug-Report-Jira.csv'}")


if __name__ == "__main__":
    sys.exit(main())
