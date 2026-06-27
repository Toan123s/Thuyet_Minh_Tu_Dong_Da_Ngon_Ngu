using System.Text.Json.Serialization;
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

app.UseHttpsRedirection();
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

app.Run();