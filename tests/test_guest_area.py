"""TS4 - Khu vực cá nhân Guest (TC4.1, TC4.2, TC4.3, TC4.5)."""

import re
from datetime import date
from pathlib import Path

import pytest
from selenium.webdriver.common.by import By

from conftest import Bug
from tests import helpers as h

AVATAR = Path(__file__).parent / "data" / "avatar.png"


def stat(driver, label):
    m = re.search(re.escape(label) + r" (\d+)", h.page_text(driver))
    return int(m.group(1)) if m else None


def open_edit_profile(driver, tc):
    tc.step("Mở /guest/profile và bấm 'Chỉnh sửa hồ sơ'")
    h.open_page(driver, "/guest/profile")
    h.click_button(driver, "Chỉnh sửa hồ sơ")
    h.modal(driver)
    h.visible(driver, ".ant-modal #fullName")


# ---------------------------------------------------------------- TC4.1

@pytest.mark.tc("TC4.1", "Dashboard và hạng thành viên Guest", technique="Equivalence Partitioning (Guest mới / Guest có booking)")
def test_dashboard_and_rank(driver, tc, guest_session):
    tc.step("Mở /guest/dashboard với Guest mới (chưa có booking)")
    h.open_page(driver, "/guest/dashboard")
    h.wait_text(driver, "Lượt đặt phòng")
    before = stat(driver, "Lượt đặt phòng")
    text = h.page_text(driver)
    tc.shot("dashboard_moi")
    tc.check(before == 0 and stat(driver, "Điểm tích lũy") == 0 and "Khách Mới" in text,
             "Guest mới: 0 lượt đặt, 0 điểm, hạng 'Khách Mới'", f"lượt={before}, điểm={stat(driver, 'Điểm tích lũy')}")
    tc.step("Chuẩn bị: Guest tạo 1 booking qua API, tải lại dashboard")
    booking = h.create_booking_api(guest_session, "Phòng cao cấp hướng phố", h.future(110))
    tc.input(ma_don=booking["code"])
    h.open_page(driver, "/guest/dashboard")
    h.wait(driver).until(lambda d: stat(d, "Lượt đặt phòng") == 1)
    tc.shot("dashboard_co_booking")
    tc.check(stat(driver, "Lượt đặt phòng") == 1, "Lượt đặt phòng tăng thành 1", stat(driver, "Lượt đặt phòng"))
    upcoming = h.page_text(driver).split("Đặt phòng sắp tới", 1)[-1].strip()
    tc.check(booking["code"] in upcoming, f"Mục 'Đặt phòng sắp tới' hiện mã đơn {booking['code']}", upcoming[:150])
    tc.step("Mở /guest/rank")
    h.open_page(driver, "/guest/rank")
    h.wait_text(driver, "Hệ thống Hạng thành viên")
    text = h.page_text(driver)
    tc.shot("hang_thanh_vien")
    tc.check("Khách Mới Hạng hiện tại" in text and "0%" in text, "Hạng hiện tại 'Khách Mới', tiến trình 0%", text[:160])
    tc.check("cần thêm 500 điểm" in text and "Đồng" in text, "Hiện mốc kế tiếp: cần thêm 500 điểm để lên hạng Đồng", text[:220])
    tc.check("Phòng cao cấp hướng phố" in upcoming, "Mục 'Đặt phòng sắp tới' ghi đúng tên loại phòng 'Phòng cao cấp hướng phố'", upcoming[:150],
             bug=Bug("Dashboard ghi tên phòng cố định 'Phòng nghỉ cao cấp' thay vì tên loại phòng đã đặt", "Trivial", "Dashboard"))


# ---------------------------------------------------------------- TC4.2

