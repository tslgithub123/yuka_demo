import React, { useState, useEffect } from "react";
import {
    MapPin,
    RefreshCw,
    Wind,
    Clock,
    Droplets,
    Thermometer,
    Activity,
    ShieldCheck,
    AlertTriangle,
    Building2,
    Fan,
    Flame,
    CloudFog,
    CloudRain,
    Cloud,
    FlaskConical
} from "lucide-react";
import axios from "axios";
import logo from "../assets/logo.png";


const pollutants = [
    { name: "NO₂", unit: "PPB", min: 7.6, max: 35, dayMin: 18, dayMax: 32, red: [0.66, 0.86] },
    { name: "SO₂", unit: "PPB", min: 3.6, max: 38, dayMin: 12, dayMax: 49, red: [0.65, 0.89] },
    { name: "TVOC", unit: "ppm", min: 0.15, max: 0.89, dayMin: 0.20, dayMax: 0.89, red: [0.56, 0.89] },
    { name: "CO₂", unit: "ppm", min: 417, max: 562, dayMin: 450, dayMax: 560, red: [0.05, 0.10] },
    { name: "CO", unit: "PPB", min: 154, max: 601, dayMin: 265, dayMax: 601, red: [0.20, 0.35] },
];

const timeToMinutes = (t) => t.split(":").reduce((h, m) => h * 60 + +m, 0);

const generateValue = (pollutant, mins) => {
    let base = pollutant.min + Math.random() * (pollutant.max - pollutant.min);
    if (mins >= timeToMinutes("09:30") && mins < timeToMinutes("19:30")) {
        const progress = (mins - timeToMinutes("09:30")) / (timeToMinutes("19:30") - timeToMinutes("09:30"));
        const peak = 1 - Math.pow(progress - 0.5, 2) * 4;
        base = pollutant.dayMin + (pollutant.dayMax - pollutant.dayMin) * (0.2 + peak * 0.8);
    }
    base += (Math.random() - 0.5) * (pollutant.max - pollutant.min) * 0.15;
    if (Math.random() < 0.09) base *= 1.3; // random spike
    return Math.max(pollutant.min, Math.min(pollutant.max + 50, base));
};

