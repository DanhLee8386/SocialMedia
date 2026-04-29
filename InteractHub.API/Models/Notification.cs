using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InteractHub.API.Models;

public enum NotificationType
{
    Like,
    Comment,
    FriendRequest,
    FriendAccepted,
    Share,
    System
}

public class Notification
{
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public NotificationType Type { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // The user who receives the notification
    [Required]
    public string UserId { get; set; } = string.Empty;
    [ForeignKey("UserId")]
    public ApplicationUser User { get; set; } = null!;

    // The user who triggered the notification
    public string? TriggeredByUserId { get; set; }
    [ForeignKey("TriggeredByUserId")]
    public ApplicationUser? TriggeredByUser { get; set; }

    // Optional reference to related entity
    public int? PostId { get; set; }
}
