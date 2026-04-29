using Microsoft.EntityFrameworkCore;
using InteractHub.API.Data;
using InteractHub.API.DTOs;
using InteractHub.API.Models;
using InteractHub.API.Services.Interfaces;

namespace InteractHub.API.Services;

public class FriendshipService : IFriendshipService
{
    private readonly ApplicationDbContext _context;

    public FriendshipService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FriendshipDTO> SendRequestAsync(string requesterId, string receiverId)
    {
        if (requesterId == receiverId)
            throw new InvalidOperationException("Không thể gửi lời mời kết bạn cho chính mình.");

        var existing = await _context.Friendships
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == requesterId && f.ReceiverId == receiverId) ||
                (f.RequesterId == receiverId && f.ReceiverId == requesterId));

        if (existing != null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
                throw new InvalidOperationException("Đã là bạn bè.");
            if (existing.Status == FriendshipStatus.Pending)
                throw new InvalidOperationException("Đã gửi lời mời kết bạn.");
        }

        var friendship = new Friendship
        {
            RequesterId = requesterId,
            ReceiverId = receiverId,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        var receiver = await _context.Users.FindAsync(receiverId);
        return new FriendshipDTO
        {
            Id = friendship.Id,
            Status = friendship.Status.ToString(),
            CreatedAt = friendship.CreatedAt,
            User = new UserSearchDTO
            {
                Id = receiver!.Id,
                UserName = receiver.UserName!,
                FullName = receiver.FullName,
                AvatarUrl = receiver.AvatarUrl
            }
        };
    }

    public async Task<FriendshipDTO> AcceptRequestAsync(int friendshipId, string userId)
    {
        var friendship = await _context.Friendships
            .Include(f => f.Requester)
            .FirstOrDefaultAsync(f => f.Id == friendshipId && f.ReceiverId == userId);

        if (friendship == null) throw new InvalidOperationException("Không tìm thấy lời mời kết bạn.");
        if (friendship.Status != FriendshipStatus.Pending)
            throw new InvalidOperationException("Lời mời đã được xử lý.");

        friendship.Status = FriendshipStatus.Accepted;
        friendship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new FriendshipDTO
        {
            Id = friendship.Id,
            Status = friendship.Status.ToString(),
            CreatedAt = friendship.CreatedAt,
            User = new UserSearchDTO
            {
                Id = friendship.Requester.Id,
                UserName = friendship.Requester.UserName!,
                FullName = friendship.Requester.FullName,
                AvatarUrl = friendship.Requester.AvatarUrl
            }
        };
    }

    public async Task RejectRequestAsync(int friendshipId, string userId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId && f.ReceiverId == userId);

        if (friendship == null) throw new InvalidOperationException("Không tìm thấy lời mời kết bạn.");

        friendship.Status = FriendshipStatus.Rejected;
        friendship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task RemoveFriendAsync(string userId, string friendId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f =>
                ((f.RequesterId == userId && f.ReceiverId == friendId) ||
                 (f.RequesterId == friendId && f.ReceiverId == userId)) &&
                f.Status == FriendshipStatus.Accepted);

        if (friendship == null) throw new InvalidOperationException("Không tìm thấy bạn bè.");

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();
    }

    public async Task<List<FriendshipDTO>> GetFriendsAsync(string userId)
    {
        var friendships = await _context.Friendships
            .Where(f => (f.RequesterId == userId || f.ReceiverId == userId) && f.Status == FriendshipStatus.Accepted)
            .Include(f => f.Requester)
            .Include(f => f.Receiver)
            .ToListAsync();

        return friendships.Select(f =>
        {
            var friend = f.RequesterId == userId ? f.Receiver : f.Requester;
            return new FriendshipDTO
            {
                Id = f.Id,
                Status = f.Status.ToString(),
                CreatedAt = f.CreatedAt,
                User = new UserSearchDTO
                {
                    Id = friend.Id,
                    UserName = friend.UserName!,
                    FullName = friend.FullName,
                    AvatarUrl = friend.AvatarUrl
                }
            };
        }).ToList();
    }

    public async Task<List<FriendshipDTO>> GetPendingRequestsAsync(string userId)
    {
        return await _context.Friendships
            .Where(f => f.ReceiverId == userId && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .Select(f => new FriendshipDTO
            {
                Id = f.Id,
                Status = f.Status.ToString(),
                CreatedAt = f.CreatedAt,
                User = new UserSearchDTO
                {
                    Id = f.Requester.Id,
                    UserName = f.Requester.UserName!,
                    FullName = f.Requester.FullName,
                    AvatarUrl = f.Requester.AvatarUrl
                }
            })
            .ToListAsync();
    }

    public async Task<string?> GetFriendshipStatusAsync(string userId1, string userId2)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == userId1 && f.ReceiverId == userId2) ||
                (f.RequesterId == userId2 && f.ReceiverId == userId1));

        return friendship?.Status.ToString();
    }
}
