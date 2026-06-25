namespace backend.DTOs.Auth;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token     { get; set; } = string.Empty;
    public string Role      { get; set; } = string.Empty;
    public int    AccountId { get; set; }
    public string Username  { get; set; } = string.Empty;
}