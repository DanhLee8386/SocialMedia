namespace InteractHub.API.Services.Interfaces;

public interface ILikeService
{
    Task<bool> ToggleLikeAsync(int postId, string userId);
    Task<int> GetLikeCountAsync(int postId);
}
