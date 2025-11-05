import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { firestore } from "../../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


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
  const [items, setItems] = useState([{ name: "", store: "" }]);
  const [newDeliveryDate, setNewDeliveryDate] = useState(new Date());

  const [openSections, setOpenSections] = useState({
    pending: true,
    inprogress: false,
    completed: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  

  const auth = getAuth();
  const user = auth.currentUser;

  const fetchUserName = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return "Unknown";

    const userDocRef = doc(firestore, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return data.name || "Unknown";
    } else {
      return "Unknown";
    }
  };

  const stores = [
    "Home Depot Laval",
    "Home Depot St Antoine",
    "Reno Depot St Jacques",
  ];

  // ✅ Fetch deliveries in real-time
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setDeliveries([]); // clear list when logged out
        return;
      }
  
      const deliveriesRef = collection(firestore, "deliveries");
      const unsubscribeDeliveries = onSnapshot(deliveriesRef, async (snapshot) => {
        const data = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const delivery = docSnap.data();
  
            let driverName = "Unassigned";
            if (delivery.driverName) {
              const workerRef = doc(firestore, "workers", delivery.driverName);
              const workerSnap = await getDoc(workerRef);
              if (workerSnap.exists()) {
                driverName = workerSnap.data().name || "Unassigned";
              }
            }
  
            return {
              id: docSnap.id,
              name: delivery.name,
              clientName: delivery.clientName,
              status: delivery.status || "Pending",
              driverName,
              teamId: delivery.teamId || "",
              teamName: delivery.teamName || "Unassigned",
              items: delivery.items || [],
              lat: delivery.location?.latitude,
              lng: delivery.location?.longitude,
              deliveryDate: delivery.deliveryDate
                ? new Date(
                    delivery.deliveryDate.seconds
                      ? delivery.deliveryDate.seconds * 1000
                      : delivery.deliveryDate
                  )
                : null,
            };
          })
        );
  
        setDeliveries(data);
      });
  
      // clean up when logging out
      return () => unsubscribeDeliveries();
    });
  
    return () => unsubscribeAuth();
  }, []);
  

  const addItem = () => setItems((prev) => [...prev, { name: "", store: "" }]);
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const clientName = await fetchUserName();

      const newDelivery = {
        name: `Request #${Date.now()}`,
        clientName: clientName,
        items: [...items],
        status: "Pending",
        teamId: "",
        teamName: "Unassigned",
        driverName: "Unassigned",
        location: {
          latitude: 45.5017,
          longitude: -73.5673,
        },
        deliveryDate: newDeliveryDate,
        createdAt: new Date(),
        userId: auth.currentUser?.uid || null

      };

      await addDoc(collection(firestore, "deliveries"), newDelivery);

      setItems([{ name: "", store: "" }]);
      closeDelivery();
      console.log("Delivery request submitted successfully!");
    } catch (error) {
      console.error("Error adding delivery: ", error);
    }
  };

  const origin = { lat: 45.5017, lng: -73.5673 };

  const handleDirectionsCallback = (deliveryId) => (response) => {
    if (response !== null) {
      setDirectionsMap((prev) => ({ ...prev, [deliveryId]: response }));
    }
  };

  // ✅ EDIT DELIVERY LOGIC
  const [editDelivery, setEditDelivery] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editDate, setEditDate] = useState(new Date());

  const openEditModal = (delivery) => {
    setEditDelivery(delivery);
    setEditItems(delivery.items || []);
    setEditDate(delivery.deliveryDate || new Date());
  };

  const closeEditModal = () => setEditDelivery(null);

  const handleEditItemChange = (index, field, value) => {
    const updated = [...editItems];
    updated[index][field] = value;
    setEditItems(updated);
  };

  const addEditItem = () =>
    setEditItems([...editItems, { name: "", store: "" }]);
  const removeEditItem = (index) =>
    setEditItems(editItems.filter((_, i) => i !== index));

  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    try {
      const ref = doc(firestore, "deliveries", editDelivery.id);
      await updateDoc(ref, {
        items: editItems,
        deliveryDate: editDate,
      });
      console.log("Delivery updated successfully!");
      closeEditModal();
    } catch (err) {
      console.error("Error updating delivery:", err);
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      {/* LEFT PANEL */}
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
  {/* Request Delivery Button */}
  <div
    style={{
      position: "sticky",
      top: 0,
      backgroundColor: "#1e1e1e",
      padding: "10px 0",
      zIndex: 10,
    }}
  >
    <button
      onClick={() => setOpenDelivery(true)}
      style={{
        backgroundColor: "#28a745",
        color: "white",
        padding: "10px 14px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        width: "100%",
        fontWeight: "bold",
      }}
    >
      + Request Delivery
    </button>
  </div>

      
     {/* COLLAPSIBLE SECTIONS */}
<div style={{ marginTop: "20px" }}>
  {/* PENDING SECTION */}
  <div style={{ marginBottom: "10px" }}>
    <h3
      onClick={() => toggleSection("pending")}
      style={{
        color: "white",
        cursor: "pointer",
        backgroundColor: "#333",
        padding: "8px 10px",
        borderRadius: "6px",
      }}
    >
      {openSections.pending ? "▼ " : "▶ "} Pending Deliveries
    </h3>
    {openSections.pending &&
      deliveries
        .filter((d) => d.status === "Pending")
        .map((delivery) => (
          <div
            key={delivery.id}
            style={{
              backgroundColor: "#2c2c2c",
              color: "white",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
            onClick={() => setSelectedDelivery(delivery)}
          >
            <h4>{delivery.name}</h4>
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
            {delivery.deliveryDate && (
              <p>
                Date:{" "}
                {new Date(delivery.deliveryDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            <button
              style={{
                backgroundColor: "#ffc107",
                color: "black",
                padding: "6px 10px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "5px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(delivery);
              }}
            >
              Edit
            </button>
          </div>
        ))}
  </div>

  {/* IN PROGRESS SECTION */}
  <div style={{ marginBottom: "10px" }}>
    <h3
      onClick={() => toggleSection("inprogress")}
      style={{
        color: "white",
        cursor: "pointer",
        backgroundColor: "#333",
        padding: "8px 10px",
        borderRadius: "6px",
      }}
    >
      {openSections.inprogress ? "▼ " : "▶ "} In Progress Deliveries
    </h3>
    {openSections.inprogress &&
      deliveries
        .filter((d) => d.status === "In Progress")
        .map((delivery) => (
          <div
            key={delivery.id}
            style={{
              backgroundColor: "#2c2c2c",
              color: "white",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
            onClick={() => setSelectedDelivery(delivery)}
          >
            <h4>{delivery.name}</h4>
            <p>Driver: {delivery.driverName}</p>
            <p>Status: {delivery.status}</p>
            {delivery.deliveryDate && (
              <p>
                Date:{" "}
                {new Date(delivery.deliveryDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          <button
            style={{
              backgroundColor: "#17a2b8",
              color: "white",
              padding: "6px 10px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "5px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(delivery);
            }}
          >
            Edit
          </button>
          </div>
          
        ))}
  </div>

  {/* COMPLETED SECTION */}
  <div style={{ marginBottom: "10px" }}>
    <h3
      onClick={() => toggleSection("completed")}
      style={{
        color: "white",
        cursor: "pointer",
        backgroundColor: "#333",
        padding: "8px 10px",
        borderRadius: "6px",
      }}
    >
      {openSections.completed ? "▼ " : "▶ "} Completed Deliveries
    </h3>
    {openSections.completed &&
      deliveries
        .filter((d) => d.status === "Completed")
        .map((delivery) => (
          <div
            key={delivery.id}
            style={{
              backgroundColor: "#2c2c2c",
              color: "white",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
            onClick={() => setSelectedDelivery(delivery)}
          >
            <h4>{delivery.name}</h4>
            <p>Driver: {delivery.driverName}</p>
            <p>Status: {delivery.status}</p>
          </div>
        ))}
  </div>
</div>
        </div>

      {/* RIGHT PANEL (MAP) */}
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
            <DirectionsRenderer directions={directionsMap[selectedDelivery.id]} />
          )}
        </GoogleMap>
      </LoadScript>

      {/* CREATE DELIVERY MODAL (unchanged) */}
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


            <div style={{ marginBottom: "10px" }}>
  <label>Delivery Date:</label>
  <DatePicker
    selected={newDeliveryDate}
    onChange={(date) => setNewDeliveryDate(date)}
    showTimeSelect
    dateFormat="Pp"
    style={{ width: "100%" }}
  />
</div>

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

      {/* EDIT DELIVERY MODAL */}
      {editDelivery && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <form
            onSubmit={handleUpdateDelivery}
            style={{
              backgroundColor: "#1e1e1e",
              padding: "20px",
              borderRadius: "8px",
              width: "420px",
              color: "white",
            }}
          >
            <h3>Edit {editDelivery.name}</h3>

            {editItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: "10px",
                  borderBottom: "1px solid #444",
                  paddingBottom: "10px",
                }}
              >
                <input
                  type="text"
                  value={item.name}
                  placeholder="Item name"
                  onChange={(e) =>
                    handleEditItemChange(index, "name", e.target.value)
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    backgroundColor: "#2c2c2c",
                    color: "white",
                    border: "1px solid #555",
                  }}
                />
                <input
                  type="text"
                  value={item.store}
                  placeholder="Store"
                  onChange={(e) =>
                    handleEditItemChange(index, "store", e.target.value)
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    backgroundColor: "#2c2c2c",
                    color: "white",
                    border: "1px solid #555",
                    marginTop: "5px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeEditItem(index)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    padding: "5px 8px",
                    border: "none",
                    borderRadius: "5px",
                    marginTop: "5px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addEditItem}
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

            <div style={{ marginBottom: "10px" }}>
              <label>Delivery Date:</label>
              <DatePicker
                selected={editDate}
                onChange={(date) => setEditDate(date)}
                showTimeSelect
                dateFormat="Pp"
              />
            </div>

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
                Save
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
