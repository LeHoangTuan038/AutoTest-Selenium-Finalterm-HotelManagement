using QuanTriKhachSanN5.DTOs.GoogleMaps;

namespace QuanTriKhachSanN5.Interfaces;

public interface IGoogleMapsService
{
    /// <summary>
    /// Search for places using Google Places API Text Search
    /// </summary>
    Task<GooglePlacesSearchDTO?> SearchPlacesAsync(string query, string? region = null, int? radius = null);

    /// <summary>
    /// Get detailed information about a place
    /// </summary>
    Task<GooglePlaceDetailsDTO?> GetPlaceDetailsAsync(string placeId);

    /// <summary>
    /// Find nearby places
    /// </summary>
    Task<GooglePlacesSearchDTO?> FindNearbyPlacesAsync(double latitude, double longitude, int radiusMeters, string type);

    /// <summary>
    /// Geocode địa chỉ thành tọa độ
    /// </summary>
    Task<(double Latitude, double Longitude)?> GeocodeAddressAsync(string address);
}
