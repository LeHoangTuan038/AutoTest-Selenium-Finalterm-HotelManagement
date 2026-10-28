-- Đồng bộ NULL / NOT NULL giữa DB và Models C# (chạy sau HotelManagement_Patch_Schema.sql)
-- Các cột dưới đây: model C# KHÔNG cho null (int/bool/decimal/DateTime hoặc string không có '?')
-- nhưng DB lại cho NULL. Nếu một dòng có NULL ở cột kiểu giá trị, EF ném SqlNullValueException
-- khi đọc ("Data is Null") -> HTTP 500. Về nghiệp vụ, tất cả đều là dữ liệu bắt buộc
-- (khóa ngoại bắt buộc, cờ trạng thái, ngày tạo, số tiền...) nên sửa DB thành NOT NULL.
-- Kiểu dữ liệu hiện tại được giữ nguyên; chạy lại nhiều lần vẫn an toàn.
USE [HotelManagementDB]
GO

/* 1. Gỡ tạm index/unique constraint đang chứa cột cần đổi (ALTER COLUMN bị chặn nếu còn) */
-- Articles.slug đang có 2 unique constraint trùng nhau (do script gốc chạy 2 lần) -> gỡ hết, tạo lại 1
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'ALTER TABLE dbo.Articles DROP CONSTRAINT ' + QUOTENAME(i.name) + N';'
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.Articles') AND i.is_unique_constraint = 1;
EXEC sp_executesql @sql;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead' AND object_id = OBJECT_ID('dbo.Notifications'))
    DROP INDEX IX_Notifications_UserId_IsRead ON dbo.Notifications;
GO

/* 2. Đổi sang NOT NULL (giữ nguyên kiểu đang có trong DB) */
DECLARE @cols TABLE (t SYSNAME, c SYSNAME);
INSERT @cols VALUES
-- Khóa ngoại bắt buộc: chi tiết/hoá đơn phải thuộc 1 booking, review phải có user + loại phòng...
 ('Booking_Details','booking_id'), ('Invoices','booking_id'),
 ('Order_Service_Details','order_service_id'), ('Order_Service_Details','service_id'),
 ('Reviews','user_id'), ('Reviews','room_type_id'),
 ('Room_Inventory','room_id'), ('Rooms','room_type_id'), ('Services','category_id'),
 ('Notifications','user_id'), ('Room_Images','room_type_id'),
 ('Articles','author_id'), ('Articles','category_id'),
-- Cờ / trạng thái (đã có DEFAULT trong DB)
 ('Amenities','is_active'), ('Room_Inventory','is_active'), ('Users','status'),
 ('Room_Images','is_active'), ('Room_Images','is_primary'),
 ('Rooms','status'), ('Rooms','cleaning_status'), ('Invoices','status'),
 ('Order_Services','Status'), ('Notifications','type'),
-- Số liệu / tiền / ngày tạo
 ('Memberships','min_points'), ('Memberships','discount_percent'),
 ('Order_Services','order_date'), ('Order_Services','total_amount'),
 ('Room_Inventory','Quantity'), ('Room_Inventory','price_if_lost'),
 ('Rooms','floor'), ('Reviews','rating'), ('Reviews','created_at'), ('Reviews','comment'),
 ('Notifications','created_at'),
 ('Articles','content'), ('Articles','slug'), ('Articles','published_at'),
 ('Audit_Logs','log_data'),
-- Bảng do HotelManagement_Patch_Schema.sql tạo: model đánh dấu bắt buộc (= null!)
 ('Role_Dashboard_Period_States','role_name'), ('Role_Dashboard_Period_States','dashboard_code'),
 ('Role_Dashboard_Period_States','dashboard_title'), ('Role_Dashboard_Period_States','period_type'),
 ('Role_Dashboard_Period_States','period_key'), ('Role_Dashboard_Period_States','dashboard_json'),
 ('Role_Dashboard_Period_States','status');

DECLARE @alter NVARCHAR(MAX) = N'';
SELECT @alter += N'ALTER TABLE dbo.' + QUOTENAME(x.t) + N' ALTER COLUMN ' + QUOTENAME(x.c) + N' '
    + CASE
        WHEN ty.name IN ('nvarchar','nchar') THEN ty.name + '(' + IIF(sc.max_length = -1, 'MAX', CAST(sc.max_length / 2 AS VARCHAR)) + ')'
        WHEN ty.name IN ('varchar','char','varbinary') THEN ty.name + '(' + IIF(sc.max_length = -1, 'MAX', CAST(sc.max_length AS VARCHAR)) + ')'
        WHEN ty.name IN ('decimal','numeric') THEN ty.name + '(' + CAST(sc.precision AS VARCHAR) + ',' + CAST(sc.scale AS VARCHAR) + ')'
        WHEN ty.name IN ('datetime2','time','datetimeoffset') THEN ty.name + '(' + CAST(sc.scale AS VARCHAR) + ')'
        ELSE ty.name
      END
    + N' NOT NULL;' + CHAR(10)
FROM @cols x
JOIN sys.columns sc ON sc.object_id = OBJECT_ID('dbo.' + x.t) AND sc.name = x.c
JOIN sys.types ty ON ty.user_type_id = sc.user_type_id
WHERE sc.is_nullable = 1;

PRINT @alter;
EXEC sp_executesql @alter;
GO

/* 3. Tạo lại index / unique constraint đã gỡ */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.Articles') AND name = 'UQ_Articles_slug')
    ALTER TABLE dbo.Articles ADD CONSTRAINT UQ_Articles_slug UNIQUE NONCLUSTERED (slug);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead' AND object_id = OBJECT_ID('dbo.Notifications'))
    CREATE NONCLUSTERED INDEX IX_Notifications_UserId_IsRead ON dbo.Notifications (user_id ASC, is_read ASC);
GO

/* 4. DEFAULT cho 2 cột bắt buộc của Loss_And_Damages (model đã sửa: Quantity = 1, PenaltyAmount = 0) */
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Loss_And_Damages') AND name = 'quantity' AND default_object_id <> 0)
    ALTER TABLE dbo.Loss_And_Damages ADD CONSTRAINT DF_Loss_And_Damages_quantity DEFAULT ((1)) FOR quantity;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Loss_And_Damages') AND name = 'penalty_amount' AND default_object_id <> 0)
    ALTER TABLE dbo.Loss_And_Damages ADD CONSTRAINT DF_Loss_And_Damages_penalty_amount DEFAULT ((0)) FOR penalty_amount;
GO
