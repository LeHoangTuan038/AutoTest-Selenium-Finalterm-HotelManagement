using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Bookings")]
    public class Booking
    {
        public int Id { get; set; }

        [Column("user_id")]
        public int? UserId { get; set; }

        [Column("guest_name")]
        public string? GuestName { get; set; }

        [Column("guest_phone")]
        public string? GuestPhone { get; set; }

        [Column("guest_email")]
        public string? GuestEmail { get; set; }

        [Column("booking_code")]
        public string BookingCode { get; set; } = string.Empty;

        [Column("voucher_id")]
        public int? VoucherId { get; set; }

        [Column("status")]
        public string? Status { get; set; } // Vd: Pending, Confirmed, Checked_in, Completed, Cancelled
        
        [Column("DepositAmount")]
        public decimal? DepositAmount { get; set; } = 0m;

        // Navigation property (1 Booking có nhiều Chi tiết đặt phòng)
        public ICollection<BookingDetail>? BookingDetails { get; set; }
    }
}
