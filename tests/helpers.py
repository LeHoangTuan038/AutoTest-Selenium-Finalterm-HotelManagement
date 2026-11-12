"""Thao tác dùng chung cho bộ kiểm thử QuanTriKhachSanN5 (Selenium + antd)."""

import json
import time
import urllib.error
import urllib.request
from datetime import date, timedelta

from selenium.common.exceptions import (
    StaleElementReferenceException,
    TimeoutException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

FRONTEND = "http://localhost:5173"
API = "http://localhost:5070/api"
TEST_OTP = "123456"
DEFAULT_PASSWORD = "Test@123"
WAIT = 15


# ---------------------------------------------------------------- API (chuẩn bị dữ liệu)

def api(method, path, body=None, token=None):
    """Gọi API Backend, trả về (status, json|text)."""
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            raw = res.read().decode("utf-8")
            status = res.status
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", "replace")
        status = err.code
    try:
        return status, json.loads(raw) if raw else None
    except ValueError:
        return status, raw


def unique_email(prefix="selenium"):
    return f"{prefix}{int(time.time() * 1000)}@hotel.com"


def register_guest_api(full_name, email=None, password=DEFAULT_PASSWORD):
    """Tạo tài khoản Guest qua API bằng OTP test 123456 (chỉ dùng cho bước chuẩn bị)."""
    email = email or unique_email()
    status, body = api("POST", "/Auth/send-otp", {"email": email})
    assert status == 200, f"Gửi OTP thất bại: {status} {body}"
    status, body = api(
        "POST",
        "/Auth/register",
        {"username": full_name, "email": email, "password": password, "otp": TEST_OTP},
    )
    assert status == 200, f"Đăng ký Guest thất bại: {status} {body}"
    return {"fullName": full_name, "email": email, "password": password}


def login_api(email, password):
    status, body = api("POST", "/Auth/login", {"email": email, "password": password})
    assert status == 200, f"Đăng nhập API thất bại: {status} {body}"
    return body


def available_rooms(check_in, check_out, adults=1, children=0):
    status, body = api("POST", "/Bookings/available-rooms", {
        "checkIn": check_in.strftime("%Y-%m-%dT14:00:00"),
        "checkOut": check_out.strftime("%Y-%m-%dT12:00:00"),
        "adults": adults, "children": children,
    })
    assert status == 200, f"Tìm phòng trống API lỗi {status}: {body}"
    return [t for t in body if t.get("availableRooms")]


def create_booking_api(account, room_type, check_in, nights=1, voucher_id=None, deposit=None):
    """Tạo booking giống payload của RoomBookingPage.jsx (bước chuẩn bị dữ liệu)."""
    check_out = check_in + timedelta(days=nights)
    types = {t["roomTypeName"]: t for t in available_rooms(check_in, check_out)}
    assert room_type in types, f"Không còn phòng '{room_type}' cho {check_in}"
    t = types[room_type]
    total = float(t["pricePerNight"]) * nights
    status, body = api("POST", "/Bookings/create", {
        "guestName": account["fullName"], "guestPhone": "0901234567", "guestEmail": account["email"],
        "checkIn": check_in.strftime("%Y-%m-%dT00:00:00"), "checkOut": check_out.strftime("%Y-%m-%dT00:00:00"),
        "selectedRoomIds": [t["availableRooms"][0]["id"]], "userId": account.get("id"),
        "depositAmount": deposit if deposit is not None else total * 0.3, "voucherId": voucher_id,
    }, token=account.get("token"))
    assert status == 200, f"Tạo booking API lỗi {status}: {body}"
    return {"code": body["bookingCode"], "room_type": room_type, "total": total, "check_in": check_in, "check_out": check_out}


def find_booking(code):
    _, rows = api("GET", "/Bookings")
    return next((b for b in rows if b["bookingCode"] == code), None)


def voucher_id(code):
    status, body = api("GET", f"/Vouchers/check/{code}")
    assert status == 200, f"Voucher {code} không dùng được: {body}"
    return body["id"]


def inject_session(driver, login_body):
    """Ghi phiên đăng nhập vào localStorage giống LoginPage.jsx."""
    user = login_body["user"]
    driver.get(FRONTEND + "/login")
    items = {
        "token": login_body["token"],
        "user": json.dumps(user, ensure_ascii=False),
        "userId": str(user["id"]),
        "userName": user.get("fullName", ""),
        "userEmail": user["email"],
        "userPoints": str(user.get("points") or 0),
        "userRank": user.get("rank") or "Khách Mới",
    }
    for key, value in items.items():
        driver.execute_script("localStorage.setItem(arguments[0], arguments[1]);", key, value)


# ---------------------------------------------------------------- Chờ và tìm phần tử

def wait(driver, timeout=WAIT):
    return WebDriverWait(driver, timeout, ignored_exceptions=[StaleElementReferenceException])


def open_page(driver, path):
    driver.get(FRONTEND + path)
    wait(driver).until(lambda d: d.execute_script("return document.readyState") == "complete")


def visible(driver, css, timeout=WAIT):
    return wait(driver, timeout).until(EC.visibility_of_element_located((By.CSS_SELECTOR, css)))


def all_visible(driver, css):
    return [e for e in driver.find_elements(By.CSS_SELECTOR, css) if e.is_displayed()]


_FIND_TEXT_JS = """
const [text, tag, exact] = arguments;
const norm = s => (s || '').replace(/\\s+/g, ' ').trim().toUpperCase();
const want = norm(text);
const vis = e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
let best = null;
for (const e of document.querySelectorAll(tag)) {
  if (!vis(e)) continue;
  const t = norm(e.innerText);
  if (exact ? t === want : t.includes(want)) {
    if (!best || best.contains(e)) best = e;   // phần tử sâu nhất chứa đúng chữ
  }
}
return best;
"""


def find_text(driver, text, tag="*", exact=True, timeout=WAIT):
    """Tìm phần tử hiển thị có innerText khớp (không phân biệt hoa thường)."""
    try:
        return wait(driver, timeout).until(
            lambda d: d.execute_script(_FIND_TEXT_JS, text, tag, exact)
        )
    except TimeoutException:
        raise AssertionError(f"Không tìm thấy phần tử có chữ '{text}' (tag={tag})")


def click_text(driver, text, tag="*", exact=True, timeout=WAIT):
    el = find_text(driver, text, tag, exact, timeout)
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    try:
        el.click()
    except Exception:
        driver.execute_script("arguments[0].click();", el)
    return el


def click_button(driver, text, timeout=WAIT, within=None):
    """Bấm nút antd theo chữ hiển thị."""
    scope = f"{within} " if within else ""
    def _find(d):
        for b in d.find_elements(By.CSS_SELECTOR, f"{scope}button"):
            if b.is_displayed() and b.is_enabled() and " ".join(b.text.split()).upper() == text.upper():
                return b
        return False
    try:
        btn = wait(driver, timeout).until(_find)
    except TimeoutException:
        raise AssertionError(f"Không tìm thấy nút '{text}'")
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
    try:
        btn.click()
    except Exception:
        driver.execute_script("arguments[0].click();", btn)
    return btn


def page_text(driver):
    return " ".join(driver.find_element(By.TAG_NAME, "body").text.split())


def wait_text(driver, text, timeout=WAIT):
    try:
        wait(driver, timeout).until(lambda d: text.upper() in page_text(d).upper())
        return True
    except TimeoutException:
        return False


def wait_url(driver, fragment, timeout=WAIT):
    try:
        wait(driver, timeout).until(lambda d: fragment in d.current_url)
        return True
    except TimeoutException:
        return False


# ---------------------------------------------------------------- antd

def focus(driver, el):
    """Cuộn phần tử ra giữa màn hình rồi bấm; nếu bị lớp khác che thì focus bằng JS."""
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    try:
        el.click()
    except Exception:
        driver.execute_script("arguments[0].focus();", el)


def fill(driver, element_id, value):
    el = visible(driver, f"#{element_id}")
    focus(driver, el)
    el.send_keys(Keys.CONTROL, "a")
    el.send_keys(Keys.DELETE)
    if value:
        el.send_keys(value)
    return el


def set_number(driver, element_id, value):
    """InputNumber của antd: xóa và gõ giá trị, rồi blur để commit."""
    el = fill(driver, element_id, str(value))
    el.send_keys(Keys.TAB)
    return el.get_attribute("value")


def form_errors(driver, timeout=5):
    try:
        wait(driver, timeout).until(lambda d: all_visible(d, ".ant-form-item-explain-error"))
    except TimeoutException:
        return []
    return [e.text.strip() for e in all_visible(driver, ".ant-form-item-explain-error") if e.text.strip()]


def toast(driver, timeout=10):
    """Chờ và trả về nội dung thông báo antd message mới nhất."""
    try:
        wait(driver, timeout).until(
            lambda d: [e for e in all_visible(d, ".ant-message-notice-content") if e.text.strip()]
        )
    except TimeoutException:
        return ""
    texts = [e.text.strip() for e in all_visible(driver, ".ant-message-notice-content") if e.text.strip()]
    return " | ".join(texts)


def clear_toasts(driver):
    driver.execute_script(
        "document.querySelectorAll('.ant-message-notice').forEach(e => e.remove());"
    )


def pick_range(driver, start, end, container_css="body"):
    """Nhập khoảng ngày cho RangePicker (format DD/MM/YYYY)."""
    inputs = [
        i for i in driver.find_elements(By.CSS_SELECTOR, f"{container_css} .ant-picker-range input")
        if i.is_displayed()
    ]
    assert len(inputs) >= 2, "Không thấy ô chọn khoảng ngày"
    for inp, value in zip(inputs[:2], (start, end)):
        focus(driver, inp)
        inp.send_keys(Keys.CONTROL, "a")
        inp.send_keys(value.strftime("%d/%m/%Y"))
        inp.send_keys(Keys.ENTER)
        time.sleep(0.3)
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    return [i.get_attribute("value") for i in inputs[:2]]


def pick_date(driver, element_id, value):
    el = visible(driver, f"#{element_id}")
    focus(driver, el)
    el.send_keys(Keys.CONTROL, "a")
    el.send_keys(value.strftime("%d/%m/%Y"))
    el.send_keys(Keys.TAB)  # Enter sẽ submit form chứa DatePicker
    time.sleep(0.3)
    return el.get_attribute("value")


def select_option(driver, element_id, label):
    sel = visible(driver, f"#{element_id}")
    driver.execute_script("arguments[0].closest('.ant-select').scrollIntoView({block:'center'});", sel)
    driver.execute_script("arguments[0].closest('.ant-select').querySelector('.ant-select-selector, .ant-select-content, input').dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));", sel)
    opt = wait(driver).until(
        lambda d: next(
            (o for o in d.find_elements(By.CSS_SELECTOR, ".ant-select-item-option")
             if o.is_displayed() and o.get_attribute("title") == label),
            False,
        )
    )
    opt.click()


def rate(driver, stars, scope_css="form"):
    """Chọn số sao trên antd Rate (bấm bằng JS để không bị header cố định che)."""
    items = [s for s in driver.find_elements(By.CSS_SELECTOR, f"{scope_css} .ant-rate-star") if s.is_displayed()]
    assert len(items) >= stars, "Không thấy thành phần chọn sao"
    target = items[stars - 1].find_element(By.CSS_SELECTOR, ":scope > div")
    driver.execute_script("arguments[0].scrollIntoView({block:'center'}); arguments[0].click();", target)


def modal(driver, timeout=WAIT):
    return wait(driver, timeout).until(
        lambda d: next((m for m in d.find_elements(By.CSS_SELECTOR, ".ant-modal") if m.is_displayed()), False)
    )


def future(days):
    return date.today() + timedelta(days=days)


def money(text):
    """'1.234.000đ' -> 1234000"""
    digits = "".join(ch for ch in text if ch.isdigit())
    return int(digits) if digits else 0
