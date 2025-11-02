import React, { useState, useEffect } from "react";
import { firestore } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc, getDocs, getDoc } from "firebase/firestore";

const DeliveriesTabs = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [deliveries, setDeliveries] = useState([]);
  const [teams, setTeams] = useState([]);

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
        };
      });
      setDeliveries(data);
    });

    return () => unsubscribe();
  }, []);

  // Fetch all teams for the dropdown
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

  const filteredDeliveries = (status) =>
    deliveries.filter((d) =>
      status === "inprogress"
        ? d.status === "In Progress"
        : status === "complete"
        ? d.status === "Completed"
        : d.status === "Pending"
    );

  // Update delivery status
  const handleStatusChange = async (deliveryId, newStatus) => {
    const deliveryRef = doc(firestore, "deliveries", deliveryId);
    await updateDoc(deliveryRef, { status: newStatus });
  };

  // Assign a team
  
  const handleTeamAssign = async (deliveryId, teamId) => {
    const deliveryRef = doc(firestore, "deliveries", deliveryId);
    const teamRef = doc(firestore, "teams", teamId);
    const teamSnap = await getDoc(teamRef);
   
    if (!teamSnap.exists()) return;
  
    const teamData = teamSnap.data();
    const driverName = teamData.role?.Driver || "Unassigned";
  
    // 1️⃣ Update local state immediately
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? { ...d, teamId, teamName: teamData.name, driverName }
          : d
      )
    );
  
    // 2️⃣ Then update Firestore
    await updateDoc(deliveryRef, {
      teamId,
      teamName: teamData.name,
      driverName,
    });
  };
  
  
  
XMLDocument
  return (
    <div className="deliveries-wrapper" style={{ height: "80vh", padding: "20px" }}>
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
  
    {/* Content area: scrollable */}
    <div
      className="tab-content"
      style={{
        height: "calc(80vh - 50px)", // adjust 50px for tabs header
        overflowY: "auto",
        paddingRight: "10px", // avoid scrollbar overlap
      }}
    >
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
            <p>Items: {d.items.map((item) => item.name).join(", ")}</p>
            <p>Store: {d.items.map((item) => item.store).join(", ")}</p>
  
            {/* Team assignment */}
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
            </select>{" "}
            <br />
  
            {/* Status change */}
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
          </div>
        ))
      )}
    </div>
  </div>
  
  );
};

export default DeliveriesTabs;
