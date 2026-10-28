namespace QuanTriKhachSanN5.Models
{
    public class User_Permission
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public int PermissionId { get; set; }
        public Permission Permission { get; set; }
    }
}
