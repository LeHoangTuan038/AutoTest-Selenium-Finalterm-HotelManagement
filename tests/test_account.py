"""TS2 - Tài khoản khách hàng (TC2.1 - TC2.5, TC2.7)."""

import base64
import json

import pytest

from conftest import Bug
from tests import helpers as h


def jwt_roles(token):
    payload = token.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    claims = json.loads(base64.urlsafe_b64decode(payload))
    roles = claims.get("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", [])
    return roles if isinstance(roles, list) else [roles]


def fill_register(driver, full_name, email, password, confirm):
    h.open_page(driver, "/register")
    h.visible(driver, "#fullName")
    for field, value in (("fullName", full_name), ("email", email), ("password", password), ("confirmPassword", confirm)):
        if value:
            h.fill(driver, field, value)
    h.click_button(driver, "Đăng Ký")


def otp_step_shown(driver, timeout=6):
    try:
        h.visible(driver, "#otp", timeout)
        return True
    except Exception:
        return False


# ---------------------------------------------------------------- TC2.1

REGISTER_CASES = [
    ("EP_bo_trong", "", "", "", "", ["Vui lòng nhập họ tên!", "Vui lòng nhập email!", "Vui lòng nhập mật khẩu!", "Vui lòng xác nhận mật khẩu!"]),
    ("EP_email_sai", "Khách Test", "khachtest@", "123456", "123456", ["Email không hợp lệ!"]),
    ("BVA_mat_khau_5_ky_tu", "Khách Test", "{email}", "12345", "12345", ["Mật khẩu ít nhất 6 ký tự!"]),
    ("BVA_mat_khau_6_ky_tu", "Khách Test", "{email}", "123456", "123456", []),
    ("EP_xac_nhan_khong_khop", "Khách Test", "{email}", "123456", "1234567", ["Mật khẩu xác nhận không khớp!"]),
]


@pytest.mark.tc("TC2.1", "Kiểm tra dữ liệu đăng ký Guest", technique="Equivalence Partitioning + Boundary Value (độ dài mật khẩu = 6)")
@pytest.mark.parametrize("case, name, email, pw, confirm, errors", REGISTER_CASES, ids=[c[0] for c in REGISTER_CASES])
def test_register_validation(driver, tc, case, name, email, pw, confirm, errors):
    email = email.replace("{email}", h.unique_email("tc21_"))
    tc.input(fullName=name, email=email, password=pw, confirmPassword=confirm)
    tc.step("Mở /register, nhập dữ liệu và bấm 'Đăng Ký'")
    fill_register(driver, name, email, pw, confirm)
    if errors:
        got = h.form_errors(driver)
        tc.shot("loi_validation")
        tc.check(all(e in got for e in errors), f"Hiển thị lỗi {errors}", got)
        tc.check(not otp_step_shown(driver, 2), "Không chuyển sang bước nhập OTP", "Vẫn ở bước 1")
    else:
        shown = otp_step_shown(driver)
        tc.shot("buoc_otp")
        tc.check(shown and not h.form_errors(driver, 1), "Mật khẩu đúng 6 ký tự được chấp nhận, chuyển sang bước nhập OTP",
                 "Đã chuyển sang bước OTP" if shown else f"Lỗi: {h.form_errors(driver, 1)}")


# ---------------------------------------------------------------- TC2.2

@pytest.mark.tc("TC2.2", "Đăng ký Guest thành công bằng OTP test", technique="Equivalence Partitioning (OTP hợp lệ)")
def test_register_success(driver, tc):
    email = h.unique_email("tc22_")
    tc.input(fullName="Khách Selenium", email=email, password=h.DEFAULT_PASSWORD, otp=h.TEST_OTP)
    tc.step("Nhập thông tin đăng ký hợp lệ và bấm 'Đăng Ký'")
    fill_register(driver, "Khách Selenium", email, h.DEFAULT_PASSWORD, h.DEFAULT_PASSWORD)
    tc.check(otp_step_shown(driver), "Chuyển sang bước nhập OTP", h.toast(driver, 2) or "Không thấy ô OTP")
    tc.step("Nhập OTP test 123456 và bấm 'Xác nhận & Đăng Ký'")
    h.fill(driver, "otp", h.TEST_OTP)
    h.clear_toasts(driver)
    h.click_button(driver, "Xác nhận & Đăng Ký")
    msg = h.toast(driver)
    tc.shot("dang_ky_thanh_cong")
    tc.check("thành công" in msg.lower(), "Thông báo 'Đăng ký thành công!'", msg or "Không có thông báo")
    tc.check(h.wait_url(driver, "/login", 8), "Tự chuyển về /login", driver.current_url)
    tc.step("Kiểm tra tài khoản mới đăng nhập được và có vai trò Guest")
    status, body = h.api("POST", "/Auth/login", {"email": email, "password": h.DEFAULT_PASSWORD})
    roles = jwt_roles(body["token"]) if status == 200 else []
    tc.check(status == 200 and "Guest" in roles, "Tài khoản được tạo với vai trò Guest", f"HTTP {status}, roles={roles}")


