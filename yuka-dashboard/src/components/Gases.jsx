import { useState, useEffect } from "react";
import {
    AlertTriangle,
    ShieldCheck,
    Fan,
} from "lucide-react";
const pollutants = [
    { name: "NO₂", unit: "PPB", min: 7.6, max: 35, dayMin: 18, dayMax: 32, red: [0.66, 0.86] },
    { name: "SO₂", unit: "PPB", min: 3.6, max: 38, dayMin: 12, dayMax: 49, red: [0.65, 0.89] },
    { name: "TVOC", unit: "ppm", min: 0.15, max: 0.89, dayMin: 0.20, dayMax: 0.89, red: [0.56, 0.89] },
    { name: "CO₂", unit: "ppm", min: 417, max: 562, dayMin: 450, dayMax: 560, red: [0.05, 0.10] },
    { name: "CO", unit: "PPB", min: 154, max: 601, dayMin: 265, dayMax: 601, red: [0.20, 0.35] },
];
const timeToMinutes = (t) => t.split(":").reduce((h, m) => h * 60 + +m, 0);
const formatTime = (d) => {
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).replace(",", "");
};
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
export default function Gases() {
    const [data, setData] = useState({});
    const [now, setNow] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const update = () => {
        setIsRefreshing(true);
        const current = new Date();
        setNow(current);
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
            };
        });
        setData(newData);
        setTimeout(() => setIsRefreshing(false), 600);
    };
    useEffect(() => {
        update();
        const interval = setInterval(update, 8000); // every 8 seconds
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Single Unified Card */}
                <div className="bg-white border border-slate-200 overflow-hidden hover:border-blue-200 transition-all duration-300 shadow-sm">
                    {/* Card Header */}
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-5">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                P7 Highway Gas Parameters
                            </h3>
                        </div>
                    </div>
                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        {/* Inlet */}
                        <div className="lg:col-span-5 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 p-8 border-r border-slate-100">
                            <div className="flex items-center gap-3 mb-8 text-rose-700">
                                <div className="p-2 bg-rose-100"><AlertTriangle size={22} /></div>
                                <span className="font-bold uppercase tracking-widest text-lg">Inlet Air</span>
                            </div>
                            <div className="space-y-5">
                                {pollutants.map((p) => (
                                    <GasRow
                                        key={p.name}
                                        label={p.name}
                                        value={data[p.name]?.inlet}
                                        unit={p.unit}
                                        color="rose"
                                    />
                                ))}
                                
                            </div>
                        </div>
                        
                        {/* MIDDLE: Flow + Fan – PERFECTLY CENTERED */}
                        <div className="lg:col-span-2 relative flex items-center justify-center py-8 lg:py-0 bg-white overflow-hidden">
                            {/* Horizontal Flow Line */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-1 bg-gradient-to-r from-rose-100 via-slate-200 to-emerald-100"></div>
                            </div>
                            {/* Particles – Left side (inlet) */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-full flex items-center justify-end pr-8 gap-6 opacity-60 pointer-events-none">
                                <div className="w-8 h-1 bg-rose-300 animate-flow-in delay-75"></div>
                                <div className="w-6 h-1 bg-rose-400 animate-flow-in delay-150"></div>
                                <div className="w-4 h-1 bg-rose-500 animate-flow-in"></div>
                            </div>
                            {/* Particles – Right side (outlet) */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full flex items-center justify-start pl-8 gap-6 opacity-60 pointer-events-none">
                                <div className="w-4 h-1 bg-emerald-500 rounded-full animate-flow-out"></div>
                                <div className="w-6 h-1 bg-emerald-400 rounded-full animate-flow-out delay-150"></div>
                                <div className="w-8 h-1 bg-emerald-300 rounded-full animate-flow-out delay-75"></div>
                            </div>
                            {/* Fan – exactly on the line */}
                            <div className="relative z-20">
                                <div className="bg-white p-4 rounded-full border-4 border-blue-200 shadow-xl">
                                    <Fan size={40} className="text-blue-500 animate-spin-slow" />
                                </div>
                            </div>
                        </div>
                        {/* Outlet */}
                        <div className="lg:col-span-5 bg-gradient-to-bl from-emerald-50 via-white to-emerald-50/30 p-8 border-l border-slate-100">
                            <div className="flex items-center gap-3 mb-8 text-emerald-700">
                                <div className="p-2 bg-emerald-100"><ShieldCheck size={22} /></div>
                                <span className="font-bold uppercase tracking-widest text-lg">Outlet Air</span>
                            </div>
                            <div className="space-y-5">
                                {pollutants.map((p) => (
                                    <GasRow
                                        key={p.name}
                                        label={p.name}
                                        value={data[p.name]?.outlet}
                                        unit={p.unit}
                                        color="emerald"
                                        reduction={data[p.name]?.reduction}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>{JSON.stringify(pollutants)}
                </div>
                <p className="text-center text-xs text-slate-400 mt-10">
                    Live simulated data • Updates every ~8 seconds with natural diurnal patterns & random peaks
                </p>
            </main>
            {/* Animations */}
            <style>{`
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes flow-in {
                    0% { transform: translateX(-80px); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(20px); opacity: 0; }
                }
                @keyframes flow-out {
                    0% { transform: translateX(-20px); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(80px); opacity: 0; }
                }
                .animate-flow-in { animation: flow-in 2s infinite linear; }
                .animate-flow-out { animation: flow-out 2s infinite linear; }
                /* Mobile fallback – vertical flow */}
                @media (max-width: 1023px) {
                    @keyframes flow-in {
                        0% { transform: translateY(-80px); opacity: 0; }
                        100% { transform: translateY(30px); opacity: 0; }
                    }
                    @keyframes flow-out {
                        0% { transform: translateY(-30px); opacity: 0; }
                        100% { transform: translateY(80px); opacity: 0; }
                    }
                }
            `}</style>
        </div>
    );
}
// Reusable Row Component
const GasRow = ({ label, value, unit, color, reduction }) => {
    const isEmerald = color === "emerald";
    const textColor = isEmerald ? "text-emerald-700" : "text-rose-700";
    return (
        <div className="flex justify-between items-end">
            <div>
                <div className="text-lg font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                {isEmerald && reduction && (
                    <div className="text-xs font-bold text-emerald-600 mt-1">{reduction}% reduced</div>
                )}
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tabular-nums ${textColor}`}>
                    {value !== undefined ? value.toFixed(2) : "--"}
                </span>
                <span className="text-lg font-semibold text-slate-400">{unit}</span>
            </div>
        </div>
    );
};
