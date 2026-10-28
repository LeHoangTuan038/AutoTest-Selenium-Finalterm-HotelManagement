using System.Linq;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Service> Services { get; set; }
        public DbSet<Service_Category> ServiceCategories { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RoomType> RoomTypes { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Equipment> Equipments { get; set; }

        public DbSet<BookingDetail> BookingDetails { get; set; }

        public DbSet<Article> Articles { get; set; }
        public DbSet<Article_Category> ArticleCategories { get; set; }
        public DbSet<Attraction> Attractions { get; set; }
        public DbSet<AttractionImage> AttractionImages { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Order_Service> OrderServices { get; set; }
        public DbSet<Order_Service_Detail> OrderServiceDetails { get; set; }
        public DbSet<LossAndDamage> LossAndDamages { get; set; }

        public DbSet<Amenity> Amenities { get; set; }
        public DbSet<Room_Inventory> RoomInventories { get; set; }
        public DbSet<Room_Image> RoomImages { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<Role_Permission> RolePermissions { get; set; }
        public DbSet<User_Permission> UserPermissions { get; set; }
        public DbSet<User_Role> UserRoles { get; set; }
        public DbSet<Audit_Log> AuditLogs { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Membership> Memberships { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PostComment> PostComments { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<RoleDashboardPeriodState> RoleDashboardPeriodStates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Booking>().ToTable("Bookings");
            modelBuilder.Entity<RoomType>().ToTable("Room_Types");
            modelBuilder.Entity<LossAndDamage>().ToTable("Loss_And_Damages");
            modelBuilder.Entity<BookingDetail>().ToTable("Booking_Details");
            modelBuilder.Entity<Room>().ToTable("Rooms");

            // 🚨 Bổ sung ép tên bảng cho chắc cú
            modelBuilder.Entity<Invoice>().ToTable("Invoices");
            modelBuilder.Entity<Order_Service>().ToTable("Order_Services");
            modelBuilder.Entity<Order_Service_Detail>().ToTable("Order_Service_Details");

            // Giải quyết lỗi Multiple Cascade Paths
            modelBuilder
                .Entity<BookingDetail>()
                .HasOne(bd => bd.RoomType)
                .WithMany()
                .HasForeignKey(bd => bd.RoomTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ép tên bảng trung gian
            modelBuilder.Entity<User_Role>().ToTable("User_Roles");

            // Khai báo khóa chính kép (Composite Key)
            modelBuilder.Entity<User_Role>().HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder
                .Entity<User_Role>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder
                .Entity<User_Role>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);

            modelBuilder.Entity<Role_Permission>().HasKey(x => new { x.RoleId, x.PermissionId });
            modelBuilder.Entity<User_Permission>().HasKey(x => new { x.UserId, x.PermissionId });

            // Explicitly resolve relationship ambiguity for User_Permission
            modelBuilder
                .Entity<User_Permission>()
                .HasOne(up => up.User)
                .WithMany(u => u.UserPermissions)
                .HasForeignKey(up => up.UserId);

            modelBuilder.Entity<Audit_Log>().ToTable("Audit_Logs");

            // Configure Membership relationships
            modelBuilder.Entity<User>()
                .HasOne(u => u.Membership)
                .WithMany()
                .HasForeignKey(u => u.MembershipId);
            
            // Định dạng tất cả kiểu thập phân thành decimal(18,2)
            foreach (
                var property in modelBuilder
                    .Model.GetEntityTypes()
                    .SelectMany(t => t.GetProperties())
                    .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?))
            )
            {
                property.SetColumnType("decimal(18,2)");
            }
        }
    }
}
