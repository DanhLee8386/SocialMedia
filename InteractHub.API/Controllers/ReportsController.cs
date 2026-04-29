using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using InteractHub.API.Data;
using InteractHub.API.DTOs;
using InteractHub.API.Models;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string UserId => User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

    /// <summary>
    /// Báo cáo bài viết
    /// </summary>
    [HttpPost("posts/{postId}")]
    public async Task<ActionResult<ApiResponse<string>>> ReportPost(int postId, [FromBody] CreateReportDTO dto)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null) return NotFound(ApiResponse<string>.ErrorResponse("Không tìm thấy bài viết."));

        var existing = await _context.PostReports
            .AnyAsync(r => r.PostId == postId && r.UserId == UserId);
        if (existing) return BadRequest(ApiResponse<string>.ErrorResponse("Bạn đã báo cáo bài viết này."));

        _context.PostReports.Add(new PostReport
        {
            PostId = postId,
            UserId = UserId,
            Reason = dto.Reason,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.SuccessResponse("OK", "Báo cáo thành công."));
    }

    /// <summary>
    /// [Admin] Lấy danh sách báo cáo
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<ReportDTO>>>> GetAll()
    {
        var reports = await _context.PostReports
            .Include(r => r.User)
            .Include(r => r.Post).ThenInclude(p => p.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReportDTO
            {
                Id = r.Id,
                Reason = r.Reason,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt,
                ReviewedAt = r.ReviewedAt,
                ReportedBy = new UserSearchDTO
                {
                    Id = r.User.Id,
                    UserName = r.User.UserName!,
                    FullName = r.User.FullName,
                    AvatarUrl = r.User.AvatarUrl
                },
                Post = new PostDTO
                {
                    Id = r.Post.Id,
                    Content = r.Post.Content,
                    ImageUrl = r.Post.ImageUrl,
                    CreatedAt = r.Post.CreatedAt,
                    User = new UserSearchDTO
                    {
                        Id = r.Post.User.Id,
                        UserName = r.Post.User.UserName!,
                        FullName = r.Post.User.FullName,
                        AvatarUrl = r.Post.User.AvatarUrl
                    }
                }
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ReportDTO>>.SuccessResponse(reports));
    }

    /// <summary>
    /// [Admin] Cập nhật trạng thái báo cáo
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateStatus(int id, [FromBody] UpdateReportStatusDTO dto)
    {
        var report = await _context.PostReports.FindAsync(id);
        if (report == null) return NotFound(ApiResponse<string>.ErrorResponse("Không tìm thấy báo cáo."));

        if (Enum.TryParse<ReportStatus>(dto.Status, out var status))
        {
            report.Status = status;
            report.ReviewedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.SuccessResponse("OK", "Cập nhật trạng thái báo cáo thành công."));
        }

        return BadRequest(ApiResponse<string>.ErrorResponse("Trạng thái không hợp lệ."));
    }
}
