"""TS1 - Website công khai (TC1.1 - TC1.5)."""

import re

import pytest
from selenium.webdriver.common.by import By

from conftest import Bug
from tests import helpers as h

ROOM_CARD_JS = """
return [...document.querySelectorAll('button')].filter(b => b.innerText.trim().toUpperCase() === 'XEM CHI TIẾT')
  .map(b => { let c = b; for (let i = 0; i < 8 && c; i++) { c = c.parentElement; if (/Tối đa \\d+ khách/.test(c.innerText)) break; }
              return c ? c.innerText : ''; });
"""


def room_cards(driver):
    """Trả về [(tên phòng, sức chứa)] của các thẻ phòng đang hiển thị trên /rooms."""
    cards = []
    for text in driver.execute_script(ROOM_CARD_JS):
        lines = [x.strip() for x in text.split("\n") if x.strip()]
        cap = re.search(r"Tối đa (\d+) khách", text)
        name = next((x for x in lines if x.startswith(("Phòng", "Biệt thự"))), lines[0] if lines else "")
        cards.append((name, int(cap.group(1)) if cap else 0))
    return cards


def rooms_count_label(driver):
    m = re.search(r"(\d+) phòng có sẵn", h.page_text(driver))
    return int(m.group(1)) if m else -1


def open_rooms(driver, query=""):
    h.open_page(driver, "/rooms" + query)
    h.wait(driver).until(lambda d: rooms_count_label(d) >= 0)
    h.wait(driver).until(lambda d: len(room_cards(d)) == rooms_count_label(d))


# ---------------------------------------------------------------- TC1.1

@pytest.mark.tc("TC1.1", "Trang chủ và điều hướng công khai", technique="Kiểm thử điều hướng (state transition)")
def test_homepage_navigation(driver, tc):
    tc.step("Mở /homepage và chờ nội dung chính tải")
    h.open_page(driver, "/homepage")
    h.wait_text(driver, "IT HOTEL")
    text = h.page_text(driver)
    tc.check("IT HOTEL" in text, "Trang chủ hiển thị nhận diện 'IT HOTEL'", "Có 'IT HOTEL'" if "IT HOTEL" in text else text[:120])
    menu = ["TRANG CHỦ", "PHÒNG NGHỈ", "GIỚI THIỆU", "LIÊN HỆ"]
    missing = [m for m in menu if m not in text.upper()]
    tc.check(not missing, f"Menu có đủ {menu}", f"Thiếu {missing}" if missing else "Đủ 4 mục menu")
    tc.shot("trang_chu")

    for label, path, marker in (("PHÒNG NGHỈ", "/rooms", "phòng có sẵn"), ("GIỚI THIỆU", "/about", "Câu Chuyện"), ("LIÊN HỆ", "/contact", "Thông Tin Liên Hệ")):
        tc.step(f"Bấm menu '{label}'")
        h.click_text(driver, label)
        reached = h.wait_url(driver, path)
        has_content = h.wait_text(driver, marker)
        tc.check(reached and has_content, f"Chuyển tới {path} và có nội dung '{marker}'",
                 f"URL={driver.current_url}, có nội dung={has_content}")
        tc.step("Quay lại trang chủ")
        h.open_page(driver, "/homepage")
        h.wait_text(driver, "IT HOTEL")

    tc.step("Mở một route không tồn tại /khong-ton-tai")
    h.open_page(driver, "/khong-ton-tai")
    h.wait(driver).until(lambda d: len(h.page_text(d)) > 0)
    tc.note(f"Trang 404 hiển thị: {h.page_text(driver)[:100]}")
    tc.check(h.page_text(driver) != "", "Route sai hiển thị trang NotFound thay vì trang trắng", h.page_text(driver)[:80])


# ---------------------------------------------------------------- TC1.2

