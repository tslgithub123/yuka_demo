import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Ashoka from "./components/Ashoka";
import ComingSoon from "./components/ComingSoon";
import Gases from "./components/Gases";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            {/* Root route - Coming Soon */}
            <Route path="/" element={<ComingSoon />} />

            {/* Ashoka Buildcon Dashboard */}
            <Route path="/yuka-dashboard" element={<Ashoka />} />
            <Route path="/gas" element={<Gases />} />

            {/* Optional: 404 fallback (recommended) */}
            <Route
              path="*"
              element={
                <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-5xl font-bold text-slate-800">404</h1>
                    <p className="text-xl text-slate-600 mt-4">Page not found</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;