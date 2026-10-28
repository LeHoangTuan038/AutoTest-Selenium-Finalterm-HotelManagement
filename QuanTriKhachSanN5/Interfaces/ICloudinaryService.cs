namespace QuanTriKhachSanN5.Interfaces;

public interface ICloudinaryService
{
    /// <summary>
    /// Upload ảnh từ file stream lên Cloudinary
    /// </summary>
    Task<(string Url, string PublicId)> UploadImageAsync(Stream fileStream, string fileName);

    /// <summary>
    /// Upload ảnh từ base64 string
    /// </summary>
    Task<(string Url, string PublicId)> UploadImageFromBase64Async(string base64String, string fileName);

    /// <summary>
    /// Xóa ảnh từ Cloudinary
    /// </summary>
    Task<bool> DeleteImageAsync(string publicId);

    /// <summary>
    /// Upload multiple images
    /// </summary>
    Task<List<(string Url, string PublicId)>> UploadMultipleImagesAsync(List<Stream> fileStreams, string folderPrefix);
}
