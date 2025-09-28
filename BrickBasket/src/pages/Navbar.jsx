import React,{useRef, useState} from "react";
import "./Navbar.css";
import logo from "../assets/hlogo2.png";
import {firestore} from "../firebase";
import { addDoc, collection } from "firebase/firestore";

export const Navbar = () => {
    const [isActive, setIsActive] = useState(false);
    const [openPopup, setOpenPopup] = useState(false);
    const [openPopup2, setOpenPopup2] = useState(false);

    const nameRef = useRef();
    const emailRef = useRef();
    const phoneRef = useRef();
    const streetRef = useRef();
    const cityRef = useRef();
    const stateRef = useRef();
    const zipRef = useRef();
    const passwordRef = useRef();
    const ref = collection(firestore, "users"); // collection reference

    const handleSignup = async(e) => {
        e.preventDefault(); //prevent page reload
        const name = nameRef.current.value;
        const email = emailRef.current.value;
        const phone = phoneRef.current.value;
        const street = streetRef.current.value;
        const city = cityRef.current.value;
        const state = stateRef.current.value;
        const zip = zipRef.current.value;
        const password = passwordRef.current.value;
        console.log("Signup:", name, email, password);
        // Perform signup logic here

        let data = {
            name: name,
            email: email,
            phone: phone,
            street: street,
            city: city,
            state: state,
            zip: zip,
            password: password
        }

        try{
            addDoc(ref, data);
            alert("Signup successful");
            setOpenPopup2(false);
        }catch(err){
            console.log(err);
        }
    };
    
    const toggleMenu = () => {
        setIsActive(!isActive);
    };

    const closePopup = () => {
        setOpenPopup(false);
    };

    const closePopup2 = () => {
        setOpenPopup2(false);
    };

    // Function to switch from login to signup popup
    const switchToSignup = (e) => {
        e.preventDefault(); // Prevent default link behavior
        setOpenPopup(false); // Close login popup
        setOpenPopup2(true); // Open signup popup
    };

    // Function to switch from signup to login popup (optional)
    const switchToLogin = (e) => {
        e.preventDefault();
        setOpenPopup2(false);
        setOpenPopup(true);
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        // Handle login logic here
        console.log("Login submitted");
    };

    const handleSignupSubmit = (e) => {
        e.preventDefault();
        // Handle signup logic here
        console.log("Signup submitted");
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
                        <li><a href="/"><img src="./src/assets/home.png" alt="Home" />Home</a></li>
                        <li><a href="/about"><img src="./src/assets/about.png" alt="About" />About</a></li>
                        <li><a href="/contact"><img src="./src/assets/email.png" alt="Contact" />Contact Us</a></li>
                    </ul>
                </div>

                <div className="nav-buttons">
                    <button className="button-30" onClick={() => setOpenPopup(true)}>Login</button>
                    <button className="button-30" onClick={() => setOpenPopup2(true)}>Sign up</button>
                </div>

                <div
                    className={`hamburger ${isActive ? "active" : ""}`}
                    onClick={toggleMenu}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </nav>

            {/* Login Popup */}
            {openPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <button className="button-30" style={{ position: "absolute", top: "10px", right: "10px" }} onClick={closePopup}>X</button>
                        <h1>Login</h1>
                        <form onSubmit={handleLoginSubmit}>
                            <input type="text" placeholder="Username or Email" />
                            <input type="password" placeholder="Password" />
                            <a href="/forgotpassword">Forgot Password?</a>
                            <button className="button-30" type="submit">LOGIN</button>
                            <a href="#" onClick={switchToSignup} className="switch-link">
                                Don't have an account? Sign up
                            </a>
                        </form>
                    </div>
                </div>
            )}

            {/* Signup Popup */}
            {openPopup2 && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <button className="button-30" o style={{ position: "absolute", top: "10px", right: "10px" }} onClick={closePopup2}>X</button>
                        <h1>Sign Up</h1>
                        <form onSubmit={handleSignup}>
                            <input type="text" ref={nameRef} placeholder="Full Name" />
                            <input type="email" ref={emailRef} placeholder="Email" />
                            <input type="text" ref={phoneRef} placeholder="Phone Number" />
                            <input type="text" ref={streetRef} placeholder="Street Address" />
                            <input type="text" ref={cityRef} placeholder="City" />
                            <input type="text" ref={stateRef} placeholder="Province" />
                            <input type="text" ref={zipRef} placeholder="Zip Code" />
                            <input type="password" ref={passwordRef} placeholder="Password" />
                            <input type="password" placeholder="Confirm Password" />
                            <button className="button-30" type="submit">SIGN UP</button>
                            <a href="#" onClick={switchToLogin} className="switch-link">
                                Already have an account? Login
                            </a>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;