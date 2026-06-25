namespace backend.DTOs.Booth
{
    public class NearestBoothRequest
    {
        public int EventId { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal? Radius { get; set; } = 15;
    }
}