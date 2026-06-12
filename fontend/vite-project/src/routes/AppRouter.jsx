import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// import trang bạn vừa làm
import BoothPage from "../pages/visitor/BoothPage";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* route chính */}
        <Route path="/booth/:id" element={<BoothPage />} />
      </Routes>
    </Router>
  );
}