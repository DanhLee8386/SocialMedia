using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.Models;

public class Hashtag
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int UsageCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
}

// Many-to-many join table
public class PostHashtag
{
    public int PostId { get; set; }
    public Post Post { get; set; } = null!;

    public int HashtagId { get; set; }
    public Hashtag Hashtag { get; set; } = null!;
}
