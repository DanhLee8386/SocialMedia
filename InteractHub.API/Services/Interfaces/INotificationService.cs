using InteractHub.API.DTOs;
using InteractHub.API.Models;

namespace InteractHub.API.Services.Interfaces;

public interface INotificationService
{
    Task CreateAsync(string userId, string triggeredByUserId, NotificationType type, string message, int? postId = null);
    Task<PaginatedResponse<NotificationDTO>> GetUserNotificationsAsync(string userId, int page, int pageSize);
    Task MarkAsReadAsync(int notificationId, string userId);
    Task MarkAllAsReadAsync(string userId);
    Task<int> GetUnreadCountAsync(string userId);
}
