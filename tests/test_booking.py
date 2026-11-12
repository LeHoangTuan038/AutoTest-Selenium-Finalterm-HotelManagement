"""TS3 - Tìm phòng và đặt phòng (TC3.1 - TC3.6)."""

import re
from datetime import date, timedelta

import pytest
from selenium.webdriver.common.by import By

from conftest import Bug
from tests import helpers as h

# Mỗi test dùng một khoảng ngày riêng để các booking Pending/Confirmed không ảnh hưởng nhau.
BASE_DAY = 60


def open_booking(driver):
    h.open_page(driver, "/guest/book-room")
    h.visible(driver, "#guestName")


def search(driver, tc, check_in, check_out, adults=None, room_type=None):
    tc.input(nhan_phong=check_in.strftime("%d/%m/%Y"), tra_phong=check_out.strftime("%d/%m/%Y"),
             nguoi_lon=adults if adults is not None else "(mặc định 2)", loai_phong=room_type or "Tất cả")
    tc.step("Chọn ngày nhận/trả phòng" + (f", số người lớn = {adults}" if adults is not None else "")
            + (f", loại phòng '{room_type}'" if room_type else ""))
    h.pick_range(driver, check_in, check_out)
    if adults is not None:
        shown = h.set_number(driver, "adults", adults)
        tc.note(f"Ô người lớn hiển thị giá trị: {shown}")
    if room_type:
        h.select_option(driver, "roomType", room_type)
    h.clear_toasts(driver)
    tc.step("Bấm 'Kiểm tra phòng trống'")
    h.click_button(driver, "Kiểm tra phòng trống")
    msg = h.toast(driver)
    tc.note(f"Thông báo: {msg}")
    return msg


def results(driver):
    """[(tên loại phòng, sức chứa NL, giá/đêm, số phòng còn)] từ danh sách kết quả."""
    out = []
    for item in h.all_visible(driver, ".ant-list-item"):
        text = item.text
        cap = re.search(r"Tối đa (\d+) NL", text)
        price = re.search(r"([\d.]+)đ / đêm", text)
        left = re.search(r"Còn (\d+) phòng trống", text)
        out.append((text.split("\n")[0].strip(), int(cap.group(1)) if cap else 0,
                    h.money(price.group(1)) if price else 0, int(left.group(1)) if left else 0))
    return out


def open_receipt(driver, tc, room_type):
    tc.step(f"Bấm 'Đặt ngay' cho '{room_type}' để mở biên lai")
    item = next(i for i in h.all_visible(driver, ".ant-list-item") if i.text.startswith(room_type))
    btn = next(b for b in item.find_elements(By.TAG_NAME, "button") if "Đặt ngay" in b.text)
    driver.execute_script("arguments[0].scrollIntoView({block:'center'}); arguments[0].click();", btn)
    return h.modal(driver)


def receipt_amounts(driver):
    text = " ".join(h.modal(driver).text.split())
    def grab(label):
        m = re.search(re.escape(label) + r"[^:]*:\s*-?([\d.]+)đ", text)
        return h.money(m.group(1)) if m else None
    return {"goc": grab("Giá gốc phòng"), "giam": grab("Giảm giá phòng"),
            "tong": grab("Tổng tiền phòng sau giảm"), "coc": grab("Số tiền cần đặt cọc (30%)")}


def apply_voucher(driver, tc, code):
    tc.input(voucher=code or "(trống)")
    tc.step(f"Nhập mã voucher '{code}' và bấm 'Áp dụng'")
    box = h.modal(driver).find_element(By.CSS_SELECTOR, "input[placeholder='Nhập mã voucher...']")
    box.clear()
    if code:
        box.send_keys(code)
    h.clear_toasts(driver)
    h.click_button(driver, "Áp dụng", within=".ant-modal")
    return h.toast(driver)


# ---------------------------------------------------------------- TC3.1

SEARCH_CASES = [
    ("EP_2_nguoi_lon", 2, None),
    ("BVA_1_nguoi_lon_min", 1, None),
    ("BVA_6_nguoi_lon_suc_chua_lon_nhat", 6, None),
    ("EP_loc_loai_phong", 2, "Phòng cao cấp hướng phố"),
]


