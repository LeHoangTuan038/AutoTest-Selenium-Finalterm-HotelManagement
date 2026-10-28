// =========================================================================
// MODULE 1: CMS - SERVICE
// =========================================================================

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class CMSService : ICMSService
    {
        private readonly ApplicationDbContext _context;

        public CMSService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Article>> GetArticlesAsync()
        {
            return await _context.Articles.Include(a => a.Category).ToListAsync();
        }

        public async Task<Article> GetArticleByIdAsync(int id)
        {
            return await _context
                .Articles.Include(a => a.Category)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task CreateArticleAsync(Article article)
        {
            _context.Articles.Add(article);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Attraction>> GetAttractionsAsync()
        {
            return await _context.Attractions.ToListAsync();
        }

        public async Task<List<Review>> GetReviewsByRoomTypeAsync(int roomTypeId)
        {
            return await _context.Reviews.Where(r => r.RoomTypeId == roomTypeId).ToListAsync();
        }
    }
}
