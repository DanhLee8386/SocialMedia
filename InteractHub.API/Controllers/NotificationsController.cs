using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InteractHub.API.DTOs;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private string UserId => User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

    /// <summary>
    /// Lấy danh sách thông báo
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<NotificationDTO>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var notifications = await _notificationService.GetUserNotificationsAsync(UserId, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<NotificationDTO>>.SuccessResponse(notifications));
    }

    /// <summary>
    /// Số thông báo chưa đọc
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        var count = await _notificationService.GetUnreadCountAsync(UserId);
        return Ok(ApiResponse<int>.SuccessResponse(count));
    }

    /// <summary>
    /// Đánh dấu đã đọc 1 thông báo
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<string>>> MarkAsRead(int id)
    {
        await _notificationService.MarkAsReadAsync(id, UserId);
        return Ok(ApiResponse<string>.SuccessResponse("OK", "Đã đánh dấu đã đọc."));
    }

    /// <summary>
    /// Đánh dấu đã đọc tất cả
    /// </summary>
    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<string>>> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(UserId);
        return Ok(ApiResponse<string>.SuccessResponse("OK", "Đã đánh dấu tất cả đã đọc."));
    }
}
