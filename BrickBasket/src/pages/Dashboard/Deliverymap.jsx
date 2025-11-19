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
  getDocs
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";





const mapStyle = {
  width: "1100px",
  height: "80vh",
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DeliveryMapPanel() {
  const [deliveries, setDeliveries] = useState([]);
  const [directionsMap, setDirectionsMap] = useState({});
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [openDelivery, setOpenDelivery] = useState(false);
  const closeDelivery = () => setOpenDelivery(false);
  const [items, setItems] = useState([{ name: "", store: "" }]);
  const [newDeliveryDate, setNewDeliveryDate] = useState(new Date());
  const [mapRef, setMapRef] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [selectedStoreCoords, setSelectedStoreCoords] = useState(null);



  const [savedCard, setSavedCard] = useState(null);

  useEffect(() => {
    async function loadCard() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userRef = doc(firestore, "users", uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setSavedCard(snap.data().wallet || null);
      }
    }

    loadCard();
  }, []);



  const fetchUserName = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return "Unknown";

    const userRef = doc(firestore, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return "Unknown";

    return userSnap.data().name || "Unknown";
  };


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

  const submitRating = async () => {
    if (!ratingTarget) return;

    const ratingRef = collection(
      firestore,
      "deliveries",
      ratingTarget.id,
      "ratings"      // 👈 subcollection name
    );

    await addDoc(ratingRef, {
      stars,
      comment,
      timestamp: new Date(),
      userId: auth.currentUser.uid,
    });

    setStars(0);
    setComment("");
    setRatingTarget(null);
  };

  const cancelDelivery = async (deliveryId) => {
    try {
      const ref = doc(firestore, "deliveries", deliveryId);

      // Fetch latest data
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return;

      const data = snapshot.data();

      // Allowed statuses
      const canCancel = ["Pending", "In Progress"];
      if (!canCancel.includes(data.status)) {
        alert("This delivery can no longer be canceled.");
        return;
      }

      await updateDoc(ref, {
        status: "Canceled",
        canceledAt: new Date(),
      });

      alert("Delivery successfully canceled.");
    } catch (err) {
      console.error("Error canceling delivery:", err);
      alert("Failed to cancel delivery.");
    }
  };



  const auth = getAuth();
  const user = auth.currentUser;

  const fetchUserProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const userDocRef = doc(firestore, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) return null;

    return {
      name: userSnap.data().name || "Unknown",
      address: userSnap.data().address || "",      // 👈 stored during sign-up
    };
  };


  const stores = [
    {
      name: "Home Depot Laval",
      lat: 45.5698,
      lng: -73.7502,
    },
    {
      name: "Home Depot St Antoine",
      lat: 45.4883,
      lng: -73.5836,
    },
    {
      name: "Reno Depot St Jacques",
      lat: 45.4764,
      lng: -73.6308,
    },
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

            // --- Fetch Ratings (subcollection) ---
            const ratingsRef = collection(
              firestore,
              "deliveries",
              docSnap.id,
              "ratings"
            );
            const ratingsSnap = await getDocs(ratingsRef);
            const ratings = ratingsSnap.docs.map((r) => r.data());

            // --- Fetch driver name ---
            let driverName = "Unassigned";
            let driverPhone = null;

            if (delivery.driverName) {
              const workerRef = doc(firestore, "workers", delivery.driverName);
              const workerSnap = await getDoc(workerRef);

              if (workerSnap.exists()) {
                const workerData = workerSnap.data();
                driverName = workerData.name || "Unassigned";
                driverPhone = workerData.phone || null;   // ← ADD THIS
              }
            }


            return {
              id: docSnap.id,
              name: delivery.name,
              clientName: delivery.clientName,
              status: delivery.status || "Pending",
              driverName,
              driverPhone,
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
              ratings, // 👈 NOW this exists
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

  useEffect(() => {
    async function computeCost() {
      if (!openDelivery) return;                  // modal must be open
      if (!selectedStoreCoords) return;           // store must be chosen

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Fetch user address
      const userRef = doc(firestore, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const fullAddress = `${userData.street}, ${userData.city}, ${userData.state}, ${userData.zip}`;

      // Geocode user address
      const geo = await geocodeAddress(fullAddress);
      if (!geo) return;

      // Calculate distance store → user
      const distanceKm = getDistanceKm(
        selectedStoreCoords.lat,
        selectedStoreCoords.lng,
        geo.lat,
        geo.lng
      );

      // Calculate costs
      const deliveryFee = 30 + distanceKm * 5;
      const serviceFee = 20;
      const subtotal = deliveryFee + serviceFee;
      const tax = subtotal * 0.1495;
      const total = subtotal + tax;
      const etaMinutes = distanceKm * 3;

      setEstimatedCost({
        distanceKm: distanceKm.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        eta: Math.round(etaMinutes),
      });

    }

    computeCost();
  }, [selectedStoreCoords, openDelivery]);


  const addItem = () => setItems((prev) => [...prev, { name: "", store: "" }]);
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };


  async function geocodeAddress(address) {
    const apiKey = "AIzaSyDFLzi0umB2Ma_D1hYkAS9jgvvjBHDELPI";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return null;

    return data.results[0].geometry.location; // { lat, lng }
  }



  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const clientName = await fetchUserName();

      // 🔥 Fetch user profile for address
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("Error loading your profile.");
        return;
      }

      const userData = userSnap.data();

      // 🔥 Ensure they have address fields
      if (!userData.street || !userData.city || !userData.state || !userData.zip) {
        alert("No delivery address on file. Please update your profile.");
        return;
      }

      // 🔥 Full formatted address
      const fullAddress = `${userData.street}, ${userData.city}, ${userData.state}, ${userData.zip}`;

      // 🔥 Get Lat/Lng via Google Maps API
      const geo = await geocodeAddress(fullAddress);

      if (!geo) {
        alert("Could not verify your delivery address location.");
        return;
      }

      // Compute distance + fees (keep your existing logic)
      const distanceKm = getDistanceKm(origin.lat, origin.lng, geo.lat, geo.lng);
      const deliveryFee = 30 + distanceKm * 5;
      const serviceFee = 20;
      const subtotal = deliveryFee + serviceFee;
      const tax = subtotal * 0.1495;
      const total = subtotal + tax;

      // ⭐ Simulate checkout delay (looks like a real payment)
      await new Promise((res) => setTimeout(res, 1500));
      const transactionId = crypto.randomUUID();

      // 🔥 Build new delivery object with REAL location
      const newDelivery = {
        name: `Request #${Date.now()}`,
        clientName,
        items: [...items],
        status: "Pending",
        teamId: "",
        teamName: "Unassigned",
        driverName: "Unassigned",
        location: {
          latitude: geo.lat,
          longitude: geo.lng,
        },
        deliveryDate: newDeliveryDate,
        createdAt: new Date(),
        userId: auth.currentUser?.uid || null,
      };

      // Add the delivery
      const deliveryRef = await addDoc(
        collection(firestore, "deliveries"),
        newDelivery
      );

      // CREATE INVOICE
      await addDoc(
        collection(firestore, "users", auth.currentUser.uid, "invoices"),
        {
          deliveryId: deliveryRef.id,
          items,
          total: total.toFixed(2),
          cardLast4: savedCard?.last4 || "0000",
          timestamp: new Date(),
          store: selectedStoreCoords?.name || "",
          distanceKm: distanceKm.toFixed(2)
        }
      );

      // Reset form + close modal
      setItems([{ name: "", store: "" }]);
      closeDelivery();

      alert("Checkout complete! Your invoice has been created.");
    } catch (error) {
      console.error("Error submitting delivery:", error);
      alert("There was an error submitting your delivery request.");
    }
  };





  function calculateCost(distanceMeters) {
    if (!distanceMeters) return null;

    const distanceKm = distanceMeters / 1000;

    const deliveryFee = 30 + distanceKm * 5;
    const serviceFee = 20;
    const subtotal = deliveryFee + serviceFee;
    const tax = subtotal * 0.1495;
    const total = subtotal + tax;

    return {
      distanceKm: distanceKm.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
    };
  }


  const origin = { lat: 45.5017, lng: -73.5673 };

  const handleDirectionsCallback = (deliveryId) => (response) => {
    if (response !== null) {
      setDirectionsMap((prev) => ({
        ...prev,
        [deliveryId]: {
          response,
          distance: response.routes[0].legs[0].distance.value, // meters
          duration: response.routes[0].legs[0].duration.text,  // ETA
        },
      }));
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
        {/* COLLAPSIBLE SECTIONS */}
        <div style={{ marginTop: "20px" }}>

          {/* Helper function for rendering cards */}
          {["pending", "inprogress", "completed"].map((sectionKey) => {
            const sectionName =
              sectionKey === "pending"
                ? "Pending Deliveries"
                : sectionKey === "inprogress"
                  ? "In Progress Deliveries"
                  : "Completed Deliveries";

            const sectionStatus =
              sectionKey === "pending"
                ? "Pending"
                : sectionKey === "inprogress"
                  ? "In Progress"
                  : "Completed";

            const buttonColor =
              sectionKey === "pending"
                ? "#ffc107"
                : sectionKey === "inprogress"
                  ? "#17a2b8"
                  : "#6c757d";

            return (
              <div style={{ marginBottom: "10px" }} key={sectionKey}>
                <h3
                  onClick={() => toggleSection(sectionKey)}
                  style={{
                    color: "white",
                    cursor: "pointer",
                    backgroundColor: "#333",
                    padding: "8px 10px",
                    borderRadius: "6px",
                  }}
                >
                  {openSections[sectionKey] ? "▼ " : "▶ "} {sectionName}
                </h3>

                {openSections[sectionKey] &&
                  deliveries
                    .filter((d) => d.status === sectionStatus)
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
                        <p>Client: {delivery.clientName}</p>
                        <p>Driver: {delivery.driverName}</p>
                        {delivery.status === "In Progress" && delivery.driverPhone && (
                          <button
                            style={{
                              backgroundColor: "#17a2b8",
                              color: "white",
                              padding: "6px 10px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              marginTop: "5px",
                              marginLeft: "10px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${delivery.driverPhone}`;
                            }}
                          >
                            Call Driver
                          </button>
                        )}

                        <p>Team: {delivery.teamName}</p>
                        <p>Status: {delivery.status}</p>

                        {delivery.items?.length > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <strong>Items:</strong>
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

                                {delivery.ratings.length > 0 && (
                                  <div style={{ marginTop: "6px" }}>
                                    <strong>Rating:</strong>
                                    <span style={{ marginLeft: "6px", color: "#ffcc00" }}>
                                      {"★".repeat(delivery.ratings[0].stars)}
                                      {"☆".repeat(5 - delivery.ratings[0].stars)}
                                    </span>

                                    {delivery.ratings[0].comment && (
                                      <p style={{ marginTop: "4px", fontStyle: "italic", color: "#ccc" }}>
                                        "{delivery.ratings[0].comment}"
                                      </p>
                                    )}
                                  </div>
                                )}



                              </div>
                            ))}
                          </div>
                        )}

                        {delivery.deliveryDate && (
                          <p>
                            Date:{" "}
                            {new Date(delivery.deliveryDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        )}
                        {["Pending", "In Progress"].includes(delivery.status) && (
                          <button
                            style={{
                              backgroundColor: buttonColor,
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

                        )}

                        {delivery.status === "Completed" && delivery.ratings.length === 0 && (
                          <button
                            style={{
                              backgroundColor: "#007bff",
                              color: "white",
                              padding: "6px 10px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              marginTop: "5px",
                              marginLeft: "10px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRatingTarget(delivery);
                            }}
                          >
                            Rate
                          </button>
                        )}


                        {["Pending", "In Progress"].includes(delivery.status) && (
                          <button
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              padding: "6px 10px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              marginTop: "5px",
                              marginLeft: "10px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelDelivery(delivery.id);
                            }}
                          >
                            Cancel
                          </button>
                        )}

                      </div>
                    ))}
              </div>
            );
          })}
        </div>

      </div>

      {/* RIGHT PANEL (MAP) */}
      <LoadScript googleMapsApiKey="AIzaSyDFLzi0umB2Ma_D1hYkAS9jgvvjBHDELPI">
        <GoogleMap
          mapContainerStyle={mapStyle}
          onLoad={(map) => setMapRef(map)}
          center={origin}   // ← fixed, no more dynamic center!
          zoom={12}
        >
          <Marker position={origin} label="Warehouse" />

          {deliveries.map((d) => (
            <Marker
              key={d.id}
              position={{ lat: d.lat, lng: d.lng }}
              label={d.name}
              onClick={() => {
                setSelectedDelivery(d);
                if (mapRef) {
                  mapRef.panTo({ lat: d.lat, lng: d.lng });
                  mapRef.setZoom(13);
                }
              }}
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
              options={{ preserveViewport: true }}   // <- KEY FIX
            />

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
                  onChange={(e) => {
                    const storeName = e.target.value;
                    handleItemChange(index, "store", storeName);

                    const storeObj = stores.find((s) => s.name === storeName);
                    if (storeObj) {
                      setSelectedStoreCoords(storeObj);
                    }
                  }}
                >

                  <option value="">Select Store</option>
                  {stores.map((store, i) => (
                    <option key={i} value={store.name}>
                      {store.name}
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

            {estimatedCost && (
              <div
                style={{
                  backgroundColor: "#252525",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  border: "1px solid #3a3a3a",
                  boxShadow: "0 0 8px rgba(0,0,0,0.4)",
                }}
              >
                <h4
                  style={{
                    marginBottom: "10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#ffffff",
                  }}
                >
                  Estimated Delivery Cost
                </h4>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Distance:</span>
                  <span>{estimatedCost.distanceKm} km</span>
                </div>

                {/* ⭐ NEW ETA ROW */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Estimated Time:</span>
                  <span>{estimatedCost.eta} min</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Delivery Fee:</span>
                  <span>${estimatedCost.deliveryFee}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Service Fee:</span>
                  <span>${estimatedCost.serviceFee}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tax:</span>
                  <span>${estimatedCost.tax}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid #444",
                    fontSize: "17px",
                    fontWeight: "bold",
                    color: "#00e676",
                  }}
                >
                  <span>Total:</span>
                  <span>${estimatedCost.total}</span>
                </div>
              </div>
            )}



            <h4 style={{ marginBottom: "10px" }}>Payment Method</h4>

            {savedCard ? (
              <div
                style={{
                  backgroundColor: "#252525",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  border: "1px solid #444",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <img
                  src={savedCard.image}
                  alt="card type"
                  style={{ width: "50px" }}
                />
                <div>
                  <strong>{savedCard.type}</strong>
                  <div>**** **** **** {savedCard.last4}</div>
                </div>
              </div>
            ) : (
              <p style={{ color: "#ccc", marginBottom: "20px" }}>
                No saved card found — please add one in Wallet.
              </p>
            )}




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
                Checkout
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

      {ratingTarget && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#1e1e1e",
              padding: "20px",
              borderRadius: "8px",
              width: "350px",
              color: "white",
            }}
          >
            <h3>Rate Your Delivery</h3>

            {/* ⭐ Star Selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  onClick={() => setStars(n)}
                  style={{
                    cursor: "pointer",
                    fontSize: "28px",
                    color: n <= stars ? "#ffcc00" : "#555",
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            {/* ✏️ Comment Box */}
            <textarea
              placeholder="Leave a comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                height: "80px",
                backgroundColor: "#2c2c2c",
                color: "white",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #555",
                marginBottom: "12px",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={submitRating}
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
                onClick={() => setRatingTarget(null)}
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
          </div>
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
