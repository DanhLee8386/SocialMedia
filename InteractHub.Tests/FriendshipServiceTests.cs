using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using InteractHub.API.Data;
using InteractHub.API.Services;
using InteractHub.API.Models;

namespace InteractHub.Tests;

public class FriendshipServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly FriendshipService _friendshipService;

    private const string User1Id = "friendship-user-1";
    private const string User2Id = "friendship-user-2";
    private const string User3Id = "friendship-user-3";

    public FriendshipServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _friendshipService = new FriendshipService(_context);

        SeedData();
    }

    private void SeedData()
    {
        _context.Users.AddRange(
            new ApplicationUser
            {
                Id = User1Id,
                UserName = "frienduser1",
                NormalizedUserName = "FRIENDUSER1",
                Email = "frienduser1@example.com",
                NormalizedEmail = "FRIENDUSER1@EXAMPLE.COM",
                FullName = "Friend User One",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new ApplicationUser
            {
                Id = User2Id,
                UserName = "frienduser2",
                NormalizedUserName = "FRIENDUSER2",
                Email = "frienduser2@example.com",
                NormalizedEmail = "FRIENDUSER2@EXAMPLE.COM",
                FullName = "Friend User Two",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new ApplicationUser
            {
                Id = User3Id,
                UserName = "frienduser3",
                NormalizedUserName = "FRIENDUSER3",
                Email = "frienduser3@example.com",
                NormalizedEmail = "FRIENDUSER3@EXAMPLE.COM",
                FullName = "Friend User Three",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // ================================================================
    // SEND REQUEST TESTS
    // ================================================================

    [Fact]
    public async Task SendRequestAsync_WithValidUsers_CreatesPendingFriendship()
    {
        // Act
        var result = await _friendshipService.SendRequestAsync(User1Id, User2Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Pending", result.Status);
        Assert.Equal(User2Id, result.User.Id);
        Assert.True(result.Id > 0);

        // Verify in DB
        var friendship = await _context.Friendships.FirstOrDefaultAsync(
            f => f.RequesterId == User1Id && f.ReceiverId == User2Id);
        Assert.NotNull(friendship);
        Assert.Equal(FriendshipStatus.Pending, friendship.Status);
    }

    [Fact]
    public async Task SendRequestAsync_ToSelf_ThrowsInvalidOperationException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _friendshipService.SendRequestAsync(User1Id, User1Id));

        Assert.Contains("chính mình", exception.Message);
    }

    [Fact]
    public async Task SendRequestAsync_WhenAlreadySent_ThrowsInvalidOperationException()
    {
        // Arrange - tạo sẵn lời mời pending
        _context.Friendships.Add(new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _friendshipService.SendRequestAsync(User1Id, User2Id));

        Assert.Contains("mời", exception.Message);
    }

    [Fact]
    public async Task SendRequestAsync_WhenAlreadyFriends_ThrowsInvalidOperationException()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _friendshipService.SendRequestAsync(User1Id, User2Id));

        Assert.Contains("bạn bè", exception.Message);
    }

    // ================================================================
    // ACCEPT REQUEST TESTS
    // ================================================================

    [Fact]
    public async Task AcceptRequestAsync_WithPendingRequest_UpdatesStatusToAccepted()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act - User2 chấp nhận lời mời của User1
        var result = await _friendshipService.AcceptRequestAsync(friendship.Id, User2Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Accepted", result.Status);
        Assert.Equal(User1Id, result.User.Id);

        // Verify in DB
        var updatedFriendship = await _context.Friendships.FindAsync(friendship.Id);
        Assert.Equal(FriendshipStatus.Accepted, updatedFriendship!.Status);
        Assert.NotNull(updatedFriendship.UpdatedAt);
    }

    [Fact]
    public async Task AcceptRequestAsync_ByWrongUser_ThrowsInvalidOperationException()
    {
        // Arrange - friendship từ User1 tới User2, nhưng User3 cố accept
        var friendship = new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _friendshipService.AcceptRequestAsync(friendship.Id, User3Id));
    }

    // ================================================================
    // REJECT REQUEST TESTS
    // ================================================================

    [Fact]
    public async Task RejectRequestAsync_WithPendingRequest_UpdatesStatusToRejected()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        await _friendshipService.RejectRequestAsync(friendship.Id, User2Id);

        // Assert
        var updatedFriendship = await _context.Friendships.FindAsync(friendship.Id);
        Assert.NotNull(updatedFriendship);
        Assert.Equal(FriendshipStatus.Rejected, updatedFriendship.Status);
        Assert.NotNull(updatedFriendship.UpdatedAt);
    }

    [Fact]
    public async Task RejectRequestAsync_WithNonExistentRequest_ThrowsInvalidOperationException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _friendshipService.RejectRequestAsync(99999, User2Id));
    }

    // ================================================================
    // REMOVE FRIEND TESTS
    // ================================================================

    [Fact]
    public async Task RemoveFriendAsync_WithExistingFriendship_RemovesFriendship()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        await _friendshipService.RemoveFriendAsync(User1Id, User2Id);

        // Assert
        var removedFriendship = await _context.Friendships.FindAsync(friendship.Id);
        Assert.Null(removedFriendship);
    }

    [Fact]
    public async Task RemoveFriendAsync_WhenNotFriends_ThrowsInvalidOperationException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _friendshipService.RemoveFriendAsync(User1Id, User3Id));

        Assert.Contains("bạn bè", exception.Message);
    }

    // ================================================================
    // GET FRIENDSHIP STATUS TESTS
    // ================================================================

    [Fact]
    public async Task GetFriendshipStatusAsync_WhenPending_ReturnsPendingStatus()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var status = await _friendshipService.GetFriendshipStatusAsync(User1Id, User2Id);

        // Assert
        Assert.Equal("Pending", status);
    }

    [Fact]
    public async Task GetFriendshipStatusAsync_WhenAccepted_ReturnsAcceptedStatus()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = User2Id,
            ReceiverId = User1Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act - kiểm tra cả chiều ngược
        var status = await _friendshipService.GetFriendshipStatusAsync(User1Id, User2Id);

        // Assert
        Assert.Equal("Accepted", status);
    }

    [Fact]
    public async Task GetFriendshipStatusAsync_WhenNoRelationship_ReturnsNull()
    {
        // Act
        var status = await _friendshipService.GetFriendshipStatusAsync(User1Id, User3Id);

        // Assert
        Assert.Null(status);
    }
}
