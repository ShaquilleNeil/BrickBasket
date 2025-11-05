import React, { useState, useEffect } from "react";
import { firestore } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const DeliveriesTabs = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [deliveries, setDeliveries] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch deliveries in real-time
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
          teamId: d.teamId || "",
          teamName: d.teamName || "Unassigned",
          items: d.items || [],
          lat: d.location?.latitude,
          lng: d.location?.longitude,
          driverName: d.driverName || "Unassigned",
          deliveryDate: d.deliveryDate
            ? new Date(d.deliveryDate.seconds * 1000)
            : null, // handles Firestore timestamp
        };
      });
      setDeliveries(data);
    });

    return () => unsubscribe();
  }, []);

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      const snapshot = await getDocs(collection(firestore, "teams"));
      const teamList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setTeams(teamList);
    };
    fetchTeams();
  }, []);

  // Filtered deliveries by status + search
  const filteredDeliveries = (status) =>
    deliveries
      .filter((d) =>
        status === "inprogress"
          ? d.status === "In Progress"
          : status === "complete"
          ? d.status === "Completed"
          : d.status === "Pending"
      )
      .filter(
        (d) =>
          d.clientName?.toLowerCase().includes(searchTerm) ||
          d.items.some((item) =>
            item.store?.toLowerCase().includes(searchTerm)
          )
      );

  // Update delivery status
  const handleStatusChange = async (deliveryId, newStatus) => {
    try {
      const deliveryRef = doc(firestore, "deliveries", deliveryId);
      await updateDoc(deliveryRef, { status: newStatus });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Assign a team
  const handleTeamAssign = async (deliveryId, teamId) => {
    try {
      const deliveryRef = doc(firestore, "deliveries", deliveryId);
      const teamRef = doc(firestore, "teams", teamId);
      const teamSnap = await getDoc(teamRef);

      if (!teamSnap.exists()) return;

      const teamData = teamSnap.data();
      const driverName = teamData.role?.Driver || "Unassigned";

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? { ...d, teamId, teamName: teamData.name, driverName }
            : d
        )
      );

      await updateDoc(deliveryRef, {
        teamId,
        teamName: teamData.name,
        driverName,
      });
    } catch (err) {
      console.error("Error assigning team:", err);
    }
  };

  // Calendar click handler
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const deliveriesForDate = selectedDate
    ? deliveries.filter(
        (d) =>
          d.deliveryDate &&
          d.deliveryDate.toDateString() === selectedDate.toDateString()
      )
    : [];

  return (
    <div
      className="deliveries-wrapper"
      style={{
        height: "80vh",
        width: "45vw",
        padding: "20px",
        color: "white",
        backgroundColor: "#1c1c1c",
        borderRadius: "10px",
      }}
    >
      {/* Tabs */}
      <div
        className="tab-header"
        style={{
          marginBottom: "10px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {["pending", "inprogress", "complete", "calendar"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? "active-tab" : ""}`}
            style={{
              flex: 1,
              margin: "0 4px",
              padding: "8px",
              backgroundColor:
                activeTab === tab ? "#3d3d3d" : "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {tab === "pending"
              ? "Pending"
              : tab === "inprogress"
              ? "In Progress"
              : tab === "complete"
              ? "Completed"
              : "Calendar"}
          </button>
        ))}
      </div>

      {/* Search Bar (skip on calendar) */}
      {activeTab !== "calendar" && (
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Search by client or store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #555",
              backgroundColor: "#2a2a2a",
              color: "white",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        className="tab-content"
        style={{
          height: "calc(70vh - 10px)",
          overflowY: "auto",
          paddingRight: "10px",
        }}
      >
        {activeTab === "calendar" ? (
          <div
            style={{
              background: "#2c2c2c",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "white", marginBottom: "10px" }}>
              Upcoming Deliveries
            </h3>
            <Calendar
              onClickDay={handleDateClick}
              tileContent={({ date }) => {
                const dayDeliveries = deliveries.filter((d) => {
                  const deliveryDate = d.deliveryDate
                    ? d.deliveryDate.toDateString()
                    : null;
                  return deliveryDate === date.toDateString();
                });
                return dayDeliveries.length ? (
                  <span style={{ color: "lightgreen", fontSize: "10px" }}>
                    {dayDeliveries.length} 📦
                  </span>
                ) : null;
              }}
            />
          </div>
        ) : filteredDeliveries(activeTab).length === 0 ? (
          <p>No deliveries in this category.</p>
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
              <p>Items: {d.items.map((item) => item.name).join(", ")}</p>
              <p>Store: {d.items.map((item) => item.store).join(", ")}</p>

              <label>Assign Team: </label>
              <select
                value={d.teamId || ""}
                onChange={(e) => handleTeamAssign(d.id, e.target.value)}
              >
                <option value="">Unassigned</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <br />

              <label>Status: </label>
              <select
                value={d.status}
                onChange={(e) => handleStatusChange(d.id, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <p>Assigned Team: {d.teamName}</p>
              <p>Driver: {d.driverName}</p>
              {d.deliveryDate && (
                <p>
                  Delivery Date: {d.deliveryDate.toLocaleDateString()}{" "}
                  {d.deliveryDate.toLocaleTimeString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal for calendar day */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "100vw",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#2c2c2c",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              Deliveries for {selectedDate?.toDateString()} (
              {deliveriesForDate.length})
            </h3>
            {deliveriesForDate.length === 0 ? (
              <p>No deliveries scheduled.</p>
            ) : (
              deliveriesForDate.map((d) => (
                <div
                  key={d.id}
                  style={{
                    borderBottom: "1px solid #555",
                    padding: "10px 0",
                  }}
                >
                  <strong>{d.name}</strong>
                  <p>Client: {d.clientName}</p>
                  <p>Team: {d.teamName}</p>
                  <p>Status: {d.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveriesTabs;
