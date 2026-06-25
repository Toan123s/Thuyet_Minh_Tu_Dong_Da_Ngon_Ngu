using backend.DTOs.Auth;
using backend.Helpers;
using backend.Repositories;

namespace backend.Services;

public class AuthService
{
    private readonly AuthRepository _repo;
    private readonly JwtHelper      _jwt;

    public AuthService(AuthRepository repo, JwtHelper jwt)
    {
        _repo = repo;
        _jwt  = jwt;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var account = await _repo.FindByUsernameAsync(request.Username)
            ?? throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không đúng.");

        if (!account.IsActive)
            throw new UnauthorizedAccessException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");

        if (!PasswordHelper.VerifyPassword(request.Password, account.PasswordHash))
            throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không đúng.");

        var token = _jwt.GenerateToken(account);

        return new LoginResponse
        {
            Token     = token,
            Role      = account.Role,
            AccountId = account.Id,
            Username  = account.Username,
        };
    }
}