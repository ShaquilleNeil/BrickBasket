import React, { useRef, useState } from "react";
import "./Navbar.css";
import logo from "../assets/hlogo2.png";
import { firestore } from "../firebase";
import { addDoc,doc,setDoc, collection } from "firebase/firestore";
import { login, signInWithGoogle, logout, signup, sendPasswordResetEmail } from "../auth";
import { useAuth } from "../contexts/authContext";
import gmailogo from "../assets/gmail.png";

const Navbar = () => {
  const [isActive, setIsActive] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});
  const [openReset, setOpenReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");



  const nameRef = useRef();
  const emailRef = useRef();
  const phoneRef = useRef();
  const streetRef = useRef();
  const cityRef = useRef();
  const stateRef = useRef();
  const zipRef = useRef();
  const passwordRef = useRef();

  const usersRef = collection(firestore, "users"); // firestore collection

  const { currentUser, userLoggedIn } = useAuth();

  // Signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
  
    const data = {
      name: nameRef.current.value.trim(),
      email: emailRef.current.value.trim(),
      phone: phoneRef.current.value.trim(),
      street: streetRef.current.value.trim(),
      city: cityRef.current.value.trim(),
      state: stateRef.current.value.trim(),
      zip: zipRef.current.value.trim(),
      password: passwordRef.current.value,
    };
  
    const errors = {};
  
    if (!data.name) errors.name = "Full Name is required";
    if (!data.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = "Email is invalid";
  
    if (!data.phone) errors.phone = "Phone Number is required";
    else if (!/^\d{10}$/.test(data.phone)) errors.phone = "Phone Number must be 10 digits";
  
    if (!data.street) errors.street = "Street is required";
    if (!data.city) errors.city = "City is required";
    if (!data.state) errors.state = "Province is required";
    if (!data.zip) errors.zip = "Zip Code is required";
  
    if (!data.password) {
      errors.password = "Password is required";
    } else {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
      if (!passwordRegex.test(data.password)) {
        errors.password =
          "Password must be at least 6 characters, include 1 uppercase, 1 number, and 1 special character";
      }
    }
  
    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) return; // stop if there are errors
  
    try {
      // Create user in Firebase Auth
      const userCredential = await signup(data.email, data.password);
  
      // Save Firestore document with UID as ID
      const userRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userRef, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
      });

      await logout();
  
      alert("Signup successful");
      setOpenSignup(false);
      setOpenLogin(true);
    } catch (err) {
      console.error(err);
      alert("Signup failed: " + err.message);
    }
  };
  



  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    setResetError("");

    if (!resetEmail) {
      setResetError("Email is required");
      return;
    }

    try {
      await sendPasswordResetEmail(resetEmail);
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setResetError(err.message || "Failed to send reset email.");
    }
  };


  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await login(email, password);
      setOpenLogin(false);
    } catch (err) {
      console.error(err);
      alert("Login failed: " + err.message);
    }
  };

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    try {
      // Sign in with Google
      const userCredential = await signInWithGoogle(); // your existing function
      const user = userCredential.user;
  
      // Reference to the user's Firestore document
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        // Create document with info from Google
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email || "",
          phone: "",    // Google doesn't provide phone by default
          street: "",
          city: "",
          state: "",
          zip: ""
        });
      }
  
      // Fetch the newly created or existing document to populate the form
      const updatedSnap = await getDoc(userRef);
      if (updatedSnap.exists()) {
        setFormData({ ...updatedSnap.data(), password: "" });
      }
  
      setCurrentUser(user);      // update currentUser state
      setActiveSection("ACCOUNT"); // optional: switch to account panel
      setOpenLogin(false);       // close login popup
    } catch (err) {
      console.error(err);
      alert("Google Sign-In failed: " + err.message);
    }
  };
  


  const toggleMenu = () => setIsActive(!isActive);
  const closeLogin = () => setOpenLogin(false);
  const closeSignup = () => setOpenSignup(false);

  const switchToSignup = (e) => {
    e.preventDefault();
    setOpenLogin(false);
    setOpenSignup(true);
  };

  const switchToLogin = (e) => {
    e.preventDefault();
    setOpenSignup(false);
    setOpenLogin(true);
  };

  return (
    <>
      <nav>
        <a href="/">
        <div className="logo">
          <img src={logo} alt="logo" />
          <h1>Brick Basket</h1>
        </div>
        </a>

        <div className={`off-screen-menu ${isActive ? "active" : ""}`}>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/contact">Contact Us</a>
            </li>
          </ul>
        </div>

        <div className="nav-buttons">
          {userLoggedIn ? (
            <button className="button-30" onClick={logout}>
              Logout
            </button>
          ) : (
            <>
              <button className="button-30" onClick={() => setOpenLogin(true)}>
                Login
              </button>
              <button
                className="button-30"
                onClick={() => setOpenSignup(true)}
              >
                Sign up
              </button>
            </>
          )}
        </div>

        <div className={`hamburger ${isActive ? "active" : ""}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>

      {/* Login Popup */}
      {openLogin && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button
              className="button-30"
              style={{ position: "absolute", top: "10px", right: "10px" }}
              onClick={closeLogin}
            >
              X
            </button>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
              <input type="email" name="email" placeholder="Email" required />
              <input type="password" name="password" placeholder="Password" required />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenLogin(false);  // close login popup if open
                  setOpenReset(true);   // open reset popup
                }}
              >
                Forgot Password?
              </a>

              <button className="button-30" type="submit">
                LOGIN
              </button>
            </form>
            <button className="button-31" onClick={handleGoogleSignIn}>
              <img src={gmailogo} alt="Google Logo" style={{ width: "15px", height: "15px", marginRight: "8px" }} /> Sign in with Google
            </button>
            <a href="#" onClick={switchToSignup} className="switch-link">
              Don't have an account? Sign up
            </a>
          </div>
        </div>
      )}

      {/* Signup Popup */}
      {openSignup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button
              className="button-30"
              style={{ position: "absolute", top: "10px", right: "10px" }}
              onClick={closeSignup}
            >
              X
            </button>
            <h1>Sign Up</h1>
            <form onSubmit={handleSignup}>
              <input type="text" ref={nameRef} placeholder="Full Name" />
              {signupErrors.name && <p className="error">{signupErrors.name}</p>}

              <input type="email" ref={emailRef} placeholder="Email" />
              {signupErrors.email && <p className="error">{signupErrors.email}</p>}

              <input type="text" ref={phoneRef} placeholder="Phone Number" />
              {signupErrors.phone && <p className="error">{signupErrors.phone}</p>}

              <input type="text" ref={streetRef} placeholder="Street Address" />
              {signupErrors.street && <p className="error">{signupErrors.street}</p>}

              <input type="text" ref={cityRef} placeholder="City" />
              {signupErrors.city && <p className="error">{signupErrors.city}</p>}

              <input type="text" ref={stateRef} placeholder="Province" />
              {signupErrors.state && <p className="error">{signupErrors.state}</p>}

              <input type="text" ref={zipRef} placeholder="Zip Code" />
              {signupErrors.zip && <p className="error">{signupErrors.zip}</p>}

              <input type="password" ref={passwordRef} placeholder="Password" />
              {signupErrors.password && <p className="error">{signupErrors.password}</p>}

              <button className="button-30" type="submit">SIGN UP</button>
            </form>

            <a href="#" onClick={switchToLogin} className="switch-link">
              Already have an account? Login
            </a>
          </div>
        </div>
      )}

      {/* Password Reset Popup */}
      {openReset && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button
              className="button-30"
              style={{ position: "absolute", top: "10px", right: "10px" }}
              onClick={() => setOpenReset(false)}
            >
              X
            </button>
            <h1>Reset Password</h1>
            <form onSubmit={handlePasswordReset}>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <button className="button-30" type="submit">
                Send Reset Email
              </button>
            </form>
            {resetMessage && <p className="success">{resetMessage}</p>}
            {resetError && <p className="error">{resetError}</p>}
            <button
              className="button-30"
              onClick={() => {
                setOpenReset(false);
                setOpenLogin(true);
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}




    </>
  );
};

export default Navbar;
