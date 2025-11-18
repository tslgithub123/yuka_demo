import { useState, useEffect } from "react";
import { MapPin, RefreshCw, Activity, Wind, Clock } from "lucide-react";
import axios from "axios";
import logo from "../assets/logo.png";

export default function Ashoka() {
    const [data, setData] = useState({});
    const [lastUpdate, setLastUpdate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [locations, setLocations] = useState({});
    
    const API_URL = process.env.NODE_ENV === "production"
        ? "http://51.21.144.39:5000/api/latest-data"
        : "http://localhost:5000/api/latest-data";

    const YANTRAS = [
        {
            name: "RMC Plant",
            inlet: "8C:4F:00:19:94:C0",
            outlet: "8C:4F:00:19:A4:F0",
            bgGradient: "from-purple-100 to-pink-100",
        },
        {
            name: "Entry Gate ABL",
            inlet: "8C:4F:00:19:5E:44",
            outlet: "8C:4F:00:19:A1:38",
            bgGradient: "from-blue-100 to-cyan-100",
        },
    ];

    const getLocationName = async (lat, lng, devId) => {
        if (!lat || !lng || locations[devId]) return;
        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
            );
            const short = res.data.display_name.split(",").slice(-6).join(", ").replace(/, India$/, ", India");
            setLocations(prev => ({ ...prev, [devId]: short }));
        } catch {
            setLocations(prev => ({ ...prev, [devId]: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
        }
    };

    const fetchData = async () => {
        try {
            const res = await fetch(API_URL);
            const json = await res.json();
            const map = {};
            json.data.forEach(d => {
                map[d.devId] = d;
                if (d.lat && d.lng && !locations[d.devId]) {
                    getLocationName(d.lat, d.lng, d.devId);
                }
            });
            setData(map);
            setLastUpdate(new Date().toLocaleString("en-IN"));
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, []);

    const getReduction = (inlet, outlet, field) => {
        if (!inlet || !outlet || !inlet[field] || !outlet[field]) return null;
        const reduction = ((inlet[field] - outlet[field]) / inlet[field]) * 100;
        return reduction > 0 ? reduction.toFixed(1) : 0;
    };

    const getAqiColor = (aqi) => {
        if (!aqi) return "text-gray-500";
        if (aqi <= 50) return "text-green-600";
        if (aqi <= 100) return "text-yellow-600";
        if (aqi <= 150) return "text-orange-600";
        return "text-red-600";
    };

    const formatVolume = (v) => v ? v.replace(" m3", "").replace(/^0+/, "") + " m³" : "—";

    const formatRunningTime = (tTot) => {
        if (!tTot) return "—";
        const parts = tTot.split(":");
        const hours = parseInt(parts[0], 10);
        return `${hours}:${parts[1]}:${parts[2]}`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative">
                    <div className="absolute left-1/2 -translate-x-1/2 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Yuka Yantra Live
                        </h1>
                        <p className="text-gray-600 text-sm md:text-base">Real-time Air Purification Dashboard</p>
                    </div>

                    <div className="flex-shrink-0">
                        <img src={logo} alt="Techknowgreen Logo" className="h-14 md:h-16 object-contain" />
                    </div>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-2 gap-10">
                    {YANTRAS.map((yantra) => {
                        const inlet = data[yantra.inlet];
                        const outlet = data[yantra.outlet];
                        const efficiencyPM25 = getReduction(inlet, outlet, "pm2d5");
                        const efficiencyPM10 = getReduction(inlet, outlet, "pm10");
                        const location = locations[yantra.inlet] || locations[yantra.outlet] || "Fetching location...";

                        return (
                            <div key={yantra.name} className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                                <div className={`h-3 bg-gradient-to-r ${yantra.bgGradient}`} />

                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-800">{yantra.name}</h2>
                                            <p className="text-gray-600 flex items-center gap-2 mt-2">
                                                <MapPin className="w-5 h-5 text-purple-600" />
                                                {location}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-5xl font-black text-green-600">
                                                {efficiencyPM25 !== null ? `${efficiencyPM25}%` : "--"}
                                            </div>
                                            <div className="text-lg text-gray-600">PM2.5 Efficiency</div>
                                            <div className="text-3xl font-bold text-green-600 mt-2">
                                                {efficiencyPM10 !== null ? `${efficiencyPM10}%` : "--"}
                                            </div>
                                            <div className="text-sm text-gray-600">PM10 Efficiency</div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Inlet */}
                                        <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 p-6">
                                            <h3 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
                                                <Wind className="w-7 h-7" />
                                                Inlet Air
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-sm text-gray-600">PM2.5 (µg/m³)</div>
                                                    <div className="text-4xl font-bold text-gray-800">
                                                        {inlet?.pm2d5?.toFixed(1) || "--"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">PM10 (µg/m³)</div>
                                                    <div className="text-4xl font-bold text-orange-700">
                                                        {inlet?.pm10?.toFixed(1) || "--"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">AQI</div>
                                                    <div className={`text-3xl font-bold ${getAqiColor(inlet?.aqi)}`}>
                                                        {inlet?.aqi || "--"}
                                                    </div>
                                                </div>

                                                {/* Temperature & Humidity – now styled like Outlet */}
                                                <div>
                                                    <div className="text-sm text-gray-600">Temperature (°C)</div>
                                                    <div className="text-3xl font-bold">
                                                        {inlet?.temp?.toFixed(1) || "--"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Humidity (%)</div>
                                                    <div className="text-3xl font-bold">
                                                        {inlet?.hum?.toFixed(0) || "--"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Outlet */}
                                        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 border border-green-200 p-6">
                                            <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                                                <Activity className="w-7 h-7" />
                                                Outlet Air
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-sm text-gray-600">PM2.5 (µg/m³)</div>
                                                    <div className="text-4xl font-bold text-green-700">
                                                        {outlet?.pm2d5?.toFixed(1) || "--"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">PM10 (µg/m³)</div>
                                                    <div className="text-4xl font-bold text-emerald-600">
                                                        {outlet?.pm10?.toFixed(1) || "--"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">AQI</div>
                                                    <div className={`text-3xl font-bold ${getAqiColor(outlet?.aqi)}`}>
                                                        {outlet?.aqi || "--"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Temperature (°C)</div>
                                                    <div className="text-3xl font-bold">
                                                        {outlet?.temp?.toFixed(1) || "--"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Humidity (%)</div>
                                                    <div className="text-3xl font-bold">
                                                        {outlet?.hum?.toFixed(0) || "--"}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Running Time: {outlet ? formatRunningTime(outlet.T_Tot) : "--"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Volume Processed: {outlet ? formatVolume(outlet.V_Tot) : "--"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t flex justify-between text-sm text-gray-500">
                                        <span className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                            Live • {inlet && outlet ? "Both online" : "Waiting..."}
                                        </span>
                                        <span>
                                            Updated: {inlet?.receivedAt ? new Date(inlet.receivedAt).toLocaleTimeString("en-IN") : "--"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t mt-20 py-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-2xl font-bold text-gray-800">
                        Techknowgreen Solutions Limited
                    </p>
                    <p className="text-gray-600 mt-2">
                        © 2025 • Pioneering Clean Air Technology • Made in India
                    </p>
                </div>
            </footer>
        </div>
    );
}
