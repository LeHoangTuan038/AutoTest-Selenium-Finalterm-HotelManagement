using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Amenities")]
    public class Amenity
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        [Column("icon_url")]
        public string? IconUrl { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        //them cot de lam kho vat tu

        [Column("category")]
        public string? Category { get; set; }

        [Column("unit")]
        public string? Unit { get; set; }

        [Column("total_quantity")]
        public int TotalQuantity { get; set; }

        [Column("import_price")]
        public decimal? ImportPrice { get; set; }

        [Column("compensation_price")]
        public decimal? CompensationPrice { get; set; }

        [Column("supplier")]
        public string? Supplier { get; set; }

        [Column("image_url")]
        public string? ImageUrl { get; set; }
    }
}
