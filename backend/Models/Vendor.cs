namespace backend.Models;

public class Vendor
{
    public int      Id                 { get; set; }
    public int      AccountId          { get; set; }
    public string   CompanyName        { get; set; } = string.Empty;
    public string   RepresentativeName { get; set; } = string.Empty;
    public string   PhoneNumber        { get; set; } = string.Empty;
    public string?  Description        { get; set; }

    /// <summary>Đã thanh toán phí sử dụng địa điểm chưa</summary>
    public bool     IsPaid  { get; set; } = false;
    public DateTime? PaidAt { get; set; }
    public int?     EventId { get; set; }

    // ── Navigation ────────────────────────────────────────────
    public Account Account { get; set; } = null!;
    public ICollection<Booth> Booths { get; set; } = new List<Booth>();
}