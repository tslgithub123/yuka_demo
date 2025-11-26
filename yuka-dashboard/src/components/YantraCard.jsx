// src/components/YantraCard.jsx
import React from "react";
import {
    MapPin, RefreshCw, Wind, Clock, Droplets, Thermometer,
    Activity, ShieldCheck, AlertTriangle, Fan, Flame,
    CloudFog, CloudRain, Cloud, FlaskConical
} from "lucide-react";

const getAqiColor = (aqi) => {
    if (!aqi) return "bg-slate-100 text-slate-500 border-slate-200";
    if (aqi <= 50) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (aqi <= 100) return "bg-lime-100 text-lime-800 border-lime-200";
    if (aqi <= 200) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (aqi <= 300) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
};

const formatVolume = (v) => v ? v.replace(" m3", "").replace(/^0+/, "") : "0";
const formatRunningTime = (tTot) => {
    if (!tTot) return "—";
    const parts = tTot.split(":");
    return `${parseInt(parts[0], 10)}h ${parts[1]}m`;
};

const StatRow = ({ label, value, unit, color }) => {
    const isEmerald = color === 'emerald';
    const textColor = isEmerald ? 'text-emerald-700' : 'text-rose-700';
    const borderColor = isEmerald ? 'border-emerald-100' : 'border-rose-100';

    return (
        <div className={`flex justify-between items-end border-b ${borderColor} pb-2`}>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-bold tracking-tight tabular-nums ${textColor}`}>
                    {value ? value.toFixed(1) : "--"}
                </span>
                <span className="text-xl font-semibold text-slate-400">{unit}</span>
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
                <div className="flex flex-col leading-none">
                    <span className={`font-bold text-sm md:text-base tabular-nums ${textClass}`}>
                        {value ? value.toFixed(1) : "--"} <span className="text-[9px] md:text-[10px] opacity-70">{unit}</span>
                    </span>
                    <span className="text-[9px] md:text-[12px] font-bold text-slate-400 uppercase mt-0.5">{label}</span>
                </div>
            </div>
            {reduction && (
                <div className="flex flex-col items-end leading-none">
                    <span className="font-bold text-sm md:text-base tabular-nums text-emerald-600">{reduction}%</span>
                    <span className="text-[9px] md:text-[12px] font-bold text-slate-400 uppercase mt-0.5">Reduction</span>
                </div>
            )}
        </div>
    );
};

export default function YantraCard({ site }) {
    const { name, location, inlet, outlet, isOnline, lastUpdate } = site;

    const pm25Red = inlet && outlet && inlet.pm2d5 ? ((inlet.pm2d5 - outlet.pm2d5) / inlet.pm2d5 * 100).toFixed(1) : "0";
    const pm10Red = inlet && outlet && inlet.pm10 ? ((inlet.pm10 - outlet.pm10) / inlet.pm10 * 100).toFixed(1) : "0";

    return (
        <div className="bg-white rounded-none border border-slate-200 overflow-hidden hover:border-blue-200 transition-shadow duration-300 shadow-sm">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full md:w-auto">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex flex-wrap items-center gap-2">
                        {name}
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

                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <div className="flex-1 md:flex-none bg-white px-3 md:px-4 py-2 border border-slate-200 text-center min-w-[100px] md:min-w-[120px] rounded-none">
                        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">PM 2.5 Cleaned</div>
                        <div className="text-xl md:text-2xl font-black text-emerald-600">{pm25Red}%</div>
                    </div>
                    <div className="flex-1 md:flex-none bg-white px-3 md:px-4 py-2 border border-slate-200 text-center min-w-[100px] md:min-w-[120px] rounded-none">
                        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">PM 10 Cleaned</div>
                        <div className="text-xl md:text-2xl font-black text-emerald-600">{pm10Red}%</div>
                    </div>
                    <div className="flex-1 md:flex-none bg-white px-3 md:px-4 py-2 border border-slate-200 text-center min-w-[100px] md:min-w-[120px] rounded-none">
                        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Last Synced</div>
                        <div className="text-xl md:text-2xl text-gray-600">
                            {lastUpdate ? new Date(lastUpdate).toLocaleTimeString("en-IN") : "--:--"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-auto md:min-h-[360px]">
                {/* INLET */}
                <div className="lg:col-span-5 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 p-5 md:p-8 relative border-b lg:border-b-0 lg:border-r border-slate-100 z-10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-300"></div>
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div className="flex items-center gap-2 text-rose-700">
                            <div className="p-1.5 md:p-2 bg-rose-100 rounded-none">
                                <AlertTriangle size={18} className="md:w-5 md:h- let's fix this line5" />
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
                    </div>
                </div>

                {/* CENTER - Flow Animation */}
                <div className="lg:col-span-2 relative flex flex-col items-center justify-between py-6 lg:py-4 bg-white overflow-hidden border-b lg:border-b-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-full lg:w-full lg:h-1 bg-gradient-to-b lg:bg-gradient-to-r from-rose-100 via-slate-200 to-emerald-100"></div>
                    </div>

                    {/* Particle Flow */}
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

                    {/* Runtime */}
                    <div className="relative z-20 bg-blue-50 backdrop-blur-sm border border-blue-200 p-2 md:p-3 w-28 text-center mb-4 lg:mb-0">
                        <div className="flex justify-center text-slate-400 mb-1"><Clock size={16} /></div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Runtime</div>
                        <div className="font-mono font-bold text-slate-800 text-sm md:text-base">
                            {outlet ? formatRunningTime(outlet.T_Tot) : "--"}
                        </div>
                    </div>

                    {/* Fan */}
                    <div className="relative z-20 flex flex-col items-center gap-2 my-2">
                        <div className="bg-white p-2 md:p-3 rounded-full border-4 border-blue-200 shadow-lg">
                            <Fan size={32} className="text-blue-400 animate-spin-slow md:w-9 md:h-9" />
                        </div>
                    </div>

                    {/* Volume */}
                    <div className="relative z-20 bg-blue-50 backdrop-blur-sm border border-blue-200 p-2 md:p-3 w-28 text-center mt-4 lg:mt-0">
                        <div className="flex justify-center text-slate-400 mb-1"><Wind size={16} /></div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Filtered</div>
                        <div className="font-mono font-bold text-slate-800 text-sm md:text-base">
                            {outlet ? formatVolume(outlet.V_Tot) : "--"} <span className="text-[10px]">m³</span>
                        </div>
                    </div>
                </div>

                {/* OUTLET */}
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
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add this to your global CSS or inside the component
const styles = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-spin-slow { animation: spin 3s linear infinite; }

  @media (min-width: 1024px) {
    @keyframes flow-in { 0% { transform: translateX(-50px); opacity: 1; } 50% { opacity: 1; } 100% { transform: translateX(20px); opacity: 0; } }
    @keyframes flow-out { 0% { transform: translateX(-20px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(50px); opacity: 0; } }
  }
  @media (max-width: 1023px) {
    @keyframes flow-in { 0% { transform: translateY(-50px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }
    @keyframes flow-out { 0% { transform: translateY(-20px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(50px); opacity: 0; } }
  }
  .animate-flow-in { animation: flow-in 1.5s infinite linear; }
  .animate-flow-out { animation: flow-out 1.5s infinite linear; }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);