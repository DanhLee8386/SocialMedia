using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Services;

public class LikeService : ILikeService
{
    private readonly ApplicationDbContext _context;

    public LikeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ToggleLikeAsync(int postId, string userId)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);
        if (post == null) throw new InvalidOperationException("Không tìm thấy bài viết.");

        var existingLike = await _context.Likes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

        if (existingLike != null)
        {
            _context.Likes.Remove(existingLike);
            await _context.SaveChangesAsync();
            return false; // Unliked
        }

        _context.Likes.Add(new Like
        {
            PostId = postId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return true; // Liked
    }

    public async Task<int> GetLikeCountAsync(int postId)
    {
        return await _context.Likes.CountAsync(l => l.PostId == postId);
    }
}
