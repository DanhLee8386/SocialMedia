using InteractHub.API.DTOs;

namespace InteractHub.API.Services.Interfaces;

public interface ICommentService
{
    Task<CommentDTO> CreateAsync(int postId, string userId, CreateCommentDTO dto);
    Task<PaginatedResponse<CommentDTO>> GetByPostIdAsync(int postId, int page, int pageSize);
    Task DeleteAsync(int commentId, string userId);
}
