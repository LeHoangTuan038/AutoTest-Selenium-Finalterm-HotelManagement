using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Room_Inventory")]
    public class Room_Inventory
    {
        public int Id { get; set; }

        [Column("room_id")]
        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public int EquipmentId { get; set; }
        
        [ForeignKey("EquipmentId")]
        public Equipment? Equipment { get; set; }

        public int Quantity { get; set; }

        [Column("price_if_lost")]
        public decimal PriceIfLost { get; set; }
        
        public string? Note { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("item_type")]
        public string? ItemType { get; set; }
    }
}