using InteractHub.API.DTOs;

namespace InteractHub.API.Services.Interfaces;

public interface IUserService
{
    Task<UserDTO?> GetByIdAsync(string id);
    Task<UserDTO> UpdateProfileAsync(string id, UpdateProfileDTO dto);
    Task<string> UpdateAvatarAsync(string id, string avatarUrl);
    Task<string> UpdateCoverPhotoAsync(string id, string coverUrl);
    Task<PaginatedResponse<UserSearchDTO>> SearchUsersAsync(string query, int page, int pageSize);
    Task<List<UserDTO>> GetAllUsersAsync();
    Task ToggleUserActiveAsync(string userId);
}
