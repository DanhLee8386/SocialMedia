namespace InteractHub.API.DTOs;

public class NotificationDTO
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserSearchDTO? TriggeredByUser { get; set; }
    public int? PostId { get; set; }
}