@pytest.mark.tc("TC1.2", "Danh sách phòng và bộ lọc", technique="Equivalence Partitioning")
def test_rooms_default_list(driver, tc):
    tc.step("Lấy danh sách loại phòng công khai từ API làm dữ liệu đối chiếu")
    status, public = h.api("GET", "/RoomTypes/public")
    tc.input(api_room_types=len(public))
    tc.step("Mở /rooms (mặc định: 2 người lớn, 0 trẻ em)")
    open_rooms(driver)
    cards = room_cards(driver)
    tc.shot("danh_sach_mac_dinh")
    tc.check(rooms_count_label(driver) == len(cards), "Số đếm 'N phòng có sẵn' bằng số thẻ phòng",
             f"Nhãn={rooms_count_label(driver)}, thẻ={len(cards)}")
    tc.check(all(c[0] and c[1] > 0 for c in cards), "Mỗi thẻ có tên và sức chứa", cards[:3])
    under = [c for c in cards if c[1] < 2]
    tc.check(not under, "Bộ lọc mặc định '2 Người lớn' chỉ hiện phòng có sức chứa >= 2",
             f"Hiện cả phòng sức chứa < 2: {under}" if under else "Đúng",
             bug=Bug("Trang /rooms ghi '2 Người lớn' nhưng vẫn hiển thị phòng tối đa 1 khách", "Minor", "Danh sách phòng"))


@pytest.mark.tc("TC1.2", "Danh sách phòng và bộ lọc", technique="Equivalence Partitioning")
def test_rooms_default_shows_all_types(driver, tc):
    status, public = h.api("GET", "/RoomTypes/public")
    expected = [r["name"] for r in public if r["isActive"] and r["capacityAdults"] >= 1]
    tc.step("Mở /rooms?adults=1 (sức chứa thấp nhất để không loại phòng nào)")
    open_rooms(driver, "?adults=1&children=0")
    names = [c[0] for c in room_cards(driver)]
    hidden = [n for n in expected if n not in names]
    tc.input(api_active_types=len(expected), shown=len(names))
    tc.check(not hidden, f"Hiển thị đủ {len(expected)} loại phòng đang hoạt động", f"Bị ẩn: {hidden}" if hidden else "Đủ",
             bug=Bug("Khoảng giá mặc định 0-5.000.000đ ẩn các loại phòng giá cao (Biệt thự 8.000.000đ) khỏi danh sách", "Minor", "Danh sách phòng"))


@pytest.mark.tc("TC1.2", "Danh sách phòng và bộ lọc", technique="Boundary Value Analysis")
@pytest.mark.parametrize("adults", [4, 6, 7], ids=["BVA_4", "BVA_6_max", "BVA_7_tren_max"])
def test_rooms_capacity_filter(driver, tc, adults):
    status, public = h.api("GET", "/RoomTypes/public")
    expected = sorted(r["name"] for r in public if r["capacityAdults"] >= adults and r["basePrice"] <= 5_000_000)
    tc.input(adults=adults, children=0)
    tc.step(f"Mở /rooms?adults={adults}&children=0")
    open_rooms(driver, f"?adults={adults}&children=0")
    cards = room_cards(driver)
    tc.shot(f"adults_{adults}")
    tc.check(all(c[1] >= adults for c in cards), f"Mọi phòng hiển thị có sức chứa >= {adults}", cards)
    tc.check(sorted(c[0] for c in cards) == expected, f"Danh sách khớp dữ liệu API: {expected}", sorted(c[0] for c in cards))
    if not expected:
        tc.check(h.wait_text(driver, "Xóa bộ lọc", 5), "Hiển thị trạng thái rỗng kèm nút 'Xóa bộ lọc'", h.page_text(driver)[-120:])


@pytest.mark.tc("TC1.2", "Danh sách phòng và bộ lọc", technique="Equivalence Partitioning")
@pytest.mark.parametrize("room_type, keyword", [("Standard", "tiêu chuẩn"), ("Deluxe", "deluxe"), ("Suite", "suite")],
                         ids=["EP_Standard", "EP_Deluxe", "EP_Suite"])
def test_rooms_type_filter(driver, tc, room_type, keyword):
    status, public = h.api("GET", "/RoomTypes/public")
    expected = sorted(r["name"] for r in public if keyword in r["name"].lower() and r["capacityAdults"] >= 1 and r["basePrice"] <= 5_000_000)
    tc.input(loai_phong=room_type)
    tc.step("Mở /rooms?adults=1")
    open_rooms(driver, "?adults=1&children=0")
    tc.step(f"Chọn bộ lọc loại phòng '{room_type}'")
    h.click_text(driver, room_type)
    h.wait(driver).until(lambda d: len(room_cards(d)) == rooms_count_label(d))
    got = sorted(c[0] for c in room_cards(driver))
    tc.shot(f"loc_{room_type}")
    tc.check(got == expected, f"Chỉ hiển thị phòng thuộc loại {room_type}: {expected}", got,
             bug=Bug(f"Bộ lọc loại phòng '{room_type}' không khớp tên phòng tiếng Việt nên không trả về phòng nào", "Major", "Danh sách phòng"))


