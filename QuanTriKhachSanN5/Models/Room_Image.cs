using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Room_Images")]
    public class Room_Image
    {
        [Column("id")]
        public int Id { get; set; }

        // CHÍ MẠNG LÀ ĐÂY: Kết nối với bảng RoomType chứ không phải Room
        [Column("room_type_id")]
        public int RoomTypeId { get; set; }
        public RoomType? RoomType { get; set; }

        [Column("image_url")]
        public string ImageUrl { get; set; } = string.Empty;

        [Column("is_primary")]
        public bool IsPrimary { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }
}