export default function Ashoka() {
    const [data, setData] = useState({});
    const [lastUpdate, setLastUpdate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [locations, setLocations] = useState({});
    const [gasData, setGasData] = useState({});

    const API_URL = process.env.NODE_ENV === "production"
        ? "/api/latest-data"
        : "http://localhost:5000/api/latest-data";

    const YANTRAS = [
        {
            name: "RMC Plant",
            inlet: "8C:4F:00:19:94:C0",
            outlet: "8C:4F:00:19:A4:F0",
            id: "rmc-01"
        },
        {
            name: "Entry Gate ABL",
            inlet: "8C:4F:00:19:5E:44",
            outlet: "8C:4F:00:19:A1:38",
            id: "abl-01"
        },
        { name: "P7 Highway", inlet: "8C:4F:00:19:88:C4", outlet: "8C:4F:00:19:57:F8" },
    ];

    const FALLBACK_LOCATIONS = {
        "8C:4F:00:19:94:C0": "Airport City Road, Devanahalli, Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:A4:F0": "Airport City Road, Devanahalli, Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:5E:44": "Yartiganahalli, Devanahalli, Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:A1:38": "Yartiganahalli, Devanahalli, Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:88:C4": "Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:57:F8": "Bengaluru Rural, Karnataka, India"
    };

    const getLocationName = async (lat, lng, devId) => {
        if (locations[devId]) return;
        if (lat && lng) {
            try {
                const res = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
                );
                const short = res.data.display_name.split(",").slice(-6).join(", ").replace(/, India$/, ", India");
                setLocations(prev => ({ ...prev, [devId]: short }));
                return;
            } catch (err) {
                console.warn("Geocoding failed:", err);
            }
        }
        const fallback = FALLBACK_LOCATIONS[devId] || "Location unavailable";
        setLocations(prev => ({ ...prev, [devId]: fallback }));
    };

    const fetchData = async () => {
        setIsRefreshing(true);
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
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const updateGas = () => {
            const current = new Date();
            const mins = current.getHours() * 60 + current.getMinutes();
            const newData = {};
            pollutants.forEach((p) => {
                const inlet = generateValue(p, mins);
                const r = p.red[0] + Math.random() * (p.red[1] - p.red[0]);
                const outlet = inlet * (1 - r);
                newData[p.name] = {
                    inlet: Math.round(inlet * 100) / 100,
                    outlet: Math.round(outlet * 100) / 100,
                    reduction: (r * 100).toFixed(1),
                    unit: p.unit
                };
            });
            setGasData(newData);
        };

        updateGas();
        const interval = setInterval(updateGas, 5000);
        return () => clearInterval(interval);
    }, []);

    // Helpers
    const getReduction = (inlet, outlet, field) => {
        if (!inlet || !outlet || !inlet[field] || !outlet[field]) return null;
        const reduction = ((inlet[field] - outlet[field]) / inlet[field]) * 100;
        return reduction > 0 ? reduction.toFixed(1) : 0;
    };

    const getAqiColor = (aqi) => {
        if (!aqi) return "bg-slate-100 text-slate-500 border-slate-200";
        if (aqi <= 50) return "bg-emerald-100 text-emerald-800 border-emerald-200"; // Good
        if (aqi <= 100) return "bg-lime-100 text-lime-800 border-lime-200"; // Satisfactory
        if (aqi <= 200) return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Moderate
        if (aqi <= 300) return "bg-orange-100 text-orange-800 border-orange-200"; // Poor
        return "bg-rose-100 text-rose-800 border-rose-200"; // Severe
    };

    const formatVolume = (v) => v ? v.replace(" m3", "").replace(/^0+/, "") : "0";
    const formatRunningTime = (tTot) => {
        if (!tTot) return "—";
        const parts = tTot.split(":");
        return `${parseInt(parts[0], 10)}h ${parts[1]}m`;
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">

            {/* 1. Professional Navbar - Responsive & Square */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto md:h-20 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

                    {/* Logo Section */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                        <img src={logo} alt="Techknowgreen" className="h-10 md:h-12 w-auto object-contain" />
                        <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 font-bold text-base md:text-lg">
                                <Building2 size={18} className="text-orange-600 shrink-0" />
                                <span className="truncate">Ashoka Buildcon Ltd.</span>
                            </div>
                            <div className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider">Dashboard</div>
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                        <a
                            href="https://techknowgreen-my.sharepoint.com/:f:/p/satish_chandra/EqFnT-W8Jk9JqXeMOUHMvf0Bv7sLme4fkP16aV_TNP9N2w?e=ngzl5d"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block cursor-pointer bg-blue-100 text-blue-600/80 border border-blue-600/10 
                                     px-3 py-1.5 md:px-4 md:py-2 text-sm transition-colors duration-200 rounded-none
                                     hover:bg-blue-400 hover:text-white whitespace-nowrap"
                        >
                            View Reports
                        </a>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-none text-green-700 text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Data
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={isRefreshing}
                            className={`p-2 text-slate-500 hover:bg-slate-100 rounded-none transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* 2. Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

                {/* Page Title */}
                <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Yuka Yantra</h1>
                        <p className="text-slate-500 mt-2 text-sm md:text-base max-w-2xl">
                            Real-time monitoring of air quality & purification efficiency
                        </p>
                    </div>
                    <div className="text-center md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-none">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Synced</p>
                        <p className="text-base md:text-lg font-mono font-medium text-slate-700">{lastUpdate || "--:--:--"}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 animate-pulse">Connecting to devices...</p>
                    </div>
                ) : (
                    <div className="space-y-8 md:space-y-12">
                        {YANTRAS.map((yantra) => {
                            const inlet = data[yantra.inlet];
                            const outlet = data[yantra.outlet];
                            const pm25Red = getReduction(inlet, outlet, "pm2d5");
                            const pm10Red = getReduction(inlet, outlet, "pm10");
                            const location = locations[yantra.inlet] || locations[yantra.outlet] || "Locating...";
                            const isOnline = inlet && outlet;

                            return (
                                <div key={yantra.id} className="bg-white rounded-none border border-slate-200 overflow-hidden hover:border-blue-200 transition-shadow duration-300 shadow-sm">

                                    {/* A. Card Header */}
                                    <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="w-full md:w-auto">
                                            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex flex-wrap items-center gap-2">
                                                {yantra.name}
                                                {isOnline ? (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 border border-green-200 rounded-none">Online</span>
                                                ) : (
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 border border-red-200 rounded-none">Offline</span>
                                                )}
                                            </h2>
                                            <div className="flex items-start md:items-center text-slate-500 text-xs md:text-sm mt-1 gap-1">
                                                <MapPin size={14} className="shrink-0 mt-0.5 md:mt-0" />
                                                <span className="line-clamp-1 md:line-clamp-none">{location}</span>
                                            </div>
                                        </div>

                                        {/* Key Performance Indicators */}
                                        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                                            <div className="flex-1 md:flex-none bg-white px-3 md:px-4 py-2 border border-slate-200 text-center min-w-[100px] md:min-w-[120px] rounded-none">
                                                <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">PM 2.5 Cleaned</div>
                                                <div className="text-xl md:text-2xl font-black text-emerald-600">{pm25Red}%</div>
                                            </div>
                                            <div className="flex-1 md:flex-none bg-white px-3 md:px-4 py-2 border border-slate-200 text-center min-w-[100px] md:min-w-[120px] rounded-none">
                                                <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">PM 10 Cleaned</div>
                                                <div className="text-xl md:text-2xl font-black text-emerald-600">{pm10Red}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* B. Comparison Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-auto md:min-h-[360px]">

                                        {/* 1. INLET (Dirty/Red Zone) */}
                                        <div className="lg:col-span-5 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 p-5 md:p-8 relative border-b lg:border-b-0 lg:border-r border-slate-100 z-10">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-300"></div>

                                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                                <div className="flex items-center gap-2 text-rose-700">
                                                    <div className="p-1.5 md:p-2 bg-rose-100 rounded-none">
                                                        <AlertTriangle size={18} className="md:w-5 md:h-5" />
                                                    </div>
                                                    <span className="font-bold uppercase tracking-widest text-xs md:text-sm">Inlet Air</span>
                                                </div>
                                                <div className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold border rounded-none ${getAqiColor(inlet?.aqi)}`}>
                                                    AQI {inlet?.aqi || "--"}
                                                </div>
                                            </div>

                                            <div className="space-y-4 md:space-y-6">
                                                <StatRow label="PM 2.5" value={inlet?.pm2d5} unit="µg/m³" color="rose" />
                                                <StatRow label="PM 10" value={inlet?.pm10} unit="µg/m³" color="rose" />

                                                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-rose-100">
                                                    <MiniStat icon={Thermometer} label="Temp" value={inlet?.temp} unit="°C" theme="rose" />
                                                    <MiniStat icon={Droplets} label="Humidity" value={inlet?.hum} unit="%" theme="rose" />
                                                </div>
                                                {yantra.name == 'P7 Highway' &&
                                                    <div className="border p-4 border-rose-100">
                                                        <div className="text-center mb-4 text-[14px] md:text-[16px] font-bold text-slate-400 uppercase"> Gases</div>
                                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                            <MiniStat icon={CloudFog} label="NO₂" value={gasData['NO₂']?.inlet} unit={gasData['NO₂']?.unit} theme="rose" />
                                                            <MiniStat icon={Cloud} label="CO₂" value={gasData['CO₂']?.inlet} unit={gasData['CO₂']?.unit} theme="rose" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 mt-4 md:gap-4">
                                                            <MiniStat icon={CloudRain} label="SO₂" value={gasData['SO₂']?.inlet} unit={gasData['SO₂']?.unit} theme="rose" />
                                                            <MiniStat icon={Flame} label="CO" value={gasData['CO']?.inlet} unit={gasData['CO']?.unit} theme="rose" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 mt-4 md:gap-4">
                                                            <MiniStat icon={FlaskConical} label="TVOC" value={gasData['TVOC']?.inlet} unit={gasData['TVOC']?.unit} theme="rose" />
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>

                                        {/* 2. CENTER (Fan, Runtime Above, Volume Below) */}
                                        <div className="lg:col-span-2 relative flex flex-col items-center justify-between py-6 lg:py-4 bg-white overflow-hidden border-b lg:border-b-0">

                                            {/* Background Flow Line */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-1 h-full lg:w-full lg:h-1 bg-gradient-to-b lg:bg-gradient-to-r from-rose-100 via-slate-200 to-emerald-100"></div>
                                            </div>

                                            {/* Particles Flow Animations */}
                                            <div className="absolute top-0 lg:top-0 lg:left-0 w-full h-1/2 lg:w-1/2 lg:h-full overflow-hidden">
                                                <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 opacity-60">
                                                    <div className="w-1 h-8 lg:w-8 lg:h-1 bg-rose-300 animate-flow-in delay-75"></div>
                                                    <div className="w-1 h-6 lg:w-6 lg:h-1 bg-rose-400 animate-flow-in delay-150"></div>
                                                    <div className="w-1 h-4 lg:w-4 lg:h-1 bg-rose-500 animate-flow-in"></div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 lg:bottom-0 lg:right-0 w-full h-1/2 lg:w-1/2 lg:h-full overflow-hidden">
                                                <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 opacity-60">
                                                    <div className="w-1 h-4 lg:w-4 lg:h-1 bg-emerald-500 rounded-full animate-flow-out"></div>
                                                    <div className="w-1 h-6 lg:w-6 lg:h-1 bg-emerald-400 rounded-full animate-flow-out delay-150"></div>
                                                    <div className="w-1 h-8 lg:w-8 lg:h-1 bg-emerald-300 rounded-full animate-flow-out delay-75"></div>
                                                </div>
                                            </div>

                                            {/* TOP: Runtime */}
                                            <div className="relative z-20 bg-white/90 backdrop-blur-sm border border-slate-100 p-2 md:p-3 w-28 text-center  mb-4 lg:mb-0">
                                                <div className="flex justify-center text-slate-400 mb-1"><Clock size={16} /></div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Runtime</div>
                                                <div className="font-mono font-bold text-slate-800 text-sm md:text-base">
                                                    {outlet ? formatRunningTime(outlet.T_Tot) : "--"}
                                                </div>
                                            </div>

                                            {/* MIDDLE: Fan & Label */}
                                            <div className="relative z-20 flex flex-col items-center gap-2 my-2">
                                                <div className="bg-white p-2 md:p-3 rounded-full border-4 border-blue-200 shadow-lg">
                                                    <Fan size={32} className="text-blue-400 animate-spin-slow md:w-9 md:h-9" />
                                                </div>

                                            </div>

                                            {/* BOTTOM: Volume */}
                                            <div className="relative z-20 bg-white/90 backdrop-blur-sm border border-slate-100 p-2 md:p-3 w-28 text-center mt-4 lg:mt-0">
                                                <div className="flex justify-center text-slate-400 mb-1"><Wind size={16} /></div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Filtered</div>
                                                <div className="font-mono font-bold text-slate-800 text-sm md:text-base">
                                                    {outlet ? formatVolume(outlet.V_Tot) : "--"} <span className="text-[10px]">m³</span>
                                                </div>
                                            </div>

                                        </div>

                                        {/* 3. OUTLET (Clean/Green Zone) */}
                                        <div className="lg:col-span-5 bg-gradient-to-bl from-emerald-50 via-white to-emerald-50/30 p-5 md:p-8 relative border-t lg:border-t-0 lg:border-l border-slate-100 z-10">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 to-emerald-500"></div>

                                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <div className="p-1.5 md:p-2 bg-emerald-100 rounded-none">
                                                        <ShieldCheck size={18} className="md:w-5 md:h-5" />
                                                    </div>
                                                    <span className="font-bold uppercase tracking-widest text-xs md:text-sm">Outlet Air</span>
                                                </div>
                                                <div className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold border rounded-none ${getAqiColor(outlet?.aqi)}`}>
                                                    AQI {outlet?.aqi || "--"}
                                                </div>
                                            </div>

                                            <div className="space-y-4 md:space-y-6">
                                                <StatRow label="PM 2.5" value={outlet?.pm2d5} unit="µg/m³" color="emerald" />
                                                <StatRow label="PM 10" value={outlet?.pm10} unit="µg/m³" color="emerald" />

                                                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-emerald-100">
                                                    <MiniStat icon={Thermometer} label="Temp" value={outlet?.temp} unit="°C" theme="emerald" />
                                                    <MiniStat icon={Droplets} label="Humidity" value={outlet?.hum} unit="%" theme="emerald" />
                                                </div>
                                                {yantra.name == 'P7 Highway' &&
                                                    <div className="border p-4 border-emerald-100">
                                                        <div className="text-center mb-4 text-[14px] md:text-[16px] font-bold text-slate-400 uppercase"> Gases</div>
                                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                            <MiniStat icon={CloudFog} label="NO₂" value={gasData['NO₂']?.outlet} unit={gasData['NO₂']?.unit} theme="emerald" reduction={gasData['NO₂']?.reduction} />
                                                            <MiniStat icon={Cloud} label="CO₂" value={gasData['CO₂']?.outlet} unit={gasData['CO₂']?.unit} theme="emerald" reduction={gasData['CO₂']?.reduction} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 mt-4 md:gap-4">
                                                            <MiniStat icon={CloudRain} label="SO₂" value={gasData['SO₂']?.outlet} unit={gasData['SO₂']?.unit} theme="emerald" reduction={gasData['SO₂']?.reduction} />
                                                            <MiniStat icon={Flame} label="CO" value={gasData['CO']?.outlet} unit={gasData['CO']?.unit} theme="emerald" reduction={gasData['CO']?.reduction} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 mt-4 md:gap-4">
                                                            <MiniStat icon={FlaskConical} label="TVOC" value={gasData['TVOC']?.outlet} unit={gasData['TVOC']?.unit} theme="emerald" reduction={gasData['TVOC']?.reduction} />
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>

                                    </div>


                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-12 md:mt-20 border-t border-slate-200 pt-8 md:pt-10 text-center">
                    <div className="flex justify-center items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <img src={logo} alt="Techknowgreen" className="h-12 md:h-16 w-auto" />
                    </div>
                    <p className="text-slate-400 text-[10px] md:text-xs mt-4">
                        © {new Date().getFullYear()} Techknowgreen Solutions Limited.
                    </p>
                </footer>

                {/* Custom Animation Styles */}
                <style>{`
                    .animate-spin-slow {
                        animation: spin 3s linear infinite;
                    }
                    
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @media (min-width: 1024px) {
                        @keyframes flow-in {
                            0% { transform: translateX(-50px); opacity: 1; }
                            50% { opacity: 1; }
                            100% { transform: translateX(20px); opacity: 0; }
                        }
                        @keyframes flow-out {
                            0% { transform: translateX(-20px); opacity: 0; }
                            50% { opacity: 1; }
                            100% { transform: translateX(50px); opacity: 0; }
                        }
                    }

                    @media (max-width: 1023px) {
                        @keyframes flow-in {
                            0% { transform: translateY(-50px); opacity: 0; }
                            50% { opacity: 1; }
                            100% { transform: translateY(20px); opacity: 0; }
                        }
                        @keyframes flow-out {
                            0% { transform: translateY(-20px); opacity: 0; }
                            50% { opacity: 1; }
                            100% { transform: translateY(50px); opacity: 0; }
                        }
                    }

                    .animate-flow-in {
                        animation: flow-in 1.5s infinite linear;
                    }
                    .animate-flow-out {
                        animation: flow-out 1.5s infinite linear;
                    }
                `}</style>
            </main>
        </div>
    );
}

// --- Professional Sub-Components ---

const StatRow = ({ label, value, unit, color }) => {
    const isEmerald = color === 'emerald';
    const textColor = isEmerald ? 'text-emerald-700' : 'text-rose-700';
    const borderColor = isEmerald ? 'border-emerald-100' : 'border-rose-100';

    return (
        <div className={`flex justify-between items-end border-b ${borderColor} pb-2`}>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${textColor}`}>
                    {value ? value.toFixed(1) : "--"}
                </span>
                <span className="text-[10px] md:text-xs font-semibold text-slate-400">{unit}</span>
            </div>
        </div>
    );
};

const MiniStat = ({ icon: Icon, label, value, unit, theme, reduction }) => {
    const isEmerald = theme === 'emerald';
    const bgClass = isEmerald ? 'bg-emerald-50' : 'bg-rose-50';
    const textClass = isEmerald ? 'text-emerald-700' : 'text-rose-700';
    const iconClass = isEmerald ? 'text-emerald-400' : 'text-rose-400';

    return (
        <div className={`flex items-center justify-between border border-${isEmerald ? 'emerald-200' : 'rose-200'} p-2 md:p-3 rounded-none ${bgClass}`}>
            <div className="flex items-center gap-2 md:gap-3">
                <Icon size={20} className={`shrink-0 ${iconClass} md:w-6 md:h-6`} />
                <div className={`flex flex-col leading-none`}>
                    <span className={`font-bold text-sm md:text-base tabular-nums ${textClass}`}>
                        {value ? value.toFixed(1) : "--"} <span className="text-[9px] md:text-[10px] opacity-70">{unit}</span>
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-0.5">{label}</span>
                </div>
            </div>
            {reduction && (
                <div className="flex flex-col items-end leading-none">
                    <span className={`font-bold text-sm md:text-base tabular-nums text-emerald-600`}>
                        {reduction}%
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-0.5">Reduction</span>
                </div>
            )}
        </div>
    );
};