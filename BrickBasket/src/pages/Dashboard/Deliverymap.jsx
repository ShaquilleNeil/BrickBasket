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
  const [directionsMap, setDirectionsMap] = useState({});
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [openDelivery, setOpenDelivery] = useState(false);
  const closeDelivery = () => setOpenDelivery(false);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [items, setItems] = useState([{ name: "", store: "" }]);

  const stores = [
    "Home Depot Laval",
    "Home Depot St Antoine",
    "Reno Depot St Jacques",
  ];

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

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", store: "" }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newDelivery = {
      id: Date.now(),
      items: [...items],
      status: "Pending",
    };
    setPendingDeliveries((prev) => [...prev, newDelivery]);
    setItems([{ name: "", store: "" }]);
    closeDelivery();
  };

  const origin = { lat: 45.5017, lng: -73.5673 };

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
        <button onClick={() => setOpenDelivery(true)}>Request Delivery</button>

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

        {/* ✅ Pending Deliveries Section */}
        {pendingDeliveries.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ color: "white", marginBottom: "10px" }}>
              Pending Deliveries
            </h3>
            {pendingDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                style={{
                  backgroundColor: "#2c2c2c",
                  color: "white",
                  padding: "10px",
                  borderRadius: "6px",
                  marginBottom: "10px",
                }}
              >
                <h4>Request #{delivery.id}</h4>
                {delivery.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "5px",
                      paddingLeft: "10px",
                      borderLeft: "2px solid #555",
                    }}
                  >
                    <p>Item: {item.name}</p>
                    <p>Store: {item.store}</p>
                  </div>
                ))}
                <p>Status: {delivery.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for delivery request */}
      {openDelivery && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: "#1e1e1e",
              padding: "20px",
              borderRadius: "8px",
              width: "400px",
              color: "white",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Request Delivery</h3>

            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "12px",
                  borderBottom: "1px solid #333",
                  paddingBottom: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, "name", e.target.value)
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #555",
                    backgroundColor: "#2c2c2c",
                    color: "white",
                  }}
                  required
                />

                <select
                  value={item.store}
                  onChange={(e) =>
                    handleItemChange(index, "store", e.target.value)
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #555",
                    backgroundColor: "#2c2c2c",
                    color: "white",
                  }}
                  required
                >
                  <option value="">Select Store</option>
                  {stores.map((store, i) => (
                    <option key={i} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              + Add Item
            </button>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="submit"
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
              <button
                type="button"
                onClick={closeDelivery}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}

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
          <Marker position={origin} label="Warehouse" />

          {deliveries.map((d) => (
            <Marker
              key={d.id}
              position={{ lat: d.lat, lng: d.lng }}
              label={d.name}
            />
          ))}

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

          {selectedDelivery && directionsMap[selectedDelivery.id] && (
            <DirectionsRenderer
              directions={directionsMap[selectedDelivery.id]}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
