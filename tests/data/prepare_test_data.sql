-- Dữ liệu kiểm thử bổ sung cho bộ Selenium (chạy lặp lại không tạo trùng).
-- Voucher đã hết hạn dùng cho TC3.4 (lớp tương đương "voucher quá hạn").
IF NOT EXISTS (SELECT 1 FROM Vouchers WHERE code = 'SELENIUMEXPIRED')
    INSERT INTO Vouchers (code, discount_type, discount_value, min_booking_value, valid_from, valid_to, usage_limit)
    VALUES ('SELENIUMEXPIRED', 'PERCENT', 10, 0, '2025-01-01', '2025-06-30', 100);
SELECT code, valid_to FROM Vouchers WHERE code = 'SELENIUMEXPIRED';
