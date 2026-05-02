"use client";

import { useRef, useCallback } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];

interface PlaceResult {
  formatted: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (result: PlaceResult) => void;
  placeholder?: string;
  hasError?: boolean;
}

export default function AddressAutocomplete({ value, onChange, onPlaceSelect, placeholder, hasError }: AddressAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const formatted = place.formatted_address || place.name || "";
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const placeId = place.place_id || "";

    onChange(formatted);
    onPlaceSelect({ formatted, lat, lng, placeId });
  }, [onChange, onPlaceSelect]);

  const inputClasses = `w-full px-3 py-2.5 rounded-btn border text-sm text-s-ink bg-white focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 ${hasError ? "border-s-coral" : "border-s-ink/10"}`;

  // Fallback to plain input if API key is missing or not yet loaded
  if (!apiKey || !isLoaded) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{ componentRestrictions: { country: "ch" }, types: ["address"] }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
        placeholder={placeholder}
      />
    </Autocomplete>
  );
}
