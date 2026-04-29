using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InteractHub.API.Models;

public enum ReportStatus
{
    Pending,
    Reviewed,
    Resolved,
    Dismissed
}

public class PostReport
{
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    public ReportStatus Status { get; set; } = ReportStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReviewedAt { get; set; }

    // Foreign keys
    [Required]
    public string UserId { get; set; } = string.Empty;
    [ForeignKey("UserId")]
    public ApplicationUser User { get; set; } = null!;

    public int PostId { get; set; }
    [ForeignKey("PostId")]
    public Post Post { get; set; } = null!;
}
