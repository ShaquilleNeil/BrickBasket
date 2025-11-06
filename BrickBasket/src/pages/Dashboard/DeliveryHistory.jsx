import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase";

export default function DeliveryHistory() {
  const [deliveries, setDeliveries] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const q = query(
      collection(firestore, "deliveries"),
      where("status", "==", "Completed"),
      orderBy("deliveryDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDeliveries(data);
      setFiltered(data);
    });

    return () => unsubscribe();
  }, []);

  // Basic client-side search
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(deliveries);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        deliveries.filter(
          (d) =>
            d.name?.toLowerCase().includes(lower) ||
            d.clientName?.toLowerCase().includes(lower) ||
            d.driverName?.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, deliveries]);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h2 style={{ marginBottom: "15px" }}>Delivery History</h2>

      <input
        type="text"
        placeholder="Search by client, driver, or name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #444",
          backgroundColor: "#2c2c2c",
          color: "white",
          marginBottom: "15px",
        }}
      />

      {filtered.length === 0 ? (
        <p>No completed deliveries found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#1e1e1e",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead style={{ backgroundColor: "#333" }}>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Client</th>
              <th style={th}>Driver</th>
              <th style={th}>Team</th>
              <th style={th}>Date</th>
              <th style={th}>Items</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((delivery) => (
              <tr key={delivery.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={td}>{delivery.name}</td>
                <td style={td}>{delivery.clientName || "N/A"}</td>
                <td style={td}>{delivery.driverName || "Unassigned"}</td>
                <td style={td}>{delivery.teamName || "Unassigned"}</td>
                <td style={td}>
                  {delivery.deliveryDate
                    ? new Date(
                        delivery.deliveryDate.seconds
                          ? delivery.deliveryDate.seconds * 1000
                          : delivery.deliveryDate
                      ).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td style={td}>
                  {delivery.items?.length
                    ? delivery.items.map((item, i) => (
                        <div key={i}>
                          <span>{item.name}</span> ({item.store})
                        </div>
                      ))
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "2px solid #444",
};

const td = {
  padding: "10px",
  verticalAlign: "top",
};
