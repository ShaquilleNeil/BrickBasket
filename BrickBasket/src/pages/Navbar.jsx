import React, { useRef, useState } from "react";
import "./Navbar.css";
import logo from "../assets/hlogo2.png";
import { firestore } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import { login, signInWithGoogle, logout, signup } from "../auth";
import { useAuth } from "../contexts/authContext";
import gmailogo from "../assets/gmail.png";

const Navbar = () => {
  const [isActive, setIsActive] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);

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
      name: nameRef.current.value,
      email: emailRef.current.value,
      phone: phoneRef.current.value,
      street: streetRef.current.value,
      city: cityRef.current.value,
      state: stateRef.current.value,
      zip: zipRef.current.value,
      password: passwordRef.current.value,
    };

    try {
    //   // Firebase Auth signup
    //   await signup(data.email, data.password);

      // Save user info to Firestore
      await addDoc(usersRef, data);

      alert("Signup successful");
      setOpenSignup(false);
      setOpenLogin(true);
    } catch (err) {
      console.error(err);
      alert("Signup failed: " + err.message);
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
      await signInWithGoogle();
      setOpenLogin(false);
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
        <div className="logo">
          <img src={logo} alt="logo" />
          <h1>Brick Basket</h1>
        </div>

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
              <a href="/forgotpassword">Forgot Password?</a>
              <button className="button-30" type="submit">
                LOGIN
              </button>
            </form>
            <button className="button-31" onClick={handleGoogleSignIn}>
              <img src={gmailogo} alt="Google Logo" style={{ width: "15px",height: "15px", marginRight: "8px" }} /> Sign in with Google
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
              <input type="text" ref={nameRef} placeholder="Full Name" required />
              <input type="email" ref={emailRef} placeholder="Email" required />
              <input type="text" ref={phoneRef} placeholder="Phone Number" required />
              <input type="text" ref={streetRef} placeholder="Street Address" required />
              <input type="text" ref={cityRef} placeholder="City" required />
              <input type="text" ref={stateRef} placeholder="Province" required />
              <input type="text" ref={zipRef} placeholder="Zip Code" required />
              <input type="password" ref={passwordRef} placeholder="Password" required />
              <button className="button-30" type="submit">
                SIGN UP
              </button>
            </form>
            <a href="#" onClick={switchToLogin} className="switch-link">
              Already have an account? Login
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
