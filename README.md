# Kiểm thử tự động QuanTriKhachSanN5 – Role User/Guest

Bộ kiểm thử dùng **Selenium WebDriver + Python + pytest** cho giao diện web của hệ thống quản trị khách sạn
(`Hotel/QuanTriKhachSanN5_Frontend`), chỉ phạm vi website công khai và tài khoản User/Guest.
Kịch bản bám theo `Hotel/Test-Plan-QuanTriKhachSan.xlsx` (25 test case, 20 chức năng).
Bộ test chỉ ghi nhận lỗi, không sửa mã nguồn ứng dụng.

## Chuẩn bị

1. SQL Server có database `HotelManagementDB`. Đổi tên server/database trong `conftest.py` nếu máy khác.
2. Chạy Backend: `cd Hotel/QuanTriKhachSanN5` rồi `dotnet run --launch-profile http` (cổng 5070).
3. Chạy Frontend: `cd Hotel/QuanTriKhachSanN5_Frontend` rồi `npm run dev` (cổng 5173).
4. Cài thư viện Python:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Bộ test tự tạo tài khoản Guest mới qua API bằng OTP test `123456` (Backend chỉ cho phép với email `@hotel.com`).
Đầu mỗi lần chạy, `tests/data/prepare_test_data.sql` được chạy bằng `sqlcmd` để thêm voucher hết hạn `SELENIUMEXPIRED` cho TC3.4.

## Chạy test và xuất kết quả

```powershell
.\.venv\Scripts\python.exe -m pytest              # chạy ẩn (headless)
.\.venv\Scripts\python.exe -m pytest --headed     # hiện trình duyệt khi trình diễn
.\.venv\Scripts\python.exe -m pytest -k TC3       # lọc theo tên test
.\.venv\Scripts\python.exe scripts\export_results.py
```

| Đầu ra | Nội dung |
|---|---|
| `results/logs/test-run_<thời gian>.log` | Log chi tiết từng ca: bước thao tác, input, kết quả mong đợi, thực tế, PASS/FAIL, lỗi, ảnh |
| `results/screenshots/<thời gian>/` | Ảnh minh chứng từng bước quan trọng và ảnh tại thời điểm FAIL |
| `results/report.html` | Báo cáo HTML: chỉ số, kết quả từng ca, danh sách lỗi |
| `results/test-results.json` | Dữ liệu thô của lần chạy gần nhất |
| `results/Bug-Report-Jira.csv` | Danh sách lỗi để import vào Jira/Trello |
| `Hotel/Test-Plan-QuanTriKhachSan.xlsx` | Cập nhật sheet Test Iteration 1 và thêm các sheet Execution Log, Bug Report, Metrics |

## Cấu trúc

```text
conftest.py              Chrome, ghi log từng bước, ảnh chụp, ghi nhận lỗi, báo cáo HTML/JSON
tests/helpers.py         Thao tác antd (DatePicker, Select, InputNumber, Rate, modal, toast) và chuẩn bị dữ liệu
tests/test_public.py     TS1 Website công khai (TC1.1–TC1.5)
tests/test_account.py    TS2 Tài khoản (TC2.1–TC2.5, TC2.7)
tests/test_booking.py    TS3 Tìm phòng và đặt phòng (TC3.1–TC3.6)
tests/test_guest_area.py TS4 Khu vực cá nhân (TC4.1–TC4.3, TC4.5)
tests/test_manual.py     4 TC thủ công (TC2.6, TC4.4, TC4.6, TC4.7) – được báo cáo là "Thủ công"
scripts/export_results.py Ghi kết quả vào Test Plan và xuất CSV lỗi
legacy_demoblaze/        Bộ test Demoblaze giữa kỳ (không còn chạy)
```

Mỗi test case trong plan được tách thành nhiều ca con theo **phân vùng tương đương (EP)** và **giá trị biên (BVA)**.
Ví dụ: mật khẩu 5 và 6 ký tự, số người lớn 6/7/10/11, voucher có tổng đơn đúng bằng giá trị tối thiểu, ngày nhận phòng ở quá khứ.
Mã ca có dạng `TC3.2-02`, kèm tên phân vùng như `BVA_10_nguoi_lon_max_o_nhap`.
Khi một ca FAIL, bộ test phân loại nguyên nhân:
- **Lỗi phần mềm (defect)**: được ghi vào Bug Report.
- **Lỗi kịch bản/môi trường**: không tính là defect.
