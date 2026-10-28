using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CMSController : ControllerBase
    {
        private readonly ICMSService _cmsService;

        public CMSController(ICMSService cmsService)
        {
            _cmsService = cmsService;
        }

        [HttpGet("articles")]
        public async Task<ActionResult<List<Article>>> GetArticles()
        {
            var articles = await _cmsService.GetArticlesAsync();
            return Ok(articles);
        }

        [HttpGet("articles/{id}")]
        public async Task<ActionResult<Article>> GetArticle(int id)
        {
            var article = await _cmsService.GetArticleByIdAsync(id);
            if (article == null)
                return NotFound();
            return Ok(article);
        }

        [HttpPost("articles")]
        public async Task<IActionResult> CreateArticle(Article article)
        {
            await _cmsService.CreateArticleAsync(article);
            return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, article);
        }

        [HttpGet("attractions")]
        public async Task<ActionResult<List<Attraction>>> GetAttractions()
        {
            var attractions = await _cmsService.GetAttractionsAsync();
            return Ok(attractions);
        }

        [HttpGet("reviews/roomtype/{roomTypeId}")]
        public async Task<ActionResult<List<Review>>> GetReviewsByRoomType(int roomTypeId)
        {
            var reviews = await _cmsService.GetReviewsByRoomTypeAsync(roomTypeId);
            return Ok(reviews);
        }
    }
}
