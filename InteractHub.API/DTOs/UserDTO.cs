namespace InteractHub.API.DTOs;

public class UserDTO
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActive { get; set; }
    public bool IsActive { get; set; }
    public int FriendsCount { get; set; }
    public int PostsCount { get; set; }
}

public class UpdateProfileDTO
{
    public string? FullName { get; set; }
    public string? Bio { get; set; }
    public DateTime? DateOfBirth { get; set; }
}

public class UserSearchDTO
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}
