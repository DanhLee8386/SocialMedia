using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using InteractHub.API.Services;
using InteractHub.API.Models;
using InteractHub.API.DTOs;

namespace InteractHub.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<IConfigurationSection> _jwtSectionMock;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _configurationMock = new Mock<IConfiguration>();
        _jwtSectionMock = new Mock<IConfigurationSection>();

        // Setup JWT configuration
        _configurationMock.Setup(c => c["Jwt:Key"])
            .Returns("SuperSecretTestKeyForUnitTestingThatIsLongEnough");
        _configurationMock.Setup(c => c["Jwt:Issuer"])
            .Returns("InteractHub-Test");
        _configurationMock.Setup(c => c["Jwt:Audience"])
            .Returns("InteractHub-Test-Audience");

        _authService = new AuthService(_userManagerMock.Object, _configurationMock.Object);
    }

    public void Dispose() { }

    // ================================================================
    // REGISTER TESTS
    // ================================================================

    [Fact]
    public async Task RegisterAsync_WithValidData_ReturnsAuthResponse()
    {
        // Arrange
        var dto = new RegisterDTO
        {
            UserName = "testuser",
            Email = "test@example.com",
            Password = "Password123!",
            FullName = "Test User",
            DateOfBirth = new DateTime(2000, 1, 1)
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync(dto.UserName))
            .ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), dto.Password))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.NotNull(result.User);
        Assert.Equal(dto.Email, result.User.Email);
        Assert.Equal(dto.UserName, result.User.UserName);
        Assert.Equal(dto.FullName, result.User.FullName);
        Assert.True(result.Expiration > DateTime.UtcNow);
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new RegisterDTO
        {
            UserName = "newuser",
            Email = "existing@example.com",
            Password = "Password123!",
            FullName = "New User"
        };

        var existingUser = new ApplicationUser
        {
            Email = dto.Email,
            UserName = "existinguser"
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterAsync(dto));

        Assert.Contains("Email", exception.Message);
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateUsername_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new RegisterDTO
        {
            UserName = "existinguser",
            Email = "new@example.com",
            Password = "Password123!",
            FullName = "New User"
        };

        var existingUser = new ApplicationUser
        {
            Email = "other@example.com",
            UserName = dto.UserName
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync(dto.UserName))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterAsync(dto));

        Assert.Contains("người dùng", exception.Message);
    }

    // ================================================================
    // LOGIN TESTS
    // ================================================================

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var dto = new LoginDTO
        {
            Email = "user@example.com",
            Password = "Password123!"
        };

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            UserName = "testuser",
            FullName = "Test User",
            IsActive = true
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);
        _userManagerMock.Setup(m => m.UpdateAsync(user))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.NotNull(result.User);
        Assert.Equal(dto.Email, result.User.Email);
        Assert.True(result.Expiration > DateTime.UtcNow);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new LoginDTO
        {
            Email = "user@example.com",
            Password = "WrongPassword!"
        };

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            UserName = "testuser",
            IsActive = true
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.LoginAsync(dto));

        Assert.Contains("mật khẩu", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_WithBannedAccount_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new LoginDTO
        {
            Email = "banned@example.com",
            Password = "Password123!"
        };

        var bannedUser = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            UserName = "banneduser",
            IsActive = false  // Tài khoản bị khóa
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(bannedUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.LoginAsync(dto));

        Assert.Contains("khóa", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new LoginDTO
        {
            Email = "nonexistent@example.com",
            Password = "Password123!"
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.LoginAsync(dto));

        Assert.Contains("Email", exception.Message);
    }
}
