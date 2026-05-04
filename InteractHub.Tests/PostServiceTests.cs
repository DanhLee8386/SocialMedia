using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using InteractHub.API.Data;
using InteractHub.API.Services;
using InteractHub.API.Models;
using InteractHub.API.DTOs;

namespace InteractHub.Tests;

public class PostServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly PostService _postService;

    // Seed data IDs
    private const string User1Id = "user-1-id";
    private const string User2Id = "user-2-id";

    public PostServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _postService = new PostService(_context);

        SeedData();
    }

    private void SeedData()
    {
        var user1 = new ApplicationUser
        {
            Id = User1Id,
            UserName = "user1",
            NormalizedUserName = "USER1",
            Email = "user1@example.com",
            NormalizedEmail = "USER1@EXAMPLE.COM",
            FullName = "User One",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var user2 = new ApplicationUser
        {
            Id = User2Id,
            UserName = "user2",
            NormalizedUserName = "USER2",
            Email = "user2@example.com",
            NormalizedEmail = "USER2@EXAMPLE.COM",
            FullName = "User Two",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.AddRange(user1, user2);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // ================================================================
    // CREATE POST TESTS
    // ================================================================

    [Fact]
    public async Task CreateAsync_WithValidData_ReturnsPostDTO()
    {
        // Arrange
        var dto = new CreatePostDTO
        {
            Content = "Hello world! This is my first post.",
            ImageUrl = null
        };

        // Act
        var result = await _postService.CreateAsync(User1Id, dto);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal(dto.Content, result.Content);
        Assert.Equal(User1Id, result.User.Id);
        Assert.Equal("user1", result.User.UserName);
        Assert.Equal(0, result.LikesCount);
        Assert.Equal(0, result.CommentsCount);
    }

    [Fact]
    public async Task CreateAsync_WithHashtags_ExtractsHashtagsCorrectly()
    {
        // Arrange
        var dto = new CreatePostDTO
        {
            Content = "This is a post with #dotnet and #testing hashtags."
        };

        // Act
        var result = await _postService.CreateAsync(User1Id, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Contains("dotnet", result.Hashtags);
        Assert.Contains("testing", result.Hashtags);
        Assert.Equal(2, result.Hashtags.Count);
    }

    // ================================================================
    // GET BY ID TESTS
    // ================================================================

    [Fact]
    public async Task GetByIdAsync_WithExistingId_ReturnsPostDTO()
    {
        // Arrange
        var post = new Post
        {
            Content = "Test post content",
            UserId = User1Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.GetByIdAsync(post.Id, User1Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(post.Id, result.Id);
        Assert.Equal(post.Content, result.Content);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // Act
        var result = await _postService.GetByIdAsync(99999, User1Id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_WithDeletedPost_ReturnsNull()
    {
        // Arrange
        var deletedPost = new Post
        {
            Content = "Deleted post",
            UserId = User1Id,
            IsDeleted = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(deletedPost);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.GetByIdAsync(deletedPost.Id, User1Id);

        // Assert
        Assert.Null(result);
    }

    // ================================================================
    // GET FEED TESTS
    // ================================================================

    [Fact]
    public async Task GetFeedAsync_IncludesOwnAndFriendPosts()
    {
        // Arrange - tạo friendship accepted
        _context.Friendships.Add(new Friendship
        {
            RequesterId = User1Id,
            ReceiverId = User2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });

        _context.Posts.AddRange(
            new Post { Content = "User1 post", UserId = User1Id, CreatedAt = DateTime.UtcNow },
            new Post { Content = "User2 post", UserId = User2Id, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.GetFeedAsync(User1Id, 1, 10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count);
    }

    [Fact]
    public async Task GetFeedAsync_WithNoFriends_ReturnsPublicPosts()
    {
        // Arrange - không có friendship giữa user1 và user2
        _context.Posts.Add(new Post
        {
            Content = "Stranger post",
            UserId = User2Id,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.GetFeedAsync(User1Id, 1, 10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
    }

    // ================================================================
    // UPDATE POST TESTS
    // ================================================================

    [Fact]
    public async Task UpdateAsync_ByOwner_UpdatesContentSuccessfully()
    {
        // Arrange
        var post = new Post
        {
            Content = "Original content",
            UserId = User1Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        var updateDto = new UpdatePostDTO { Content = "Updated content" };

        // Act
        var result = await _postService.UpdateAsync(post.Id, User1Id, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated content", result.Content);
        Assert.NotNull(result.UpdatedAt);
    }

    [Fact]
    public async Task UpdateAsync_ByNonOwner_ThrowsInvalidOperationException()
    {
        // Arrange
        var post = new Post
        {
            Content = "Original content",
            UserId = User1Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        var updateDto = new UpdatePostDTO { Content = "Hacked content" };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _postService.UpdateAsync(post.Id, User2Id, updateDto));
    }

    // ================================================================
    // DELETE POST TESTS
    // ================================================================

    [Fact]
    public async Task DeleteAsync_ByOwner_SoftDeletesPost()
    {
        // Arrange
        var post = new Post
        {
            Content = "Post to delete",
            UserId = User1Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        await _postService.DeleteAsync(post.Id, User1Id);

        // Assert
        var deletedPost = await _context.Posts.FindAsync(post.Id);
        Assert.NotNull(deletedPost);
        Assert.True(deletedPost.IsDeleted);
    }

    [Fact]
    public async Task DeleteAsync_ByNonOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var post = new Post
        {
            Content = "User1's post",
            UserId = User1Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _postService.DeleteAsync(post.Id, User2Id));
    }
}
