using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    public class OrderRequest
    {
        public int BookingDetailId { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new List<OrderItemRequest>();
    }

    public class OrderItemRequest
    {
        public int ServiceId { get; set; }
        public int Quantity { get; set; }
    }
}