@pytest.mark.tc("TC1.2", "Danh sách phòng và bộ lọc", technique="Kiểm tra nội dung")
def test_rooms_location_consistency(driver, tc):
    tc.step("Mở /contact và đọc địa chỉ khách sạn")
    h.open_page(driver, "/contact")
    h.wait_text(driver, "Địa Chỉ")
    contact = h.page_text(driver)
    city = "Đà Nẵng" if "Đà Nẵng" in contact else "?"
    tc.step("Mở /rooms và đọc phần tiêu đề vị trí")
    open_rooms(driver)
    m = re.search(r"\d+ loại phòng - ([^|]+?) NHẬN PHÒNG", h.page_text(driver))
    shown = m.group(1).strip() if m else h.page_text(driver)[:150]
    tc.check(city in shown, f"Tiêu đề /rooms ghi đúng thành phố của khách sạn ({city})", shown,
             bug=Bug("Trang /rooms ghi vị trí 'Hà Nội' trong khi địa chỉ liên hệ ở Đà Nẵng", "Trivial", "Nội dung"))


# ---------------------------------------------------------------- TC1.3

@pytest.mark.tc("TC1.3", "Chi tiết loại phòng và đánh giá hiện có", technique="Equivalence Partitioning")
def test_room_detail(driver, tc):
    tc.step("Mở /rooms và bấm 'XEM CHI TIẾT' của phòng đầu tiên")
    open_rooms(driver, "?adults=1")
    first_name = room_cards(driver)[0][0]
    h.click_button(driver, "XEM CHI TIẾT")
    tc.check(h.wait_url(driver, "/room/"), "Chuyển tới /room/{id}", driver.current_url)
    room_id = int(driver.current_url.rstrip("/").split("/")[-1])
    _, public = h.api("GET", "/RoomTypes/public")
    data = next(r for r in public if r["id"] == room_id)
    tc.input(room_id=room_id, ten_phong=data["name"])
    h.wait_text(driver, "Đánh giá của khách hàng")
    text = h.page_text(driver)
    tc.shot("chi_tiet_phong")
    tc.check(data["name"] in text and first_name == data["name"], "Tên phòng trên trang chi tiết khớp thẻ đã chọn và dữ liệu API",
             f"Thẻ='{first_name}', API='{data['name']}'")
    price = f"{int(data['basePrice']):,}".replace(",", ".") + "đ"
    tc.check(price in text, f"Hiển thị giá {price}/đêm", "Có" if price in text else text[-300:])
    cap = f"{data['capacityAdults']} người lớn, {data['capacityChildren']} trẻ em"
    tc.check(cap in text, f"Hiển thị sức chứa '{cap}'", re.search(r"Sức chứa: [^|]+?trẻ em", text).group(0) if "Sức chứa" in text else "Không có")
    tc.check("Đánh giá của khách hàng" in text and "GỬI ĐÁNH GIÁ" in text.upper(), "Có khu vực đánh giá và form gửi đánh giá", "Có")
    area = re.search(r"Diện tích: ([^|]*?)m²", text)
    area_val = area.group(1).strip() if area else ""
    tc.check(area_val != "", "Thông tin 'Diện tích' có giá trị", f"Diện tích: '{area_val} m²'",
             bug=Bug("Trang chi tiết phòng hiển thị 'Diện tích: m²' (thiếu số liệu diện tích)", "Minor", "Chi tiết phòng"))


@pytest.mark.tc("TC1.3", "Chi tiết loại phòng và đánh giá hiện có", technique="Equivalence Partitioning (chưa đăng nhập)")
def test_room_review_requires_login(driver, tc):
    tc.step("Mở /room/1 khi chưa đăng nhập")
    h.open_page(driver, "/room/1")
    h.wait_text(driver, "Chia sẻ trải nghiệm")
    tc.step("Chọn 5 sao, nhập nhận xét và bấm GỬI ĐÁNH GIÁ")
    h.rate(driver, 5)
    h.fill(driver, "comment", "Selenium: thử gửi đánh giá khi chưa đăng nhập")
    h.click_button(driver, "GỬI ĐÁNH GIÁ")
    msg = h.toast(driver)
    tc.shot("danh_gia_chua_dang_nhap")
    tc.check("đăng nhập" in msg.lower(), "Hệ thống yêu cầu đăng nhập trước khi gửi đánh giá", msg or "Không có thông báo")


