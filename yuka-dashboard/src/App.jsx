import { BrowserRouter, Routes, Route } from "react-router-dom";
import Ashoka from "./components/Ashoka";
import ComingSoon from "./components/ComingSoon";
import Gases from "./components/Gases";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - Coming Soon */}
        <Route
          path="/"
          element={
            <ComingSoon/>
          }
        />

        {/* Ashoka Buildcon Dashboard */}
        <Route path="/ashoka-buildcon" element={<Ashoka />} />
        <Route path="/gas" element={<Gases />} />

        {/* Optional: 404 fallback (recommended) */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-5xl font-bold text-gray-800">404</h1>
                <p className="text-xl text-gray-600 mt-4">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;