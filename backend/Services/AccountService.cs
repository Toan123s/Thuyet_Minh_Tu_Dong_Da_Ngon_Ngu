using System;
using System.Linq;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using backend.Helpers;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Services
{
    public class AccountService
    {
        private readonly IAccountRepository _accountRepo;
        private readonly AppDbContext _db;

        public AccountService(IAccountRepository accountRepo, AppDbContext db)
        {
            _accountRepo = accountRepo;
            _db = db;
        }

        public async Task<AccountListResponse> GetAllAsync(int page, int pageSize, string? role, string? search)
        {
            var query = _db.Accounts
                .Include(a => a.Vendor)
                .AsQueryable();

            if (!string.IsNullOrEmpty(role))
                query = query.Where(a => a.Role == role);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(a => a.Username.Contains(search) || a.Email.Contains(search));

            var total = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new AccountListResponse
            {
                Data = data.Select(MapToResponse).ToList(),
                Total = total,
                Page = page,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        public async Task<AccountResponse> GetByIdAsync(int id)
        {
            var account = await _accountRepo.GetById(id)
                ?? throw new KeyNotFoundException($"Không tìm thấy tài khoản ID {id}");
            return MapToResponse(account);
        }

        public async Task<AccountResponse> CreateAsync(CreateAccountRequest request)
        {
            var existing = await _accountRepo.GetByUsername(request.Username);
            if (existing != null)
                throw new InvalidOperationException("Tên đăng nhập đã tồn tại.");

            var account = new Account
            {
                Username     = request.Username,
                PasswordHash = PasswordHelper.HashPassword(request.Password),
                Email        = request.Email,
                Role         = request.Role,
                IsActive     = true,
                CreatedAt    = DateTime.UtcNow,
            };

            if (request.Role == "Vendor")
            {
                account.Vendor = new Vendor
                {
                    CompanyName        = request.CompanyName        ?? string.Empty,
                    RepresentativeName = request.RepresentativeName ?? string.Empty,
                    PhoneNumber        = request.PhoneNumber        ?? string.Empty,
                };
            }

            var created = await _accountRepo.Create(account);
            return MapToResponse(created);
        }

        public async Task<AccountResponse> UpdateAsync(int id, UpdateAccountRequest request)
        {
            var account = await _accountRepo.GetById(id)
                ?? throw new KeyNotFoundException($"Không tìm thấy tài khoản ID {id}");

            account.Email = request.Email;

            if (account.Vendor != null)
            {
                account.Vendor.CompanyName        = request.CompanyName        ?? account.Vendor.CompanyName;
                account.Vendor.RepresentativeName = request.RepresentativeName ?? account.Vendor.RepresentativeName;
                account.Vendor.PhoneNumber        = request.PhoneNumber        ?? account.Vendor.PhoneNumber;
            }

            await _accountRepo.Update(account);
            return MapToResponse(account);
        }

        public async Task DeleteAsync(int id)
        {
            var deleted = await _accountRepo.Delete(id);
            if (!deleted)
                throw new KeyNotFoundException($"Không tìm thấy tài khoản ID {id}");
        }

        public async Task SetStatusAsync(int id, bool isActive)
        {
            var account = await _accountRepo.GetById(id)
                ?? throw new KeyNotFoundException($"Không tìm thấy tài khoản ID {id}");
            account.IsActive = isActive;
            await _accountRepo.Update(account);
        }

        public async Task ResetPasswordAsync(int id, ResetPasswordRequest request)
        {
            var account = await _accountRepo.GetById(id)
                ?? throw new KeyNotFoundException($"Không tìm thấy tài khoản ID {id}");
            account.PasswordHash = PasswordHelper.HashPassword(request.NewPassword);
            await _accountRepo.Update(account);
        }

        private static AccountResponse MapToResponse(Account a) => new AccountResponse
        {
            Id                 = a.Id,
            Username           = a.Username,
            Email              = a.Email,
            Role               = a.Role,
            IsActive           = a.IsActive,
            CreatedAt          = a.CreatedAt,
            CompanyName        = a.Vendor?.CompanyName,
            RepresentativeName = a.Vendor?.RepresentativeName,
            PhoneNumber        = a.Vendor?.PhoneNumber,
        };
    }
}