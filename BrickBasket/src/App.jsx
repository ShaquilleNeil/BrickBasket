import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./pages/Navbar.jsx";
import Home from "./pages/home.jsx";
import About from "./pages/about.jsx";
import Contact from "./pages/contact.jsx";
import Dashuser from "./pages/Dashboard/Dashuser.jsx";
import DashDM from "./pages/Dashboard/DashDM.jsx";
import { AuthProvider, useAuth } from "./contexts/authContext/index.jsx";
import { registerFCMToken } from "./getFCMToken";



// Private Route component must be inside the AuthProvider context
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    // Avoid calling the function repeatedly on each render
    registerFCMToken();
    return children;
  }

  return <Navigate to="/" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar /> {/* Always visible */}
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuthRedirect>
                <Home />
              </RequireAuthRedirect>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Protected Dashboard */}
          <Route
            path="/Dashuser"
            element={
              <PrivateRoute>
                <Dashuser />
              </PrivateRoute>
            }
          />
          <Route
            path="/DashDM"
            element={
              <PrivateRoute>
                <DashDM />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Helper component to redirect logged-in users away from Home
function RequireAuthRedirect({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/Dashuser" /> : children;
}



export default App;
