'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dispensary } from '@/types';

interface MapViewProps {
  dispensaries: Dispensary[];
}

export default function MapView({ dispensaries }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    // Note: You'll need to set NEXT_PUBLIC_MAPBOX_TOKEN in your .env file
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      console.warn('Mapbox token not found. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env file');
      return;
    }
    
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || !dispensaries.length) return;

    // Remove existing markers
    const markers: mapboxgl.Marker[] = [];
    
    // Calculate bounds to fit all markers
    const bounds = new mapboxgl.LngLatBounds();

    dispensaries.forEach((dispensary) => {
      if (!dispensary.coordinates?.coordinates || dispensary.coordinates.coordinates.length !== 2) {
        return;
      }

      const [lng, lat] = dispensary.coordinates.coordinates;
      
      if (isNaN(lng) || isNaN(lat) || lng === 0 && lat === 0) {
        return;
      }

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';
      popupContent.innerHTML = `
        <div class="font-semibold text-orange-700">${dispensary.name}</div>
        ${dispensary.address ? `
          <div class="text-sm text-gray-600 mt-1">
            ${dispensary.address.street1}${dispensary.address.street2 ? `, ${dispensary.address.street2}` : ''}<br/>
            ${dispensary.address.city}, ${dispensary.address.state} ${dispensary.address.zipCode}
          </div>
        ` : ''}
        ${dispensary.phoneNumber ? `<div class="text-sm text-gray-600 mt-1">${dispensary.phoneNumber}</div>` : ''}
        ${dispensary.status ? `
          <div class="mt-2">
            <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              dispensary.status === 'approved' 
                ? 'bg-green-100 text-green-700' 
                : dispensary.status === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }">
              ${dispensary.status.charAt(0).toUpperCase() + dispensary.status.slice(1)}
            </span>
          </div>
        ` : ''}
      `;

      // Create marker
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = dispensary.status === 'approved' ? '#10b981' : dispensary.status === 'pending' ? '#f59e0b' : '#ef4444';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent))
        .addTo(map.current!);

      markers.push(marker);
      bounds.extend([lng, lat]);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
      });
    }

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [mapLoaded, dispensaries]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[calc(100vh-200px)] rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg text-sm max-w-md">
          <p className="font-semibold mb-2">⚠️ Mapbox Token Required</p>
          <p>Please set <code className="bg-yellow-200 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your <code className="bg-yellow-200 px-1 rounded">.env</code> file to display the map.</p>
          <p className="mt-2 text-xs">Get your token from <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">mapbox.com</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-200px)] rounded-lg overflow-hidden shadow-lg border border-gray-200 relative">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