@pytest.mark.tc("TC4.2", "Xem QR và gửi yêu cầu xác nhận thanh toán", technique="State transition (Chưa thanh toán -> Đang xử lý)")
def test_invoice_qr_payment(driver, tc, guest_session):
    tc.step("Chuẩn bị: Guest tạo booking 2 đêm qua API")
    booking = h.create_booking_api(guest_session, "Phòng cao cấp hướng phố", h.future(115), 2)
    total = f"{int(booking['total']):,}".replace(",", ".")
    tc.input(ma_don=booking["code"], tong_tien=total)
    tc.step("Mở /guest/invoices")
    h.open_page(driver, "/guest/invoices")
    h.wait_text(driver, booking["code"])
    tc.check(total in h.page_text(driver), f"Hóa đơn hiện mã đơn và tổng tiền {total}", h.page_text(driver)[:250])
    tc.step("Bấm 'Thanh toán'")
    h.click_button(driver, "Thanh toán")
    popup = h.modal(driver)
    h.wait(driver).until(lambda d: booking["code"] in h.modal(d).text)
    text = " ".join(h.modal(driver).text.split())
    qr = popup.find_element(By.CSS_SELECTOR, "img[alt='VietQR']").get_attribute("src")
    tc.note(f"Ảnh QR: {qr}")
    tc.shot("ma_qr")
    tc.check(booking["code"] in text and total in text, "Cửa sổ VietQR hiện đúng mã đơn và số tiền", text[:250])
    tc.check(f"amount={int(booking['total'])}" in qr, "Mã QR chứa đúng số tiền thanh toán", qr)
    h.clear_toasts(driver)
    tc.step("Bấm 'Xác nhận đã chuyển khoản'")
    h.click_button(driver, "Xác nhận đã chuyển khoản")
    msg = h.toast(driver)
    tc.check("đã gửi yêu cầu" in msg.lower(), "Thông báo đã gửi yêu cầu xác nhận thanh toán", msg)
    tc.step("Tải lại /guest/invoices")
    h.open_page(driver, "/guest/invoices")
    h.wait_text(driver, booking["code"])
    buttons = [b.text for b in driver.find_elements(By.TAG_NAME, "button") if b.is_displayed()]
    processing = next((b for b in driver.find_elements(By.TAG_NAME, "button") if b.text.strip() == "Đang xử lý"), None)
    tc.shot("dang_xu_ly")
    tc.check(processing is not None and not processing.is_enabled() and "Thanh toán" not in buttons,
             "Đơn chuyển sang 'Đang xử lý' (nút bị khóa), không cho gửi lại yêu cầu", buttons)


@pytest.mark.tc("TC4.2", "Xem QR và gửi yêu cầu xác nhận thanh toán", technique="Equivalence Partitioning (đơn có voucher)")
def test_invoice_amount_with_voucher(driver, tc, guest_session):
    tc.step("Chuẩn bị: Guest đặt phòng 2 đêm có áp dụng voucher KM1 (giảm 10%) qua API")
    vid = h.voucher_id("KM1")
    booking = h.create_booking_api(guest_session, "Phòng cao cấp hướng phố", h.future(120), 2, voucher_id=vid,
                                   deposit=1_260_000 * 0.3)
    expected = f"{int(booking['total'] * 0.9):,}".replace(",", ".")
    tc.input(ma_don=booking["code"], voucher="KM1", gia_goc=int(booking["total"]), tong_sau_giam=expected)
    tc.step("Mở /guest/invoices")
    h.open_page(driver, "/guest/invoices")
    h.wait_text(driver, booking["code"])
    m = re.search(r"Mã đặt phòng: " + re.escape(booking["code"]) + r" Tổng tiền: ([\d.]+)", h.page_text(driver))
    shown = m.group(1) if m else h.page_text(driver)[:200]
    tc.shot("hoa_don_voucher")
    tc.check(shown == expected, f"Tổng tiền hóa đơn đã trừ voucher: {expected}đ", f"{shown}đ",
             bug=Bug("Hóa đơn/QR thanh toán tính theo giá gốc, bỏ qua giảm giá voucher đã áp dụng khi đặt phòng", "Major", "Hóa đơn"))


