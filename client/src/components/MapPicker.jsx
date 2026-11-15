import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const markerIcon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })
function ClickPoint({ onChange }) { useMapEvents({ click(event) { onChange({ latitude: String(event.latlng.lat.toFixed(6)), longitude: String(event.latlng.lng.toFixed(6)) }) } }); return null }
export default function MapPicker({ latitude, longitude, onChange }) {
  const selected = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && latitude !== '' && longitude !== ''
  const center = selected ? [Number(latitude), Number(longitude)] : [20.5937, 78.9629]
  return <div className="map-picker"><MapContainer center={center} zoom={selected ? 15 : 4} scrollWheelZoom={false} key={`${center[0]}-${center[1]}`}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><ClickPoint onChange={onChange} />{selected && <Marker position={center} icon={markerIcon} />}</MapContainer><small>Click the map to set the site coordinates.</small></div>
}
