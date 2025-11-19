import { useState, useEffect } from "react";
import { auth, firestore } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const loadInvoices = async () => {
      const uid = auth.currentUser.uid;
      const ref = collection(firestore, "users", uid, "invoices");

      const snap = await getDocs(ref);

      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    loadInvoices();
  }, []);

  return (
    <div>
      <h2>Your Invoices</h2>

      {invoices.length === 0 && <p>No invoices yet.</p>}

      {invoices.map(inv => (
        <div
          key={inv.id}
          style={{
            background: "#222",
            padding: "16px",
            marginBottom: "12px",
            borderRadius: "8px",
            color: "white"
          }}
        >
          <h4>Invoice #{inv.id.slice(-6)}</h4>
          <p>Total: ${inv.total}</p>
          <p>Paid With: **** {inv.cardLast4}</p>
          <p>Date: {new Date(inv.timestamp.seconds * 1000).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
