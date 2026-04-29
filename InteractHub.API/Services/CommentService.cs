using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.DTOs;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Services;

public class CommentService : ICommentService
{
    private readonly ApplicationDbContext _context;

    public CommentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CommentDTO> CreateAsync(int postId, string userId, CreateCommentDTO dto)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);
        if (post == null) throw new InvalidOperationException("Không tìm thấy bài viết.");

        var comment = new Comment
        {
            Content = dto.Content,
            PostId = postId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);
        return new CommentDTO
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            User = new UserSearchDTO
            {
                Id = user!.Id,
                UserName = user.UserName!,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl
            }
        };
    }

    public async Task<PaginatedResponse<CommentDTO>> GetByPostIdAsync(int postId, int page, int pageSize)
    {
        var query = _context.Comments
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreatedAt);

        var totalCount = await query.CountAsync();

        var comments = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(c => c.User)
            .Select(c => new CommentDTO
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                User = new UserSearchDTO
                {
                    Id = c.User.Id,
                    UserName = c.User.UserName!,
                    FullName = c.User.FullName,
                    AvatarUrl = c.User.AvatarUrl
                }
            })
            .ToListAsync();

        return new PaginatedResponse<CommentDTO>
        {
            Items = comments,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task DeleteAsync(int commentId, string userId)
    {
        var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment == null) throw new InvalidOperationException("Không tìm thấy bình luận.");
        if (comment.UserId != userId) throw new UnauthorizedAccessException("Bạn không có quyền xóa bình luận này.");

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
    }
}
