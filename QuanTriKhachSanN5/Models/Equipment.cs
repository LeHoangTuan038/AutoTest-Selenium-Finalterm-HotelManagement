using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // CÁI NÀY RẤT QUAN TRỌNG NHA

namespace QuanTriKhachSanN5.Models
{
    [Table("Equipments")]
    public class Equipment
    {
        [Key]
        public int Id { get; set; }
        
        public string ItemCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        
        public int TotalQuantity { get; set; }

        // 👇 ĐÂY CHÍNH LÀ 3 CÁI "BÙA CHÚ" ĐỂ TRỊ LỖI COMPUTED COLUMN 👇
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public int? InUseQuantity { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public int? DamagedQuantity { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public int? InStockQuantity { get; set; }
        // 👆 Hết vùng bùa chú 👆

        public int LiquidatedQuantity { get; set; }
        public decimal BasePrice { get; set; }
        public decimal DefaultPriceIfLost { get; set; }

        public string? Supplier { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        public string? ImageUrl { get; set; } 
    }
}