using System.Text.Json.Serialization;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using backend.Repositories;
using backend.Services;
using backend.Helpers;
using backend.Models;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// 1. CAU HINH CONTROLLERS
// ============================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        // FIX 1: camelCase de frontend doc duoc (item.id, item.visitedAt, item.languageCode...)
        // Truoc day backend tra "Id","VisitedAt","LanguageCode" (PascalCase) nhung frontend doc item.id → undefined
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ============================================
// 2. CAU HINH DATABASE
// ============================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// ============================================
// 3. CAU HINH CORS
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
// 4. DANG KY REPOSITORIES
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
builder.Services.AddScoped<ICategoryTranslationRepository, CategoryTranslationRepository>();

// 4b. Dang ky them class cu the
builder.Services.AddScoped<ImageRepository>();
builder.Services.AddScoped<VideoRepository>();
builder.Services.AddScoped<VisitLogRepository>();
builder.Services.AddScoped<NarrationRepository>();
builder.Services.AddScoped<TranslationRepository>();
builder.Services.AddScoped<AuthRepository>();

// ============================================
// 5. DANG KY SERVICES
// ============================================
builder.Services.AddHttpClient();
builder.Services.AddSingleton<OnlineTrackerService>(); // Singleton: giữ session trong RAM
builder.Services.AddScoped<NarrationService>();
builder.Services.AddScoped<TranslationService>();
builder.Services.AddScoped<SpeechService>();
builder.Services.AddScoped<MediaService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<VisitLogService>();
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<VendorService>();
builder.Services.AddScoped<CategoryTranslationService>();

// ============================================
// 6. CAU HINH JWT AUTHENTICATION
// ============================================
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidateAudience         = true,
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.Zero,
        };
    });
builder.Services.AddAuthorization();

// ============================================
// 7. XAY DUNG APP
// ============================================
var app = builder.Build();

// ============================================
// 8. PIPELINE
// ============================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ⚠ FIX: UseHttpsRedirection() bị BỎ trong môi trường Development khi test
// qua LAN (điện thoại quét QR). Lý do: app chạy HTTP thuần ở 0.0.0.0:5069
// (xem launchSettings.json), nhưng middleware này tự redirect mọi request
// HTTP sang HTTPS (cổng 7214) — nơi dùng self-signed dev cert mà điện thoại
// (không phải máy dev) KHÔNG tin cậy. Gõ URL trực tiếp trên browser thì
// browser còn cho "Proceed anyway", nhưng khi LandingPage gọi qua
// axios/fetch (XHR) thì request đó thất bại THẲNG, KHÔNG báo lỗi rõ ràng
// → trang trắng/treo y như khi không hề kết nối được tới backend.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ============================================
// 9. TAO THU MUC QR CODES VA AUDIO
// ============================================
try
{
    var webRoot = app.Environment.WebRootPath ?? "wwwroot";
    foreach (var dir in new[] { "qrcodes", "audio" })
    {
        var path = Path.Combine(webRoot, dir);
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
            Console.WriteLine($"Da tao thu muc: {path}");
        }
    }
}
catch { }

// ============================================
// 10. SEED BANG SUPPORTED_LANGUAGE (vi + en mac dinh)
// ============================================
// Du an nay khong co thu muc Migrations (xem trong repo) nen tao bang
// bang raw SQL ngay khi app khoi dong, idempotent — chay lai nhieu lan
// khong sao (IF NOT EXISTS). Mac dinh luon co vi + en; cac ngon ngu khac
// (ja, ko, zh, fr) chi xuat hien sau khi co khach THAT quet QR voi dien
// thoai dang ngon ngu do (xem LanguageController.Detect).
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    db.Database.ExecuteSqlRaw(@"
        IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SUPPORTED_LANGUAGE')
        BEGIN
            CREATE TABLE SUPPORTED_LANGUAGE (
                Code    VARCHAR(10)   NOT NULL PRIMARY KEY,
                Label   NVARCHAR(100) NOT NULL,
                Flag    NVARCHAR(10)  NULL,
                AddedAt DATETIME2     NOT NULL
            );
        END
    ");

    if (!db.SupportedLanguages.Any())
    {
        var now = DateTime.UtcNow;
        db.SupportedLanguages.AddRange(
            new SupportedLanguage { Code = "vi", Label = "Tiếng Việt", Flag = "🇻🇳", AddedAt = now },
            new SupportedLanguage { Code = "en", Label = "English",    Flag = "🇬🇧", AddedAt = now.AddMilliseconds(1) }
        );
        db.SaveChanges();
        Console.WriteLine("Da seed SUPPORTED_LANGUAGE: vi, en");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[SUPPORTED_LANGUAGE seed] Loi (bo qua, khong chan app khoi dong): {ex.Message}");
}

app.Run();