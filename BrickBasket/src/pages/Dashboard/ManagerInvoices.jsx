import React, { useEffect, useState } from "react";
import { firestore } from "../../firebase";
import { collection, getDocs, doc } from "firebase/firestore";

export default function ManagerInvoices() {
    const [clients, setClients] = useState([]);
    const [openClient, setOpenClient] = useState(null);
    const [openInvoice, setOpenInvoice] = useState(null);

    useEffect(() => {
        async function loadAllInvoices() {
            const usersSnap = await getDocs(collection(firestore, "users"));

            const clientsData = [];

            for (const userDoc of usersSnap.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();

                // ❌ Skip employees/managers
                if (userData.email?.toLowerCase().includes("brickbasket")) {
                    continue;
                }

                // Load invoices for this real customer
                const invoicesRef = collection(firestore, "users", userId, "invoices");
                const invoicesSnap = await getDocs(invoicesRef);

                const invoices = invoicesSnap.docs.map(inv => ({
                    id: inv.id,
                    ...inv.data(),
                }));

                clientsData.push({
                    userId,
                    name: userData.name || "Unnamed User",
                    email: userData.email || "",
                    invoices,
                });
            }


            setClients(clientsData);
        }

        loadAllInvoices();
    }, []);

    return (
        <div style={{ padding: "20px", color: "white" }}>
            <h2>All Client Invoices</h2>

            {clients.map((client) => (
                <div
                    key={client.userId}
                    style={{
                        background: "#1e1e1e",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "10px",
                    }}
                >
                    {/* CLIENT HEADER */}
                    <div
                        onClick={() =>
                            setOpenClient(openClient === client.userId ? null : client.userId)
                        }
                        style={{
                            cursor: "pointer",
                            fontSize: "20px",
                            fontWeight: "bold",
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <span>{client.name}</span>
                        <span>{openClient === client.userId ? "▼" : "▶"}</span>
                    </div>

                    {/* CLIENT INVOICES */}
                    {openClient === client.userId && (
                        <div style={{ marginTop: "10px", paddingLeft: "10px" }}>
                            {client.invoices.length === 0 ? (
                                <p style={{ color: "#aaa" }}>No invoices found.</p>
                            ) : (
                                client.invoices.map((inv) => (
                                    <div
                                        key={inv.id}
                                        style={{
                                            background: "#2c2c2c",
                                            padding: "10px",
                                            borderRadius: "8px",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <div
                                            onClick={() =>
                                                setOpenInvoice(openInvoice === inv.id ? null : inv.id)
                                            }
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "16px",
                                            }}
                                        >
                                            <span>Invoice #{inv.id.slice(0, 6)}</span>
                                            <span>{openInvoice === inv.id ? "▼" : "▶"}</span>
                                        </div>

                                        {/* INVOICE DETAILS */}
                                        {openInvoice === inv.id && (
                                            <div style={{ marginTop: "10px", paddingLeft: "10px", color: "#ccc" }}>
                                                <p><strong>Total:</strong> ${inv.fees?.total}</p>
                                                <p><strong>Store:</strong> {inv.store}</p>
                                                <p><strong>Distance:</strong> {inv.distanceKm} km</p>
                                                <p><strong>Driver:</strong> {inv.driverName}</p>
                                                <p><strong>Team:</strong> {inv.teamName}</p>

                                                <div style={{ marginTop: "10px" }}>
                                                    <strong>Items:</strong>
                                                    {inv.items?.map((it, index) => (
                                                        <div key={index} style={{ marginLeft: "10px" }}>
                                                            <p>- {it.name} ({it.store})</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ marginTop: "10px" }}>
                                                    <strong>Fees Breakdown:</strong>
                                                    <p>Delivery Fee: ${inv.fees?.deliveryFee}</p>
                                                    <p>Service Fee: ${inv.fees?.serviceFee}</p>
                                                    <p>Tax: ${inv.fees?.tax}</p>
                                                    <p style={{ fontWeight: "bold", color: "#00ff99" }}>
                                                        Total: ${inv.fees?.total}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