@pytest.mark.tc("TC3.1", "Tìm phòng trống theo ngày và số người lớn", technique="Equivalence Partitioning + Boundary Value (số người lớn)")
@pytest.mark.parametrize("case, adults, room_type", SEARCH_CASES, ids=[c[0] for c in SEARCH_CASES])
def test_search_available(driver, tc, guest_session, case, adults, room_type):
    check_in, check_out = h.future(BASE_DAY), h.future(BASE_DAY + 2)
    expected = {t["roomTypeName"] for t in h.available_rooms(check_in, check_out, adults)
                if not room_type or t["roomTypeName"] == room_type}
    tc.step("Mở /guest/book-room")
    open_booking(driver)
    msg = search(driver, tc, check_in, check_out, adults, room_type)
    got = results(driver)
    tc.shot("ket_qua")
    tc.check("tìm thấy" in msg.lower() and got, "Thông báo tìm thấy phòng và hiển thị danh sách kết quả", msg or "Không có kết quả")
    tc.check(all(r[1] >= adults for r in got), f"Mọi loại phòng có sức chứa >= {adults} người lớn", [(r[0], r[1]) for r in got])
    tc.check(all(r[2] > 0 and r[3] > 0 for r in got), "Mỗi kết quả có giá/đêm và số phòng còn trống", [(r[0], r[2], r[3]) for r in got])
    tc.check({r[0] for r in got} == expected, f"Kết quả khớp API available-rooms: {sorted(expected)}", sorted(r[0] for r in got))


DATE_CASES = [
    ("BVA_ngay_nhan_trong_qua_khu", -1, 1),
    ("BVA_ngay_tra_bang_ngay_nhan", BASE_DAY + 5, BASE_DAY + 5),
]


@pytest.mark.tc("TC3.1", "Tìm phòng trống theo ngày và số người lớn", technique="Boundary Value Analysis (ngày nhận/trả)")
@pytest.mark.parametrize("case, start, end", DATE_CASES, ids=[c[0] for c in DATE_CASES])
def test_search_invalid_dates(driver, tc, guest_session, case, start, end):
    check_in, check_out = date.today() + timedelta(days=start), date.today() + timedelta(days=end)
    tc.step("Mở /guest/book-room")
    open_booking(driver)
    msg = search(driver, tc, check_in, check_out, 2)
    got = results(driver)
    tc.shot("ngay_khong_hop_le")
    reason = "ngày nhận phòng ở quá khứ" if start < 0 else "số đêm = 0 (ngày trả = ngày nhận)"
    tc.check(not got, f"Hệ thống từ chối tìm phòng khi {reason} và báo lỗi ngày", f"Vẫn trả {len(got)} loại phòng; thông báo: {msg}",
             bug=Bug(f"Tìm/đặt phòng chấp nhận {reason} (không kiểm tra ngày ở Frontend và Backend)", "Major", "Đặt phòng"))


# ---------------------------------------------------------------- TC3.2

EMPTY_CASES = [
    ("BVA_7_nguoi_lon_tren_suc_chua", 7, 7),
    ("BVA_10_nguoi_lon_max_o_nhap", 10, 10),
    ("BVA_11_nguoi_lon_vuot_max_o_nhap", 11, 10),
]


@pytest.mark.tc("TC3.2", "Hiển thị rỗng khi không có phòng phù hợp", technique="Boundary Value Analysis")
@pytest.mark.parametrize("case, adults, shown", EMPTY_CASES, ids=[c[0] for c in EMPTY_CASES])
def test_search_no_rooms(driver, tc, guest_session, case, adults, shown):
    tc.step("Mở /guest/book-room")
    open_booking(driver)
    msg = search(driver, tc, h.future(BASE_DAY), h.future(BASE_DAY + 1), adults)
    value = driver.find_element(By.ID, "adults").get_attribute("value")
    tc.check(value == str(shown), f"Ô người lớn nhận giá trị {shown} (giới hạn 1-10)", value)
    h.wait_text(driver, "Không tìm thấy phòng phù hợp", 8)
    tc.shot("ket_qua_rong")
    tc.check(not results(driver) and "Không tìm thấy phòng phù hợp" in h.page_text(driver),
             "Không có thẻ phòng, hiển thị 'Không tìm thấy phòng phù hợp với tiêu chí của bạn.'", f"{len(results(driver))} kết quả")
    tc.check("không có phòng trống" in msg.lower(), "Cảnh báo 'Không có phòng trống phù hợp với yêu cầu của bạn.'", msg)


# ---------------------------------------------------------------- TC3.3

VOUCHER_OK = [
    ("EP_KM1_giam_10_phan_tram", "KM1", "Phòng cao cấp hướng phố", 2, 140_000),
    ("EP_KM6_giam_co_dinh_50k", "KM6", "Phòng cao cấp hướng phố", 2, 50_000),
    ("BVA_KM4_tong_bang_gia_tri_toi_thieu", "KM4", "Phòng Suite cho gia đình", 1, 200_000),
]


