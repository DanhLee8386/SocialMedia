using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.DTOs;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HashtagsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public HashtagsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy hashtag trending
    /// </summary>
    [HttpGet("trending")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetTrending([FromQuery] int count = 10)
    {
        var hashtags = await _context.Hashtags
            .OrderByDescending(h => h.UsageCount)
            .Take(count)
            .Select(h => new { h.Id, h.Name, h.UsageCount })
            .ToListAsync();

        return Ok(ApiResponse<List<object>>.SuccessResponse(hashtags.Cast<object>().ToList()));
    }
}
