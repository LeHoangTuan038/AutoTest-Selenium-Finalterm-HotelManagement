using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly ICloudinaryService _cloudinaryService;

        public UploadController(ICloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            try
            {
                using var stream = file.OpenReadStream();
                var (url, publicId) = await _cloudinaryService.UploadImageAsync(stream, file.FileName);
                return Ok(new { url, publicId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("base64")]
        public async Task<IActionResult> UploadBase64([FromBody] string base64)
        {
            if (string.IsNullOrEmpty(base64))
                return BadRequest("No base64 string provided");

            try
            {
                var (url, publicId) = await _cloudinaryService.UploadImageFromBase64Async(base64, $"upload_{Guid.NewGuid()}");
                return Ok(new { url, publicId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
