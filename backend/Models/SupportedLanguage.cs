namespace backend.Models;

// Danh sách ngôn ngữ đang được hệ thống "biết" — dùng để render dropdown
// chọn ngôn ngữ ở mọi trang visitor. Đây là dữ liệu TOÀN CỤC (chung cho
// mọi khách), KHÔNG phải theo từng người dùng riêng lẻ:
//   - Mặc định luôn có "vi" + "en".
//   - Khi 1 khách quét QR mà điện thoại đang để ngôn ngữ khác (vd "ja")
//     và hệ thống CÓ bản dịch cho ngôn ngữ đó → tự thêm vào đây, để từ
//     lúc đó MỌI khách khác cũng thấy "ja" xuất hiện trong dropdown.
public class SupportedLanguage
{
    public string Code { get; set; } = string.Empty; // "vi", "en", "ja", "ko", "zh", "fr"...
    public string Label { get; set; } = string.Empty; // "Tiếng Việt", "English"...
    public string? Flag { get; set; } // emoji cờ, vd "🇻🇳" — có thể null
    public DateTime AddedAt { get; set; }
}
