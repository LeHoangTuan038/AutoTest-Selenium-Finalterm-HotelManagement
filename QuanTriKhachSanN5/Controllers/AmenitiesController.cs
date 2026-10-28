using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;
using System.Threading.Tasks;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AmenitiesController : ControllerBase
    {
        private readonly IAmenityService _amenityService;

        public AmenitiesController(IAmenityService amenityService)
        {
            _amenityService = amenityService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _amenityService.GetAllAmenitiesAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Equipment equipment) // ĐỔI THÀNH EQUIPMENT
        {
            var result = await _amenityService.CreateAmenityAsync(equipment);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Equipment equipment) // ĐỔI THÀNH EQUIPMENT
        {
            equipment.Id = id;
            await _amenityService.UpdateAmenityAsync(equipment);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _amenityService.DeleteAmenityAsync(id);
            return NoContent();
        }
    }
}
