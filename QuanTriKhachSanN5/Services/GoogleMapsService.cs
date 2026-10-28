using Microsoft.Extensions.Configuration;
using QuanTriKhachSanN5.DTOs.GoogleMaps;
using QuanTriKhachSanN5.Interfaces;
using System.Net.Http.Json;
using System.Text.Json;

namespace QuanTriKhachSanN5.Services;

public class GoogleMapsService : IGoogleMapsService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly string _apiKey;
    private readonly string _placesApiUrl;

    public GoogleMapsService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _config = config;
        _apiKey = config["GoogleMaps:ApiKey"] ?? string.Empty;
        _placesApiUrl = config["GoogleMaps:PlacesApiUrl"] ?? "https://maps.googleapis.com/maps/api/place";
    }

    public async Task<GooglePlacesSearchDTO?> SearchPlacesAsync(string query, string? region = null, int? radius = null)
    {
        try
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new Exception("Google Maps API key not configured");

            var url = $"{_placesApiUrl}/textsearch/json?query={Uri.EscapeDataString(query)}&key={_apiKey}";

            if (!string.IsNullOrEmpty(region))
                url += $"&region={region}";

            if (radius.HasValue)
                url += $"&radius={radius}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<GooglePlacesSearchDTO>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Google Places search error: {ex.Message}");
            return null;
        }
    }

    public async Task<GooglePlaceDetailsDTO?> GetPlaceDetailsAsync(string placeId)
    {
        try
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new Exception("Google Maps API key not configured");

            var fields = "place_id,name,formatted_address,geometry,types,url,formatted_phone_number,website,rating,user_ratings_total,photos";
            var url = $"{_placesApiUrl}/details/json?place_id={placeId}&fields={fields}&key={_apiKey}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var jsonDocument = await JsonDocument.ParseAsync(stream);
            var result = jsonDocument.RootElement;
            
            if (!result.TryGetProperty("result", out var placeResultElement) || placeResultElement.ValueKind == JsonValueKind.Null)
                return null;

            var placeResult = placeResultElement;
            var photoUrls = new List<string>();

            // Extract photos if available
            if (placeResult.TryGetProperty("photos", out var photosElement) && photosElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var photo in photosElement.EnumerateArray())
                {
                    if (photo.TryGetProperty("photo_reference", out var photoRef))
                    {
                        var photoUrl = $"{_placesApiUrl}/photo?maxwidth=400&photo_reference={photoRef.GetString()}&key={_apiKey}";
                        photoUrls.Add(photoUrl);
                    }
                }
            }

            var geometry = placeResult.TryGetProperty("geometry", out var geomElement) ? new GoogleGeometryDTO
            {
                Location = geomElement.TryGetProperty("location", out var locElement) ? new GoogleLocationDTO
                {
                    Latitude = locElement.GetProperty("lat").GetDouble(),
                    Longitude = locElement.GetProperty("lng").GetDouble()
                } : null
            } : null;

            return new GooglePlaceDetailsDTO
            {
                PlaceId = placeId,
                Name = placeResult.TryGetProperty("name", out var nameElement) ? nameElement.GetString() ?? string.Empty : string.Empty,
                FormattedAddress = placeResult.TryGetProperty("formatted_address", out var addressElement) ? addressElement.GetString() : null,
                Geometry = geometry,
                PhoneNumber = placeResult.TryGetProperty("formatted_phone_number", out var phoneElement) ? phoneElement.GetString() : null,
                Website = placeResult.TryGetProperty("website", out var websiteElement) ? websiteElement.GetString() : null,
                Rating = placeResult.TryGetProperty("rating", out var ratingElement) ? ratingElement.GetDouble() : null,
                UserRatingsTotal = placeResult.TryGetProperty("user_ratings_total", out var ratingsCountElement) ? ratingsCountElement.GetInt32() : null,
                PhotoUrls = photoUrls
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Google Place details error: {ex.Message}");
            return null;
        }
    }

    public async Task<GooglePlacesSearchDTO?> FindNearbyPlacesAsync(double latitude, double longitude, int radiusMeters, string type)
    {
        try
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new Exception("Google Maps API key not configured");

            var location = $"{latitude},{longitude}";
            var url = $"{_placesApiUrl}/nearbysearch/json?location={location}&radius={radiusMeters}&type={type}&key={_apiKey}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<GooglePlacesSearchDTO>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Nearby places search error: {ex.Message}");
            return null;
        }
    }

    public async Task<(double Latitude, double Longitude)?> GeocodeAddressAsync(string address)
    {
        try
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new Exception("Google Maps API key not configured");

            var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(address)}&key={_apiKey}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var jsonDocument = await JsonDocument.ParseAsync(stream);
            var result = jsonDocument.RootElement;

            if (result.TryGetProperty("results", out var resultsElement) && resultsElement.ValueKind == JsonValueKind.Array)
            {
                var resultsArray = resultsElement.EnumerateArray().FirstOrDefault();
                if (resultsArray.ValueKind != JsonValueKind.Null && 
                    resultsArray.TryGetProperty("geometry", out var geometry) && 
                    geometry.TryGetProperty("location", out var location))
                {
                    var lat = location.GetProperty("lat").GetDouble();
                    var lng = location.GetProperty("lng").GetDouble();
                    return (lat, lng);
                }
            }

            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Geocoding error: {ex.Message}");
            return null;
        }
    }
}