@pytest.mark.tc("TC3.3", "Áp dụng voucher và tính tiền cọc", technique="Equivalence Partitioning + Boundary Value (giá trị đơn tối thiểu)")
@pytest.mark.parametrize("case, code, room_type, nights, discount", VOUCHER_OK, ids=[c[0] for c in VOUCHER_OK])
def test_apply_voucher(driver, tc, guest_session, case, code, room_type, nights, discount):
    start = h.future(BASE_DAY + 10)
    tc.step("Mở /guest/book-room")
    open_booking(driver)
    search(driver, tc, start, start + timedelta(days=nights), 1, room_type)
    open_receipt(driver, tc, room_type)
    before = receipt_amounts(driver)
    tc.note(f"Biên lai trước khi áp dụng: {before}")
    tc.check(before["coc"] == round(before["goc"] * 0.3), "Tiền cọc ban đầu = 30% giá gốc", before)
    msg = apply_voucher(driver, tc, code)
    after = receipt_amounts(driver)
    tc.shot("da_ap_dung")
    total = before["goc"] - discount
    tc.check("thành công" in msg.lower(), f"Thông báo áp dụng mã {code} thành công", msg)
    tc.check(after["giam"] == discount and after["tong"] == total, f"Giảm {discount:,}đ, tổng sau giảm {total:,}đ", after)
    tc.check(after["coc"] == round(total * 0.3), f"Tiền cọc = 30% tổng sau giảm = {round(total * 0.3):,}đ", after["coc"])
    tc.step("Bấm 'Hủy áp dụng'")
    h.click_button(driver, "Hủy áp dụng", within=".ant-modal")
    reset = receipt_amounts(driver)
    tc.check(reset["tong"] == before["goc"] and reset["coc"] == before["coc"], "Giá và tiền cọc trở về mức ban đầu", reset)


# ---------------------------------------------------------------- TC3.4

VOUCHER_BAD = [
    ("EP_ma_khong_ton_tai", "KHONGTONTAI", "Phòng cao cấp hướng phố", "không tồn tại"),
    ("EP_ma_het_han", "SELENIUMEXPIRED", "Phòng cao cấp hướng phố", "quá hạn"),
    ("BVA_duoi_gia_tri_toi_thieu", "KM4", "Phòng Premium tiện nghi cao cấp", "chỉ áp dụng cho đơn"),
    ("EP_ma_trong", "", "Phòng cao cấp hướng phố", "Vui lòng nhập mã giảm giá"),
]


@pytest.mark.tc("TC3.4", "Từ chối voucher sai hoặc hết hạn", technique="Equivalence Partitioning (lớp không hợp lệ) + Boundary Value")
@pytest.mark.parametrize("case, code, room_type, expected", VOUCHER_BAD, ids=[c[0] for c in VOUCHER_BAD])
def test_reject_voucher(driver, tc, guest_session, case, code, room_type, expected):
    start = h.future(BASE_DAY + 15)
    tc.step("Mở /guest/book-room")
    open_booking(driver)
    search(driver, tc, start, start + timedelta(days=1), 1, room_type)
    open_receipt(driver, tc, room_type)
    before = receipt_amounts(driver)
    msg = apply_voucher(driver, tc, code)
    after = receipt_amounts(driver)
    tc.shot("tu_choi_voucher")
    tc.check(expected.lower() in msg.lower(), f"Báo lỗi chứa '{expected}'", msg or "Không có thông báo")
    applied = "Đã áp dụng mã" in h.modal(driver).text
    tc.check(not applied and after == before, "Voucher không được áp dụng, tổng tiền và tiền cọc giữ nguyên",
             f"Đã áp dụng={applied}, trước={before}, sau={after}")


# ---------------------------------------------------------------- TC3.5