@pytest.mark.tc("TC2.2", "Đăng ký Guest thành công bằng OTP test", technique="Equivalence Partitioning (OTP sai)")
def test_register_wrong_otp(driver, tc):
    email = h.unique_email("tc22otp_")
    tc.input(email=email, otp="000000")
    tc.step("Nhập thông tin hợp lệ, sang bước OTP")
    fill_register(driver, "Khách Selenium", email, h.DEFAULT_PASSWORD, h.DEFAULT_PASSWORD)
    tc.check(otp_step_shown(driver), "Chuyển sang bước nhập OTP", "Không thấy ô OTP")
    tc.step("Nhập OTP sai 000000 và xác nhận")
    h.fill(driver, "otp", "000000")
    h.clear_toasts(driver)
    h.click_button(driver, "Xác nhận & Đăng Ký")
    msg = h.toast(driver)
    tc.shot("otp_sai")
    tc.check("không chính xác" in msg.lower(), "Báo 'Mã OTP không chính xác!'", msg or "Không có thông báo")
    status, _ = h.api("POST", "/Auth/login", {"email": email, "password": h.DEFAULT_PASSWORD})
    tc.check(status != 200, "Không tạo tài khoản khi OTP sai", f"Đăng nhập HTTP {status}")


# ---------------------------------------------------------------- TC2.3

@pytest.mark.tc("TC2.3", "Từ chối đăng ký trùng email", technique="Equivalence Partitioning (email đã tồn tại)")
def test_register_duplicate_email(driver, tc):
    tc.step("Chuẩn bị: tạo sẵn một Guest qua API")
    existing = h.register_guest_api("Khách Đã Có")
    tc.input(email=existing["email"], otp=h.TEST_OTP)
    tc.step("Đăng ký lại bằng chính email đó")
    fill_register(driver, "Khách Trùng Email", existing["email"], h.DEFAULT_PASSWORD, h.DEFAULT_PASSWORD)
    at_otp = otp_step_shown(driver)
    tc.note(f"Hệ thống {'vẫn' if at_otp else 'không'} gửi OTP cho email đã tồn tại")
    if at_otp:
        h.fill(driver, "otp", h.TEST_OTP)
        h.clear_toasts(driver)
        h.click_button(driver, "Xác nhận & Đăng Ký")
    msg = h.toast(driver)
    tc.shot("trung_email")
    tc.check("tồn tại" in msg.lower(), "Báo 'Email đã tồn tại!'", msg or "Không có thông báo")
    tc.check("/register" in driver.current_url, "Ở lại trang đăng ký, không chuyển về /login", driver.current_url)


# ---------------------------------------------------------------- TC2.4

@pytest.mark.tc("TC2.4", "Đăng nhập tài khoản Guest hợp lệ", technique="Equivalence Partitioning (thông tin hợp lệ)")
def test_login_success(driver, tc, guest):
    tc.input(email=guest["email"], password=guest["password"])
    tc.step("Mở /login, nhập email và mật khẩu Guest hợp lệ, bấm 'Đăng nhập'")
    h.open_page(driver, "/login")
    h.fill(driver, "login_form_email", guest["email"])
    h.fill(driver, "login_form_password", guest["password"])
    h.click_button(driver, "Đăng nhập")
    tc.check(h.wait_url(driver, "/guest/dashboard"), "Chuyển tới /guest/dashboard", driver.current_url)
    h.wait_text(driver, guest["email"])
    text = h.page_text(driver)
    tc.shot("dashboard")
    tc.check(guest["email"] in text and "Lịch sử đặt phòng" in text, "Menu Guest hiển thị kèm email người dùng", text[:150])
    token = driver.execute_script("return localStorage.getItem('token');")
    tc.check(bool(token) and "Guest" in jwt_roles(token), "Phiên đăng nhập (JWT vai trò Guest) được lưu", "Có token Guest" if token else "Không có token")


