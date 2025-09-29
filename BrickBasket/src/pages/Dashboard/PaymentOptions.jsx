// PaymentOptions.jsx
import React, { useState } from "react";
import visaLogo from "../../assets/visa.png";
import mastercardLogo from "../../assets/mastercard.png";
import "./PaymentOptions.css";

export default function PaymentOptions() {
  const [currentCard, setCurrentCard] = useState({
    type: "Visa",
    last4: "1234",
    image: visaLogo,
  });

  const otherCards = [
    { type: "Mastercard", last4: "5678", image: mastercardLogo },
    { type: "Visa", last4: "9012", image: visaLogo },
  ];

  return (
    <div className="payment-container">
      <h2>Wallet & Payment Options</h2>

      <div className="current-card">
        <h3>Current Card</h3>
        <div className="card">
          <img src={currentCard.image} alt={currentCard.type} />
          <span>**** **** **** {currentCard.last4}</span>
        </div>
      </div>

      <div className="other-cards">
        <h3>Other Saved Cards</h3>
        {otherCards.map((card, idx) => (
          <div className="card" key={idx} onClick={() => setCurrentCard(card)}>
            <img src={card.image} alt={card.type} />
            <span>**** **** **** {card.last4}</span>
          </div>
        ))}
      </div>

      <button className="add-card-btn">Add New Card</button>
    </div>
  );
}
