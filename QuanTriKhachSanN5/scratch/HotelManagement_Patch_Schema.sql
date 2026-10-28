-- Vá schema cho khớp với các Models C# (chạy sau HotelManagement_New.sql và HotelManagement_Patch_Users.sql)
-- Chỉ THÊM bảng/cột, nới NOT NULL và chép dữ liệu cũ sang cột mới; chạy lại nhiều lần vẫn an toàn.
USE [HotelManagementDB]
GO

/* =========================================================
   1. CỘT CÒN THIẾU (EF báo "Invalid column name" -> HTTP 500)
   ========================================================= */

-- Amenities (Models/Amenity.cs) - dùng cho kho vật tư
IF COL_LENGTH('dbo.Amenities', 'category') IS NULL           ALTER TABLE dbo.Amenities ADD category NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.Amenities', 'unit') IS NULL               ALTER TABLE dbo.Amenities ADD unit NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.Amenities', 'total_quantity') IS NULL     ALTER TABLE dbo.Amenities ADD total_quantity INT NOT NULL CONSTRAINT DF_Amenities_total_quantity DEFAULT ((0));
IF COL_LENGTH('dbo.Amenities', 'import_price') IS NULL       ALTER TABLE dbo.Amenities ADD import_price DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Amenities', 'compensation_price') IS NULL ALTER TABLE dbo.Amenities ADD compensation_price DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Amenities', 'supplier') IS NULL           ALTER TABLE dbo.Amenities ADD supplier NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.Amenities', 'image_url') IS NULL          ALTER TABLE dbo.Amenities ADD image_url NVARCHAR(MAX) NULL;
GO

-- Attractions (Models/Attraction.cs) -> /api/Attractions
IF COL_LENGTH('dbo.Attractions', 'image_url') IS NULL ALTER TABLE dbo.Attractions ADD image_url NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.Attractions', 'is_hot') IS NULL    ALTER TABLE dbo.Attractions ADD is_hot BIT NULL CONSTRAINT DF_Attractions_is_hot DEFAULT ((0));
GO

-- Bookings (Models/Booking.cs) -> /api/Dashboard/admin, đặt cọc ở lễ tân
IF COL_LENGTH('dbo.Bookings', 'DepositAmount') IS NULL ALTER TABLE dbo.Bookings ADD DepositAmount DECIMAL(18,2) NULL;
GO

-- Loss_And_Damages (Models/LossAndDamage.cs) -> /api/LossAndDamages
IF COL_LENGTH('dbo.Loss_And_Damages', 'status') IS NULL ALTER TABLE dbo.Loss_And_Damages ADD status NVARCHAR(MAX) NULL;
GO
-- Giá trị mặc định mà LossAndDamageService dùng cho biên bản mới
UPDATE dbo.Loss_And_Damages SET status = N'Chưa đền bù' WHERE status IS NULL;
GO

/* =========================================================
   2. AUDIT_LOGS: model mới lưu log dạng JSON (log_date, log_data, role_name)
      còn bảng cũ có action/table_name/record_id NOT NULL mà model không ghi
      -> AuditLogFilter (chạy ở MỌI request) INSERT lỗi.
   ========================================================= */
