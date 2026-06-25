namespace backend.Services;

public class SpeechService
{
    private static readonly Dictionary<string, string> VoiceMap = new()
    {
        { "vi", "vi-VN-HoaiMyNeural"   },
        { "en", "en-US-JennyNeural"    },
        { "ja", "ja-JP-NanamiNeural"   },
        { "ko", "ko-KR-SunHiNeural"    },
        { "zh", "zh-CN-XiaoxiaoNeural" },
    };

    public Task<object> GenerateAudioAsync(string text, string languageCode)
    {
        var voice    = VoiceMap.GetValueOrDefault(languageCode, "vi-VN-HoaiMyNeural");
        var audioUrl = $"/audio/{languageCode}/{Guid.NewGuid()}.mp3";
        return Task.FromResult<object>(new { audioUrl, voice, languageCode });
    }
}