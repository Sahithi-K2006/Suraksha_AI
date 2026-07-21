import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

const VERDICT_COLOR = {
  safe: '#10B981',
  suspicious: '#F59E0B',
  high_risk: '#DC2626',
};

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru

export default function IncidentMap({ cases = [] }) {
  const withCoords = cases.filter((c) => c.latitude && c.longitude);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom={false} style={{ height: '420px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.latitude, c.longitude]}
          radius={6}
          pathOptions={{ color: VERDICT_COLOR[c.verdict] || '#64748b', fillColor: VERDICT_COLOR[c.verdict] || '#64748b', fillOpacity: 0.7, weight: 1.5 }}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <div className="font-semibold capitalize">{c.type.replace('_', ' ')}</div>
              <div className="truncate max-w-[200px]">{c.input_summary}</div>
              <div className="capitalize">{c.verdict.replace('_', ' ')} - {c.risk_score}/100</div>
              <Link to={`/cases/${c.id}`} className="text-trust-blue underline">View case</Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
