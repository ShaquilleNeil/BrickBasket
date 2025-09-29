import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { firestore } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const containerStyle = {
  width: "1100px",
  height: "700px"
};

const center = { lat: 45.5017, lng: -73.5673 }; // default center (Montreal)

export default function DeliveryMap() {
  const [deliveries, setDeliveries] = useState([]);
  const [directions, setDirections] = useState(null);

useEffect(() => {
  const deliveriesRef = collection(firestore, "deliveries");
  const unsubscribe = onSnapshot(deliveriesRef, (snapshot) => {
    const data = snapshot.docs.map(doc => {
      const delivery = doc.data();
      return {
        id: doc.id,
        name: delivery.name,
        lat: delivery.location.latitude,
        lng: delivery.location.longitude,
      };
    });
    setDeliveries(data);
  });

  return () => unsubscribe();
}, []);


  // Example: take the first delivery as destination
  const origin = { lat: 45.5017, lng: -73.5673 }; // warehouse
  const destination = deliveries[0]
    ? { lat: deliveries[0].lat, lng: deliveries[0].lng }
    : origin;

  const directionsCallback = (response) => {
    if (response !== null) setDirections(response);
  };

  const distance = directions?.routes?.[0]?.legs?.[0]?.distance?.text;
  const duration = directions?.routes?.[0]?.legs?.[0]?.duration?.text;

  return (
    <LoadScript googleMapsApiKey="AIzaSyA3XlNOQoweAUjubkWnn8YFiyAv0fh_ymA">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
        <Marker position={origin} label="Warehouse" />
        {deliveries.map((d) => (
          <Marker key={d.id} position={{ lat: d.lat, lng: d.lng }} label={d.name} />
        ))}

        {deliveries[0] && (
          <DirectionsService
            options={{ origin, destination, travelMode: "DRIVING" }}
            callback={directionsCallback}
          />
        )}

        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>

      {deliveries[0] && (
        <div style={{ marginTop: "10px", color: "white" }}>
          <p>Distance: {distance}</p>
          <p>ETA: {duration}</p>
        </div>
      )}
    </LoadScript>
  );
}
