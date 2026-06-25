using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class ImageRepository : IImageRepository
    {
        private readonly AppDbContext _db;

        public ImageRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Image>> GetByBoothId(int boothId)
        {
            return await _db.Images
                .Where(i => i.BoothId == boothId)
                .OrderBy(i => i.SortOrder)
                .ToListAsync();
        }

        public async Task<Image> GetById(int id)
        {
            return await _db.Images.FindAsync(id);
        }

        public async Task<Image> Create(Image image)
        {
            image.CreatedAt = System.DateTime.UtcNow;
            _db.Images.Add(image);
            await _db.SaveChangesAsync();
            return image;
        }

        public async Task<Image> Update(Image image)
        {
            _db.Images.Update(image);
            await _db.SaveChangesAsync();
            return image;
        }

        public async Task<bool> Delete(int id)
        {
            var image = await _db.Images.FindAsync(id);
            if (image == null) return false;

            _db.Images.Remove(image);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}