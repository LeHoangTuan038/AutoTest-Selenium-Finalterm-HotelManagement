-- Vá bảng Users cho khớp với Models/User.cs (chạy sau HotelManagement_New.sql)
USE [HotelManagementDB]
GO

-- 1. Các cột model User có nhưng script gốc thiếu -> EF báo "Invalid column name" khi login
IF COL_LENGTH('dbo.Users', 'points') IS NULL
    ALTER TABLE [dbo].[Users] ADD [points] INT NOT NULL CONSTRAINT [DF_Users_points] DEFAULT ((0));
GO
IF COL_LENGTH('dbo.Users', 'last_birthday_voucher_year') IS NULL
    ALTER TABLE [dbo].[Users] ADD [last_birthday_voucher_year] INT NULL;
GO

-- 2. Script gốc không có INSERT nào cho Users -> tạo 4 tài khoản test, mật khẩu đều là 123456
--    (hash BCrypt tạo bằng BCrypt.Net-Next, cùng thư viện backend dùng để Verify)
DECLARE @hash NVARCHAR(MAX) = N'$2a$11$J5UnvEnCJ/AZAuofBTKbD.xFEfSRKfG411OGD0FCF9HnPk/Gym1w.';

INSERT dbo.Users (full_name, email, password_hash, status)
SELECT v.full_name, v.email, @hash, 1
FROM (VALUES
    (N'Admin',        'admin@hotel.com'),
    (N'Receptionist', 'receptionist@hotel.com'),
    (N'Housekeeping', 'housekeeping@hotel.com'),
    (N'Guest',        'guest@hotel.com')
) v(full_name, email)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Users u WHERE u.email = v.email);

INSERT dbo.User_Roles (user_id, role_id)
SELECT u.id, r.id
FROM (VALUES
    ('admin@hotel.com',        'Admin'),
    ('receptionist@hotel.com', 'Receptionist'),
    ('housekeeping@hotel.com', 'Housekeeping'),
    ('guest@hotel.com',        'Guest')
) v(email, role)
JOIN dbo.Users u ON u.email = v.email
JOIN dbo.Roles r ON r.name = v.role
WHERE NOT EXISTS (SELECT 1 FROM dbo.User_Roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);
GO

SELECT u.id, u.email, r.name AS role
FROM dbo.Users u
LEFT JOIN dbo.User_Roles ur ON ur.user_id = u.id
LEFT JOIN dbo.Roles r ON r.id = ur.role_id
ORDER BY u.id;
GO
