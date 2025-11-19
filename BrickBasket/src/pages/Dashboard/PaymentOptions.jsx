import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; 
import AddCardModal from "./AddCardModal";
import visaLogo from "../../assets/visa.png";
import mastercardLogo from "../../assets/mastercard.png";
import "./PaymentOptions.css";

export default function PaymentOptions() {
  const [wallet, setWallet] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load saved wallet data
  useEffect(() => {
    const loadWallet = async () => {
      const uid = auth.currentUser.uid;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setWallet(snap.data().wallet || null);
      }
    };

    loadWallet();
  }, []);

  const saveCardToFirestore = async (card) => {
    const uid = auth.currentUser.uid;
    const ref = doc(db, "users", uid);

    const cardWithImage = {
      ...card,
      image: card.type === "Visa" ? visaLogo : mastercardLogo
    };

    await updateDoc(ref, {
      wallet: cardWithImage
    });

    setWallet(cardWithImage);
  };

  return (
    <div className="payment-container">
      <h2>Wallet & Payment Options</h2>

      {wallet ? (
        <div className="current-card">
          <h3>Saved Card</h3>
          <div className="card">
            <img src={wallet.image} alt={wallet.type} />
            <span>**** **** **** {wallet.last4}</span>
          </div>
        </div>
      ) : (
        <p>No card saved yet.</p>
      )}

      <button className="add-card-btn" onClick={() => setShowModal(true)}>
        {wallet ? "Update Card" : "Add New Card"}
      </button>

      {showModal && (
        <AddCardModal
          onClose={() => setShowModal(false)}
          onSave={saveCardToFirestore}
        />
      )}
    </div>
  );
}
