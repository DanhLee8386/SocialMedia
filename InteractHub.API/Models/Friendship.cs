using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InteractHub.API.Models;

public enum FriendshipStatus
{
    Pending,
    Accepted,
    Rejected
}

public class Friendship
{
    public int Id { get; set; }

    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Requester
    [Required]
    public string RequesterId { get; set; } = string.Empty;
    [ForeignKey("RequesterId")]
    public ApplicationUser Requester { get; set; } = null!;

    // Receiver
    [Required]
    public string ReceiverId { get; set; } = string.Empty;
    [ForeignKey("ReceiverId")]
    public ApplicationUser Receiver { get; set; } = null!;
}
