using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using backend.Repositories;
using backend.DTOs.Event;

namespace backend.Services
{
    public interface IEventService
    {
        Task<IEnumerable<EventResponseDto>> GetAll(string? status = null);
        Task<EventResponseDto> GetById(int id);
        Task<Event> Create(Event eventItem);
        Task<Event> Update(Event eventItem);
        Task<bool> Delete(int id);
    }

    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepo;

        public EventService(IEventRepository eventRepo)
        {
            _eventRepo = eventRepo;
        }

        public async Task<IEnumerable<EventResponseDto>> GetAll(string? status = null)
        {
            var events = await _eventRepo.GetAll(status);
            return events.Select(e => new EventResponseDto
            {
                Id          = e.Id,
                Name        = e.Name ?? "",
                Description = e.Description ?? "",
                Location    = e.Location ?? "",
                StartDate   = e.StartDate ?? DateTime.MinValue,
                EndDate     = e.EndDate   ?? DateTime.MinValue,
                LogoUrl     = e.LogoUrl   ?? "",
                QRCodeUrl   = e.QRCodeUrl ?? "",
                Status      = GetEventStatus(e.StartDate, e.EndDate),
                CreatedAt   = e.CreatedAt ?? DateTime.MinValue,
                TotalBooths = e.Booths?.Count ?? 0
            });
        }

        public async Task<EventResponseDto> GetById(int id)
        {
            var e = await _eventRepo.GetById(id);
            if (e == null) return null!;

            return new EventResponseDto
            {
                Id          = e.Id,
                Name        = e.Name ?? "",
                Description = e.Description ?? "",
                Location    = e.Location ?? "",
                StartDate   = e.StartDate ?? DateTime.MinValue,
                EndDate     = e.EndDate   ?? DateTime.MinValue,
                LogoUrl     = e.LogoUrl   ?? "",
                QRCodeUrl   = e.QRCodeUrl ?? "",
                Status      = GetEventStatus(e.StartDate, e.EndDate),
                CreatedAt   = e.CreatedAt ?? DateTime.MinValue,
                TotalBooths = e.Booths?.Count ?? 0
            };
        }

        public async Task<Event> Create(Event eventItem)
        {
            eventItem.CreatedAt = DateTime.UtcNow;
            return await _eventRepo.Create(eventItem);
        }

        public async Task<Event> Update(Event eventItem)
        {
            return await _eventRepo.Update(eventItem);
        }

        public async Task<bool> Delete(int id)
        {
            return await _eventRepo.Delete(id);
        }

        // Nhận DateTime? để khớp với Model
        private string GetEventStatus(DateTime? startDate, DateTime? endDate)
        {
            // Nếu chưa set ngày thì coi là "Sắp tới"
            if (startDate == null || endDate == null) return "Sắp tới";
            var now = DateTime.UtcNow;
            if (now < startDate.Value) return "Sắp tới";
            if (now <= endDate.Value)  return "Đang mở";
            return "Đã kết thúc";
        }
    }
}