# ---------------------------------------------------------------- TC4.3

@pytest.mark.tc("TC4.3", "Cập nhật hồ sơ và ảnh đại diện", technique="Equivalence Partitioning (dữ liệu hợp lệ)")
def test_update_profile(driver, tc, guest_session):
    data = {"fullName": "Nguyễn Selenium Test", "phone": "0912345678", "address": "Hải Châu, Đà Nẵng", "dob": date(1999, 5, 20)}
    tc.input(**data)
    open_edit_profile(driver, tc)
    tc.step("Sửa họ tên, số điện thoại, ngày sinh, địa chỉ và bấm 'Lưu thay đổi'")
    h.fill(driver, "fullName", data["fullName"])
    h.fill(driver, "phone", data["phone"])
    h.pick_date(driver, "dateOfBirth", data["dob"])
    h.fill(driver, "address", data["address"])
    h.clear_toasts(driver)
    h.click_button(driver, "Lưu thay đổi")
    msg = h.toast(driver)
    tc.check("thành công" in msg.lower(), "Thông báo cập nhật thông tin thành công", msg)
    tc.step("Tải lại /guest/profile")
    h.open_page(driver, "/guest/profile")
    h.wait_text(driver, data["fullName"])
    text = h.page_text(driver)
    tc.shot("ho_so_sau_cap_nhat")
    tc.check(all(v in text for v in (data["fullName"], data["phone"], data["address"])),
             "Họ tên, số điện thoại, địa chỉ mới hiển thị sau khi tải lại", text[:300])
    dob = data["dob"].strftime("%d/%m/%Y")
    m = re.search(r"Ngày sinh:? (\d{2}/\d{2}/\d{4})", text)
    tc.check(dob in text, f"Ngày sinh hiển thị đúng {dob}", m.group(1) if m else text[:300],
             bug=Bug("Ngày sinh lưu bị lùi 1 ngày (gửi toISOString theo UTC, lệch múi giờ +7)", "Major", "Hồ sơ cá nhân"))


@pytest.mark.tc("TC4.3", "Cập nhật hồ sơ và ảnh đại diện", technique="Equivalence Partitioning (dữ liệu không hợp lệ)")
@pytest.mark.parametrize("case, field, value, expected", [
    ("EP_ho_ten_trong", "fullName", "", "Vui lòng nhập họ tên!"),
    ("EP_so_dien_thoai_chu", "phone", "abcxyz", "số điện thoại"),
], ids=["EP_ho_ten_trong", "EP_so_dien_thoai_chu"])
def test_update_profile_invalid(driver, tc, guest_session, case, field, value, expected):
    tc.input(**{field: value or "(trống)"})
    open_edit_profile(driver, tc)
    tc.step(f"Nhập {field} = '{value}' và bấm 'Lưu thay đổi'")
    h.fill(driver, field, value)
    h.clear_toasts(driver)
    h.click_button(driver, "Lưu thay đổi")
    errors = h.form_errors(driver, 4)
    msg = h.toast(driver, 3)
    tc.shot("du_lieu_sai")
    bug = None if field == "fullName" else Bug("Hồ sơ chấp nhận số điện thoại chứa chữ cái (không kiểm tra định dạng)", "Minor", "Hồ sơ cá nhân")
    tc.check(any(expected.lower() in e.lower() for e in errors) and "thành công" not in msg.lower(),
             f"Báo lỗi '{expected}' và không lưu", f"Lỗi form={errors}, thông báo={msg}", bug=bug)


