using System;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs.Promotion;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Services
{
    public class PromotionService : IPromotionService
    {
        private readonly ApplicationDbContext _context;

        public PromotionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<decimal> CalculateFinalAmountAsync(CalculateDiscountDTO dto)
        {
            decimal discountAmount = 0;

            if (!string.IsNullOrEmpty(dto.VoucherCode))
            {
                var now = DateTime.UtcNow;
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v =>
                    v.Code == dto.VoucherCode && 
                    (v.ValidFrom == null || v.ValidFrom <= now) &&
                    (v.ValidTo == null || v.ValidTo >= now) &&
                    (v.UsageLimit == null || v.UsageLimit > 0)
                );

                if (voucher != null)
                {
                    if (dto.OriginalAmount >= (voucher.MinBookingValue ?? 0))
                    {
                        if (string.Equals(voucher.DiscountType, "PERCENT", StringComparison.OrdinalIgnoreCase))
                        {
                            discountAmount += dto.OriginalAmount * (voucher.DiscountValue / 100);
                        }
                        else if (string.Equals(voucher.DiscountType, "FIXED_AMOUNT", StringComparison.OrdinalIgnoreCase))
                        {
                            discountAmount += voucher.DiscountValue;
                        }
                    }
                }
            }

            if (dto.MembershipId.HasValue)
            {
                var membership = await _context.Memberships.FindAsync(dto.MembershipId.Value);
                if (membership != null)
                {
                    discountAmount += dto.OriginalAmount * (membership.DiscountPercent / 100);
                }
            }

            if (discountAmount > dto.OriginalAmount)
                discountAmount = dto.OriginalAmount;

            return dto.OriginalAmount - discountAmount;
        }
    }
}
