using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using QuanTriKhachSanN5.API.Services;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;
using QuanTriKhachSanN5.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();

// ============================================================
// 1. CẤU HÌNH HỆ THỐNG (SERVICES)
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactApp",
        policy =>
        {
            policy
                .SetIsOriginAllowed(origin => true)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

builder
    .Services.AddControllers(options =>
        options.Filters.Add<QuanTriKhachSanN5.Filters.AuditLogFilter>()
    )
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// --- DEPENDENCY INJECTION ---
builder.Services.AddScoped<IAmenityService, AmenityService>();
builder.Services.AddScoped<ILossAndDamageService, LossAndDamageService>();
builder.Services.AddScoped<IRoomInventoryService, RoomInventoryService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IRoomTypeService, RoomTypeService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IReceptionService, ReceptionService>();
builder.Services.AddScoped<IHRRBACService, HRRBACService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ICMSService, CMSService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IPostCommentService, PostCommentService>();
builder.Services.AddScoped<IAttractionService, AttractionService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<CheckoutService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuditBatchService, AuditBatchService>();
builder.Services.Configure<VietQRConfig>(builder.Configuration.GetSection("VietQR"));
builder.Services.AddScoped<IVietQRService, VietQRService>();
builder.Services.AddScoped<IMomoService, MomoService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();

// AuditLogFilter registered globally above

// --- AUTHENTICATION & AUTHORIZATION ---
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            ),
            RoleClaimType = ClaimTypes.Role,
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Cấu hình các Policy tương ứng với các quyền (Admin có toàn quyền)
    var permissionPolicies = new[] {
        "VIEW_DASHBOARD", "MANAGE_USERS", "MANAGE_ROLES", "VIEW_USERS", "VIEW_ROLES", "EDIT_ROLES", "CREATE_USERS",
        "MANAGE_ROOMS", "MANAGE_BOOKINGS", "MANAGE_INVOICES", "MANAGE_SERVICES", "VIEW_REPORTS", "MANAGE_CONTENT", "MANAGE_INVENTORY"
    };
    foreach (var perm in permissionPolicies)
    {
        options.AddPolicy(perm, policy => policy.RequireAssertion(ctx =>
            ctx.User.IsInRole("Admin") || ctx.User.HasClaim("Permission", perm)));
    }
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// --- SWAGGER (BẢN RÚT GỌN ĐỂ VƯỢT ẢI BUILD) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type => type.FullName); // Tránh xung đột nếu có class trùng tên ở namespace khác
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// ============================================================
// 2. CẤU HÌNH PIPELINE (MIDDLEWARE)
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ============================================================
// 3. SEED DATA
// ============================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    try
    {
        context.Database.EnsureCreated();
        SeedData(context);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Lỗi Seed Data: {ex.Message}");
    }
}

app.Run();

