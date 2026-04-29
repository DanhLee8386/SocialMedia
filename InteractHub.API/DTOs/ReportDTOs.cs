using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs;

public class CreateReportDTO
{
    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;
}

public class ReportDTO
{
    public int Id { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public UserSearchDTO ReportedBy { get; set; } = null!;
    public PostDTO Post { get; set; } = null!;
}

public class UpdateReportStatusDTO
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
