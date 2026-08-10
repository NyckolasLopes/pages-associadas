import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { VisitorInfo } from '@/stores/live';
import { MapPin } from 'lucide-react';

interface LiveMapProps {
  visitors: VisitorInfo[];
}

// Criação de um ícone customizado usando DivIcon para manter o estilo visual premium
const createPulseIcon = (cityName: string) => {
  return L.divIcon({
    className: 'custom-pulse-icon',
    html: `
      <div class="relative flex items-center justify-center group" style="width: 24px; height: 24px;">
        <div class="absolute w-8 h-8 bg-emerald-500 rounded-full opacity-60 animate-ping"></div>
        <div class="relative w-3 h-3 bg-emerald-600 rounded-full shadow-[0_0_12px_rgba(5,150,105,1)] border-[1.5px] border-white"></div>
        <div class="absolute top-5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow-lg whitespace-nowrap border border-slate-100 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          ${cityName}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export function LiveMap({ visitors }: LiveMapProps) {
  // Centro aproximado do Brasil
  const center: [number, number] = [-14.235004, -51.92528];
  
  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative z-0">
      <style dangerouslySetInnerHTML={{ __html: `
          .leaflet-container {
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 0;
          }
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
            border-radius: 8px !important;
            overflow: hidden;
            margin-right: 24px !important;
            margin-bottom: 24px !important;
          }
          .leaflet-control-zoom a {
            background-color: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(8px);
            color: #334155 !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          .leaflet-control-zoom a:hover {
            background-color: #f8fafc !important;
            color: #10b981 !important;
          }
        ` }} />
      <MapContainer 
        center={center} 
        zoom={4} 
        scrollWheelZoom={true} 
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />

        {visitors.map((v) => {
          if (!v || !v.cidade) return null;
          
          // Fallback para caso lat/lng não venha do socket (usando porto alegre genérico ou centro do BR)
          const lat = v.cidade.lat || -14.235;
          const lng = v.cidade.lng || -51.925;
          
          return (
            <Marker 
              key={v.id} 
              position={[lat, lng]} 
              icon={createPulseIcon(v.cidade.nome)}
            >
              <Popup className="rounded-xl overflow-hidden shadow-xl border-0">
                <div className="p-1 min-w-[120px] text-center">
                  <div className="font-bold text-slate-800 text-sm mb-1">{v.cidade.nome}</div>
                  <div className="text-xs text-slate-500">{v.cidade.uf}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
