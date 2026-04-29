using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.DTOs;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<UserDTO?> GetByIdAsync(string id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return null;

        var friendsCount = await _context.Friendships
            .CountAsync(f => (f.RequesterId == id || f.ReceiverId == id) && f.Status == FriendshipStatus.Accepted);
        var postsCount = await _context.Posts.CountAsync(p => p.UserId == id && !p.IsDeleted);

        return new UserDTO
        {
            Id = user.Id,
            UserName = user.UserName!,
            Email = user.Email!,
            FullName = user.FullName,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            CoverPhotoUrl = user.CoverPhotoUrl,
            CreatedAt = user.CreatedAt,
            LastActive = user.LastActive,
            IsActive = user.IsActive,
            FriendsCount = friendsCount,
            PostsCount = postsCount
        };
    }

    public async Task<UserDTO> UpdateProfileAsync(string id, UpdateProfileDTO dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) throw new InvalidOperationException("Không tìm thấy người dùng.");

        if (dto.FullName != null) user.FullName = dto.FullName;
        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.DateOfBirth.HasValue) user.DateOfBirth = dto.DateOfBirth.Value;

        await _context.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<string> UpdateAvatarAsync(string id, string avatarUrl)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) throw new InvalidOperationException("Không tìm thấy người dùng.");

        user.AvatarUrl = avatarUrl;
        await _context.SaveChangesAsync();
        return avatarUrl;
    }

    public async Task<string> UpdateCoverPhotoAsync(string id, string coverUrl)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) throw new InvalidOperationException("Không tìm thấy người dùng.");

        user.CoverPhotoUrl = coverUrl;
        await _context.SaveChangesAsync();
        return coverUrl;
    }

    public async Task<PaginatedResponse<UserSearchDTO>> SearchUsersAsync(string query, int page, int pageSize)
    {
        var usersQuery = _context.Users
            .Where(u => u.IsActive && (
                u.UserName!.Contains(query) ||
                u.FullName.Contains(query) ||
                u.Email!.Contains(query)
            ))
            .OrderBy(u => u.FullName);

        var totalCount = await usersQuery.CountAsync();

        var users = await usersQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserSearchDTO
            {
                Id = u.Id,
                UserName = u.UserName!,
                FullName = u.FullName,
                AvatarUrl = u.AvatarUrl
            })
            .ToListAsync();

        return new PaginatedResponse<UserSearchDTO>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<UserDTO>> GetAllUsersAsync()
    {
        return await _context.Users
            .Select(u => new UserDTO
            {
                Id = u.Id,
                UserName = u.UserName!,
                Email = u.Email!,
                FullName = u.FullName,
                Bio = u.Bio,
                AvatarUrl = u.AvatarUrl,
                CreatedAt = u.CreatedAt,
                LastActive = u.LastActive,
                IsActive = u.IsActive
            })
            .ToListAsync();
    }

    public async Task ToggleUserActiveAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new InvalidOperationException("Không tìm thấy người dùng.");

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();
    }
}
