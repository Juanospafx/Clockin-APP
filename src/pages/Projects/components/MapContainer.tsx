// src/components/MapContainer.tsx

import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Circle,
  useJsApiLoader,
  Autocomplete,
} from "@react-google-maps/api";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Cambiamos el alto fijo aquí (300px) porque en el wrapper del formulario ya tenemos h-56
const containerStyle = { width: "100%", height: "100%" };
const allowedRadius = 100; // metros

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect: (address: {
    state: string;
    city: string;
    street: string;
    street_number: string;
    postal_code: string;
  }) => void;
}

const MapContainer: React.FC<Props> = ({
  onLocationSelect,
  onAddressSelect,
}) => {
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [autocomplete, setAutocomplete] = useState<
    google.maps.places.Autocomplete | null
  >(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  // Función auxiliar para extraer todos los campos de dirección
  const extractAddressComponents = (
    components: google.maps.GeocoderAddressComponent[]
  ) => {
    let state = "";
    let city = "";
    let street = "";
    let street_number = "";
    let postal_code = "";

    components.forEach((comp) => {
      if (comp.types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      }
      if (
        comp.types.includes("locality") ||
        comp.types.includes("administrative_area_level_2")
      ) {
        city = comp.long_name;
      }
      if (comp.types.includes("route")) {
        street = comp.long_name;
      }
      if (comp.types.includes("street_number")) {
        street_number = comp.long_name;
      }
      if (comp.types.includes("postal_code")) {
        postal_code = comp.long_name;
      }
    });

    return { state, city, street, street_number, postal_code };
  };

  // Cuando cambia currentPosition, hacemos reverse-geocoding para obtener dirección completa
  useEffect(() => {
    if (!isLoaded || !currentPosition) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: currentPosition },
      (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          // Usamos el primer resultado para extraer los componentes
          const {
            state,
            city,
            street,
            street_number,
            postal_code,
          } = extractAddressComponents(results[0].address_components);

          onAddressSelect({ state, city, street, street_number, postal_code });
        }
      }
    );
  }, [isLoaded, currentPosition, onAddressSelect]);

  // Pedir geolocalización al usuario
  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setCurrentPosition(pos);
        onLocationSelect(pos.lat, pos.lng);
      },
      console.error,
      { enableHighAccuracy: true }
    );
  };

  // Setup de Autocomplete
  const onLoadAutocomplete = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };
  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const pos = { lat, lng };
      setCurrentPosition(pos);
      onLocationSelect(lat, lng);

      // Extraer todos los componentes si vienen en place.address_components
      if (place.address_components) {
        const {
          state,
          city,
          street,
          street_number,
          postal_code,
        } = extractAddressComponents(place.address_components);

        onAddressSelect({ state, city, street, street_number, postal_code });
      }
    }
  };

  if (loadError) return <div className="text-red-600">Error loading map</div>;
  if (!isLoaded) return <div>Cargando mapa…</div>;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Botones y buscador */}
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGetLocation}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Use My Location
        </button>
        <Autocomplete
          onLoad={onLoadAutocomplete}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search location..."
            className="px-3 py-2 border border-gray-300 rounded w-full sm:w-64 focus:outline-none"
          />
        </Autocomplete>
      </div>

      {/* Mapa interactivo */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentPosition || { lat: 18.4861, lng: -69.9312 }}
          zoom={currentPosition ? 16 : 4}
          onClick={(e) => {
            const lat = e.latLng!.lat();
            const lng = e.latLng!.lng();
            const pos = { lat, lng };
            setCurrentPosition(pos);
            onLocationSelect(lat, lng);
          }}
        >
          {currentPosition && (
            <>
              <Marker
                position={currentPosition}
                draggable
                onDragEnd={(e) => {
                  const lat = e.latLng!.lat();
                  const lng = e.latLng!.lng();
                  const pos = { lat, lng };
                  setCurrentPosition(pos);
                  onLocationSelect(lat, lng);
                }}
              />
              <Circle
                center={currentPosition}
                radius={allowedRadius}
                options={{ strokeOpacity: 0.8, fillOpacity: 0.2 }}
              />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default MapContainer;
