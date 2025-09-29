import "./Dashuser.css";
import { useEffect, useState } from "react";
import { auth, firestore } from "../../firebase";
import { onAuthStateChanged, updateProfile, updateEmail } from "firebase/auth";
import { doc, updateDoc, setDoc, getDoc, collection } from "firebase/firestore";
import { updatePassword} from "firebase/auth";
import PaymentOptions from "./PaymentOptions.jsx";
import DeliveryMap from "./Deliverymap.jsx";


export default function Dashuser() {
    const [currentUser, setCurrentUser] = useState(null);
    const [activeSection, setActiveSection] = useState("ACCOUNT");

    const usersRef = collection(firestore, "users"); // firestore collection

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zip: "",
        password: "",
    });

    // Fetch logged-in user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);

                const userRef = doc(firestore, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    // Fill form with Firestore data
                    setFormData({ ...userSnap.data(), password: "" });
                } else {
                    // If no document exists, use defaults or create one
                    const defaultData = {
                        name: user.displayName || "",
                        email: user.email || "",
                        phone: "",
                        street: "",
                        city: "",
                        state: "",
                        zip: "",
                        password: "",
                    };
                    setFormData(defaultData);
                }
            } else {
                setCurrentUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            // Update display name in Firebase Auth
            if (formData.name !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: formData.name });
            }

            // Update email in Firebase Auth
            if (formData.email !== currentUser.email) {
                await updateEmail(currentUser, formData.email);
            }

            // Update password if field is not empty
            if (formData.password) {
                await updatePassword(currentUser, formData.password);
            }

            // Update other fields in Firestore
            const userRef = doc(firestore, "users", currentUser.uid);
            await updateDoc(userRef, {
                phone: formData.phone,
                street: formData.street,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
            });

            alert("Profile updated successfully!");
            setFormData((prev) => ({ ...prev, password: "" })); // clear password field
        } catch (err) {
            console.error(err);
            alert("Error updating profile: " + err.message);
        }
    };


    return (
        <div className="dashuser-wrapper">
            <div className="dashuser-container">

                <div className="sidebar">
                    <div className="account-header">
                        <h2>{currentUser?.displayName || formData.name}</h2>
                        <p>{currentUser?.email || formData.email}</p>
                        <div className="line"></div>

                        <div className="navcontainer">
                            <div className="nav-items" onClick={() => setActiveSection("ACCOUNT")}>ACCOUNT</div>
                            <div className="nav-items" onClick={() => setActiveSection("DELIVERIES")}>DELIVERIES</div>
                            <div className="nav-items" onClick={() => setActiveSection("HISTORY")}>HISTORY</div>
                            <div className="nav-items" onClick={() => setActiveSection("INVOICES")}>INVOICES</div>
                            <div className="nav-items" onClick={() => setActiveSection("WALLET")}>WALLET</div>

                        </div>
                    </div>
                </div>

                <div className="content">
                    {activeSection === "ACCOUNT" && (
                        <form className="account-form" onSubmit={handleSubmit}>
                            <label>
                                Name:
                                <input name="name" value={formData.name} onChange={handleChange} />
                            </label>
                            <label>
                                Email:
                                <input name="email" value={formData.email} onChange={handleChange} />
                            </label>
                            <label>
                                Phone:
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                            </label>
                            <label>
                                Street:
                                <input name="street" value={formData.street} onChange={handleChange} />
                            </label>
                            <label>
                                City:
                                <input name="city" value={formData.city} onChange={handleChange} />
                            </label>
                            <label>
                                State:
                                <input name="state" value={formData.state} onChange={handleChange} />
                            </label>
                            <label>
                                Zip:
                                <input name="zip" value={formData.zip} onChange={handleChange} />
                            </label>
                            <label>
                                Password:
                                <input type="password" name="password" value={formData.password} onChange={handleChange} />
                            </label>
                            <div className="button-wrapper">
                                <button className="button-30" type="submit">Save Changes</button>
                            </div>
                        </form>
                    )}

                    {activeSection === "DELIVERIES" && <DeliveryMap />}
                    {activeSection === "HISTORY" && <p>History content goes here.</p>}
                    {activeSection === "INVOICES" && <p>Invoices content goes here.</p>}
                    {activeSection === "WALLET" && <PaymentOptions />}
                </div>
            </div>
        </div>
    );
}