@pytest.mark.tc("TC3.5", "Tạo đặt phòng Guest thành công", technique="Equivalence Partitioning (luồng hợp lệ)")
def test_create_booking(driver, tc, guest_session):
    room_type, start = "Phòng Deluxe hướng biển", h.future(BASE_DAY + 20)
    tc.step("Mở /guest/book-room")
    open_booking(driver)
    search(driver, tc, start, start + timedelta(days=1), 2, room_type)
    open_receipt(driver, tc, room_type)
    amounts = receipt_amounts(driver)
    tc.shot("bien_lai")
    h.clear_toasts(driver)
    tc.step("Bấm 'Xác nhận đã chuyển khoản & Đặt phòng'")
    h.click_button(driver, "Xác nhận đã chuyển khoản & Đặt phòng")
    msg = h.toast(driver)
    tc.check("thành công" in msg.lower(), f"Thông báo 'Đặt phòng {room_type} thành công!'", msg or "Không có thông báo")
    tc.check(h.wait_url(driver, "/guest/bookings"), "Chuyển tới /guest/bookings", driver.current_url)
    h.wait_text(driver, "Mã đơn")
    text = h.page_text(driver)
    codes = re.findall(r"BK-\d{8}-\d{4}", text)
    tc.shot("lich_su")
    tc.check(len(codes) == 1 and "Chờ xác nhận" in text, "Có đúng 1 mã đơn mới, trạng thái 'Chờ xác nhận'", f"Mã: {codes}, có 'Chờ xác nhận'={'Chờ xác nhận' in text}")
    booking = h.find_booking(codes[0])
    tc.input(ma_don=codes[0])
    tc.check(booking and booking["status"] == "Pending" and booking["guestEmail"] == guest_session["email"],
             "Booking lưu ở Backend: trạng thái Pending, đúng email Guest", booking)
    tc.check(booking and int(booking["totalAmount"]) == amounts["goc"], f"Tổng tiền đơn = {amounts['goc']:,}đ như biên lai", booking and booking["totalAmount"])


# ---------------------------------------------------------------- TC3.6

@pytest.mark.tc("TC3.6", "Xem lịch sử và chi tiết booking Guest", technique="Equivalence Partitioning")
def test_booking_history_detail(driver, tc, guest_session):
    tc.step("Chuẩn bị: tạo 1 booking cho Guest qua API")
    booking = h.create_booking_api(guest_session, "Phòng cao cấp hướng phố", h.future(BASE_DAY + 25), 2)
    tc.input(ma_don=booking["code"])
    tc.step("Mở /guest/bookings")
    h.open_page(driver, "/guest/bookings")
    h.wait_text(driver, booking["code"])
    tc.check(booking["code"] in h.page_text(driver), f"Danh sách có mã đơn {booking['code']}", h.page_text(driver)[:200])
    tc.step("Bấm 'Xem chi tiết'")
    h.click_button(driver, "Xem chi tiết")
    popup = h.modal(driver)
    h.wait(driver).until(lambda d: booking["code"] in h.modal(d).text)
    text = " ".join(h.modal(driver).text.split())
    tc.shot("chi_tiet_don")
    total = f"{int(booking['total']):,}".replace(",", ".")
    tc.check(booking["code"] in text and "Chờ xác nhận" in text and guest_session["fullName"] in text,
             "Chi tiết hiện đúng mã đơn, khách hàng và trạng thái 'Chờ xác nhận'", text[:300])
    shown = re.search(r"Tổng tiền (.+?) Danh sách", text)
    tc.check(total in text, f"Chi tiết hiện tổng tiền {total}đ", f"Tổng tiền: {shown.group(1) if shown else text[:200]}",
             bug=Bug("Chi tiết đơn đặt phòng hiển thị 'Tổng tiền NaN ₫'", "Major", "Lịch sử đặt phòng"))


@pytest.mark.tc("TC3.6", "Xem lịch sử và chi tiết booking Guest", technique="Equivalence Partitioning (Guest khác cùng họ tên)")
def test_booking_history_isolation(driver, tc, guest_session):
    tc.step("Chuẩn bị: Guest A (cùng họ tên 'Khách Selenium', email khác) tạo một booking qua API")
    other = h.register_guest_api(guest_session["fullName"], h.unique_email("guestA_"))
    other_login = h.login_api(other["email"], other["password"])
    other.update(id=other_login["user"]["id"], token=other_login["token"])
    booking = h.create_booking_api(other, "Phòng cao cấp hướng phố", h.future(BASE_DAY + 30))
    tc.input(guest_A=other["email"], guest_B=guest_session["email"], ma_don_A=booking["code"])
    tc.step("Guest B (chưa có booking nào) mở /guest/bookings")
    h.open_page(driver, "/guest/bookings")
    h.wait(driver).until(lambda d: "Mã đơn" in h.page_text(d) or "Chưa có phòng nào" in h.page_text(d))
    leaked = re.findall(r"BK-\d{8}-\d{4}", h.page_text(driver))
    tc.shot("lich_su_guest_B")
    tc.check(not leaked, "Guest B không thấy booking của Guest khác (danh sách rỗng)",
             f"Guest B thấy {len(leaked)} đơn của khách khác, gồm {booking['code']}" if booking["code"] in leaked else f"Thấy {leaked}",
             bug=Bug("Lịch sử đặt phòng lọc theo email HOẶC họ tên: Guest trùng họ tên xem được booking của người khác", "Critical", "Lịch sử đặt phòng"))

