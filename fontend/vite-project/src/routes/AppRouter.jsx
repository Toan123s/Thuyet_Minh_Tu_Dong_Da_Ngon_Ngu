import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/visitor/LandingPage";
import PaymentPage from "../pages/visitor/PaymentPage";
import LocationPage from "../pages/visitor/LocationPage";
import MapPage from "../pages/visitor/MapPage";
import BoothPage from "../pages/visitor/BoothPage";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/booth/:id" element={<BoothPage />} />
      </Routes>
    </Router>
  );
}