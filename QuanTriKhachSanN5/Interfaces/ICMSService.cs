// =========================================================================
// MODULE 1: CMS - INTERFACES
// =========================================================================

using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface ICMSService
    {
        Task<List<Article>> GetArticlesAsync();
        Task<Article> GetArticleByIdAsync(int id);
        Task CreateArticleAsync(Article article);
        Task<List<Attraction>> GetAttractionsAsync();
        Task<List<Review>> GetReviewsByRoomTypeAsync(int roomTypeId);
    }
}