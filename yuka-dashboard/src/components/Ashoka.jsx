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
  Fan // Imported Fan Icon
} from "lucide-react";
import axios from "axios";
import logo from "../assets/logo.png"; // Ensure this path is correct

export default function Ashoka() {
    const [data, setData] = useState({});
    const [lastUpdate, setLastUpdate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [locations, setLocations] = useState({});
    
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
    ];

    const FALLBACK_LOCATIONS = {
        "8C:4F:00:19:94:C0": "Airport City Road, Devanahalli, Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:A4:F0": "Airport City Road, Devanahalli, Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:5E:44": "Yartiganahalli, Devanahalli, Bengaluru Rural, Karnataka, India",
        "8C:4F:00:19:A1:38": "Yartiganahalli, Devanahalli, Bengaluru Rural, Karnataka, India",
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
            
            {/* 1. Professional Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="Techknowgreen" className="h-12 w-auto object-contain" />
                        <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                        <div>
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                                <Building2 size={18} className="text-orange-600"/>
                                Ashoka Buildcon Ltd.
                            </div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dashboard</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
  href="https://techknowgreen-my.sharepoint.com/:f:/p/satish_chandra/EqFnT-W8Jk9JqXeMOUHMvf0Bv7sLme4fkP16aV_TNP9N2w?e=ngzl5d"
   target="_blank"
  className="inline-block cursor-pointer bg-blue-100 text-blue-600/80 border border-blue-600/10 
             px-4 py-2 transition-colors duration-200
             hover:bg-blue-400 hover:text-white"
>
  View Reports
</a>

                         <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-bold uppercase tracking-wide">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Data
                        </div>
                        <button 
                            onClick={fetchData} 
                            disabled={isRefreshing}
                            className={`p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={20}/>
                        </button>
                    </div>
                </div>
            </nav>

            {/* 2. Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                
                {/* Page Title */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yuka Yantra</h1>
                        <p className="text-slate-500 mt-2 max-w-2xl">
                            Real-time monitoring of air quality & purification efficiency
                        </p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Synced</p>
                         <p className="text-lg font-mono font-medium text-slate-700">{lastUpdate || "--:--:--"}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 animate-pulse">Connecting to devices...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {YANTRAS.map((yantra) => {
                            const inlet = data[yantra.inlet];
                            const outlet = data[yantra.outlet];
                            const pm25Red = getReduction(inlet, outlet, "pm2d5");
                            const pm10Red = getReduction(inlet, outlet, "pm10");
                            const location = locations[yantra.inlet] || locations[yantra.outlet] || "Locating...";
                            const isOnline = inlet && outlet;

                            return (
                                <div key={yantra.id} className="bg-white   border border-slate-200 overflow-hidden hover:border-blue-200 transition-shadow duration-300">
                                    
                                    {/* A. Card Header */}
                                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                                {yantra.name}
                                                {isOnline ? (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 border border-green-200">Online</span>
                                                ) : (
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 border border-red-200">Offline</span>
                                                )}
                                            </h2>
                                            <div className="flex items-center text-slate-500 text-sm mt-1 gap-1">
                                                <MapPin size={14} /> {location}
                                            </div>
                                        </div>
                                        
                                        {/* Key Performance Indicators (Efficiency) */}
                                        <div className="flex gap-3 w-full md:w-auto">
                                            <div className="flex-1 md:flex-none bg-white px-4 py-2 border border-slate-200 text-center min-w-[120px]">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PM 2.5 Cleaned</div>
                                                <div className="text-2xl font-black text-emerald-600">{pm25Red}%</div>
                                            </div>
                                            <div className="flex-1 md:flex-none bg-white px-4 py-2 border border-slate-200 text-center min-w-[120px]">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PM 10 Cleaned</div>
                                                <div className="text-2xl font-black text-emerald-600">{pm10Red}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* B. Comparison Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[320px]">
                                        
                                        {/* 1. INLET (Dirty/Red Zone) */}
                                        <div className="lg:col-span-5 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 p-6 md:p-8 relative border-b lg:border-b-0 lg:border-r border-slate-100 z-10">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-300"></div>
                                            
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-2 text-rose-700">
                                                    <div className="p-2 bg-rose-100 ">
                                                        <AlertTriangle size={20} />
                                                    </div>
                                                    <span className="font-bold uppercase tracking-widest text-sm">Inlet Air</span>
                                                </div>
                                                <div className={`px-3 py-1 text-xs font-bold border ${getAqiColor(inlet?.aqi)}`}>
                                                    AQI {inlet?.aqi || "--"}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <StatRow label="PM 2.5" value={inlet?.pm2d5} unit="µg/m³" color="rose" />
                                                <StatRow label="PM 10" value={inlet?.pm10} unit="µg/m³" color="rose" />
                                                
                                                {/* Secondary Env Stats */}
                                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-rose-100">
                                                    <MiniStat icon={Thermometer} label="Temp" value={inlet?.temp} unit="°C" theme="rose" />
                                                    <MiniStat icon={Droplets} label="Humidity" value={inlet?.hum} unit="%" theme="rose" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. CENTER (New Fan & Filtering Animation) */}
                                        <div className="lg:col-span-2 relative flex flex-col items-center justify-center py-8 bg-white overflow-hidden">
                                            
                                            {/* Background Flow Line */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-1 h-full lg:w-full lg:h-1 bg-gradient-to-b lg:bg-gradient-to-r from-rose-100 via-slate-200 to-emerald-100"></div>
                                            </div>

                                            {/* Dirty Air Particles (Moving towards fan) */}
                                            <div className="absolute top-0 lg:top-auto lg:left-0 w-full h-1/2 lg:w-1/2 lg:h-full overflow-hidden">
                                                <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 opacity-60">
                                                    <div className="w-1 h-8 lg:w-8 lg:h-1 bg-rose-300  animate-flow-in delay-75"></div>
                                                    <div className="w-1 h-6 lg:w-6 lg:h-1 bg-rose-400  animate-flow-in delay-150"></div>
                                                    <div className="w-1 h-4 lg:w-4 lg:h-1 bg-rose-500  animate-flow-in"></div>
                                                </div>
                                            </div>

                                            {/* The Main Fan */}
                                            <div className="relative z-20 bg-white p-3 rounded-full border-4 border-blue-200 shadow-lg">
                                                <Fan size={36} className="text-blue-400 animate-spin-slow" />
                                                {/* Inner glow to signify power */}
                                                <div className="absolute inset-0 rounded-full "></div>
                                            </div>

                                            {/* Clean Air Particles (Moving away from fan) */}
                                            <div className="absolute bottom-0 lg:bottom-auto lg:right-0 w-full h-1/2 lg:w-1/2 lg:h-full overflow-hidden">
                                                <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 opacity-60">
                                                    <div className="w-1 h-4 lg:w-4 lg:h-1 bg-emerald-500 rounded-full animate-flow-out"></div>
                                                    <div className="w-1 h-6 lg:w-6 lg:h-1 bg-emerald-400 rounded-full animate-flow-out delay-150"></div>
                                                    <div className="w-1 h-8 lg:w-8 lg:h-1 bg-emerald-300 rounded-full animate-flow-out delay-75"></div>
                                                </div>
                                            </div>
                                            
                                            {/* Label */}
                                            <div className="absolute bottom-4 lg:bottom-6 z-20 bg-white px-2 py-1 border border-slate-100">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filtering</span>
                                            </div>

                                        </div>

                                        {/* 3. OUTLET (Clean/Green Zone) */}
                                        <div className="lg:col-span-5 bg-gradient-to-bl from-emerald-50 via-white to-emerald-50/30 p-6 md:p-8 relative border-t lg:border-t-0 lg:border-l border-slate-100 z-10">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 to-emerald-500"></div>
                                            
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <div className="p-2 bg-emerald-100">
                                                        <ShieldCheck size={20} />
                                                    </div>
                                                    <span className="font-bold uppercase tracking-widest text-sm">Outlet Air</span>
                                                </div>
                                                <div className={`px-3 py-1 text-xs font-bold border ${getAqiColor(outlet?.aqi)}`}>
                                                    AQI {outlet?.aqi || "--"}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <StatRow label="PM 2.5" value={outlet?.pm2d5} unit="µg/m³" color="emerald" />
                                                <StatRow label="PM 10" value={outlet?.pm10} unit="µg/m³" color="emerald" />
                                                
                                                {/* Secondary Env Stats */}
                                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-emerald-100">
                                                    <MiniStat icon={Thermometer} label="Temp" value={outlet?.temp} unit="°C" theme="emerald" />
                                                    <MiniStat icon={Droplets} label="Humidity" value={outlet?.hum} unit="%" theme="emerald" />
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    {/* C. Footer Stats */}
                                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap justify-between gap-4 items-center text-sm text-slate-500">
                                        <div className="flex items-center gap-6">
                                            <span className="flex items-center gap-2 bg-white px-3 py-1 border border-slate-200">
                                                <Clock size={18} className="text-slate-400"/> 
                                                <span className="font-mono font-bold text-slate-700">{outlet ? formatRunningTime(outlet.T_Tot) : "--"}</span> 
                                                <span className="text-xs">Runtime</span>
                                            </span>
                                            <span className="flex items-center gap-2 bg-white px-3 py-1 border border-slate-200">
                                                <Wind size={18} className="text-slate-400"/> 
                                                <span className="font-mono font-bold text-slate-700">{outlet ? formatVolume(outlet.V_Tot) : "--"}</span>
                                                <span className="text-xs">m³ Filtered</span>
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 italic">
                                            Live Sensor Data
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-20 border-t border-slate-200 pt-10 text-center">
                    <div className="flex justify-center items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <img src={logo} alt="Techknowgreen" className="h-16" />
                    </div>
                    <p className="text-slate-400 text-xs mt-4">
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

                    /* Desktop Flow (Left to Right) */
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

                    /* Mobile Flow (Top to Bottom) */
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
            <span  className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold tracking-tight tabular-nums ${textColor}`}>
                    {value ? value.toFixed(1) : "--"}
                </span>
                <span className="text-xs font-semibold text-slate-400">{unit}</span>
            </div>
        </div>
    );
};

const MiniStat = ({ icon: Icon, label, value, unit, theme }) => {
    const isEmerald = theme === 'emerald';
    const bgClass = isEmerald ? 'bg-emerald-50' : 'bg-rose-50';
    const textClass = isEmerald ? 'text-emerald-700' : 'text-rose-700';
    const iconClass = isEmerald ? 'text-emerald-400' : 'text-rose-400';

    return (
        <div className={`flex items-center border border-${isEmerald ? 'emerald-200' : 'rose-200'} gap-3 p-3  ${bgClass}`}>
            <Icon size={24} className={iconClass} />
            <div className={`flex flex-col  leading-none`}>
                <span className={`font-bold text-base tabular-nums ${textClass}`}>
                    {value ? value.toFixed(1) : "--"} <span className="text-[10px] opacity-70">{unit}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{label}</span>
            </div>
        </div>
    );
};