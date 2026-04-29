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
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILikeService _likeService;
    private readonly ICommentService _commentService;
    private readonly INotificationService _notificationService;
    private readonly IHubContext<NotificationHub> _hubContext;

    public PostsController(
        IPostService postService,
        ILikeService likeService,
        ICommentService commentService,
        INotificationService notificationService,
        IHubContext<NotificationHub> hubContext)
    {
        _postService = postService;
        _likeService = likeService;
        _commentService = commentService;
        _notificationService = notificationService;
        _hubContext = hubContext;
    }

    private string UserId => User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

    /// <summary>
    /// Tạo bài viết mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PostDTO>>> Create([FromBody] CreatePostDTO dto)
    {
        var post = await _postService.CreateAsync(UserId, dto);
        return CreatedAtAction(nameof(GetById), new { id = post.Id },
            ApiResponse<PostDTO>.SuccessResponse(post, "Đăng bài thành công."));
    }

    /// <summary>
    /// Lấy bài viết theo ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PostDTO>>> GetById(int id)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var post = await _postService.GetByIdAsync(id, currentUserId);
        if (post == null)
            return NotFound(ApiResponse<PostDTO>.ErrorResponse("Không tìm thấy bài viết."));

        return Ok(ApiResponse<PostDTO>.SuccessResponse(post));
    }

    /// <summary>
    /// Lấy news feed
    /// </summary>
    [HttpGet("feed")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<PostDTO>>>> GetFeed(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var feed = await _postService.GetFeedAsync(UserId, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<PostDTO>>.SuccessResponse(feed));
    }

    /// <summary>
    /// Lấy bài viết của user
    /// </summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<PostDTO>>>> GetUserPosts(
        string userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var posts = await _postService.GetUserPostsAsync(userId, currentUserId, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<PostDTO>>.SuccessResponse(posts));
    }

    /// <summary>
    /// Cập nhật bài viết
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PostDTO>>> Update(int id, [FromBody] UpdatePostDTO dto)
    {
        try
        {
            var post = await _postService.UpdateAsync(id, UserId, dto);
            return Ok(ApiResponse<PostDTO>.SuccessResponse(post, "Cập nhật bài viết thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<PostDTO>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Xóa bài viết
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id)
    {
        try
        {
            await _postService.DeleteAsync(id, UserId);
            return Ok(ApiResponse<string>.SuccessResponse("OK", "Xóa bài viết thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Like/Unlike bài viết
    /// </summary>
    [HttpPost("{id}/like")]
    public async Task<ActionResult<ApiResponse<object>>> ToggleLike(int id)
    {
        try
        {
            var liked = await _likeService.ToggleLikeAsync(id, UserId);
            var count = await _likeService.GetLikeCountAsync(id);

            if (liked)
            {
                var post = await _postService.GetByIdAsync(id, UserId);
                if (post != null && post.User.Id != UserId)
                {
                    var userName = User.FindFirst("FullName")?.Value ?? User.Identity?.Name;
                    await _notificationService.CreateAsync(post.User.Id, UserId,
                        NotificationType.Like, $"{userName} đã thích bài viết của bạn.", id);
                    await _hubContext.Clients.Group(post.User.Id).SendAsync("ReceiveNotification",
                        new { message = $"{userName} đã thích bài viết của bạn.", type = "Like", postId = id });
                }
            }

            return Ok(ApiResponse<object>.SuccessResponse(
                new { liked, likesCount = count },
                liked ? "Đã thích." : "Đã bỏ thích."));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Thêm bình luận
    /// </summary>
    [HttpPost("{id}/comments")]
    public async Task<ActionResult<ApiResponse<CommentDTO>>> AddComment(int id, [FromBody] CreateCommentDTO dto)
    {
        try
        {
            var comment = await _commentService.CreateAsync(id, UserId, dto);

            var post = await _postService.GetByIdAsync(id, UserId);
            if (post != null && post.User.Id != UserId)
            {
                var userName = User.FindFirst("FullName")?.Value ?? User.Identity?.Name;
                await _notificationService.CreateAsync(post.User.Id, UserId,
                    NotificationType.Comment, $"{userName} đã bình luận bài viết của bạn.", id);
                await _hubContext.Clients.Group(post.User.Id).SendAsync("ReceiveNotification",
                    new { message = $"{userName} đã bình luận bài viết của bạn.", type = "Comment", postId = id });
            }

            return CreatedAtAction(nameof(GetComments), new { id },
                ApiResponse<CommentDTO>.SuccessResponse(comment, "Bình luận thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<CommentDTO>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Lấy danh sách bình luận
    /// </summary>
    [HttpGet("{id}/comments")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<CommentDTO>>>> GetComments(
        int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var comments = await _commentService.GetByPostIdAsync(id, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<CommentDTO>>.SuccessResponse(comments));
    }

    /// <summary>
    /// Xóa bình luận
    /// </summary>
    [HttpDelete("comments/{commentId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteComment(int commentId)
    {
        try
        {
            await _commentService.DeleteAsync(commentId, UserId);
            return Ok(ApiResponse<string>.SuccessResponse("OK", "Xóa bình luận thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Chia sẻ bài viết
    /// </summary>
    [HttpPost("{id}/share")]
    public async Task<ActionResult<ApiResponse<PostDTO>>> Share(int id, [FromBody] SharePostDTO dto)
    {
        try
        {
            var post = await _postService.ShareAsync(id, UserId, dto);

            var originalPost = await _postService.GetByIdAsync(id, UserId);
            if (originalPost != null && originalPost.User.Id != UserId)
            {
                var userName = User.FindFirst("FullName")?.Value ?? User.Identity?.Name;
                await _notificationService.CreateAsync(originalPost.User.Id, UserId,
                    NotificationType.Share, $"{userName} đã chia sẻ bài viết của bạn.", id);
                await _hubContext.Clients.Group(originalPost.User.Id).SendAsync("ReceiveNotification",
                    new { message = $"{userName} đã chia sẻ bài viết của bạn.", type = "Share", postId = id });
            }

            return CreatedAtAction(nameof(GetById), new { id = post.Id },
                ApiResponse<PostDTO>.SuccessResponse(post, "Chia sẻ bài viết thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<PostDTO>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Tìm kiếm bài viết
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<PostDTO>>>> Search(
        [FromQuery] string q = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var results = await _postService.SearchAsync(q, currentUserId, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<PostDTO>>.SuccessResponse(results));
    }
}
