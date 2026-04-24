'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Deal, Dispensary } from '@/types';

interface DealsMapViewProps {
  deals: Deal[];
  userLocation?: GeolocationCoordinates | { latitude: number; longitude: number } | null;
  radius?: number; // radius in miles
}

// Helper function to create a circle polygon given center point and radius in miles
function createCircle(center: [number, number], radiusMiles: number, points: number = 64): GeoJSON.Polygon {
  const [centerLng, centerLat] = center;
  const radiusKm = radiusMiles * 1.60934; // Convert miles to kilometers
  const earthRadiusKm = 6371; // Earth radius in kilometers
  
  const coordinates: [number, number][] = [];
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 360;
    const bearing = angle * Math.PI / 180;
    
    const lat1 = centerLat * Math.PI / 180;
    const lng1 = centerLng * Math.PI / 180;
    const d = radiusKm / earthRadiusKm;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
    );
    
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    coordinates.push([lng2 * 180 / Math.PI, lat2 * 180 / Math.PI]);
  }
  
  // Close the polygon by adding the first point at the end
  coordinates.push(coordinates[0]);
  
  return {
    type: 'Polygon',
    coordinates: [coordinates]
  };
}

export default function DealsMapView({ deals, userLocation, radius }: DealsMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      console.warn('Mapbox token not found. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env file');
      return;
    }
    
    mapboxgl.accessToken = mapboxToken;

    // Set initial center based on user location or default to USA center
    const initialCenter: [number, number] = userLocation
      ? [userLocation.longitude, userLocation.latitude]
      : [-98.5795, 39.8283];
    
    const initialZoom = userLocation ? 10 : 3;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
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
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove existing radius circle layers and source if they exist
    if (map.current.getSource('radius-circle')) {
      if (map.current.getLayer('radius-circle-fill')) {
        map.current.removeLayer('radius-circle-fill');
      }
      if (map.current.getLayer('radius-circle-border')) {
        map.current.removeLayer('radius-circle-border');
      }
      map.current.removeSource('radius-circle');
    }

    // Add radius circle if userLocation and radius are provided
    if (userLocation && radius && radius > 0) {
      const center: [number, number] = [userLocation.longitude, userLocation.latitude];
      const circle = createCircle(center, radius);

      // Add circle source
      map.current.addSource('radius-circle', {
        type: 'geojson',
        data: circle,
      });

      // Add filled circle layer
      map.current.addLayer({
        id: 'radius-circle-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.15,
        },
      });

      // Add circle border layer
      map.current.addLayer({
        id: 'radius-circle-border',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-opacity': 0.5,
          'line-dasharray': [2, 2],
        },
      });
    }

    // Filter deals with valid dispensary coordinates
    const validDeals = deals.filter((deal: Deal) => {
      const dispensary = typeof deal.dispensary === 'object' ? deal.dispensary : null;
      if (!dispensary?.coordinates?.coordinates) return false;
      const [lng, lat] = dispensary.coordinates.coordinates;
      return !isNaN(lng) && !isNaN(lat) && !(lng === 0 && lat === 0);
    });

    console.log('validDeals', validDeals);

    if (validDeals.length === 0) {
      // If no valid deals, center on user location if available
      if (userLocation && map.current) {
        map.current.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 10,
        });
      }
      return;
    }


    const bounds = new mapboxgl.LngLatBounds();
    
    // Add user location marker if available
    if (userLocation) {
      const userMarkerEl = document.createElement('div');
      userMarkerEl.className = 'user-location-marker';
      userMarkerEl.style.width = '20px';
      userMarkerEl.style.height = '20px';
      userMarkerEl.style.borderRadius = '50%';
      userMarkerEl.style.backgroundColor = '#3b82f6';
      userMarkerEl.style.border = '3px solid white';
      userMarkerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const userMarker = new mapboxgl.Marker(userMarkerEl)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);

      markersRef.current.push(userMarker);
      bounds.extend([userLocation.longitude, userLocation.latitude]);
    }

    // Group deals by dispensary to avoid duplicate markers
    const dealsByDispensary = new Map<string, Deal[]>();
    validDeals.forEach((deal) => {
      const dispensary = typeof deal.dispensary === 'object' ? deal.dispensary : null;
      if (!dispensary?._id) return;
      
      const existingDeals = dealsByDispensary.get(dispensary._id) || [];
      existingDeals.push(deal);
      dealsByDispensary.set(dispensary._id, existingDeals);
    });



    // Create markers for each dispensary with its deals
    dealsByDispensary.forEach((dispensaryDeals, dispensaryId) => {
      const firstDeal = dispensaryDeals[0];
      const dispensary = typeof firstDeal.dispensary === 'object' ? firstDeal.dispensary : null;
      if (!dispensary) return;

      const [lng, lat] = dispensary.coordinates.coordinates;

      // Create popup content with all deals at this dispensary
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 max-w-xs';
      popupContent.innerHTML = `
        <div class="font-semibold text-lg text-orange-700 mb-2">${dispensary.name}</div>
        ${dispensary.address ? `
          <div class="text-sm text-gray-600 mb-3">
            ${dispensary.address.street1}${dispensary.address.street2 ? `, ${dispensary.address.street2}` : ''}<br/>
            ${dispensary.address.city}, ${dispensary.address.state} ${dispensary.address.zipCode}
          </div>
        ` : ''}
        <div class="border-t pt-2 mt-2">
          <div class="text-xs font-semibold text-gray-700 mb-1">Discounts (${dispensaryDeals.length}):</div>
          ${dispensaryDeals.slice(0, 3).map(deal => `
            <div class="text-sm mb-2 p-2 bg-gray-50 rounded">
              <div class="font-semibold text-gray-800">${deal.title}</div>
              <div class="text-xs text-gray-600 mt-1">
                <span class="line-through">$${deal.originalPrice?.toFixed(2)}</span>
                <span class="text-green-600 font-semibold ml-1">$${deal.salePrice?.toFixed(2)}</span>
              </div>
              ${deal.sizeOrStrength ? `<div class="text-xs text-gray-600 font-medium mt-0.5">${deal.sizeOrStrength}</div>` : ''}
              ${deal.category ? `<div class="text-xs text-gray-500 mt-1">${deal.category}</div>` : ''}
            </div>
          `).join('')}
          ${dispensaryDeals.length > 3 ? `<div class="text-xs text-gray-500 mt-1">+ ${dispensaryDeals.length - 3} more discounts</div>` : ''}
        </div>
      `;

      // Create marker
      const markerEl = document.createElement('div');
      markerEl.className = 'deal-marker';
      markerEl.style.width = '35px';
      markerEl.style.height = '35px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.backgroundColor = '#f97316'; // Orange color for deals
      markerEl.style.border = '3px solid white';
      markerEl.style.cursor = 'pointer';
      markerEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
      markerEl.style.display = 'flex';
      markerEl.style.alignItems = 'center';
      markerEl.style.justifyContent = 'center';
      markerEl.style.fontSize = '12px';
      markerEl.style.fontWeight = 'bold';
      markerEl.style.color = 'white';
      markerEl.textContent = dispensaryDeals.length > 1 ? dispensaryDeals.length.toString() : '';

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 25, maxWidth: '300px' }).setDOMContent(popupContent))
        .addTo(map.current!);

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [mapLoaded, deals, userLocation, radius]);

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
    <div className="w-full h-[calc(100vh-300px)] min-h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200 relative">
      <div ref={mapContainer} className="w-full h-full" />
      {deals.length === 0 && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <p className="text-gray-500 text-lg">No discounts found to display on map</p>
        </div>
      )}
    </div>
  );
}
