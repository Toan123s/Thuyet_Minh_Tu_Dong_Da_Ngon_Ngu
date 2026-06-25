// Program.cs — paste đè toàn bộ
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using backend.Repositories;
using backend.Services;
using backend.Helpers;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// 1. CẤU HÌNH CONTROLLERS
// ============================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ============================================
// 2. CẤU HÌNH DATABASE
// ============================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// ============================================
// 3. CẤU HÌNH CORS
// ============================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

// ============================================
// 4. ĐĂNG KÝ REPOSITORIES (GIỮ INTERFACE)
// ============================================
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IVendorRepository, VendorRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IBoothRepository, BoothRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<INarrationRepository, NarrationRepository>();
builder.Services.AddScoped<ITranslationRepository, TranslationRepository>();
builder.Services.AddScoped<IImageRepository, ImageRepository>();
builder.Services.AddScoped<IVideoRepository, VideoRepository>();
builder.Services.AddScoped<IVisitLogRepository, VisitLogRepository>();

// 4b. ĐĂNG KÝ THÊM CLASS CỤ THỂ — vì các Service ở dưới (không dùng
//     interface) inject trực tiếp ImageRepository/VideoRepository/...
//     thay vì IImageRepository/IVideoRepository/..., nên cần đăng ký
//     thêm để DI container resolve được đúng class.
builder.Services.AddScoped<ImageRepository>();
builder.Services.AddScoped<VideoRepository>();
builder.Services.AddScoped<VisitLogRepository>();
builder.Services.AddScoped<NarrationRepository>();
builder.Services.AddScoped<TranslationRepository>();

// 4c. AuthRepository (dùng trực tiếp class, không qua interface)
builder.Services.AddScoped<AuthRepository>();

// ============================================
// 5. ĐĂNG KÝ SERVICES (KHÔNG DÙNG INTERFACE)
// ============================================
builder.Services.AddScoped<NarrationService>();
builder.Services.AddScoped<TranslationService>();
builder.Services.AddScoped<SpeechService>();
builder.Services.AddScoped<MediaService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<VisitLogService>();

// 🔥 5b. BA SERVICE NÀY BỊ THIẾU TRONG BẢN GỐC — đây là nguyên nhân
//     /api/auth/login, /api/admin/accounts/*, /api/register/*,
//     /api/vendor/* trả lỗi 500 "Unable to resolve service for type...".
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<VendorService>();

// ============================================
// 5c. CẤU HÌNH JWT AUTHENTICATION
//     (trước đây chưa được bật, nên VendorController.GetAccountId()
//     đọc User.Claims luôn rỗng → luôn trả 401 "Không xác định được
//     tài khoản" dù token hợp lệ).
// ============================================
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });
builder.Services.AddAuthorization();

// ============================================
// 6. XÂY DỰNG APP
// ============================================
var app = builder.Build();

// ============================================
// 7. PIPELINE
// ============================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();   // 🔥 PHẢI đứng trước UseAuthorization
app.UseAuthorization();
app.MapControllers();

// ============================================
// 8. TẠO THƯ MỤC QR CODES
// ============================================
try
{
    var qrDir = Path.Combine(app.Environment.WebRootPath, "qrcodes");
    if (!Directory.Exists(qrDir))
    {
        Directory.CreateDirectory(qrDir);
        Console.WriteLine($"📁 Đã tạo thư mục: {qrDir}");
    }
}
catch { }

app.Run();