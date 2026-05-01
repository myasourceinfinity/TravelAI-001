/**
 * MapPanel.jsx
 * Interactive world map for the right side of the split-screen auth layout.
 * Uses react-leaflet and CartoDB Dark Matter tiles.
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker with an emoji
const createEmojiIcon = (emoji) => {
  return L.divIcon({
    className: 'custom-emoji-marker',
    html: `<div style="font-size: 24px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

export const MAP_DESTINATIONS = [
  { id: 'USD', pos: [40.7128, -74.0060], emoji: '🗽', name: 'New York, USA' },
  { id: 'EUR', pos: [48.8566, 2.3522],   emoji: '🗼', name: 'Paris, France' },
  { id: 'GBP', pos: [51.5074, -0.1278],  emoji: '💂', name: 'London, UK' },
  { id: 'AUD', pos: [-33.8688, 151.2093],emoji: '🦘', name: 'Sydney, Australia' },
  { id: 'NZD', pos: [-36.8485, 174.7633],emoji: '🥝', name: 'Auckland, New Zealand' },
  { id: 'JPY', pos: [35.6762, 139.6503], emoji: '⛩️', name: 'Tokyo, Japan' },
  { id: 'CAD', pos: [43.6532, -79.3832], emoji: '🍁', name: 'Toronto, Canada' },
  { id: 'SGD', pos: [1.3521, 103.8198],  emoji: '🦁', name: 'Singapore' },
  { id: 'CHF', pos: [47.3769, 8.5417],   emoji: '⛰️', name: 'Zurich, Switzerland' },
  { id: 'CNY', pos: [39.9042, 116.4074], emoji: '🐉', name: 'Beijing, China' },
];

// Component to handle map resize when container changes
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Small delay to ensure container has resized
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Controller to handle flying to selected currency
function MapController({ selectedCurrency }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCurrency) {
      const dest = MAP_DESTINATIONS.find(d => d.id === selectedCurrency);
      if (dest) {
        map.flyTo(dest.pos, 4, { duration: 1.5 });
      }
    }
  }, [selectedCurrency, map]);
  return null;
}

export default function MapPanel({ selectedCurrency, onCurrencyChange }) {
  const mapRef = useRef(null);
  return (
    <div className="auth-map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Subtle overlay gradient to blend with the dark form panel on the left */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100px',
          height: '100%',
          background: 'linear-gradient(to right, var(--bg-900) 0%, transparent 100%)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      />
      
      <MapContainer 
        center={[20, 0]} 
        zoom={2.5} 
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false} // Hide default zoom control for cleaner look
        ref={mapRef}
      >
        <MapResizer />
        <MapController selectedCurrency={selectedCurrency} />
        {/* CartoDB Voyager tiles (colorful) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {MAP_DESTINATIONS.map(dest => (
          <Marker 
            key={dest.id} 
            position={dest.pos} 
            icon={createEmojiIcon(dest.emoji)}
            eventHandlers={{
              click: () => {
                if (onCurrencyChange) onCurrencyChange(dest.id);
              },
            }}
          >
            <Popup className="custom-popup">
              <strong>{dest.name}</strong>
              <br />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Currency: {dest.id}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
