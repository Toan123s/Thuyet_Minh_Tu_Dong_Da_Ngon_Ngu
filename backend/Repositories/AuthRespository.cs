using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories;

public class AuthRepository
{
    private readonly AppDbContext _db;

    public AuthRepository(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Tìm account theo username (không phân biệt hoa thường).</summary>
    public async Task<Account?> FindByUsernameAsync(string username)
        => await _db.Accounts
            .FirstOrDefaultAsync(a => a.Username.ToLower() == username.ToLower());
}