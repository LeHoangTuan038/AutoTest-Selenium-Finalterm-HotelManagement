using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly IConfiguration _config;
    private readonly string _folder;

    public CloudinaryService(IConfiguration config)
    {
        _config = config;
        var cloudName = config["Cloudinary:CloudName"];
        var apiKey = config["Cloudinary:ApiKey"];
        var apiSecret = config["Cloudinary:ApiSecret"];
        _folder = config["Cloudinary:Folder"] ?? "hotel-management/attractions";

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<(string Url, string PublicId)> UploadImageAsync(Stream fileStream, string fileName)
    {
        try
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = _folder,
                Transformation = new Transformation()
                    .Quality("auto")
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
            {
                return (uploadResult.SecureUrl.AbsoluteUri, uploadResult.PublicId);
            }

            throw new Exception($"Upload failed: {uploadResult.Error?.Message}");
        }
        catch (Exception ex)
        {
            throw new Exception($"Cloudinary upload error: {ex.Message}", ex);
        }
    }

    public async Task<(string Url, string PublicId)> UploadImageFromBase64Async(string base64String, string fileName)
    {
        try
        {
            // Convert base64 to byte array
            var base64Data = base64String.Contains(",") ? base64String.Split(",")[1] : base64String;
            var imageBytes = Convert.FromBase64String(base64Data);
            var stream = new MemoryStream(imageBytes);

            return await UploadImageAsync(stream, fileName);
        }
        catch (Exception ex)
        {
            throw new Exception($"Base64 upload error: {ex.Message}", ex);
        }
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        try
        {
            if (string.IsNullOrEmpty(publicId))
                return false;

            var deleteParams = new DeletionParams(publicId);
            var deleteResult = await _cloudinary.DestroyAsync(deleteParams);

            return deleteResult.Result == "ok";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Cloudinary delete error: {ex.Message}");
            return false;
        }
    }

    public async Task<List<(string Url, string PublicId)>> UploadMultipleImagesAsync(List<Stream> fileStreams, string folderPrefix)
    {
        var results = new List<(string Url, string PublicId)>();

        try
        {
            var tasks = fileStreams.Select((stream, index) =>
                UploadImageAsync(stream, $"{folderPrefix}_{Guid.NewGuid()}_{index}")
            ).ToList();

            var uploadResults = await Task.WhenAll(tasks);
            results.AddRange(uploadResults);

            return results;
        }
        catch (Exception ex)
        {
            throw new Exception($"Multiple upload error: {ex.Message}", ex);
        }
    }
}