# ---------------------------------------------------------------- TC2.5

LOGIN_CASES = [
    ("EP_sai_mat_khau", "{email}", "SaiMatKhau1", "toast", "không đúng"),
    ("EP_email_chua_dang_ky", "khongtontai@hotel.com", "Test@123", "toast", "không đúng"),
    ("EP_email_sai_dinh_dang", "khach.hotel.com", "Test@123", "form", "Email không đúng định dạng!"),
    ("EP_bo_trong", "", "", "form", "Vui lòng nhập email!"),
]


@pytest.mark.tc("TC2.5", "Từ chối đăng nhập Guest sai mật khẩu", technique="Equivalence Partitioning (lớp không hợp lệ)")
@pytest.mark.parametrize("case, email, password, kind, expected", LOGIN_CASES, ids=[c[0] for c in LOGIN_CASES])
def test_login_rejected(driver, tc, guest, case, email, password, kind, expected):
    email = email.replace("{email}", guest["email"])
    tc.input(email=email, password=password)
    tc.step("Mở /login, nhập thông tin và bấm 'Đăng nhập'")
    h.open_page(driver, "/login")
    driver.execute_script("localStorage.clear();")
    if email:
        h.fill(driver, "login_form_email", email)
    if password:
        h.fill(driver, "login_form_password", password)
    h.click_button(driver, "Đăng nhập")
    got = h.toast(driver) if kind == "toast" else " | ".join(h.form_errors(driver))
    tc.shot("tu_choi")
    bug = Bug("Đăng nhập sai không hiện thông báo lỗi: interceptor 401 của axios tải lại trang /login nên thông báo bị mất",
              "Major", "Đăng nhập") if kind == "toast" else None
    tc.check(expected.lower() in got.lower(), f"Hiển thị lỗi chứa '{expected}'", got or "Không có thông báo nào, trang /login bị tải lại", bug=bug)
    token = driver.execute_script("return localStorage.getItem('token');")
    tc.check("/login" in driver.current_url and not token, "Ở lại /login và không tạo phiên", f"URL={driver.current_url}, token={'có' if token else 'không'}")


# ---------------------------------------------------------------- TC2.7

@pytest.mark.tc("TC2.7", "Đăng xuất Guest và chặn trang cần phiên", technique="State transition (đã đăng nhập -> đã đăng xuất)")
def test_logout(driver, tc, guest_session):
    tc.step("Mở /guest/dashboard khi đang đăng nhập")
    h.open_page(driver, "/guest/dashboard")
    h.wait_text(driver, "Đăng xuất")
    tc.step("Bấm 'Đăng xuất'")
    h.click_button(driver, "Đăng xuất")
    tc.check(h.wait_url(driver, "/login"), "Chuyển về /login", driver.current_url)
    left = driver.execute_script(
        "return Object.keys(localStorage).filter(k => ['token','user','userId','userName','userEmail'].includes(k));")
    tc.note(f"Khóa còn lại trong localStorage: {left}")
    tc.check("token" not in left, "Token đăng nhập bị xóa", f"Còn: {left}")
    tc.step("Truy cập trực tiếp /guest/book-room sau khi đăng xuất")
    h.open_page(driver, "/guest/book-room")
    tc.check(h.wait_url(driver, "/login"), "Bị chuyển về /login, không xem được trang đặt phòng", driver.current_url)
    tc.shot("sau_dang_xuat")
    tc.check(not left or left == ["token"], "Thông tin cá nhân (user, userEmail, userName, userId) cũng bị xóa khỏi trình duyệt",
             f"Vẫn lưu {left}",
             bug=Bug("Đăng xuất chỉ xóa token, thông tin cá nhân Guest (email, họ tên, id) vẫn lưu trong localStorage", "Minor", "Tài khoản"))
