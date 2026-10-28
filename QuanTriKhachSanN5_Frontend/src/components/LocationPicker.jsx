import React, { useState, useRef } from 'react';
import { Input, Button, List, Spin, Empty, Typography } from 'antd';
import { SearchOutlined, EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * LocationPicker — Tìm kiếm vị trí qua Nominatim (OSM) + hiển thị Google Maps embed
 * Props:
 *   value: { address, lat, lng, mapEmbedLink }
 *   onChange: (value) => void
 */
const LocationPicker = ({ value = {}, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(value || {});
  const debounceRef = useRef(null);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&accept-language=vi`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelect = (item) => {
    const lat = parseFloat(item.lat).toFixed(6);
    const lng = parseFloat(item.lon).toFixed(6);
    const address = item.display_name;
    const mapEmbedLink = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

    const next = { address, lat, lng, mapEmbedLink };
    setSelected(next);
    setResults([]);
    setQuery(address);
    onChange?.(next);
  };

  const mapSrc = selected?.mapEmbedLink;

  return (
    <div>
      {/* Thanh tìm kiếm */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input
          prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
          placeholder="Tìm kiếm địa điểm... VD: Cầu Vàng Đà Nẵng"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          size="large"
          allowClear
          onClear={() => { setQuery(''); setResults([]); setSelected({}); onChange?.({}); }}
        />
        <Button
          type="primary"
          size="large"
          icon={searching ? <LoadingOutlined /> : <SearchOutlined />}
          onClick={() => handleSearch()}
          disabled={searching}
          style={{ minWidth: 100 }}
        >
          Tìm
        </Button>
      </div>

      {/* Danh sách kết quả */}
      {searching && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin tip="Đang tìm kiếm..." />
        </div>
      )}

      {!searching && results.length > 0 && (
        <div style={{
          border: '1px solid #d9d9d9', borderRadius: 8, background: '#fff',
          maxHeight: 220, overflowY: 'auto', marginBottom: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <List
            size="small"
            dataSource={results}
            renderItem={item => (
              <List.Item
                onClick={() => handleSelect(item)}
                style={{ cursor: 'pointer', padding: '10px 14px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <EnvironmentOutlined style={{ color: '#1890ff', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>
                      {item.display_name.split(',')[0]}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.display_name.split(',').slice(1, 4).join(',')}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Bản đồ Google Maps embed */}
      {mapSrc ? (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #d9d9d9', marginTop: 4 }}>
          <iframe
            title="Google Maps"
            src={mapSrc}
            width="100%"
            height="260"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div style={{ padding: '8px 12px', background: '#fafafa', fontSize: 12, color: '#666', borderTop: '1px solid #f0f0f0' }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {selected.address?.split(',').slice(0, 3).join(',')}
            {selected.lat && (
              <span style={{ marginLeft: 12, color: '#1890ff' }}>
                📍 {selected.lat}, {selected.lng}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d9d9d9', borderRadius: 10, background: '#fafafa', color: '#bbb', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 32 }}>🗺️</span>
          <span style={{ fontSize: 13 }}>Nhập địa điểm rồi nhấn Tìm để hiển thị bản đồ</span>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