# ---------------------------------------------------------------- TC1.4

def news_titles(driver):
    return driver.execute_script("""
return [...document.querySelectorAll('h1,h2,h3,h4,h5')].filter(e => e.offsetParent && e.closest('*'))
  .map(e => e.innerText.trim()).filter(Boolean);""")


@pytest.mark.tc("TC1.4", "Tìm kiếm tin tức và gửi bình luận", technique="Equivalence Partitioning")
@pytest.mark.parametrize("keyword, has_result", [("hải sản", True), ("HẢI SẢN", True), ("zzkhongcobaiviet", False)],
                         ids=["EP_co_ket_qua", "EP_khong_phan_biet_hoa_thuong", "EP_khong_ket_qua"])
def test_news_search(driver, tc, keyword, has_result):
    _, posts = h.api("GET", "/Posts")
    expected = sorted(p["title"] for p in posts if p["isPublished"] and (keyword.lower() in p["title"].lower() or keyword.lower() in (p["content"] or "").lower()))
    tc.input(tu_khoa=keyword)
    tc.step("Mở /news")
    h.open_page(driver, "/news")
    box = h.visible(driver, "input[placeholder='Tìm kiếm bài viết, ưu đãi...']")
    tc.step(f"Nhập từ khóa '{keyword}' vào ô tìm kiếm")
    box.send_keys(keyword)
    if has_result:
        ok = h.wait_text(driver, expected[0]) if expected else False
        text = h.page_text(driver)
        others = [p["title"] for p in posts if p["isPublished"] and p["title"] not in expected and p["title"] in text]
        tc.shot("tim_kiem")
        tc.check(ok and not others, f"Chỉ hiển thị bài khớp từ khóa: {expected}", f"Bài khác vẫn hiện: {others}" if others else f"Hiện {expected}")
    else:
        found = h.wait_text(driver, "Không tìm thấy bài viết nào", 8)
        tc.shot("tim_kiem_rong")
        tc.check(found, "Hiển thị 'Không tìm thấy bài viết nào!'", "Có" if found else h.page_text(driver)[-150:])


@pytest.mark.tc("TC1.4", "Tìm kiếm tin tức và gửi bình luận", technique="Equivalence Partitioning")
def test_news_category_filter(driver, tc):
    _, posts = h.api("GET", "/Posts")
    category = "Góc Thư Giãn"
    expected = [p["title"] for p in posts if p["isPublished"] and p["categoryName"] == category]
    not_expected = [p["title"] for p in posts if p["isPublished"] and p["categoryName"] != category and not p.get("isHot")]
    tc.input(danh_muc=category)
    tc.step("Mở /news và chọn danh mục")
    h.open_page(driver, "/news")
    h.click_button(driver, category)
    h.wait_text(driver, expected[0])
    text = h.page_text(driver)
    leaked = [t for t in not_expected if t in text]
    tc.shot("loc_danh_muc")
    tc.check(all(t in text for t in expected) and not leaked, f"Chỉ hiện bài thuộc '{category}': {expected}",
             f"Bài ngoài danh mục: {leaked}" if leaked else "Đúng")
    tc.step("Bấm 'ĐỌC CHI TIẾT →' của bài viết trong danh mục")
    h.click_text(driver, "ĐỌC CHI TIẾT →")
    popup = h.modal(driver)
    tc.check(expected[0] in popup.text, f"Mở nội dung bài '{expected[0]}'", " ".join(popup.text.split())[:120])
    tc.shot("doc_bai_viet")
    can_comment = "/post/" in driver.current_url or "bình luận" in popup.text.lower()
    tc.check(can_comment, "Từ trang chi tiết bài viết, khách có thể xem/gửi bình luận (trang /post/{id})",
             f"Chỉ mở modal tại {driver.current_url}, không có phần bình luận",
             bug=Bug("Trang Tin tức không dẫn tới trang chi tiết /post/{id}; khách không thể bình luận qua giao diện", "Major", "Tin tức"))


