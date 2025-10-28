import React, { useState, useEffect } from "react";
import { firestore } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const DeliveriesTabs = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    const deliveriesRef = collection(firestore, "deliveries");
    const unsubscribe = onSnapshot(deliveriesRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          clientName: d.clientName,
          status: d.status || "Pending",
          driver: d.driverName || "Unassigned",
          items: d.items || [],
          lat: d.location?.latitude,
          lng: d.location?.longitude,
        };
      });
      setDeliveries(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredDeliveries = (status) =>
    deliveries.filter((d) =>
      status === "inprogress"
        ? d.status === "In Progress"
        : status === "complete"
        ? d.status === "Completed"
        : d.status === "Pending"
    );

  return (
    <div className="deliveries-wrapper">
      {/* Tabs */}
      <div className="tab-header">
        {["pending", "inprogress", "complete"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? "active-tab" : ""}`}
          >
            {tab === "pending"
              ? "Pending"
              : tab === "inprogress"
              ? "In Progress"
              : "Completed"}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="tab-content">
        {filteredDeliveries(activeTab).length === 0 ? (
          <p style={{ color: "white" }}>No deliveries in this category.</p>
        ) : (
          filteredDeliveries(activeTab).map((d) => (
            <div
              key={d.id}
              style={{
                backgroundColor: "#2c2c2c",
                color: "white",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              <h4>{d.name}</h4>
              <p>Client: {d.clientName}</p>
              <p>Items: {d.items.map(item => item.name).join(", ")}</p>
              <p>Store: {d.items.map(item => item.store).join(", ")}</p>
              <p>Status: {d.status}</p>
              <p>Driver: {d.driver}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveriesTabs;
