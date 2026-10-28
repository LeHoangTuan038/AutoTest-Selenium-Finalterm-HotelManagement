namespace QuanTriKhachSanN5.DTOs.Review
{
    public class ReviewDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; }
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public int? Cleanliness { get; set; }
        public int? Comfort { get; set; }
        public int? ServiceQuality { get; set; }
        public int? ValueForMoney { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsVerified { get; set; }

        // Calculate average rating
        public double GetAverageRating()
        {
            var ratings = new List<int> { Rating };
            if (Cleanliness.HasValue) ratings.Add(Cleanliness.Value);
            if (Comfort.HasValue) ratings.Add(Comfort.Value);
            if (ServiceQuality.HasValue) ratings.Add(ServiceQuality.Value);
            if (ValueForMoney.HasValue) ratings.Add(ValueForMoney.Value);
            return ratings.Average();
        }
    }
}
