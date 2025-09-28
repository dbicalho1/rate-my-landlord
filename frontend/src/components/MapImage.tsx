"use client";

import { useState } from 'react';
import { generateStreetViewUrl, isValidAddress, getFallbackMapUrl } from '@/lib/maps';

interface StreetViewImageProps {
  address: string;
  className?: string;
  width?: number;
  height?: number;
  fov?: number;
  heading?: number;
  pitch?: number;
}

export default function MapImage({ 
  address, 
  className = "", 
  width = 400, 
  height = 300, 
  fov = 80,
  heading = 0,
  pitch = 0
}: StreetViewImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Don't render anything if address is invalid
  if (!isValidAddress(address)) {
    return null;
  }

  const streetViewUrl = imageError ? getFallbackMapUrl() : generateStreetViewUrl({
    address,
    width,
    height,
    fov,
    heading,
    pitch
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Map image failed to load:', e.currentTarget.src);
    console.error('Error details:', e);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="w-full h-48 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      )}
      
      {streetViewUrl && (
        <img
          src={streetViewUrl}
          alt={`Street view of ${address}`}
          className={`w-full h-auto transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      )}
      
      {imageError && !isLoading && (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-1 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span>Street view unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
}
