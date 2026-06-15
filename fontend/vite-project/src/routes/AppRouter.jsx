import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./routes/AppRouter";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppRouter />
);
``
=======
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "../pages/visitor/LandingPage";
import PaymentPage from "../pages/visitor/PaymentPage";
import LocationPage from "../pages/visitor/LocationPage";
import MapPage from "../pages/visitor/MapPage";
import BoothPage from "../pages/visitor/BoothPage";

// Import các trang thuộc phân hệ Vendor hệ thống định tuyến
import VendorDashboardPage from "../pages/vendor/VendorDashboardPage";
import NarrationPage from "../pages/vendor/NarrationPage";
import MediaPage from "../pages/vendor/MediaPage";
import StatisticPage from "../pages/vendor/StatisticPage";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
      
        <Route path="/" element={<LandingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/booth/:id" element={<BoothPage />} />

       
        <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
        <Route path="/vendor/narrations/:boothId" element={<NarrationPage />} />
        <Route path="/vendor/media/:boothId" element={<MediaPage />} />
        <Route path="/vendor/stats/:boothId" element={<StatisticPage />} />
      </Routes>
    </Router>
  );
}
