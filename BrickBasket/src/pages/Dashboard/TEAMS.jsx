import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./Team.css";

const TeamPanel = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teamData, setTeamData] = useState(null);
  const [editedRoles, setEditedRoles] = useState({});
  const [workers, setWorkers] = useState([]);

  // Fetch all teams and workers
  useEffect(() => {
    const fetchTeams = async () => {
      const snapshot = await getDocs(collection(db, "teams"));
      setTeams(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchWorkers = async () => {
      const snapshot = await getDocs(collection(db, "workers"));
      setWorkers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchTeams();
    fetchWorkers();
  }, []);

  // Fetch selected team data
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!selectedTeamId) return;
      const docRef = doc(db, "teams", selectedTeamId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTeamData(data);
        setEditedRoles({ ...data.role }); // initialize editedRoles
      } else {
        setTeamData(null);
        setEditedRoles({});
      }
    };
    fetchTeamData();
  }, [selectedTeamId]);

  // Handle local change
  const handleWorkerChange = (role, workerId) => {
    setEditedRoles((prev) => ({ ...prev, [role]: workerId }));
  };

  // Save changes to Firestore
  const handleSaveChanges = async () => {
    if (!selectedTeamId) return;
    try {
      const teamRef = doc(db, "teams", selectedTeamId);
      await updateDoc(teamRef, { role: editedRoles });
      setTeamData((prev) => ({ ...prev, role: editedRoles }));
      alert("Team assignments updated successfully!");
    } catch (err) {
      console.error("Error updating team:", err);
      alert("Failed to save changes. See console for details.");
    }
  };

  return (
    <div className="team-panel-wrapper">
      <h1 className="panel-header">Team Assignment</h1>

      <div className="panel-card">
        <label>Select Team</label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          <option value="">Choose a team...</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name || team.id}
            </option>
          ))}
        </select>

        {teamData && (
          <div className="team-fields">
            <h2>{teamData.name}</h2>

            {Object.entries(teamData.role).map(([role, workerId]) => {
              const eligibleWorkers = workers.filter((w) => w.role === role);

              return (
                <div key={role} className="role-row">
                  <label>{role}</label>
                  <select
                    value={editedRoles[role] || ""}
                    onChange={(e) => handleWorkerChange(role, e.target.value)}
                  >
                    <option value="">Select {role}</option>
                    {eligibleWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            <button onClick={handleSaveChanges} className="save-button">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPanel;
