import "./contact.css"
import Lottie from "lottie-react"
import animationData from "../assets/contact.json"
import emailjs from '@emailjs/browser';
import React, { useRef, useState } from "react";
function contact() {
     const formRef = useRef();
     const [status, setStatus] = useState('');

      const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("Sending...");

    emailjs
      .sendForm(
        "service_qw0hj4c",   // replace with your service ID
        "template_737j2qf",  // replace with your template ID
        formRef.current,
        "OA4VGF-OPafeORdSI"  
      )
      .then(
        (result) => {
          console.log(result.text);
          setStatus("Message sent successfully!");
          formRef.current.reset(); // clear form
        },
        (error) => {
          console.log(error.text);
          setStatus("Failed to send message. Try again later.");
        }
      );
  };

    return (
       
        <>
            <div class="custom-shape-divider-bottom-1758859673">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
                </svg>
            </div>

            {/* 2 column set up with a form on the right and text on the left  */}
            <div className="contactcontainer">

                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    style={{
                        width: 300, height: 300, position: 'absolute',
                        top: -10,
                        left: 0,
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        color: "red"
                    }}
                />


                <div class="contactText">
                    <h1>contact us</h1>
                    <p>
                        We're here to help! If you have any questions, concerns, or feedback, don't hesitate to get in touch with us. <br />
                        Our dedicated support team is always ready to assist you. <br />
                        Whether you need help with a specific issue, have a suggestion, or simply want to share your thoughts, we're here to provide you with the support you need.
                    </p>
                </div>

                <div className="contactForm">
                    <form ref={formRef} onSubmit={handleSubmit}>
                        <input type="text" name="name" placeholder="Name" />
                        <input type="email" name="email" placeholder="Email" />
                        <textarea name="message" placeholder="Message"></textarea>
                        <button type="submit">Send</button>
                    </form>
                </div>
            </div>

        </>
    )
}

export default contact