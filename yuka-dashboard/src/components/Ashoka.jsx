// src/components/Ashoka.jsx
import React, { useState, useEffect } from "react";
import YantraCard from "./YantraCard";

export default function Ashoka() {
    const [sites, setSites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/sites");
                const json = await res.json();
                setSites(json.sites || []);
                setIsLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                setIsLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900 mb-8">Yuka Yantra — Ashoka Buildcon</h1>

                {isLoading ? (
                    <div className="text-center py-20">Loading live data...</div>
                ) : sites.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">No active sites</div>
                ) : (
                    <div className="space-y-12">
                        {sites.map(site => (
                            <YantraCard key={site.siteId} site={site} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}