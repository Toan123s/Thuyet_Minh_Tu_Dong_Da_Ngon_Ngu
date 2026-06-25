// MediaService.cs — paste đè toàn bộ (đổi GetByBoothIdAsync/CreateAsync/... thành không-Async)
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class MediaService
{
    private readonly ImageRepository _imageRepo;
    private readonly VideoRepository _videoRepo;

    public MediaService(ImageRepository imageRepo, VideoRepository videoRepo)
    {
        _imageRepo = imageRepo;
        _videoRepo = videoRepo;
    }

    // ── Images ────────────────────────────────────────────────

    public async Task<List<object>> GetImagesAsync(int boothId)
    {
        var images = await _imageRepo.GetByBoothId(boothId);
        return images.Select(MapImage).ToList();
    }

    public async Task<object> AddImageAsync(int boothId, string imageUrl, string? caption)
    {
        var image = new Image
        {
            BoothId   = boothId,
            FilePath  = imageUrl,
            Caption   = caption,
            SortOrder = 0,
        };
        var created = await _imageRepo.Create(image);
        return MapImage(created);
    }

    public async Task<object> UpdateImageCaptionAsync(int imageId, string? caption)
    {
        var image = await _imageRepo.GetById(imageId)
            ?? throw new KeyNotFoundException($"Không tìm thấy ảnh ID = {imageId}.");
        image.Caption = caption;
        var updated = await _imageRepo.Update(image);
        return MapImage(updated);
    }

    public async Task DeleteImageAsync(int imageId)
    {
        var ok = await _imageRepo.Delete(imageId);
        if (!ok) throw new KeyNotFoundException($"Không tìm thấy ảnh ID = {imageId}.");
    }

    // ── Videos ────────────────────────────────────────────────

    public async Task<List<object>> GetVideosAsync(int boothId)
    {
        var videos = await _videoRepo.GetByBoothId(boothId);
        return videos.Select(MapVideo).ToList();
    }

    public async Task<object> AddVideoAsync(int boothId, string videoUrl, string? title)
    {
        var video = new Video
        {
            BoothId  = boothId,
            VideoUrl = videoUrl,
            Title    = title,
        };
        var created = await _videoRepo.Create(video);
        return MapVideo(created);
    }

    public async Task DeleteVideoAsync(int videoId)
    {
        var ok = await _videoRepo.Delete(videoId);
        if (!ok) throw new KeyNotFoundException($"Không tìm thấy video ID = {videoId}.");
    }

    private static object MapImage(Image i) => new
    {
        i.Id, i.BoothId,
        filePath = i.FilePath,
        i.Caption, i.SortOrder, i.CreatedAt,
    };

    private static object MapVideo(Video v) => new
    {
        v.Id, v.BoothId, v.VideoUrl, v.Title, v.CreatedAt,
    };
}