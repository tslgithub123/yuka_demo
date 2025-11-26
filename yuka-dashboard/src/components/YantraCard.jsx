// src/components/YantraCard.jsx
import React from "react";
import {
    MapPin, AlertTriangle, ShieldCheck, Fan, Wind, Clock, Droplets, Thermometer, CloudFog, Cloud, CloudRain, Flame, FlaskConical
} from "lucide-react";

const getAqiColor = (aqi) => {
    if (!aqi) return "bg-slate-100 text-slate-500 border-slate-200";
    if (aqi <= 50) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (aqi <= 100) return "bg-lime-100 text-lime-800 border-lime-200";
    if (aqi <= 200) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (aqi <= 300) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
};

const StatRow = ({ label, value, unit, color }) => (
    <div className={`flex justify-between items-end border-b ${color === 'emerald' ? 'border-emerald-100' : 'border-rose-100'} pb-2`}>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-5xl font-bold ${color === 'emerald' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {value ? value.toFixed(1) : "--"}
            </span>
            <span className="text-xl font-semibold text-slate-400">{unit}</span>
        </div>
    </div>
);

const MiniStat = ({ icon: Icon, label, value, unit, theme, reduction }) => {
    const isEmerald = theme === 'emerald';
    return (
        <div className={`flex items-center justify-between border p-3 rounded-none ${isEmerald ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex items-center gap-3">
                <Icon size={20} className={isEmerald ? 'text-emerald-400' : 'text-rose-400'} />
                <div>
                    <span className={`font-bold text-base ${isEmerald ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {value ? value.toFixed(1) : "--"} <span className="text-xs opacity-70">{unit}</span>
                    </span>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">{label}</p>
                </div>
            </div>
            {reduction && <span className="font-bold text-emerald-600">{reduction}%</span>}
        </div>
    );
};

const formatRunningTime = (t) => t ? `${parseInt(t.split(":")[0])}h ${t.split(":")[1]}m` : "--";
const formatVolume = (v) => v ? v.replace(" m3", "").replace(/^0+/, "") : "0";

export default function YantraCard({ site }) {
    const { name, location, inlet, outlet, isOnline, lastUpdate } = site;
    const pm25Red = inlet && outlet ? (((inlet.pm2d5 - outlet.pm2d5) / inlet.pm2d5) * 100).toFixed(1) : "0";
    const pm10Red = inlet && outlet ? (((inlet.pm10 - outlet.pm10) / inlet.pm10) * 100).toFixed(1) : "0";

    return (
        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm hover:border-blue-200 transition-shadow">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {name}
                        <span className={`text-xs px-2 py-0.5 border rounded-none ${isOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </h2>
                    <div className="flex items-center text-slate-500 text-sm mt-1 gap-1">
                        <MapPin size={14} />
                        <span>{location}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 border border-slate-200 text-center min-w-[120px]">
                        <div className="text-xs font-bold text-slate-400 uppercase">PM 2.5 Cleaned</div>
                        <div className="text-2xl font-bold text-emerald-600">{pm25Red}%</div>
                    </div>
                    <div className="bg-white px-4 py-2 border border-slate-200 text-center min-w-[120px]">
                        <div className="text-xs font-bold text-slate-400 uppercase">PM 10 Cleaned</div>
                        <div className="text-2xl font-bold text-emerald-600">{pm10Red}%</div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
                {/* Inlet */}
                <div className="lg:col-span-5 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 p-8 border-r border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-2 text-rose-700">
                            <AlertTriangle size={18} />
                            <span className="font-bold uppercase text-sm">Inlet Air</span>
                        </div>
                        <div className={`px-3 py-1 text-xs font-bold border rounded-none ${getAqiColor(inlet?.aqi)}`}>
                            AQI {inlet?.aqi || "--"}
                        </div>
                    </div>
                    <StatRow label="PM 2.5" value={inlet?.pm2d5} unit="µg/m³" color="rose" />
                    <StatRow label="PM 10" value={inlet?.pm10} unit="µg/m³" color="rose" />
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-rose-100">
                        <MiniStat icon={Thermometer} label="Temp" value={inlet?.temp} unit="°C" theme="rose" />
                        <MiniStat icon={Droplets} label="Humidity" value={inlet?.hum} unit="%" theme="rose" />
                    </div>
                </div>

                {/* Center */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center py-8 bg-white">
                    <div className="bg-blue-50 border border-blue-200 p-3 text-center mb-6">
                        <Clock size={16} className="mx-auto text-slate-400 mb-1" />
                        <div className="text-xs font-bold text-slate-400 uppercase">Runtime</div>
                        <div className="font-mono font-bold text-slate-800">
                            {formatRunningTime(outlet?.T_Tot)}
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-full border-4 border-blue-200 shadow-lg mb-6">
                        <Fan size={36} className="text-blue-400 animate-spin-slow" />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 text-center">
                        <Wind size={16} className="mx-auto text-slate-400 mb-1" />
                        <div className="text-xs font-bold text-slate-400 uppercase">Filtered</div>
                        <div className="font-mono font-bold text-slate-800">
                            {formatVolume(outlet?.V_Tot)} <span className="text-xs">m³</span>
                        </div>
                    </div>
                </div>

                {/* Outlet */}
                <div className="lg:col-span-5 bg-gradient-to-bl from-emerald-50 via-white to-emerald-50/30 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <ShieldCheck size={18} />
                            <span className="font-bold uppercase text-sm">Outlet Air</span>
                        </div>
                        <div className={`px-3 py-1 text-xs font-bold border rounded-none ${getAqiColor(outlet?.aqi)}`}>
                            AQI {outlet?.aqi || "--"}
                        </div>
                    </div>
                    <StatRow label="PM 2.5" value={outlet?.pm2d5} unit="µg/m³" color="emerald" />
                    <StatRow label="PM 10" value={outlet?.pm10} unit="µg/m³" color="emerald" />
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-emerald-100">
                        <MiniStat icon={Thermometer} label="Temp" value={outlet?.temp} unit="°C" theme="emerald" />
                        <MiniStat icon={Droplets} label="Humidity" value={outlet?.hum} unit="%" theme="emerald" />
                    </div>
                </div>
            </div>
        </div>
    );
}