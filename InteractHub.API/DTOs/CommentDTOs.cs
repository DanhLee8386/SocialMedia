using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs;

public class CreateCommentDTO
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
}

public class CommentDTO
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public UserSearchDTO User { get; set; } = null!;
}
