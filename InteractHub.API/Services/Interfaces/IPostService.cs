using InteractHub.API.DTOs;

namespace InteractHub.API.Services.Interfaces;

public interface IPostService
{
    Task<PostDTO> CreateAsync(string userId, CreatePostDTO dto);
    Task<PostDTO?> GetByIdAsync(int id, string? currentUserId);
    Task<PaginatedResponse<PostDTO>> GetFeedAsync(string userId, int page, int pageSize);
    Task<PaginatedResponse<PostDTO>> GetUserPostsAsync(string userId, string? currentUserId, int page, int pageSize);
    Task<PostDTO> UpdateAsync(int id, string userId, UpdatePostDTO dto);
    Task DeleteAsync(int id, string userId);
    Task<PostDTO> ShareAsync(int postId, string userId, SharePostDTO dto);
    Task<PaginatedResponse<PostDTO>> SearchAsync(string query, string? currentUserId, int page, int pageSize);
}
