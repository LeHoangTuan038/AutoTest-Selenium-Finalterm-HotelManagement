// using System.ComponentModel.DataAnnotations;
//
// namespace QuanTriKhachSanN5.Models
// {
//     // Model Service ánh xạ với bảng Services trong SQL Server
//     public class Service
//     {
//         // Khóa chính của bảng
//         public int id { get; set; }
//
//         // ID của loại dịch vụ (liên kết với bảng Service_Categories)
//         public int category_id { get; set; }
//
//         // Tên dịch vụ (ví dụ: Giặt đồ, Spa, Ăn sáng)
//         public string? name { get; set; }
//
//         // Giá dịch vụ
//         public decimal price { get; set; }
//
//         // Đơn vị tính (ví dụ: lần, giờ, người)
//         public string? unit { get; set; }
//
//         public int status { get; set; } // 1 = enable, 0 = disable
//     }
// }
