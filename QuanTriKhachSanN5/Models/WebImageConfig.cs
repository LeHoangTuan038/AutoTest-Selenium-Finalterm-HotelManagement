using System;
using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.Models
{
    public class WebImageConfig
    {
        [Key]
        public int Id { get; set; }

        public string? LogoImgUrl { get; set; }
        public string? HeroBannerImgUrl { get; set; }
        public string? LoginBackgroundImgUrl { get; set; }
        public string? HotelName { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
}
