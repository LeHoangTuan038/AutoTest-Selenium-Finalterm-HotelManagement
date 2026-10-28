using System;
using System.Threading.Tasks;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IAuditBatchService
    {
        Task AddEventAsync(int userId, string role, object eventObj);
    }
}
