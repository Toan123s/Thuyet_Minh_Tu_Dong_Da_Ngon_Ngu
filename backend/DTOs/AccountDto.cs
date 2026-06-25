namespace backend.DTOs;

// ── Request ───────────────────────────────────────────────────
public class CreateAccountRequest
{
    public string Username  { get; set; } = string.Empty;
    public string Password  { get; set; } = string.Empty;
    public string Email     { get; set; } = string.Empty;
    public string Role      { get; set; } = "Vendor";
    public string? CompanyName          { get; set; }
    public string? RepresentativeName   { get; set; }
    public string? PhoneNumber          { get; set; }
}

public class UpdateAccountRequest
{
    public string  Email               { get; set; } = string.Empty;
    public string? CompanyName         { get; set; }
    public string? RepresentativeName  { get; set; }
    public string? PhoneNumber         { get; set; }
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}

// ── Response ──────────────────────────────────────────────────
public class AccountResponse
{
    public int      Id        { get; set; }
    public string   Username  { get; set; } = string.Empty;
    public string   Email     { get; set; } = string.Empty;
    public string   Role      { get; set; } = string.Empty;
    public bool     IsActive  { get; set; }
    public DateTime CreatedAt { get; set; }
    public string?  CompanyName          { get; set; }
    public string?  RepresentativeName   { get; set; }
    public string?  PhoneNumber          { get; set; }
}

public class AccountListResponse
{
    public List<AccountResponse> Data       { get; set; } = new();
    public int                   Total      { get; set; }
    public int                   Page       { get; set; }
    public int                   TotalPages { get; set; }
}