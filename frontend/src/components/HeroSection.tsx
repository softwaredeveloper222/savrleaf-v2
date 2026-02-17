'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Check, Star, ChevronDown } from 'lucide-react';
import logo from '../assets/logo.png';
import backgroundImage from '../assets/background.png';
import MapPinIcon from './MapPinIcon';

interface HeroSectionProps {
  userLocation: GeolocationPosition | GeolocationCoordinates | null;
  locationError: string | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  zipCode: string;
  handleZipCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
}

export default function HeroSection({
  userLocation,
  locationError,
  searchTerm,
  setSearchTerm,
  zipCode,
  handleZipCodeChange,
  handleSearch,
}: HeroSectionProps) {
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          handleSearch();
        },
        (err) => {
          console.error('Location error:', err);
        }
      );
    }
  };

  return (
    <section className="relative from-orange-200 via-orange-100 to-orange-200 text-gray-900 pt-12 pb-16 font-sans overflow-hidden min-h-[600px] flex items-center">
      {/* Background image from assets */}
      {/* <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div> */}
      
      {/* Background gradient overlay for color tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200/70 via-orange-100/70 to-orange-200/70 z-0" />

      {/* Decorative blurred cannabis elements */}
      <div className="absolute left-0 top-1/4 w-40 h-40 opacity-20 blur-3xl">
        <div className="w-full h-full bg-green-400 rounded-full" />
      </div>
      <div className="absolute right-0 top-1/3 w-48 h-48 opacity-20 blur-3xl">
        <div className="w-full h-full bg-green-500 rounded-full" />
      </div>
      <div className="absolute left-1/4 bottom-1/4 w-32 h-32 opacity-15 blur-2xl">
        <div className="w-full h-full bg-green-300 rounded-full" />
      </div>
      <div className="absolute right-1/4 bottom-1/3 w-36 h-36 opacity-15 blur-2xl">
        <div className="w-full h-full bg-green-400 rounded-full" />
      </div>

      {/* Glowing center effect */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at center, rgba(251, 146, 60, 0.3) 0%, transparent 70%)'
      }} />

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 text-center z-10 w-full">
        {/* Large centered logo */}
        <div className="flex justify-center mb-4">
          <Image src={logo} alt="SavrLeaf Logo" width={120} height={120} className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
        </div>
        
        {/* Headline — LOCKED: exact copy only */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-12 leading-tight text-gray-900 max-w-4xl mx-auto" style={{ lineHeight: "50px" }}>
          SavrLeafDeals.com<br/> Discounted cannabis deals only.<br />No sign-ups. No logins.<br />21+ only.
        </h1>

        {/* Large location pin icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <MapPinIcon size="large" />
            <div className="absolute inset-0 bg-orange-400/20 blur-xl rounded-full" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search input - large white rounded box */}
            <div className="flex items-center flex-1 px-4 py-4 min-w-0 bg-white rounded-2xl shadow-md">
              <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search discounted products, brands, or categories…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="flex-1 text-gray-900 placeholder:text-gray-400 focus:outline-none text-base min-w-0 bg-transparent"
                aria-label="Search deals"
              />
            </div>

            {/* ZIP code input box - smaller white rounded box, always visible */}
            <div className="flex items-center justify-between px-4 py-4 bg-white rounded-2xl shadow-md sm:flex-shrink-0 sm:min-w-[120px] sm:max-w-[120px] min-h-[56px]">
              <input
                type="text"
                placeholder="ZIP"
                value={zipCode}
                onChange={handleZipCodeChange}
                maxLength={5}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="flex-1 text-gray-900 placeholder:text-gray-400 focus:outline-none text-base min-w-0 bg-transparent font-medium"
                aria-label="ZIP code"
              />
              <MapPinIcon size="medium" className="ml-2 flex-shrink-0" />
            </div>

            {/* Search button - orange rounded button */}
            <button
              onClick={handleSearch}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 sm:flex-shrink-0 shadow-md w-full sm:w-auto"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-white" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Location status bar */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {userLocation && <Check className="h-5 w-5 text-green-600 flex-shrink-0" />}
              <Star className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="text-gray-700 font-medium text-sm sm:text-base">
                {userLocation ? 'Using your current location' : 'Use your current location'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPinIcon size="small" className="flex-shrink-0" />
              <span>Enter ZIP code or use your location</span>
            </div>
          </div>
        </div>

        {/* Browse deals arrow */}
        <div className="flex justify-end mt-10 max-w-4xl mx-auto">
          <button
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex flex-col items-center gap-1 text-gray-800 hover:text-orange-600 transition-colors cursor-pointer bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl px-5 py-3 shadow-sm hover:shadow-md"
            aria-label="Scroll to deals"
          >
            <span className="text-sm font-semibold">Browse deals below</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
}
