"""Test case thủ công: tool không tự thực hiện được (xem cột 'Ghi chú thực thi' trong Test Plan)."""

import pytest

MANUAL = [
    ("TC2.6", "Khôi phục mật khẩu Guest bằng OTP",
     "OTP khôi phục sinh ngẫu nhiên và chỉ gửi qua email, Selenium không đọc được hộp thư."),
    ("TC4.4", "Đổi mật khẩu Guest bằng OTP",
     "OTP đổi mật khẩu sinh ngẫu nhiên và chỉ gửi qua email, không có OTP test cố định."),
    ("TC4.6", "Đánh giá booking đã hoàn tất",
     "Cần booking trạng thái Completed do Lễ tân/Admin trả phòng, ngoài phạm vi User."),
    ("TC4.7", "Đánh giá loại phòng từ trang chi tiết",
     "Backend chỉ cho đánh giá khi Guest có lượt lưu trú Completed/Checked_out, cần Lễ tân/Admin."),
]


def _manual_test(tc_id, title, reason):
    @pytest.mark.manual
    @pytest.mark.tc(tc_id, title, technique="Thủ công")
    def test(tc):
        tc.note(f"Không tự động hóa: {reason}")
        pytest.skip(f"THỦ CÔNG - {reason}")
    test.__name__ = f"test_manual_{tc_id.replace('.', '_')}"
    return test


for _tc_id, _title, _reason in MANUAL:
    globals()[f"test_manual_{_tc_id.replace('.', '_')}"] = _manual_test(_tc_id, _title, _reason)
