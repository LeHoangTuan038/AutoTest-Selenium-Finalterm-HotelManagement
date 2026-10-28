using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Data;

public static class SeedData
{
    /// <summary>
    /// Khởi chạy dữ liệu mẫu cho database
    /// </summary>
    public static void Initialize(ApplicationDbContext context)
    {
        // Tránh thêm dữ liệu trùng lặp
        if (context.RoomTypes.Any())
            return;

        // ============ SEED ROOM TYPES ============
        var roomTypes = new List<RoomType>
        {
            new RoomType
            {
                Name = "Phòng Tiêu chuẩn",
                Description = "Phòng 1 giường đơn, tiện ích cơ bản, phù hợp cho khách lẻ",
                BasePrice = 500000,
                CapacityAdults = 1,
                CapacityChildren = 0
            },
            new RoomType
            {
                Name = "Phòng Đôi",
                Description = "Phòng với 1 giường đôi, view biển, phù hợp cho cặp đôi",
                BasePrice = 800000,
                CapacityAdults = 2,
                CapacityChildren = 0
            },
            new RoomType
            {
                Name = "Phòng Gia đình",
                Description = "Phòng rộng 2 giường, bếp nhỏ, phù hợp cho gia đình 3-4 người",
                BasePrice = 1200000,
                CapacityAdults = 2,
                CapacityChildren = 2
            },
            new RoomType
            {
                Name = "Phòng Suite Deluxe",
                Description = "Phòng cao cấp với phòng khách riêng, view biển tuyệt vời",
                BasePrice = 2000000,
                CapacityAdults = 4,
                CapacityChildren = 0
            }
        };

        context.RoomTypes.AddRange(roomTypes);
        context.SaveChanges();

        // ============ SEED ROOMS ============
        var rooms = new List<Room>();
        foreach (var roomType in roomTypes)
        {
            for (int i = 1; i <= 5; i++)
            {
                rooms.Add(new Room
                {
                    RoomNumber = $"{roomType.Id * 100 + i}",
                    RoomTypeId = roomType.Id,
                    Status = "Available"
                });
            }
        }

        context.Rooms.AddRange(rooms);
        context.SaveChanges();

        // ============ SEED CATEGORIES ============
        var categories = new List<Category>
        {
            new Category
            {
                Name = "Tin tức",
                Description = "Tin tức và cập nhật về khách sạn"
            },
            new Category
            {
                Name = "Sự kiện",
                Description = "Các sự kiện và hoạt động tại khách sạn"
            },
            new Category
            {
                Name = "Du lịch",
                Description = "Thông tin du lịch địa phương"
            }
        };

        context.Categories.AddRange(categories);
        context.SaveChanges();

        // ============ SEED POSTS ============
        var posts = new List<Post>
        {
            new Post
            {
                Title = "Chào mừng đến Nha Trang",
                Content = "Khách sạn chúng tôi chào mừng bạn đến với thành phố biển xinh đẹp này. Chúng tôi cam kết mang lại trải nghiệm tuyệt vời nhất cho bạn.",
                CategoryId = categories[0].Id
            },
            new Post
            {
                Title = "Lễ hội mùa hè 2026",
                Content = "Tham gia các hoạt động vui nhộn và ưu đãi đặc biệt vào mùa hè. Đừng bỏ lỡ cơ hội tận hưởng kỳ nghỉ tuyệt vời với nhiều ưu đãi hấp dẫn.",
                CategoryId = categories[1].Id
            },
            new Post
            {
                Title = "Top 5 địa điểm du lịch Nha Trang",
                Content = "Khám phá những điểm đến không thể bỏ lỡ khi đến Nha Trang. Từ những bãi biển đẹp nhất đến những di tích lịch sử, Nha Trang có rất nhiều để khám phá.",
                CategoryId = categories[2].Id
            }
        };

        context.Posts.AddRange(posts);
        context.SaveChanges();

        // ============ SEED ATTRACTIONS ============
        var attractions = new List<Attraction>
        {
            new Attraction
            {
                Name = "Tháp Trầm Hương",
                Description = "Tháp cổ kính 9 tầng với kiến trúc châu Á đặc sắc, nằm trên đỉnh đồi Trầm Hương",
                Address = "Nha Trang",
                Latitude = 12.2427m,
                Longitude = 109.2032m,
                DistanceKm = 1.2m,
                IsActive = true
            },
            new Attraction
            {
                Name = "Bãi biển Nha Trang",
                Description = "Bãi biển nổi tiếng with cát trắng và nước trong xanh, lý tưởng cho bơi lội",
                Address = "Nha Trang",
                Latitude = 12.2485m,
                Longitude = 109.1800m,
                DistanceKm = 0.5m,
                IsActive = true
            },
            new Attraction
            {
                Name = "Núi Niêm",
                Description = "Ngọn núi ngoài khơi với mệnh danh 'bảo tàng địa chất tự nhiên'",
                Address = "Nha Trang",
                Latitude = 12.3600m,
                Longitude = 109.1200m,
                DistanceKm = 15.0m,
                IsActive = true
            },
            new Attraction
            {
                Name = "Lâu đài nước Tràm Huơng",
                Description = "Công viên nước hiện đại với nhiều trò chơi thú vị cho gia đình",
                Address = "Nha Trang",
                Latitude = 12.2100m,
                Longitude = 109.1900m,
                DistanceKm = 5.0m,
                IsActive = true
            },
            new Attraction
            {
                Name = "Nhà thờ Đá",
                Description = "Nhà thờ được xây dựng bằng đá, là một trong những công trình kiến trúc độc đáo",
                Address = "Nha Trang",
                Latitude = 12.2347m,
                Longitude = 109.1956m,
                DistanceKm = 2.3m,
                IsActive = true
            }
        };

        context.Attractions.AddRange(attractions);
        context.SaveChanges();

        // ============ SEED CATEGORIES AND POSTS (Already done above) ============

        Console.WriteLine("✅ Dữ liệu mẫu đã được khởi chạy thành công!");
        Console.WriteLine($"   - {roomTypes.Count} loại phòng");
        Console.WriteLine($"   - {rooms.Count} phòng");
        Console.WriteLine($"   - {categories.Count} danh mục");
        Console.WriteLine($"   - {posts.Count} bài viết");
        Console.WriteLine($"   - {attractions.Count} điểm du lịch");
    }
}

