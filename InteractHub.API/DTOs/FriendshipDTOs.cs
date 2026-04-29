namespace InteractHub.API.DTOs;

public class FriendshipDTO
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public UserSearchDTO User { get; set; } = null!;
}
