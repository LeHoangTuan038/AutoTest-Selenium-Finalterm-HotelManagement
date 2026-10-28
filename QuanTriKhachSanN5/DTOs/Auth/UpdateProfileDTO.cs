using System;

namespace QuanTriKhachSanN5.DTOs.Auth
{
    public class UpdateProfileDTO
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