void SeedData(ApplicationDbContext context)
{
    if (!context.Roles.Any())
    {
        context.Roles.AddRange(
            new Role { Name = "Admin" },
            new Role { Name = "Guest" },
            new Role { Name = "Receptionist" },
            new Role { Name = "Housekeeping" }
        );
        context.SaveChanges();
    }

    if (!context.Permissions.Any())
    {
        context.Permissions.AddRange(
            new Permission { Name = "VIEW_DASHBOARD" },
            new Permission { Name = "MANAGE_USERS" },
            new Permission { Name = "MANAGE_ROLES" },
            new Permission { Name = "VIEW_USERS" },
            new Permission { Name = "VIEW_ROLES" },
            new Permission { Name = "EDIT_ROLES" },
            new Permission { Name = "CREATE_USERS" },
            new Permission { Name = "MANAGE_ROOMS" },
            new Permission { Name = "MANAGE_BOOKINGS" },
            new Permission { Name = "MANAGE_INVOICES" },
            new Permission { Name = "MANAGE_SERVICES" },
            new Permission { Name = "VIEW_REPORTS" },
            new Permission { Name = "MANAGE_CONTENT" },
            new Permission { Name = "MANAGE_INVENTORY" }
        );
        context.SaveChanges();
    }
    else 
    {
        // Thêm các quyền mới nếu chưa có
        var existingPerms = context.Permissions.Select(p => p.Name).ToList();
        var newPerms = new[] {
            "VIEW_DASHBOARD", "MANAGE_USERS", "MANAGE_ROLES", "VIEW_USERS", "VIEW_ROLES", "EDIT_ROLES", "CREATE_USERS",
            "MANAGE_ROOMS", "MANAGE_BOOKINGS", "MANAGE_INVOICES", "MANAGE_SERVICES", "VIEW_REPORTS", "MANAGE_CONTENT", "MANAGE_INVENTORY"
        };
        foreach (var p in newPerms)
        {
            if (!existingPerms.Contains(p))
            {
                context.Permissions.Add(new Permission { Name = p });
            }
        }
        context.SaveChanges();
    }

    // Gán toàn bộ quyền cho role Admin
    var adminRole = context.Roles.FirstOrDefault(r => r.Name == "Admin");
    if (adminRole != null)
    {
        var assignedPermIds = context.RolePermissions
            .Where(rp => rp.RoleId == adminRole.Id)
            .Select(rp => rp.PermissionId)
            .ToList();
        var missingPerms = context.Permissions
            .Where(p => !assignedPermIds.Contains(p.Id))
            .ToList();
        foreach (var p in missingPerms)
        {
            context.RolePermissions.Add(new Role_Permission { RoleId = adminRole.Id, PermissionId = p.Id });
        }
        context.SaveChanges();
    }

    if (!context.Users.Any(u => u.Email == "admin@hotel.com"))
    {
        var admin = new User
        {
            FullName = "Admin",
            Email = "admin@hotel.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
        };
        var receptionist = new User
        {
            FullName = "Receptionist",
            Email = "receptionist@hotel.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
        };

        context.Users.AddRange(admin, receptionist);
        context.SaveChanges();

        var roles = context.Roles.ToList();
        context.UserRoles.AddRange(
            new User_Role { UserId = admin.Id, RoleId = roles.First(r => r.Name == "Admin").Id },
            new User_Role
            {
                UserId = receptionist.Id,
                RoleId = roles.First(r => r.Name == "Receptionist").Id,
            }
        );
        context.SaveChanges();
    }

    // Ensure we have users up to ID 5 so TC_UROLE_002 does not fail due to FK constraints
    while (context.Users.Count() < 5)
    {
        int nextNum = context.Users.Count() + 1;
        context.Users.Add(new User
        {
            FullName = $"Seed User {nextNum}",
            Email = $"seeduser{nextNum}@hotel.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456")
        });
        context.SaveChanges();
    }

    // Tự động sao chép dữ liệu từ bảng Articles (nếu có) sang bảng Posts để hiển thị lên giao diện
    try
    {
        if (context.Articles.Any())
        {
            var articleCategories = context.ArticleCategories.ToList();
            var postCategories = context.Categories.ToList();

            foreach (var artCat in articleCategories)
            {
                if (!postCategories.Any(pc => pc.Name.Equals(artCat.Name, StringComparison.OrdinalIgnoreCase)))
                {
                    var newCat = new Category { Name = artCat.Name, Description = "Nhập từ dữ liệu gốc Articles" };
                    context.Categories.Add(newCat);
                }
            }
            context.SaveChanges();

            // Reload danh sách categories sau khi thêm
            postCategories = context.Categories.ToList();

            var articlesList = context.Articles.Include(a => a.Category).ToList();
            foreach (var art in articlesList)
            {
                if (!context.Posts.Any(p => p.Title == art.Title))
                {
                    var targetCategoryName = art.Category?.Name ?? "Tin tức";
                    var matchedCategory = postCategories.FirstOrDefault(pc => pc.Name.Equals(targetCategoryName, StringComparison.OrdinalIgnoreCase)) 
                                          ?? postCategories.FirstOrDefault();

                    if (matchedCategory != null)
                    {
                        var newPost = new Post
                        {
                            Title = art.Title,
                            Content = art.Content,
                            Excerpt = art.Content.Length > 200 ? art.Content.Substring(0, 197) + "..." : art.Content,
                            ImageUrl = art.ThumbnailUrl,
                            IsPublished = true,
                            IsHot = art.Title.Contains("mới") || art.Title.Contains("khuyến mãi") || art.Title.Contains("nổi bật"),
                            CategoryId = matchedCategory.Id,
                            CreatedAt = art.PublishedAt != default ? art.PublishedAt : DateTime.UtcNow
                        };
                        context.Posts.Add(newPost);
                    }
                }
            }
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Lỗi khi đồng bộ Articles sang Posts: {ex.Message}");
    }
}
