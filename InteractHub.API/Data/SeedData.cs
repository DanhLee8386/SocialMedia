using Microsoft.AspNetCore.Identity;
using InteractHub.API.Models;

namespace InteractHub.API.Data;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();

        // Create roles
        string[] roles = { "Admin", "User" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Create admin user
        var admin = await userManager.FindByEmailAsync("admin@interacthub.com");
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = "admin",
                Email = "admin@interacthub.com",
                FullName = "Quản Trị Viên",
                Bio = "Quản trị viên hệ thống InteractHub",
                DateOfBirth = new DateTime(1990, 1, 1),
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                EmailConfirmed = true
            };
            await userManager.CreateAsync(admin, "Admin@123");
            await userManager.AddToRoleAsync(admin, "Admin");
        }

        // Create sample users
        var sampleUsers = new[]
        {
            new { UserName = "nguyenvana", Email = "nguyenvana@gmail.com", FullName = "Nguyễn Văn A", Bio = "Yêu thích công nghệ và du lịch" },
            new { UserName = "tranthib", Email = "tranthib@gmail.com", FullName = "Trần Thị B", Bio = "Sinh viên CNTT năm cuối" },
            new { UserName = "levanc", Email = "levanc@gmail.com", FullName = "Lê Văn C", Bio = "Lập trình viên fullstack" },
            new { UserName = "phamthid", Email = "phamthid@gmail.com", FullName = "Phạm Thị D", Bio = "Đam mê nhiếp ảnh" },
            new { UserName = "hoangvane", Email = "hoangvane@gmail.com", FullName = "Hoàng Văn E", Bio = "Blogger về ẩm thực" },
            new { UserName = "dothif", Email = "dothif@gmail.com", FullName = "Đỗ Thị F", Bio = "Designer UI/UX" },
            new { UserName = "vuvang", Email = "vuvang@gmail.com", FullName = "Vũ Văn G", Bio = "DevOps Engineer" },
            new { UserName = "ngothih", Email = "ngothih@gmail.com", FullName = "Ngô Thị H", Bio = "Data Scientist" },
        };

        var createdUsers = new List<ApplicationUser>();
        foreach (var u in sampleUsers)
        {
            var existing = await userManager.FindByEmailAsync(u.Email);
            if (existing == null)
            {
                var user = new ApplicationUser
                {
                    UserName = u.UserName,
                    Email = u.Email,
                    FullName = u.FullName,
                    Bio = u.Bio,
                    DateOfBirth = new DateTime(1995 + Random.Shared.Next(0, 5), Random.Shared.Next(1, 13), Random.Shared.Next(1, 28)),
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 60)),
                    IsActive = true,
                    EmailConfirmed = true
                };
                await userManager.CreateAsync(user, "User@123");
                await userManager.AddToRoleAsync(user, "User");
                createdUsers.Add(user);
            }
            else
            {
                createdUsers.Add(existing);
            }
        }

        // Only seed if no posts exist
        if (context.Posts.Any()) return;

        // Create friendships
        for (int i = 0; i < createdUsers.Count - 1; i++)
        {
            context.Friendships.Add(new Friendship
            {
                RequesterId = createdUsers[i].Id,
                ReceiverId = createdUsers[i + 1].Id,
                Status = FriendshipStatus.Accepted,
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30))
            });
        }

        // Friend admin with first user
        if (createdUsers.Count > 0)
        {
            context.Friendships.Add(new Friendship
            {
                RequesterId = admin.Id,
                ReceiverId = createdUsers[0].Id,
                Status = FriendshipStatus.Accepted,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            });
        }

        await context.SaveChangesAsync();

        // Create posts
        var postContents = new[]
        {
            "Hôm nay trời đẹp quá! Ai muốn đi cà phê không? #cuocsong #caphe",
            "Vừa hoàn thành dự án mới, cảm thấy rất hài lòng! #laptrình #thanhcong",
            "Chia sẻ kinh nghiệm học React cho người mới bắt đầu #react #hoclap",
            "Món ăn ngon nhất hôm nay: Phở Hà Nội! #amthuc #pho",
            "Tips chụp ảnh đẹp với smartphone #nhiephanh #tips",
            "Đang tìm hiểu về AI và Machine Learning #AI #machinelearning",
            "Review laptop mới: rất mạnh và mượt! #congnghe #laptop",
            "Cuối tuần rồi! Kế hoạch gì nào? #cuoituan #giaitri",
            "Học được nhiều điều mới từ khóa học online #hoctap #online",
            "Góc nhìn đẹp từ quán cà phê trên cao #view #saigon",
        };

        var posts = new List<Post>();
        foreach (var user in createdUsers)
        {
            for (int i = 0; i < 2; i++)
            {
                var post = new Post
                {
                    Content = postContents[Random.Shared.Next(postContents.Length)],
                    UserId = user.Id,
                    CreatedAt = DateTime.UtcNow.AddHours(-Random.Shared.Next(1, 100))
                };
                context.Posts.Add(post);
                posts.Add(post);
            }
        }

        await context.SaveChangesAsync();

        // Create likes and comments
        foreach (var post in posts)
        {
            var likers = createdUsers.OrderBy(_ => Random.Shared.Next()).Take(Random.Shared.Next(1, 5));
            foreach (var liker in likers)
            {
                if (liker.Id != post.UserId)
                {
                    context.Likes.Add(new Like { PostId = post.Id, UserId = liker.Id, CreatedAt = DateTime.UtcNow });
                }
            }

            var commentTexts = new[] { "Hay quá!", "Đồng ý!", "Cảm ơn bạn chia sẻ!", "Tuyệt vời!", "Rất hữu ích!" };
            var commenters = createdUsers.OrderBy(_ => Random.Shared.Next()).Take(Random.Shared.Next(1, 3));
            foreach (var commenter in commenters)
            {
                context.Comments.Add(new Comment
                {
                    Content = commentTexts[Random.Shared.Next(commentTexts.Length)],
                    PostId = post.Id,
                    UserId = commenter.Id,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-Random.Shared.Next(1, 500))
                });
            }
        }

        // Create hashtags from posts
        var hashtagNames = new[] { "cuocsong", "caphe", "laptrình", "thanhcong", "react", "hoclap", "amthuc", "pho", "nhiephanh", "tips", "AI", "machinelearning", "congnghe", "laptop", "cuoituan", "giaitri", "hoctap", "online", "view", "saigon" };
        foreach (var name in hashtagNames)
        {
            context.Hashtags.Add(new Hashtag
            {
                Name = name.ToLower(),
                UsageCount = Random.Shared.Next(1, 10),
                CreatedAt = DateTime.UtcNow
            });
        }

        // Create stories
        foreach (var user in createdUsers.Take(4))
        {
            context.Stories.Add(new Story
            {
                Content = $"Story của {user.FullName} - Hôm nay thật tuyệt!",
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow.AddHours(-Random.Shared.Next(1, 20)),
                ExpiresAt = DateTime.UtcNow.AddHours(Random.Shared.Next(4, 24))
            });
        }

        await context.SaveChangesAsync();
    }
}
