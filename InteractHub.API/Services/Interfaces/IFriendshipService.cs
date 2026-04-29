using InteractHub.API.DTOs;

namespace InteractHub.API.Services.Interfaces;

public interface IFriendshipService
{
    Task<FriendshipDTO> SendRequestAsync(string requesterId, string receiverId);
    Task<FriendshipDTO> AcceptRequestAsync(int friendshipId, string userId);
    Task RejectRequestAsync(int friendshipId, string userId);
    Task RemoveFriendAsync(string userId, string friendId);
    Task<List<FriendshipDTO>> GetFriendsAsync(string userId);
    Task<List<FriendshipDTO>> GetPendingRequestsAsync(string userId);
    Task<string?> GetFriendshipStatusAsync(string userId1, string userId2);
}
