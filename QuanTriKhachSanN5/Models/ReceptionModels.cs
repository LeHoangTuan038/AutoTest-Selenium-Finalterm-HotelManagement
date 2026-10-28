using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    // =========================================================
    // Bảng Services: Dịch vụ (Spa, gọi món)
    // =========================================================
    [Table("Services")]
    public class Service
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // 🚨 BÙA CHÚ BẢO VỆ: SQL không có cột này thì cấm C# đòi hỏi!
        [NotMapped]
        public string? Description { get; set; }

        public decimal Price { get; set; }

        public string? Unit { get; set; }

        // 🚨 BÙA CHÚ BẢO VỆ: SQL không có cột này thì cấm C# đòi hỏi!
        [NotMapped]
        public int Status { get; set; } = 1; // 1 = enable, 0 = disable

        [Column("category_id")] 
        public int CategoryId { get; set; }
        public Service_Category? Category { get; set; }
    }

    // =========================================================
    // Bảng Service_Categories: Danh mục dịch vụ
    // =========================================================
    [Table("Service_Categories")]
    public class Service_Category
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public ICollection<Service>? Services { get; set; }
    }

    // =========================================================
    // Bảng Order_Services: Đơn hàng dịch vụ
    // =========================================================
    [Table("Order_Services")]
    public class Order_Service
    {
        [Key]
        public int Id { get; set; }

        // 🚨 BÙA CHÚ BẢO VỆ: Không cho lưu cột này xuống SQL
        [NotMapped]
        public int BookingId { get; set; }
        
        [NotMapped]
        public Booking? Booking { get; set; }

        [Column("order_date")]
        public DateTime OrderDate { get; set; } = DateTime.Now;

        public string Status { get; set; } = "Ordered"; // Ordered, Delivered, Cancelled

        [Column("booking_detail_id")]
        public int? BookingDetailId { get; set; }

        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        public ICollection<Order_Service_Detail>? Details { get; set; }
    }

    // =========================================================
    // Bảng Order_Service_Details: Chi tiết đơn hàng
    // =========================================================
    [Table("Order_Service_Details")]
    public class Order_Service_Detail
    {
        [Key]
        public int Id { get; set; }

        [Column("order_service_id")]
        public int OrderServiceId { get; set; }
        public Order_Service? OrderService { get; set; }

        [Column("service_id")]
        public int ServiceId { get; set; }
        public Service? Service { get; set; }

        public int Quantity { get; set; }

        [Column("unit_price")]
        public decimal UnitPrice { get; set; }
    }
}