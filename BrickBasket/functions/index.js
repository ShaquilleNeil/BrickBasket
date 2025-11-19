/**
 * Firebase Cloud Functions (V2)
 */
// require("dotenv").config();


const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2/options");
const admin = require("firebase-admin");
admin.initializeApp();

// --- SendGrid ---
// --- SendGrid ---
const sgMail = require("@sendgrid/mail");

const SENDGRID_KEY = process.env.SENDGRID_KEY;

if (!SENDGRID_KEY) {
  console.log("❌ No SENDGRID_KEY set in environment");
} else {
  console.log("✅ SENDGRID_KEY loaded from environment");
  sgMail.setApiKey(SENDGRID_KEY);
}



// Optional limits
setGlobalOptions({ maxInstances: 10 });

// --- Delivery Status Change Trigger ---
exports.notifyStatusChange = onDocumentUpdated(
  "deliveries/{deliveryId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === after.status) return null;

    const userId = after.userId;
    const userSnap = await admin.firestore().doc(`users/${userId}`).get();

    if (!userSnap.exists) return null;

    const user = userSnap.data();

    // Build item name list
    const itemNames = (after.items || [])
      .map(i => i.name)
      .join(", ");

    // --- PUSH NOTIFICATION ---
    if (user.fcmToken) {
      await admin.messaging().send({
        notification: {
          title: "Delivery Update",
          body: `Your delivery of ${itemNames} is now: ${after.status}`,
        },
        token: user.fcmToken,
      });
    }

    // --- EMAIL NOTIFICATION ---
    if (process.env.SENDGRID_KEY && user.email) {
      await sgMail.send({
        to: user.email,
        from: "williamosborne88@gmail.com", // must be verified Sender
        subject: `Delivery Update: ${after.status}`,
        html: `
          <h2>Your Delivery Update</h2>
          <p>Your delivery containing:</p>
          <p><strong>${itemNames}</strong></p>
          <p>is now:</p>
          <h3>${after.status}</h3>
          <p style="color: grey;">BrickBasket Delivery System</p>
        `,
      });
    }

    return null;
  }
);
