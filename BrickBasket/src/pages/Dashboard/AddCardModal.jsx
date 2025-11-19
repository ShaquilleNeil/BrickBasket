import React, { useState } from "react";
// import "./AddCardModal.css";

export default function AddCardModal({ onClose, onSave }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [holder, setHolder] = useState("");

  const saveCard = () => {
    if (cardNumber.length < 12) return alert("Card number too short");

    const last4 = cardNumber.slice(-4);

    onSave({
      last4,
      expiry,
      holder,
      type: cardNumber.startsWith("4") ? "Visa" : "Mastercard",
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add New Card</h2>

        <input
          type="text"
          placeholder="Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="MM/YY"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />

        <input
          type="text"
          placeholder="Cardholder Name"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
        />

        <button onClick={saveCard}>Save Card</button>
        <button className="close-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
