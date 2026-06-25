namespace backend.DTOs.Booth
{
    public class NearestBoothResponse
    {
        public int BoothId { get; set; }
        public string BoothName { get; set; } = "";
        public decimal Distance { get; set; }
        public bool IsWithinGeofence { get; set; }
        public decimal GeofenceRadius { get; set; }
    }
}