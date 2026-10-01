import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Institution, Resource } from '../types';
import { db } from '../services/db';

interface RexMapProps {
  institutions: Institution[];
  selectedInstitutionId?: string;
  onSelectInstitution?: (institution: Institution) => void;
  userInstitution?: Institution;
  highlightResource?: Resource;
  className?: string;
  zoomLevel?: 'INDIA' | 'STATE' | 'CITY' | 'COLLEGE';
}

const DARK_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const RexMap: React.FC<RexMapProps> = ({
  institutions,
  selectedInstitutionId,
  onSelectInstitution,
  userInstitution,
  highlightResource,
  className = 'w-full h-full min-h-[450px]',
  zoomLevel,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;

    // Center on India or User College
    const initialCenter: [number, number] = userInstitution
      ? [userInstitution.longitude, userInstitution.latitude]
      : [78.9629, 20.5937]; // Center of India
    const initialZoom = userInstitution ? 11 : 4.5;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      maxBounds: [
        [60.0, 5.0], // Southwest bounds of Indian sub-continent
        [98.0, 38.0], // Northeast bounds
      ],
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapInstance.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update Markers and Clusters
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Get current real resource counts per institution
    const allResources = db.getResources({ status: 'ACTIVE' });
    const resourceCountByInst: { [id: string]: number } = {};
    allResources.forEach((r) => {
      resourceCountByInst[r.institution_id] = (resourceCountByInst[r.institution_id] || 0) + 1;
    });

    // Add markers for institutions
    institutions.forEach((inst) => {
      const isUserCollege = userInstitution?.id === inst.id;
      const isSelected = selectedInstitutionId === inst.id;
      const resCount = resourceCountByInst[inst.id] || 0;

      // Custom HTML Marker element
      const el = document.createElement('div');
      el.className = 'rex-map-marker cursor-pointer group';
      
      const markerHtml = `
        <div class="relative flex items-center justify-center transition-transform hover:scale-125">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border shadow-lg ${
            isUserCollege
              ? 'bg-blue-500/20 text-blue-400 border-blue-400'
              : isSelected
              ? 'bg-emerald-500 text-charcoal-950 border-white font-extrabold shadow-emerald-glow'
              : resCount > 0
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-charcoal-800 text-slate-400 border-white/10'
          }">
            ${resCount > 0 ? resCount : '•'}
          </div>
          ${
            isSelected || isUserCollege
              ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>'
              : ''
          }
        </div>
      `;
      el.innerHTML = markerHtml;

      // Popup
      const popupHtml = `
        <div class="p-3 bg-[#0B0D13] text-slate-100 rounded-xl border border-white/10 font-sans shadow-xl max-w-[260px]">
          <div class="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
            ${inst.aishe_code} • ${inst.institution_type}
          </div>
          <div class="font-bold text-white text-sm leading-snug mb-1">
            ${inst.name}
          </div>
          <div class="text-[11px] text-slate-400 mb-2">
            ${inst.city}, ${inst.state}
          </div>
          <div class="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span class="text-emerald-400 font-bold font-mono">${resCount} active REX resources</span>
            <span class="text-slate-400 font-mono text-[10px]">Verified AISHE</span>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inst.longitude, inst.latitude])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onSelectInstitution?.(inst);
      });

      markersRef.current.push(marker);
    });
  }, [institutions, selectedInstitutionId, userInstitution, mapLoaded, onSelectInstitution]);

  // Handle Zoom and Routing Line when a Resource is Highlighted
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    // Draw connection line if both User College and Resource College exist
    const routeSourceId = 'rex-exchange-route';
    const routeLayerId = 'rex-exchange-line';

    if (highlightResource && userInstitution) {
      const resourceInst = institutions.find((i) => i.id === highlightResource.institution_id);
      if (resourceInst) {
        const coords = [
          [userInstitution.longitude, userInstitution.latitude],
          [resourceInst.longitude, resourceInst.latitude],
        ];

        const geojsonData: any = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        };

        if (map.getSource(routeSourceId)) {
          (map.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
        } else {
          map.addSource(routeSourceId, {
            type: 'geojson',
            data: geojsonData,
          });

          map.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#10B981',
              'line-width': 3,
              'line-dasharray': [2, 2],
            },
          });
        }

        // Fit bounds to show both colleges with padding
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([userInstitution.longitude, userInstitution.latitude]);
        bounds.extend([resourceInst.longitude, resourceInst.latitude]);

        map.fitBounds(bounds, {
          padding: { top: 70, bottom: 70, left: 70, right: 70 },
          maxZoom: 14,
          duration: 1200,
        });
        return;
      }
    } else {
      // Remove line if not highlighted
      if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
      if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);
    }

    // Zoom Level buttons or FlyTo selected institution
    if (selectedInstitutionId) {
      const inst = institutions.find((i) => i.id === selectedInstitutionId);
      if (inst) {
        map.flyTo({
          center: [inst.longitude, inst.latitude],
          zoom: 13.5,
          essential: true,
          duration: 1000,
        });
      }
    } else if (zoomLevel === 'INDIA') {
      map.flyTo({ center: [78.9629, 20.5937], zoom: 4.8, essential: true });
    } else if (zoomLevel === 'STATE' && userInstitution) {
      map.flyTo({ center: [userInstitution.longitude, userInstitution.latitude], zoom: 7.5, essential: true });
    } else if (zoomLevel === 'CITY' && userInstitution) {
      map.flyTo({ center: [userInstitution.longitude, userInstitution.latitude], zoom: 10.5, essential: true });
    } else if (zoomLevel === 'COLLEGE' && userInstitution) {
      map.flyTo({ center: [userInstitution.longitude, userInstitution.latitude], zoom: 14.5, essential: true });
    }
  }, [selectedInstitutionId, highlightResource, userInstitution, zoomLevel, institutions, mapLoaded]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-charcoal-950 ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Real Data & OpenStreetMap Attribution badge */}
      <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-md bg-[#07080B]/90 border border-white/10 text-[10px] font-mono text-slate-400 flex items-center gap-2 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span>MapLibre GL • OpenStreetMap / CARTO</span>
      </div>
    </div>
  );
};
