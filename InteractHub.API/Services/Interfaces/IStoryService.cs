using InteractHub.API.DTOs;

namespace InteractHub.API.Services.Interfaces;

public interface IStoryService
{
    Task<StoryDTO> CreateAsync(string userId, CreateStoryDTO dto);
    Task<List<StoryDTO>> GetFriendsStoriesAsync(string userId);
    Task<List<StoryDTO>> GetUserStoriesAsync(string userId);
    Task DeleteAsync(int storyId, string userId);
}
