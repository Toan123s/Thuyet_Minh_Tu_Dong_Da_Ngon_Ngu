using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class VideoRepository : IVideoRepository
    {
        private readonly AppDbContext _db;

        public VideoRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Video>> GetByBoothId(int boothId)
        {
            return await _db.Videos
                .Where(v => v.BoothId == boothId)
                .ToListAsync();
        }

        public async Task<Video> GetById(int id)
        {
            return await _db.Videos.FindAsync(id);
        }

        public async Task<Video> Create(Video video)
        {
            video.CreatedAt = System.DateTime.UtcNow;
            _db.Videos.Add(video);
            await _db.SaveChangesAsync();
            return video;
        }

        public async Task<Video> Update(Video video)
        {
            _db.Videos.Update(video);
            await _db.SaveChangesAsync();
            return video;
        }

        public async Task<bool> Delete(int id)
        {
            var video = await _db.Videos.FindAsync(id);
            if (video == null) return false;

            _db.Videos.Remove(video);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}