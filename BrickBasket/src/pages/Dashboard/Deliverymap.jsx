import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { firestore } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const mapStyle = {
  width: "1100px",
  height: "80vh",
};

export default function DeliveryMapPanel() {
  const [deliveries, setDeliveries] = useState([]);
  const [directionsMap, setDirectionsMap] = useState({}); // store directions for each delivery
  const [selectedDelivery, setSelectedDelivery] = useState(null); // new state for selected delivery

  useEffect(() => {
    const deliveriesRef = collection(firestore, "deliveries");
    const unsubscribe = onSnapshot(deliveriesRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const delivery = doc.data();
        return {
          id: doc.id,
          name: delivery.name,
          lat: delivery.location.latitude,
          lng: delivery.location.longitude,
          status: delivery.status || "In Progress",
          driver: delivery.driverName || "Unassigned",
        };
      });
      setDeliveries(data);
    });

    return () => unsubscribe();
  }, []);

  const origin = { lat: 45.5017, lng: -73.5673 }; // warehouse

  const handleDirectionsCallback = (deliveryId) => (response) => {
    if (response !== null) {
      setDirectionsMap((prev) => ({ ...prev, [deliveryId]: response }));
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      {/* Left panel: deliveries */}
      <div
        style={{
          width: "300px",
          maxHeight: "80vh",
          overflowY: "auto",
          backgroundColor: "#1e1e1e",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ color: "white", marginBottom: "10px" }}>
          In Progress Deliveries
        </h3>
        {deliveries.map((d) => {
          const directions = directionsMap[d.id];
          const distance =
            directions?.routes?.[0]?.legs?.[0]?.distance?.text || "-";
          const duration =
            directions?.routes?.[0]?.legs?.[0]?.duration?.text || "-";

          return (
            <div
              key={d.id}
              style={{
                backgroundColor: "#2c2c2c",
                color: "white",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "6px",
                cursor: "pointer",
                border:
                  selectedDelivery?.id === d.id ? "2px solid #00f" : "none",
              }}
              onClick={() => setSelectedDelivery(d)}
            >
              <h4>{d.name}</h4>
              <p>Status: {d.status}</p>
              <p>Driver: {d.driver}</p>
              <p>Distance: {distance}</p>
              <p>ETA: {duration}</p>
            </div>
          );
        })}
      </div>

      {/* Right panel: map */}
      <LoadScript googleMapsApiKey="AIzaSyA3XlNOQoweAUjubkWnn8YFiyAv0fh_ymA">
        <GoogleMap
          mapContainerStyle={mapStyle}
          center={
            selectedDelivery
              ? { lat: selectedDelivery.lat, lng: selectedDelivery.lng }
              : origin
          }
          zoom={12}
        >
          {/* Warehouse marker */}
          <Marker position={origin} label="Warehouse" />

          {/* Show all delivery markers */}
          {deliveries.map((d) => (
            <Marker
              key={d.id}
              position={{ lat: d.lat, lng: d.lng }}
              label={d.name}
            />
          ))}

          {/* Only render directions for selected delivery */}
          {selectedDelivery && (
            <DirectionsService
              key={selectedDelivery.id}
              options={{
                origin,
                destination: {
                  lat: selectedDelivery.lat,
                  lng: selectedDelivery.lng,
                },
                travelMode: "DRIVING",
              }}
              callback={handleDirectionsCallback(selectedDelivery.id)}
            />
          )}

          {selectedDelivery &&
            directionsMap[selectedDelivery.id] && (
              <DirectionsRenderer
                directions={directionsMap[selectedDelivery.id]}
              />
            )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
