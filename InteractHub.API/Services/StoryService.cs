using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.DTOs;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Services;

public class StoryService : IStoryService
{
    private readonly ApplicationDbContext _context;

    public StoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<StoryDTO> CreateAsync(string userId, CreateStoryDTO dto)
    {
        var story = new Story
        {
            Content = dto.Content,
            ImageUrl = dto.ImageUrl,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        _context.Stories.Add(story);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);
        return new StoryDTO
        {
            Id = story.Id,
            Content = story.Content,
            ImageUrl = story.ImageUrl,
            CreatedAt = story.CreatedAt,
            ExpiresAt = story.ExpiresAt,
            User = new UserSearchDTO
            {
                Id = user!.Id,
                UserName = user.UserName!,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl
            }
        };
    }

    public async Task<List<StoryDTO>> GetFriendsStoriesAsync(string userId)
    {
        var friendIds = await _context.Friendships
            .Where(f => (f.RequesterId == userId || f.ReceiverId == userId) && f.Status == FriendshipStatus.Accepted)
            .Select(f => f.RequesterId == userId ? f.ReceiverId : f.RequesterId)
            .ToListAsync();

        friendIds.Add(userId);

        return await _context.Stories
            .Where(s => friendIds.Contains(s.UserId) && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .Include(s => s.User)
            .Select(s => new StoryDTO
            {
                Id = s.Id,
                Content = s.Content,
                ImageUrl = s.ImageUrl,
                CreatedAt = s.CreatedAt,
                ExpiresAt = s.ExpiresAt,
                User = new UserSearchDTO
                {
                    Id = s.User.Id,
                    UserName = s.User.UserName!,
                    FullName = s.User.FullName,
                    AvatarUrl = s.User.AvatarUrl
                }
            })
            .ToListAsync();
    }

    public async Task<List<StoryDTO>> GetUserStoriesAsync(string userId)
    {
        return await _context.Stories
            .Where(s => s.UserId == userId && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .Include(s => s.User)
            .Select(s => new StoryDTO
            {
                Id = s.Id,
                Content = s.Content,
                ImageUrl = s.ImageUrl,
                CreatedAt = s.CreatedAt,
                ExpiresAt = s.ExpiresAt,
                User = new UserSearchDTO
                {
                    Id = s.User.Id,
                    UserName = s.User.UserName!,
                    FullName = s.User.FullName,
                    AvatarUrl = s.User.AvatarUrl
                }
            })
            .ToListAsync();
    }

    public async Task DeleteAsync(int storyId, string userId)
    {
        var story = await _context.Stories.FirstOrDefaultAsync(s => s.Id == storyId && s.UserId == userId);
        if (story == null) throw new InvalidOperationException("Không tìm thấy story.");

        _context.Stories.Remove(story);
        await _context.SaveChangesAsync();
    }
}
