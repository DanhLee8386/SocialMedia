using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using InteractHub.API.DTOs;
using InteractHub.API.Hubs;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly IFriendshipService _friendshipService;
    private readonly INotificationService _notificationService;
    private readonly IHubContext<NotificationHub> _hubContext;

    public FriendsController(
        IFriendshipService friendshipService,
        INotificationService notificationService,
        IHubContext<NotificationHub> hubContext)
    {
        _friendshipService = friendshipService;
        _notificationService = notificationService;
        _hubContext = hubContext;
    }

    private string UserId => User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

    /// <summary>
    /// Gửi lời mời kết bạn
    /// </summary>
    [HttpPost("request/{receiverId}")]
    public async Task<ActionResult<ApiResponse<FriendshipDTO>>> SendRequest(string receiverId)
    {
        try
        {
            var friendship = await _friendshipService.SendRequestAsync(UserId, receiverId);
            var userName = User.FindFirst("FullName")?.Value ?? User.Identity?.Name;

            await _notificationService.CreateAsync(receiverId, UserId,
                NotificationType.FriendRequest, $"{userName} đã gửi lời mời kết bạn.");
            await _hubContext.Clients.Group(receiverId).SendAsync("ReceiveNotification",
                new { message = $"{userName} đã gửi lời mời kết bạn.", type = "FriendRequest" });

            return Ok(ApiResponse<FriendshipDTO>.SuccessResponse(friendship, "Đã gửi lời mời kết bạn."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<FriendshipDTO>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Chấp nhận lời mời kết bạn
    /// </summary>
    [HttpPut("accept/{friendshipId}")]
    public async Task<ActionResult<ApiResponse<FriendshipDTO>>> Accept(int friendshipId)
    {
        try
        {
            var friendship = await _friendshipService.AcceptRequestAsync(friendshipId, UserId);
            var userName = User.FindFirst("FullName")?.Value ?? User.Identity?.Name;

            await _notificationService.CreateAsync(friendship.User.Id, UserId,
                NotificationType.FriendAccepted, $"{userName} đã chấp nhận lời mời kết bạn.");
            await _hubContext.Clients.Group(friendship.User.Id).SendAsync("ReceiveNotification",
                new { message = $"{userName} đã chấp nhận lời mời kết bạn.", type = "FriendAccepted" });

            return Ok(ApiResponse<FriendshipDTO>.SuccessResponse(friendship, "Đã chấp nhận lời mời kết bạn."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<FriendshipDTO>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Từ chối lời mời kết bạn
    /// </summary>
    [HttpPut("reject/{friendshipId}")]
    public async Task<ActionResult<ApiResponse<string>>> Reject(int friendshipId)
    {
        try
        {
            await _friendshipService.RejectRequestAsync(friendshipId, UserId);
            return Ok(ApiResponse<string>.SuccessResponse("OK", "Đã từ chối lời mời kết bạn."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Hủy kết bạn
    /// </summary>
    [HttpDelete("{friendId}")]
    public async Task<ActionResult<ApiResponse<string>>> RemoveFriend(string friendId)
    {
        try
        {
            await _friendshipService.RemoveFriendAsync(UserId, friendId);
            return Ok(ApiResponse<string>.SuccessResponse("OK", "Đã hủy kết bạn."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Lấy danh sách bạn bè
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<FriendshipDTO>>>> GetFriends()
    {
        var friends = await _friendshipService.GetFriendsAsync(UserId);
        return Ok(ApiResponse<List<FriendshipDTO>>.SuccessResponse(friends));
    }

    /// <summary>
    /// Lấy lời mời kết bạn đang chờ
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<ApiResponse<List<FriendshipDTO>>>> GetPending()
    {
        var requests = await _friendshipService.GetPendingRequestsAsync(UserId);
        return Ok(ApiResponse<List<FriendshipDTO>>.SuccessResponse(requests));
    }

    /// <summary>
    /// Kiểm tra trạng thái kết bạn
    /// </summary>
    [HttpGet("status/{otherUserId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetStatus(string otherUserId)
    {
        var status = await _friendshipService.GetFriendshipStatusAsync(UserId, otherUserId);
        return Ok(ApiResponse<object>.SuccessResponse(new { status = status ?? "None" }));
    }
}
