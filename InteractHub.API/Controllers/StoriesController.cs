using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InteractHub.API.DTOs;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StoriesController : ControllerBase
{
    private readonly IStoryService _storyService;

    public StoriesController(IStoryService storyService)
    {
        _storyService = storyService;
    }

    private string UserId => User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

    /// <summary>
    /// Tạo story mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoryDTO>>> Create([FromBody] CreateStoryDTO dto)
    {
        var story = await _storyService.CreateAsync(UserId, dto);
        return CreatedAtAction(nameof(GetMyStories), null,
            ApiResponse<StoryDTO>.SuccessResponse(story, "Đăng story thành công."));
    }

    /// <summary>
    /// Lấy stories của bạn bè
    /// </summary>
    [HttpGet("feed")]
    public async Task<ActionResult<ApiResponse<List<StoryDTO>>>> GetFeed()
    {
        var stories = await _storyService.GetFriendsStoriesAsync(UserId);
        return Ok(ApiResponse<List<StoryDTO>>.SuccessResponse(stories));
    }

    /// <summary>
    /// Lấy stories của mình
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<List<StoryDTO>>>> GetMyStories()
    {
        var stories = await _storyService.GetUserStoriesAsync(UserId);
        return Ok(ApiResponse<List<StoryDTO>>.SuccessResponse(stories));
    }

    /// <summary>
    /// Lấy stories của user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<ApiResponse<List<StoryDTO>>>> GetUserStories(string userId)
    {
        var stories = await _storyService.GetUserStoriesAsync(userId);
        return Ok(ApiResponse<List<StoryDTO>>.SuccessResponse(stories));
    }

    /// <summary>
    /// Xóa story
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id)
    {
        try
        {
            await _storyService.DeleteAsync(id, UserId);
            return Ok(ApiResponse<string>.SuccessResponse("OK", "Xóa story thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
        }
    }
}