@pytest.mark.tc("TC4.3", "Cập nhật hồ sơ và ảnh đại diện", technique="Equivalence Partitioning (ảnh PNG hợp lệ)")
def test_upload_avatar(driver, tc, guest_session):
    tc.input(file=AVATAR.name)
    open_edit_profile(driver, tc)
    old = driver.execute_script("return [...document.querySelectorAll('.ant-modal img, .ant-modal .ant-avatar img')].map(i => i.src);")
    tc.step("Chọn file ảnh avatar.png ở 'Thay đổi ảnh đại diện'")
    h.clear_toasts(driver)
    driver.find_element(By.CSS_SELECTOR, ".ant-modal input[type=file]").send_keys(str(AVATAR.resolve()))
    msg = h.toast(driver, 30)
    tc.shot("tai_anh")
    tc.check("thành công" in msg.lower(), "Thông báo 'Cập nhật ảnh đại diện thành công!'", msg or "Không có thông báo")
    tc.step("Tải lại hồ sơ và kiểm tra ảnh đại diện")
    h.open_page(driver, "/guest/profile")
    h.wait_text(driver, guest_session["email"])
    srcs = driver.execute_script("return [...document.querySelectorAll('img')].map(i => i.src);")
    tc.check(any("cloudinary" in s for s in srcs) and srcs != old, "Ảnh đại diện mới (Cloudinary) hiển thị sau khi tải lại",
             [s for s in srcs if "cloudinary" in s or "pravatar" in s][:3])


# ---------------------------------------------------------------- TC4.5

@pytest.mark.tc("TC4.5", "Đọc thông báo trong hộp thư Guest", technique="State transition (thư Mới -> Đã đọc)")
def test_read_mailbox(driver, tc, guest_session):
    today = date.today()
    tc.input(ngay_sinh=today.strftime("%d/%m/%Y"))
    open_edit_profile(driver, tc)
    tc.step("Đặt ngày sinh là hôm nay và lưu để hệ thống gửi thư sinh nhật")
    h.pick_date(driver, "dateOfBirth", today)
    h.clear_toasts(driver)
    h.click_button(driver, "Lưu thay đổi")
    tc.note(f"Thông báo: {h.toast(driver)}")
    tc.step("Mở /guest/profile?tab=mailbox")
    h.open_page(driver, "/guest/profile?tab=mailbox")
    h.wait(driver).until(lambda d: "Đọc thư" in h.page_text(d) or "đang trống" in h.page_text(d))
    text = h.page_text(driver)
    tc.shot("hop_thu")
    tc.check("Đọc thư" in text, "Hộp thư có thư chúc mừng sinh nhật (chưa đọc, nhãn 'Mới')",
             "Hộp thư trống" if "đang trống" in text else text[-200:],
             bug=Bug("Không nhận thư/voucher sinh nhật khi đặt ngày sinh là hôm nay (ngày sinh lưu lệch múi giờ)", "Major", "Hộp thư"))
    badge = driver.execute_script("const b=document.querySelector('.ant-tabs .ant-badge sup'); return b ? b.innerText : '0';")
    tc.check("Mới" in text and badge.strip() not in ("", "0"), "Thư hiện nhãn 'Mới' và số chưa đọc > 0", f"badge={badge}")
    tc.step("Bấm 'Đọc thư'")
    h.click_button(driver, "Đọc thư")
    body = " ".join(h.modal(driver).text.split())
    code = re.search(r"HPBD-\d{4}-\d+-\d{4}", body)
    tc.shot("noi_dung_thu")
    tc.check("sinh nhật" in body.lower() and code, "Nội dung thư sinh nhật kèm mã voucher HPBD-...", body[:200])
    tc.step("Bấm 'Đóng thư' và tải lại hộp thư")
    h.click_button(driver, "Đóng thư")
    h.open_page(driver, "/guest/profile?tab=mailbox")
    h.wait_text(driver, "Đọc thư")
    badge = driver.execute_script("const b=document.querySelector('.ant-tabs .ant-badge sup'); return b ? b.innerText : '0';")
    tc.shot("sau_khi_doc")
    tc.check("Mới" not in h.page_text(driver) and badge.strip() in ("", "0"), "Thư được đánh dấu đã đọc, số chưa đọc về 0",
             f"badge={badge}, còn nhãn Mới={'Mới' in h.page_text(driver)}")
