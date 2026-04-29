using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs;

public class CreatePostDTO
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
}

public class UpdatePostDTO
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
}

public class PostDTO
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public UserSearchDTO User { get; set; } = null!;
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public PostDTO? OriginalPost { get; set; }
    public List<string> Hashtags { get; set; } = new();
}

public class SharePostDTO
{
    [MaxLength(5000)]
    public string? Content { get; set; }
}
