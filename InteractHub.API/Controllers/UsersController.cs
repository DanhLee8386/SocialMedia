using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InteractHub.API.DTOs;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    private string UserId => User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

    /// <summary>
    /// Lấy profile hiện tại
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDTO>>> GetCurrentUser()
    {
        var user = await _userService.GetByIdAsync(UserId);
        if (user == null)
            return NotFound(ApiResponse<UserDTO>.ErrorResponse("Không tìm thấy người dùng."));

        return Ok(ApiResponse<UserDTO>.SuccessResponse(user));
    }

    /// <summary>
    /// Lấy profile theo ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<UserDTO>>> GetById(string id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null)
            return NotFound(ApiResponse<UserDTO>.ErrorResponse("Không tìm thấy người dùng."));

        return Ok(ApiResponse<UserDTO>.SuccessResponse(user));
    }

    /// <summary>
    /// Cập nhật profile
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse<UserDTO>>> UpdateProfile([FromBody] UpdateProfileDTO dto)
    {
        var user = await _userService.UpdateProfileAsync(UserId, dto);
        return Ok(ApiResponse<UserDTO>.SuccessResponse(user, "Cập nhật thông tin thành công."));
    }

    /// <summary>
    /// Cập nhật avatar (nhận URL ảnh)
    /// </summary>
    [HttpPut("me/avatar")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateAvatar([FromBody] UpdateImageDTO dto)
    {
        var url = await _userService.UpdateAvatarAsync(UserId, dto.ImageUrl);
        return Ok(ApiResponse<string>.SuccessResponse(url, "Cập nhật avatar thành công."));
    }

    /// <summary>
    /// Cập nhật ảnh bìa
    /// </summary>
    [HttpPut("me/cover")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateCover([FromBody] UpdateImageDTO dto)
    {
        var url = await _userService.UpdateCoverPhotoAsync(UserId, dto.ImageUrl);
        return Ok(ApiResponse<string>.SuccessResponse(url, "Cập nhật ảnh bìa thành công."));
    }

    /// <summary>
    /// Tìm kiếm người dùng
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<UserSearchDTO>>>> Search(
        [FromQuery] string q = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var results = await _userService.SearchUsersAsync(q, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<UserSearchDTO>>.SuccessResponse(results));
    }

    /// <summary>
    /// [Admin] Lấy danh sách tất cả người dùng
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<UserDTO>>>> GetAll()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(ApiResponse<List<UserDTO>>.SuccessResponse(users));
    }

    /// <summary>
    /// [Admin] Khóa/Mở tài khoản
    /// </summary>
    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<string>>> ToggleActive(string id)
    {
        try
        {
            await _userService.ToggleUserActiveAsync(id);
            return Ok(ApiResponse<string>.SuccessResponse("OK", "Cập nhật trạng thái tài khoản thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
        }
    }
}

public class UpdateImageDTO
{
    public string ImageUrl { get; set; } = string.Empty;
}
