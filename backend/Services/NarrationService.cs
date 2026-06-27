using System;
using System.Threading.Tasks;
using backend.Models;
using backend.Repositories;
using backend.DTOs.Narration;

namespace backend.Services
{
    public class NarrationService
    {
        private readonly INarrationRepository _repo;

        public NarrationService(INarrationRepository repo) { _repo = repo; }

        // Lấy narration theo booth — trả null-safe response thay vì throw khi chưa có
        public async Task<NarrationResponse> GetByBoothIdAsync(int boothId)
        {
            var narration = await _repo.GetByBoothId(boothId);
            if (narration == null)
                return new NarrationResponse { BoothId = boothId };   // trả rỗng, không crash

            return MapToResponse(narration);
        }

        // Tạo mới hoặc cập nhật nội dung thuyết minh
        public async Task<NarrationResponse> UpsertAsync(int boothId, NarrationRequest request)
        {
            var existing = await _repo.GetByBoothId(boothId);
            if (existing != null)
            {
                existing.Title     = request.Title;
                existing.Content   = request.Content;
                existing.UpdatedAt = DateTime.UtcNow;
                var updated = await _repo.Update(existing);
                return MapToResponse(updated);
            }

            var narration = new Narration
            {
                BoothId   = boothId,
                Title     = request.Title,
                Content   = request.Content,
                UpdatedAt = DateTime.UtcNow
            };
            var created = await _repo.Create(narration);
            return MapToResponse(created);
        }

        // Cập nhật narration theo ID
        public async Task<NarrationResponse> UpdateAsync(int narrationId, NarrationRequest request)
        {
            var existing = await _repo.GetById(narrationId);
            if (existing == null)
                throw new KeyNotFoundException($"Không tìm thấy narration với ID {narrationId}.");

            existing.Title     = request.Title;
            existing.Content   = request.Content;
            existing.UpdatedAt = DateTime.UtcNow;

            var result = await _repo.Update(existing);
            return MapToResponse(result);
        }

        private static NarrationResponse MapToResponse(Narration n) => new()
        {
            Id        = n.Id,
            BoothId   = n.BoothId,
            Title     = n.Title,
            Content   = n.Content,
            UpdatedAt = n.UpdatedAt
        };
    }
}