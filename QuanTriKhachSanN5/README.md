# Hệ Thống Quản Trị Khách Sạn (Hotel Management System)

Dự án Quản lý Khách sạn bao gồm Backend (ASP.NET Core Web API) và Frontend (React + Vite). Dưới đây là hướng dẫn chi tiết cách cài đặt và chạy dự án.

## 📋 Yêu cầu hệ thống (Prerequisites)
Trước khi chạy dự án, hãy đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:
- **.NET 8 SDK** (hoặc mới hơn) cho Backend.
- **Node.js** (phiên bản 18+ trở lên) cho Frontend.
- **SQL Server** (hoặc SQL Server Express) để chạy cơ sở dữ liệu.
- **Git** (tuỳ chọn) để quản lý mã nguồn.

---

## 🗄️ 1. Hướng dẫn thiết lập Database (Cơ sở dữ liệu)

1. Mở **SQL Server Management Studio (SSMS)** hoặc công cụ quản lý CSDL của bạn.
2. Tại thư mục gốc của dự án, tìm file `HotelManagement.sql`.
3. Mở file script `HotelManagement.sql` trong SSMS và chạy (Execute) để tạo cấu trúc bảng và dữ liệu mẫu.
4. Đảm bảo database đã được tạo thành công với tên là `HotelManagementDB` (hoặc tên theo script của bạn).

*(Lưu ý: Bạn cũng có thể dùng Entity Framework Core Migrations bằng lệnh `dotnet ef database update` trong thư mục Backend nếu Project có cấu hình migrations)*

---

## ⚙️ 2. Hướng dẫn chạy Backend (ASP.NET Core)

Backend sử dụng ASP.NET Core Web API, cung cấp RESTful API cho ứng dụng Frontend.

1. Mở terminal (PowerShell/Command Prompt) và di chuyển vào thư mục Backend:
   ```bash
   cd QuanTriKhachSanN5
   ```
2. Cấu hình chuỗi kết nối Database:
   - Mở file `appsettings.json` (và `appsettings.Development.json` nếu cần).
   - Kiểm tra `ConnectionStrings:DefaultConnection`. Đảm bảo Server Name trỏ đúng tới SQL Server của bạn. 
   - Ví dụ: `"Server=.;Database=HotelManagementDB;Trusted_Connection=True;TrustServerCertificate=True"`
3. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   dotnet restore
   ```
4. Khởi chạy Server:
   ```bash
   dotnet run
   ```
5. Khi terminal thông báo Server đang chạy (thường là `http://localhost:5070` hoặc `https://localhost:7070`), bạn có thể truy cập **Swagger UI** để xem danh sách API:
   - 👉 **Link Swagger:** `http://localhost:<PORT>/swagger` (ví dụ: `http://localhost:5070/swagger`)

---

## 💻 3. Hướng dẫn chạy Frontend (React + Vite)

Frontend được xây dựng bằng React.js kết hợp Vite.

1. Mở một cửa sổ terminal mới và di chuyển vào thư mục Frontend:
   ```bash
   cd QuanTriKhachSanN5_Frontend
   ```
2. Cài đặt các thư viện (node_modules):
   ```bash
   npm install
   ```
3. Khởi chạy môi trường phát triển (Development Server):
   ```bash
   npm run dev
   ```
4. Ứng dụng Frontend sẽ chạy ở địa chỉ mặc định. Bạn mở trình duyệt và truy cập:
   - 👉 **Link Frontend:** `http://localhost:5173`

---

## 🧪 4. Hướng dẫn Test và Validations

Hiện tại, hệ thống sử dụng kiểm thử thủ công và kiểm thử API trực tiếp qua Swagger.

### A. Kiểm thử API qua Swagger
1. Chạy Backend và truy cập vào giao diện **Swagger UI** (như hướng dẫn ở mục 2).
2. Tại đây, bạn có thể xem mô tả chi tiết của từng endpoint, các params/body yêu cầu.
3. Nhấn **"Try it out"**, nhập dữ liệu và nhấn **"Execute"** để xem kết quả trả về (Response) từ Server.

### B. Kiểm thử qua Postman
Bạn có thể import các endpoint từ Swagger vào Postman để lưu trữ collections và viết các script test tự động bằng JavaScript trong Postman.

### C. Tài khoản Test Mẫu (Đã được Seed Data)
Trong quá trình phát triển, database đã được cấu hình tự động (seed) một số tài khoản dùng để đăng nhập và test phân quyền. 
Bạn có thể sử dụng các tài khoản sau tại màn hình Đăng nhập (Login):

| Vai trò (Role) | Email | Mật khẩu (Password) |
| :--- | :--- | :--- |
| **Admin** | `admin@hotel.com` | `123456` |
| **Receptionist** | `receptionist@hotel.com` | `123456` |
| **User** | `user@hotel.com` | `123456` |
| **Housekeeping** | `housekeeping@hotel.com` | `123456` |

> Chú ý: Một số API yêu cầu quyền truy cập (Authorization). Hãy đăng nhập để lấy JWT Token, sau đó copy token này dán vào phần **Authorize** trên Swagger hoặc Header `Authorization: Bearer <token>` trên Postman trước khi gọi các API bảo mật.
