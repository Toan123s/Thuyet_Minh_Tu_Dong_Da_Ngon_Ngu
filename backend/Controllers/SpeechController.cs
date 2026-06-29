using Microsoft.AspNetCore.Mvc;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace backend.Controllers
{
    // ─────────────────────────────────────────────────────────
    // SpeechController — sinh audio thuyết minh bằng Azure
    // Cognitive Speech (Text-to-Speech).
    //
    // CÀI ĐẶT TRƯỚC KHI DÙNG:
    //   1. cd backend
    //      dotnet add package Microsoft.CognitiveServices.Speech
    //
    //   2. Thêm vào appsettings.json (hoặc User Secrets cho an toàn):
    //      "Azure": {
    //        "SpeechKey": "<key lấy từ Azure Portal>",
    //        "SpeechRegion": "southeastasia"   // hoặc region bạn tạo resource
    //      }
    //
    //   3. Tạo resource "Speech" (không phải "OpenAI") trên Azure Portal,
    //      free tier F0 cho phép dùng thử miễn phí 1 lượng nhất định/tháng.
    //
    // NẾU CHƯA CÓ KEY: endpoint này trả 503, frontend (speechService.js)
    // sẽ tự fallback sang Web Speech API của browser — app vẫn chạy được,
    // không cần chờ Azure setup xong mới demo được tính năng.
    // ─────────────────────────────────────────────────────────
    [Route("api/speech")]
    [ApiController]
    public class SpeechController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;

        public SpeechController(IConfiguration config, IWebHostEnvironment env)
        {
            _config = config;
            _env    = env;
        }

        private static readonly System.Collections.Generic.Dictionary<string, string> VoiceMap = new()
        {
            ["vi"] = "vi-VN-HoaiMyNeural",
            ["en"] = "en-US-JennyNeural",
            ["ja"] = "ja-JP-NanamiNeural",
            ["zh"] = "zh-CN-XiaoxiaoNeural",
            ["ko"] = "ko-KR-SunHiNeural",
            ["fr"] = "fr-FR-DeniseNeural",
        };

        // POST /api/speech/generate
        // Body: { text, languageCode }
        // Returns: { audioUrl }
        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateSpeechDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Text))
                return BadRequest(new { message = "text là bắt buộc." });

            var speechKey    = _config["Azure:SpeechKey"];
            var speechRegion = _config["Azure:SpeechRegion"];

            // Chưa cấu hình Azure key → trả 503 để frontend tự fallback
            // sang Web Speech API, KHÔNG throw exception làm crash request.
            if (string.IsNullOrWhiteSpace(speechKey) || string.IsNullOrWhiteSpace(speechRegion))
            {
                return StatusCode(503, new { message = "Azure Speech chưa được cấu hình." });
            }

            try
            {
                var voiceName = VoiceMap.TryGetValue(dto.LanguageCode ?? "vi", out var v) ? v : VoiceMap["vi"];

                var config = SpeechConfig.FromSubscription(speechKey, speechRegion);
                config.SpeechSynthesisVoiceName = voiceName;

                // Lưu file mp3 vào wwwroot/audio để có thể serve qua URL tĩnh
                var folder = Path.Combine(_env.WebRootPath ?? "wwwroot", "audio");
                Directory.CreateDirectory(folder);

                var fileName = $"{Guid.NewGuid()}.mp3";
                var filePath = Path.Combine(folder, fileName);

                using var audioConfig = AudioConfig.FromWavFileOutput(filePath);
                using var synthesizer = new SpeechSynthesizer(config, audioConfig);

                var result = await synthesizer.SpeakTextAsync(dto.Text);

                if (result.Reason != ResultReason.SynthesizingAudioCompleted)
                {
                    return StatusCode(502, new { message = "Azure không tạo được audio." });
                }

                var audioUrl = $"/audio/{fileName}";
                return Ok(new { audioUrl });
            }
            catch (Exception ex)
            {
                // Azure lỗi (key sai, hết quota, network...) → vẫn trả 503,
                // không để lỗi 500 làm crash — frontend cần biết đây là
                // "Azure không khả dụng" để tự fallback, không phải bug thật.
                return StatusCode(503, new { message = "Azure Speech lỗi.", detail = ex.Message });
            }
        }
        // POST /api/speech/gtts — Google Translate TTS proxy (free, no key needed)
        [HttpPost("gtts")]
        public async Task<IActionResult> GoogleTTS([FromBody] GenerateSpeechDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Text))
                return BadRequest(new { message = "text la bat buoc." });

            var langMap = new System.Collections.Generic.Dictionary<string, string>
            {
                ["vi"] = "vi", ["en"] = "en", ["ja"] = "ja",
                ["zh"] = "zh-CN", ["ko"] = "ko", ["fr"] = "fr",
            };
            var tl = langMap.TryGetValue(dto.LanguageCode ?? "vi", out var mapped) ? mapped : "vi";

            try
            {
                var text    = dto.Text.Length > 200 ? dto.Text[..200] : dto.Text;
                var encoded = Uri.EscapeDataString(text);
                var url     = $"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded}&tl={tl}&client=tw-ob&ttsspeed=0.9";

                using var http = new System.Net.Http.HttpClient();
                http.DefaultRequestHeaders.Add("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                http.Timeout = TimeSpan.FromSeconds(10);

                var bytes    = await http.GetByteArrayAsync(url);
                var folder   = Path.Combine(_env.WebRootPath ?? "wwwroot", "audio");
                Directory.CreateDirectory(folder);
                var fileName = $"gtts_{Guid.NewGuid()}.mp3";
                await System.IO.File.WriteAllBytesAsync(Path.Combine(folder, fileName), bytes);

                return Ok(new { audioUrl = $"/audio/{fileName}" });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Google TTS loi.", detail = ex.Message });
            }
        }
    }

    public class GenerateSpeechDto
    {
        public string Text { get; set; } = string.Empty;
        public string? LanguageCode { get; set; }
    }
}