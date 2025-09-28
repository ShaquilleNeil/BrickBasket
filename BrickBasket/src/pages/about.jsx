import deliver from "./deliver.jpg"
import "./about.css"



function about() {
  return (
    <>
      <div className="custom-shape-divider-bottom-1758859673">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
        </svg>
      </div>

      <div className="aboutContainer">

        {/* 2 column set up with text on the left and image on the right   */}
        <div className="column-left">
          <h1>Our Mission</h1>
          <p>
            At BrickBasket, our mission is to revolutionize the way construction materials are delivered to your job site. <br />
            We believe that every project is unique, and we are committed to providing the highest quality materials, <br />
            ensuring that your construction work is completed on time and within budget.
          </p>
        </div>



        <div className="item one"><img src={deliver} alt="" /></div>
      </div>
    </>
  )
}

export default about