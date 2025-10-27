
const DashDM = () => {
  return (
   <div className="dashuser-wrapper">
               <div className="dashuser-container">
   
                   <div className="sidebar">
                       <div className="account-header">
                           {/* <h2>{currentUser?.displayName || formData.name}</h2>
                           <p>{currentUser?.email || formData.email}</p> */}
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
                       {/* {activeSection === "ACCOUNT" && (
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
                       {activeSection === "WALLET" && <PaymentOptions />} */}
                   </div>
               </div>
           </div>
  );
};

export default DashDM;
