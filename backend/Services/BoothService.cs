using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using backend.Repositories;
using backend.DTOs.Booth;
using backend.Helpers;

namespace backend.Services
{
    public interface IBoothService
    {
        Task<IEnumerable<Booth>> GetByEventId(int eventId);
        Task<Booth> GetById(int id);
        Task<Booth> Create(Booth booth);
        Task<Booth> Update(Booth booth);
        Task<bool> Delete(int id);
        Task<NearestBoothResponse> FindNearest(NearestBoothRequest request);
    }

    public class BoothService : IBoothService
    {
        private readonly IBoothRepository _boothRepo;

        public BoothService(IBoothRepository boothRepo)
        {
            _boothRepo = boothRepo;
        }

        public async Task<IEnumerable<Booth>> GetByEventId(int eventId)
        {
            return await _boothRepo.GetByEventId(eventId);
        }

        public async Task<Booth> GetById(int id)
        {
            return await _boothRepo.GetById(id);
        }

        public async Task<Booth> Create(Booth booth)
        {
            booth.CreatedAt = DateTime.UtcNow;
            booth.IsActive = true;
            return await _boothRepo.Create(booth);
        }

        public async Task<Booth> Update(Booth booth)
        {
            return await _boothRepo.Update(booth);
        }

        public async Task<bool> Delete(int id)
        {
            return await _boothRepo.Delete(id);
        }

        public async Task<NearestBoothResponse> FindNearest(NearestBoothRequest request)
        {
            var booths = await _boothRepo.GetByEventId(request.EventId);
            var activeBooths = booths.Where(b => b.IsActive).ToList();

            if (!activeBooths.Any())
            {
                return new NearestBoothResponse
                {
                    BoothId = 0,
                    BoothName = "Không có gian hàng nào",
                    Distance = 0,
                    IsWithinGeofence = false,
                    GeofenceRadius = 0
                };
            }

            var boothsWithDistance = activeBooths.Select(b => new
            {
                Booth = b,
                Distance = HaversineHelper.CalculateDistance(
                    (double)request.Latitude,
                    (double)request.Longitude,
                    (double)b.Latitude,
                    (double)b.Longitude)
            }).ToList();

            var nearest = boothsWithDistance.OrderBy(x => x.Distance).First();

            double radius = (double)(request.Radius ?? 15);
            bool isWithin = nearest.Distance <= radius;

            return new NearestBoothResponse
            {
                BoothId = nearest.Booth.Id,
                BoothName = nearest.Booth.BoothName ?? "",  // ← SỬA: BoothName
                Distance = (decimal)nearest.Distance,
                IsWithinGeofence = isWithin,
                GeofenceRadius = nearest.Booth.Radius
            };
        }
    }
}