'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Address } from '@/types';

interface AddressAutocompleteProps {
  value: Address;
  onChange: (address: Address) => void;
  required?: boolean;
  className?: string;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
  };
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    short_code?: string;
    text: string;
  }>;
  address?: string;
}

interface MapboxGeocodingResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  required = false,
  className = '',
}: AddressAutocompleteProps) {
  const street1Ref = useRef<HTMLInputElement>(null);
  const street2Ref = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const zipCodeRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleInputChange = (field: keyof Address, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  // Debounced function to fetch suggestions from Mapbox
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!mapboxToken || !query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=us&` +
        `types=address&` +
        `autocomplete=true&` +
        `limit=5`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data: MapboxGeocodingResponse = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapboxToken]);

  // Handle input change with debouncing
  const handleStreet1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    handleInputChange('street1', query);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debouncing
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  };

  // Parse Mapbox feature to Address
  const parseMapboxFeature = (feature: MapboxFeature): Address => {
    const address: Address = {
      street1: feature.address || feature.text || '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
    };

    // Extract address components from context
    if (feature.context) {
      feature.context.forEach((context) => {
        if (context.id.startsWith('place')) {
          // City
          address.city = context.text;
        } else if (context.id.startsWith('region')) {
          // State (2-letter code)
          address.state = context.short_code?.toUpperCase() || context.text;
        } else if (context.id.startsWith('postcode')) {
          // Zip code
          address.zipCode = context.text;
        }
      });
    }

    // Extract street address from place_name
    // Format: "123 Main St, City, State ZIP"
    const placeParts = feature.place_name.split(',');
    if (placeParts.length > 0) {
      address.street1 = placeParts[0].trim();
    }

    return address;
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (feature: MapboxFeature) => {
    const parsedAddress = parseMapboxFeature(feature);
    onChange(parsedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Focus on street2 field after selection
    setTimeout(() => {
      street2Ref.current?.focus();
    }, 100);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        street1Ref.current &&
        !street1Ref.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.mapbox-suggestions')
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address 1 *
        </label>
        <input
          ref={street1Ref}
          type="text"
          value={value.street1}
          onChange={handleStreet1Change}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Start typing your address..."
          required={required}
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
        {mapboxToken && (
          <p className="text-xs text-gray-500 mt-1">
            💡 Start typing to see address suggestions
          </p>
        )}
        {!mapboxToken && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ Mapbox token not configured. Autocomplete disabled.
          </p>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mapbox-suggestions">
            {isLoading && (
              <div className="p-3 text-sm text-gray-500">Loading suggestions...</div>
            )}
            {suggestions.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleSuggestionSelect(feature)}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 focus:bg-orange-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{feature.text}</div>
                <div className="text-xs text-gray-500">{feature.place_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address 2 (optional)
        </label>
        <input
          ref={street2Ref}
          type="text"
          value={value.street2 || ''}
          onChange={(e) => handleInputChange('street2', e.target.value)}
          placeholder="Apartment, suite, unit, etc."
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            ref={cityRef}
            type="text"
            value={value.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="City"
            required={required}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            ref={stateRef}
            type="text"
            value={value.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="State"
            required={required}
            maxLength={2}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg uppercase"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zip Code *
          </label>
          <input
            ref={zipCodeRef}
            type="text"
            value={value.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="Zip Code"
            required={required}
            pattern="\d{5}(-\d{4})?"
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

