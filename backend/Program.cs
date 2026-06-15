using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using backend.Helpers;
using backend.Middleware;
using backend.Repositories;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT Authentication ────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer   = true,
            ValidIssuer      = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience    = builder.Configuration["Jwt:Audience"],
            ClockSkew        = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

// ── CORS (cho phép React dev server) ─────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// ── Helpers ───────────────────────────────────────────────────
builder.Services.AddScoped<JwtHelper>();

// ── Repositories ──────────────────────────────────────────────
builder.Services.AddScoped<AuthRepository>();
builder.Services.AddScoped<AccountRepository>();
builder.Services.AddScoped<BoothRepository>();
builder.Services.AddScoped<EventRepository>();
builder.Services.AddScoped<CategoryRepository>();
builder.Services.AddScoped<NarrationRepository>();
builder.Services.AddScoped<TranslationRepository>();
builder.Services.AddScoped<ImageRepository>();
builder.Services.AddScoped<VideoRepository>();
builder.Services.AddScoped<VendorRepository>();
builder.Services.AddScoped<VisitLogRepository>();

// ── Services ──────────────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<BoothService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<VendorService>();
builder.Services.AddScoped<NarrationService>();
builder.Services.AddScoped<TranslationService>();
builder.Services.AddScoped<MediaService>();
builder.Services.AddScoped<VisitLogService>();
builder.Services.AddScoped<SpeechService>();

// ── Controllers & Swagger ─────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
// app.UseHttpsRedirection();

// JWT Middleware custom (gắn thông tin vào HttpContext.Items)
app.UseMiddleware<JwtMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.Run();