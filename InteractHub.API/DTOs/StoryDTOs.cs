using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs;

public class CreateStoryDTO
{
    public string? ImageUrl { get; set; }

    [MaxLength(1000)]
    public string? Content { get; set; }
}

public class StoryDTO
{
    public int Id { get; set; }
    public string? ImageUrl { get; set; }
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public UserSearchDTO User { get; set; } = null!;
}