IF COL_LENGTH('dbo.Audit_Logs', 'role_name') IS NULL ALTER TABLE dbo.Audit_Logs ADD role_name NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.Audit_Logs', 'log_date') IS NULL  ALTER TABLE dbo.Audit_Logs ADD log_date DATETIME2 NOT NULL CONSTRAINT DF_Audit_Logs_log_date DEFAULT (GETDATE());
IF COL_LENGTH('dbo.Audit_Logs', 'log_data') IS NULL  ALTER TABLE dbo.Audit_Logs ADD log_data NVARCHAR(MAX) NULL;
GO
ALTER TABLE dbo.Audit_Logs ALTER COLUMN [action] NVARCHAR(50) NULL;
ALTER TABLE dbo.Audit_Logs ALTER COLUMN table_name NVARCHAR(100) NULL;
ALTER TABLE dbo.Audit_Logs ALTER COLUMN record_id INT NULL;
GO
-- Chép log cũ sang định dạng JSON mà Audit_Log.ExtractJson() đọc (action, tableName, recordId, oldValue, newValue)
UPDATE dbo.Audit_Logs
SET log_date = ISNULL(created_at, log_date),
    log_data = (SELECT [action]   AS [action],
                       table_name AS [tableName],
                       CAST(record_id AS NVARCHAR(20)) AS [recordId],
                       old_value  AS [oldValue],
                       new_value  AS [newValue]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
WHERE log_data IS NULL AND [action] IS NOT NULL;
GO

/* =========================================================
   3. BẢNG CÒN THIẾU (EF báo "Invalid object name")
      DDL lấy từ ApplicationDbContext.Database.GenerateCreateScript()
   ========================================================= */
IF OBJECT_ID('dbo.Categories') IS NULL
CREATE TABLE dbo.Categories (
    [Id] INT NOT NULL IDENTITY,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(1000) NULL,
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
);
GO
IF OBJECT_ID('dbo.Posts') IS NULL
BEGIN
    CREATE TABLE dbo.Posts (
        [Id] INT NOT NULL IDENTITY,
        [Title] NVARCHAR(250) NOT NULL,
        [Content] NVARCHAR(MAX) NOT NULL,
        [Excerpt] NVARCHAR(500) NULL,
        [ImageUrl] NVARCHAR(1000) NULL,
        [IsPublished] BIT NOT NULL,
        [IsHot] BIT NOT NULL,
        [CategoryId] INT NOT NULL,
        [RoomTypeId] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [PK_Posts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Posts_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES dbo.Categories ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Posts_Room_Types_RoomTypeId] FOREIGN KEY ([RoomTypeId]) REFERENCES dbo.Room_Types ([id])
    );
    CREATE INDEX [IX_Posts_CategoryId] ON dbo.Posts ([CategoryId]);
    CREATE INDEX [IX_Posts_RoomTypeId] ON dbo.Posts ([RoomTypeId]);
END
GO
IF OBJECT_ID('dbo.PostComments') IS NULL
BEGIN
    CREATE TABLE dbo.PostComments (
        [Id] INT NOT NULL IDENTITY,
        [PostId] INT NOT NULL,
        [GuestName] NVARCHAR(100) NOT NULL,
        [GuestEmail] NVARCHAR(100) NOT NULL,
        [Rating] INT NOT NULL,
        [Content] NVARCHAR(1000) NOT NULL,
        [IsApproved] BIT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [PK_PostComments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PostComments_Posts_PostId] FOREIGN KEY ([PostId]) REFERENCES dbo.Posts ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_PostComments_PostId] ON dbo.PostComments ([PostId]);
END
GO
IF OBJECT_ID('dbo.AttractionImages') IS NULL
BEGIN
    CREATE TABLE dbo.AttractionImages (
        [Id] INT NOT NULL IDENTITY,
        [AttractionId] INT NOT NULL,
        [ImageUrl] NVARCHAR(500) NOT NULL,
        [CloudinaryPublicId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [IsDeleted] BIT NOT NULL,
        CONSTRAINT [PK_AttractionImages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AttractionImages_Attractions_AttractionId] FOREIGN KEY ([AttractionId]) REFERENCES dbo.Attractions ([id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_AttractionImages_AttractionId] ON dbo.AttractionImages ([AttractionId]);
END
GO
IF OBJECT_ID('dbo.Role_Dashboard_Period_States') IS NULL
CREATE TABLE dbo.Role_Dashboard_Period_States (
    [id] INT NOT NULL IDENTITY,
    [role_id] INT NOT NULL,
    [role_name] NVARCHAR(MAX) NULL,
    [dashboard_code] NVARCHAR(MAX) NULL,
    [dashboard_title] NVARCHAR(MAX) NULL,
    [period_type] NVARCHAR(MAX) NULL,
    [period_key] NVARCHAR(MAX) NULL,
    [period_start] DATETIME2 NOT NULL,
    [period_end] DATETIME2 NOT NULL,
    [dashboard_json] NVARCHAR(MAX) NULL,
    [comparison_json] NVARCHAR(MAX) NULL,
    [status] NVARCHAR(MAX) NULL,
    [is_current] BIT NOT NULL,
    [last_event_type] NVARCHAR(MAX) NULL,
    [last_event_source] NVARCHAR(MAX) NULL,
    [last_event_ref_id] INT NULL,
    [version] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL,
    [updated_at] DATETIME2 NOT NULL,
    [closed_at] DATETIME2 NULL,
    [updated_by] INT NULL,
    CONSTRAINT [PK_Role_Dashboard_Period_States] PRIMARY KEY ([id])
);
GO

/* =========================================================
   4. DỮ LIỆU CHO POSTS: chép Articles -> Posts (giống logic seed trong Program.cs)
   ========================================================= */
INSERT dbo.Categories (Name, Description)
SELECT ac.name, N'Nhập từ dữ liệu gốc Articles'
FROM dbo.Article_Categories ac
WHERE NOT EXISTS (SELECT 1 FROM dbo.Categories c WHERE c.Name = ac.name);
GO
INSERT dbo.Posts (Title, Content, Excerpt, ImageUrl, IsPublished, IsHot, CategoryId, CreatedAt)
SELECT a.title,
       ISNULL(a.content, N''),
       CASE WHEN LEN(a.content) > 200 THEN LEFT(a.content, 197) + N'...' ELSE a.content END,
       a.thumbnail_url,
       1,
       CASE WHEN a.title LIKE N'%mới%' OR a.title LIKE N'%khuyến mãi%' OR a.title LIKE N'%nổi bật%' THEN 1 ELSE 0 END,
       c.Id,
       ISNULL(a.published_at, GETUTCDATE())
FROM dbo.Articles a
JOIN dbo.Article_Categories ac ON ac.id = a.category_id
JOIN dbo.Categories c ON c.Name = ac.name
WHERE NOT EXISTS (SELECT 1 FROM dbo.Posts p WHERE p.Title = a.title);
GO

/* =========================================================
   5. USER BỊ THIẾU: Bookings/Reviews/Audit_Logs trỏ tới user_id 5..10 nhưng script gốc
      không có INSERT Users -> navigation User = null. Tạo lại các user này (role Guest,
      mật khẩu 123456 - cùng hash với HotelManagement_Patch_Users.sql).
   ========================================================= */
DECLARE @hash NVARCHAR(MAX) = N'$2a$11$J5UnvEnCJ/AZAuofBTKbD.xFEfSRKfG411OGD0FCF9HnPk/Gym1w.';
SET IDENTITY_INSERT dbo.Users ON;
INSERT dbo.Users (id, full_name, email, password_hash, status)
SELECT n, N'Khách hàng ' + CAST(n AS NVARCHAR(10)), 'guest' + CAST(n AS VARCHAR(10)) + '@hotel.com', @hash, 1
FROM (VALUES (5), (6), (7), (8), (9), (10)) v(n)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Users u WHERE u.id = v.n);
SET IDENTITY_INSERT dbo.Users OFF;

INSERT dbo.User_Roles (user_id, role_id)
SELECT u.id, r.id
FROM dbo.Users u CROSS JOIN dbo.Roles r
WHERE u.id BETWEEN 5 AND 10 AND r.name = 'Guest'
  AND NOT EXISTS (SELECT 1 FROM dbo.User_Roles ur WHERE ur.user_id = u.id);
GO
