import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { firestore } from "../../firebase";

export default function DeliveryReport() {
  const [period, setPeriod] = useState("week"); // "day", "week", "month"
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    const now = new Date();
    let startDate;

    if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      const day = now.getDay(); // Sunday = 0
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day); // start of week
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const q = query(
      collection(firestore, "deliveries"),
      where("deliveryDate", ">=", Timestamp.fromDate(startDate)),
      where("deliveryDate", "<=", Timestamp.fromDate(now)),
      orderBy("deliveryDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDeliveries(data);
    });

    return () => unsubscribe();
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  const totalCount = deliveries.length;
  const completedCount = deliveries.filter((d) => d.status === "Completed").length;
  const inProgressCount = deliveries.filter((d) => d.status === "In Progress").length;
  const pendingCount = deliveries.filter((d) => d.status === "Pending").length;

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h2>Delivery Report</h2>

      <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            backgroundColor: "#2c2c2c",
            border: "1px solid #444",
            color: "white",
          }}
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        <button
          onClick={handlePrint}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Print Report
        </button>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <strong>Total Deliveries:</strong> {totalCount} <br />
        <strong>Completed:</strong> {completedCount} <br />
        <strong>In Progress:</strong> {inProgressCount} <br />
        <strong>Pending:</strong> {pendingCount}
      </div>

      {deliveries.length === 0 ? (
        <p>No deliveries for this period.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#1e1e1e",
          }}
        >
          <thead style={{ backgroundColor: "#333" }}>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Client</th>
              <th style={th}>Driver</th>
              <th style={th}>Status</th>
              <th style={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #444" }}>
                <td style={td}>{d.name}</td>
                <td style={td}>{d.clientName || "N/A"}</td>
                <td style={td}>{d.driverName || "Unassigned"}</td>
                <td style={td}>{d.status}</td>
                <td style={td}>
                  {d.deliveryDate
                    ? new Date(
                        d.deliveryDate.seconds
                          ? d.deliveryDate.seconds * 1000
                          : d.deliveryDate
                      ).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
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
