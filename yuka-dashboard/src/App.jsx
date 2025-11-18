import { BrowserRouter, Routes, Route } from "react-router-dom";
import Ashoka from "./components/Ashoka";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - Coming Soon */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
              <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                Coming Soon
              </h1>
            </div>
          }
        />

        {/* Ashoka Buildcon Dashboard */}
        <Route path="/ashoka-buildcon" element={<Ashoka />} />

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