using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.DTOs;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(string userId, string triggeredByUserId, NotificationType type, string message, int? postId = null)
    {
        if (userId == triggeredByUserId) return; // Don't notify yourself

        var notification = new Notification
        {
            UserId = userId,
            TriggeredByUserId = triggeredByUserId,
            Type = type,
            Message = message,
            PostId = postId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<PaginatedResponse<NotificationDTO>> GetUserNotificationsAsync(string userId, int page, int pageSize)
    {
        var query = _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();

        var notifications = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(n => n.TriggeredByUser)
            .Select(n => new NotificationDTO
            {
                Id = n.Id,
                Message = n.Message,
                Type = n.Type.ToString(),
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                PostId = n.PostId,
                TriggeredByUser = n.TriggeredByUser != null ? new UserSearchDTO
                {
                    Id = n.TriggeredByUser.Id,
                    UserName = n.TriggeredByUser.UserName!,
                    FullName = n.TriggeredByUser.FullName,
                    AvatarUrl = n.TriggeredByUser.AvatarUrl
                } : null
            })
            .ToListAsync();

        return new PaginatedResponse<NotificationDTO>
        {
            Items = notifications,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task MarkAsReadAsync(int notificationId, string userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notification == null) return;

        notification.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
            n.IsRead = true;

        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
    }
}
