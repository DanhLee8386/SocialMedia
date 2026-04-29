using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.DTOs;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;
using System.Text.RegularExpressions;

namespace InteractHub.API.Services;

public class PostService : IPostService
{
    private readonly ApplicationDbContext _context;

    public PostService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PostDTO> CreateAsync(string userId, CreatePostDTO dto)
    {
        var post = new Post
        {
            Content = dto.Content,
            ImageUrl = dto.ImageUrl,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Extract and save hashtags
        await ExtractAndSaveHashtags(post);

        return await GetByIdAsync(post.Id, userId) ?? throw new InvalidOperationException("Lỗi tạo bài viết.");
    }

    public async Task<PostDTO?> GetByIdAsync(int id, string? currentUserId)
    {
        var post = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .Include(p => p.Shares)
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
            .Include(p => p.OriginalPost).ThenInclude(op => op!.User)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (post == null) return null;

        return MapToDTO(post, currentUserId);
    }

    public async Task<PaginatedResponse<PostDTO>> GetFeedAsync(string userId, int page, int pageSize)
    {
        // Get friend IDs
        var friendIds = await _context.Friendships
            .Where(f => (f.RequesterId == userId || f.ReceiverId == userId) && f.Status == FriendshipStatus.Accepted)
            .Select(f => f.RequesterId == userId ? f.ReceiverId : f.RequesterId)
            .ToListAsync();

        friendIds.Add(userId); // Include own posts

        // Nếu chưa có bạn bè, hiện tất cả bài viết công khai
        IQueryable<Post> query;
        if (friendIds.Count <= 1)
        {
            query = _context.Posts
                .Where(p => !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt);
        }
        else
        {
            query = _context.Posts
                .Where(p => friendIds.Contains(p.UserId) && !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt);
        }

        var totalCount = await query.CountAsync();

        var posts = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .Include(p => p.Shares)
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
            .Include(p => p.OriginalPost).ThenInclude(op => op!.User)
            .ToListAsync();

        return new PaginatedResponse<PostDTO>
        {
            Items = posts.Select(p => MapToDTO(p, userId)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PaginatedResponse<PostDTO>> GetUserPostsAsync(string userId, string? currentUserId, int page, int pageSize)
    {
        var query = _context.Posts
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();

        var posts = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .Include(p => p.Shares)
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
            .Include(p => p.OriginalPost).ThenInclude(op => op!.User)
            .ToListAsync();

        return new PaginatedResponse<PostDTO>
        {
            Items = posts.Select(p => MapToDTO(p, currentUserId)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PostDTO> UpdateAsync(int id, string userId, UpdatePostDTO dto)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && !p.IsDeleted);
        if (post == null) throw new InvalidOperationException("Không tìm thấy bài viết.");

        post.Content = dto.Content;
        post.UpdatedAt = DateTime.UtcNow;

        // Re-extract hashtags
        var oldHashtags = await _context.PostHashtags.Where(ph => ph.PostId == id).ToListAsync();
        _context.PostHashtags.RemoveRange(oldHashtags);
        await _context.SaveChangesAsync();
        await ExtractAndSaveHashtags(post);

        return await GetByIdAsync(post.Id, userId) ?? throw new InvalidOperationException("Lỗi cập nhật bài viết.");
    }

    public async Task DeleteAsync(int id, string userId)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (post == null) throw new InvalidOperationException("Không tìm thấy bài viết.");

        // Allow owner or admin to delete
        if (post.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa bài viết này.");
        }

        post.IsDeleted = true;
        await _context.SaveChangesAsync();
    }

    public async Task<PostDTO> ShareAsync(int postId, string userId, SharePostDTO dto)
    {
        var originalPost = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);
        if (originalPost == null) throw new InvalidOperationException("Không tìm thấy bài viết gốc.");

        var sharedPost = new Post
        {
            Content = dto.Content ?? "",
            UserId = userId,
            OriginalPostId = originalPost.OriginalPostId ?? postId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Posts.Add(sharedPost);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(sharedPost.Id, userId) ?? throw new InvalidOperationException("Lỗi chia sẻ bài viết.");
    }

    public async Task<PaginatedResponse<PostDTO>> SearchAsync(string query, string? currentUserId, int page, int pageSize)
    {
        var postsQuery = _context.Posts
            .Where(p => !p.IsDeleted && (
                p.Content.Contains(query) ||
                p.PostHashtags.Any(ph => ph.Hashtag.Name.Contains(query))
            ))
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await postsQuery.CountAsync();

        var posts = await postsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .Include(p => p.Shares)
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
            .ToListAsync();

        return new PaginatedResponse<PostDTO>
        {
            Items = posts.Select(p => MapToDTO(p, currentUserId)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private async Task ExtractAndSaveHashtags(Post post)
    {
        var hashtagPattern = new Regex(@"#(\w+)");
        var matches = hashtagPattern.Matches(post.Content);

        foreach (Match match in matches)
        {
            var tagName = match.Groups[1].Value.ToLower();
            var hashtag = await _context.Hashtags.FirstOrDefaultAsync(h => h.Name == tagName);

            if (hashtag == null)
            {
                hashtag = new Hashtag { Name = tagName, CreatedAt = DateTime.UtcNow };
                _context.Hashtags.Add(hashtag);
                await _context.SaveChangesAsync();
            }

            hashtag.UsageCount++;

            if (!await _context.PostHashtags.AnyAsync(ph => ph.PostId == post.Id && ph.HashtagId == hashtag.Id))
            {
                _context.PostHashtags.Add(new PostHashtag { PostId = post.Id, HashtagId = hashtag.Id });
            }
        }
        await _context.SaveChangesAsync();
    }

    private static PostDTO MapToDTO(Post post, string? currentUserId)
    {
        return new PostDTO
        {
            Id = post.Id,
            Content = post.Content,
            ImageUrl = post.ImageUrl,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            User = new UserSearchDTO
            {
                Id = post.User.Id,
                UserName = post.User.UserName!,
                FullName = post.User.FullName,
                AvatarUrl = post.User.AvatarUrl
            },
            LikesCount = post.Likes.Count,
            CommentsCount = post.Comments.Count,
            SharesCount = post.Shares.Count,
            IsLikedByCurrentUser = currentUserId != null && post.Likes.Any(l => l.UserId == currentUserId),
            Hashtags = post.PostHashtags.Select(ph => ph.Hashtag.Name).ToList(),
            OriginalPost = post.OriginalPost != null ? new PostDTO
            {
                Id = post.OriginalPost.Id,
                Content = post.OriginalPost.Content,
                ImageUrl = post.OriginalPost.ImageUrl,
                CreatedAt = post.OriginalPost.CreatedAt,
                User = new UserSearchDTO
                {
                    Id = post.OriginalPost.User.Id,
                    UserName = post.OriginalPost.User.UserName!,
                    FullName = post.OriginalPost.User.FullName,
                    AvatarUrl = post.OriginalPost.User.AvatarUrl
                }
            } : null
        };
    }
}
