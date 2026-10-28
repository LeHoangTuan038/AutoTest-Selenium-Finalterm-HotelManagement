namespace QuanTriKhachSanN5.DTOs.GoogleMaps;

public class GooglePlaceDetailsDTO
{
    public string PlaceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? FormattedAddress { get; set; }
    public GoogleGeometryDTO? Geometry { get; set; }
    public List<string>? Types { get; set; }
    public string? Url { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public double? Rating { get; set; }
    public int? UserRatingsTotal { get; set; }
    public List<string>? PhotoUrls { get; set; }
}

public class GoogleGeometryDTO
{
    public GoogleLocationDTO? Location { get; set; }
}

public class GoogleLocationDTO
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class GooglePlacesSearchDTO
{
    public List<GooglePlaceResult>? Results { get; set; }
    public string? Status { get; set; }
    public string? NextPageToken { get; set; }
}

public class GooglePlaceResult
{
    public string PlaceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? FormattedAddress { get; set; }
    public GoogleGeometryDTO? Geometry { get; set; }
}
