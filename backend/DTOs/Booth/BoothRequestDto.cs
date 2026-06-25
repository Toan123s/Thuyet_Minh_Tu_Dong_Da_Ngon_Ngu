namespace backend.DTOs.Booth
{
    public class BoothRequestDto
    {
        public int AccountId { get; set; }
        public int CategoryId { get; set; }
        public int? EventId { get; set; }
        public string? BoothName { get; set; }
        public string? Description { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? Radius { get; set; }
    }
}