COMMENT_CASES = [
    ("EP_bo_trong", "", "", 0, "", ["Nhập tên của bạn", "Nhập email", "Vui lòng chọn sao đánh giá", "Nhập nội dung bình luận"]),
    ("EP_email_sai", "Khách Selenium", "khach@", 5, "Bài viết hay", ["Email không hợp lệ"]),
    ("EP_hop_le", "Khách Selenium", "selenium.comment@hotel.com", 5, "Selenium: bình luận hợp lệ", []),
]


@pytest.mark.tc("TC1.4", "Tìm kiếm tin tức và gửi bình luận", technique="Equivalence Partitioning")
@pytest.mark.parametrize("case, name, email, stars, content, errors", COMMENT_CASES, ids=[c[0] for c in COMMENT_CASES])
def test_post_comment(driver, tc, case, name, email, stars, content, errors):
    tc.input(guestName=name, guestEmail=email, rating=stars, content=content)
    tc.step("Mở /post/1")
    h.open_page(driver, "/post/1")
    h.visible(driver, "#guestName")
    tc.step("Điền form bình luận và bấm 'Gửi Bình Luận'")
    if name:
        h.fill(driver, "guestName", name)
    if email:
        h.fill(driver, "guestEmail", email)
    if stars:
        h.rate(driver, stars)
    if content:
        h.fill(driver, "content", content)
    h.click_button(driver, "Gửi Bình Luận")
    if errors:
        got = h.form_errors(driver)
        tc.shot("loi_validation")
        tc.check(all(e in got for e in errors), f"Hiển thị lỗi: {errors}", got)
    else:
        msg = h.toast(driver)
        tc.shot("gui_thanh_cong")
        tc.check("thành công" in msg.lower(), "Thông báo 'Gửi bình luận thành công! Đang chờ admin duyệt.'", msg or "Không có thông báo",
                 bug=Bug("Gửi bình luận hợp lệ cho bài viết thất bại", "Major", "Tin tức"))


# ---------------------------------------------------------------- TC1.5

CONTACT_CASES = [
    ("EP_bo_trong", "", "", "", ["Vui lòng nhập tên!", "Vui lòng nhập email hợp lệ!", "Vui lòng nhập tin nhắn!"]),
    ("EP_email_sai", "Nguyễn Văn A", "nguyenvana.com", "Xin chào", ["Vui lòng nhập email hợp lệ!"]),
    ("EP_hop_le", "Nguyễn Văn A", "nguyenvana@hotel.com", "Selenium: cần tư vấn đặt phòng", []),
]


@pytest.mark.tc("TC1.5", "Biểu mẫu liên hệ và kiểm tra dữ liệu", technique="Equivalence Partitioning")
@pytest.mark.parametrize("case, name, email, message, errors", CONTACT_CASES, ids=[c[0] for c in CONTACT_CASES])
def test_contact_form(driver, tc, case, name, email, message, errors):
    tc.input(name=name, email=email, message=message)
    tc.step("Mở /contact, điền form và bấm 'GỬI TIN NHẮN'")
    h.open_page(driver, "/contact")
    h.visible(driver, "#name")
    for field, value in (("name", name), ("email", email), ("message", message)):
        if value:
            h.fill(driver, field, value)
    driver.execute_script("performance.clearResourceTimings();")
    h.click_button(driver, "GỬI TIN NHẮN")
    if errors:
        got = h.form_errors(driver)
        tc.shot("loi_validation")
        tc.check(all(e in got for e in errors), f"Hiển thị lỗi: {errors}", got)
        return
    msg = h.toast(driver)
    tc.shot("gui_lien_he")
    tc.check("cảm ơn" in msg.lower(), "Hiển thị thông báo cảm ơn", msg or "Không có thông báo")
    calls = driver.execute_script(
        "return performance.getEntriesByType('resource').map(e => e.name).filter(n => n.includes(':5070'));")
    tc.note(f"Request tới Backend sau khi gửi: {calls}")
    tc.check(bool(calls), "Nội dung liên hệ được gửi tới Backend để lưu/chuyển cho khách sạn",
             "Không có request nào tới Backend (form chỉ console.log)",
             bug=Bug("Form liên hệ báo thành công nhưng không gửi/lưu nội dung lên hệ thống", "Major", "Liên hệ"))
