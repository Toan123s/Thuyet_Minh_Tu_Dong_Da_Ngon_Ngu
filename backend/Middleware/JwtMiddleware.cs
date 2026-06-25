using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace backend.Middleware;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration  _config;

    public JwtMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next   = next;
        _config = config;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (token != null)
            AttachAccountToContext(context, token);

        await _next(context);
    }

    private void AttachAccountToContext(HttpContext context, string token)
    {
        try
        {
            var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var handler = new JwtSecurityTokenHandler();

            handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = key,
                ValidateIssuer           = true,
                ValidIssuer              = _config["Jwt:Issuer"],
                ValidateAudience         = true,
                ValidAudience            = _config["Jwt:Audience"],
                ClockSkew                = TimeSpan.Zero,
            }, out var validatedToken);

            var jwt = (JwtSecurityToken)validatedToken;

            // Gắn thông tin vào HttpContext.Items để dùng ở Controller
            context.Items["accountId"] = int.Parse(jwt.Claims.First(c => c.Type == "accountId").Value);
            context.Items["username"]  = jwt.Claims.First(c => c.Type == "username").Value;
            context.Items["role"]      = jwt.Claims.First(c => c.Type == "role").Value;
        }
        catch
        {
            // Token không hợp lệ → bỏ qua, controller sẽ xử lý [Authorize]
        }
    }
}