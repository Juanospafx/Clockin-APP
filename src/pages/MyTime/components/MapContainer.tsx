import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Circle,
  useJsApiLoader,
  Autocomplete,
} from "@react-google-maps/api";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY!;
const containerStyle = { width: "100%", height: "300px" };

interface AddressComponents {
  state: string;
  city: string;
  street: string;
  street_number: string;
  postal_code: string;
}

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect: (address: AddressComponents) => void;
  onGeofenceExit?: () => void;
  geofenceRadius?: number;
  initialCenter?: { lat: number; lng: number } | null;
}

const MapContainer: React.FC<Props> = ({
  onLocationSelect,
  onAddressSelect,
  onGeofenceExit,
  geofenceRadius = 100,
  initialCenter = null,
}) => {
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(initialCenter);
  const [geofenceCenter, setGeofenceCenter] = useState<{ lat: number; lng: number } | null>(initialCenter);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  useEffect(() => {
    // Espera a que cargue la librería de Maps y tenga posición
    if (!isLoaded || !markerPos) return;
    // Usa el constructor correcto
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: markerPos }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const comp = results[0].address_components;
        const address: AddressComponents = {
          state: "",
          city: "",
          street: "",
          street_number: "",
          postal_code: "",
        };
        comp.forEach(c => {
          if (c.types.includes("administrative_area_level_1")) address.state = c.long_name;
          if (c.types.includes("locality")) address.city = c.long_name;
          if (c.types.includes("route")) address.street = c.long_name;
          if (c.types.includes("street_number")) address.street_number = c.long_name;
          if (c.types.includes("postal_code")) address.postal_code = c.long_name;
        });
        onAddressSelect(address);
      }
    });

    if (!geofenceCenter) {
      setGeofenceCenter(markerPos);
      onLocationSelect(markerPos.lat, markerPos.lng);
    }

    if (geofenceCenter && onGeofenceExit) {
      const R = 6371000;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(markerPos.lat - geofenceCenter.lat);
      const dLng = toRad(markerPos.lng - geofenceCenter.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(geofenceCenter.lat)) *
          Math.cos(toRad(markerPos.lat)) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist > geofenceRadius) onGeofenceExit();
    }
  }, [isLoaded, markerPos, geofenceCenter, geofenceRadius, onAddressSelect, onLocationSelect, onGeofenceExit]);

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setMarkerPos({ lat: coords.latitude, lng: coords.longitude }),
      console.error,
      { enableHighAccuracy: true }
    );
  };

  const onLoadAutocomplete = (auto: google.maps.places.Autocomplete) => setAutocomplete(auto);
  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (place.geometry?.location) {
      setMarkerPos({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  if (loadError) return <div className="text-red-600">Error loading map</div>;
  if (!isLoaded) return <div>Cargando mapa…</div>;

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          onClick={handleGetLocation}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Use My Location
        </button>
        <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Search location..."
            className="px-3 py-2 border rounded w-64 focus:outline-none"
          />
        </Autocomplete>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPos || { lat: 18.4861, lng: -69.9312 }}
        zoom={markerPos ? 16 : 4}
        onClick={e => setMarkerPos({ lat: e.latLng!.lat(), lng: e.latLng!.lng() })}
      >
        {markerPos && (
          <>
            <Marker
              position={markerPos}
              draggable
              onDragEnd={e => setMarkerPos({ lat: e.latLng!.lat(), lng: e.latLng!.lng() })}
            />
            {geofenceCenter && (
              <Circle
                center={geofenceCenter}
                radius={geofenceRadius}
                options={{ strokeOpacity: 0.8, fillOpacity: 0.2 }}
              />
            )}
          </>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapContainer;