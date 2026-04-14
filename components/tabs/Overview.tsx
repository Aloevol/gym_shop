"use client"
import { useEffect, useState } from "react";
import RevenueChart from "../chart/RevenueChart";
import { getDashboardStats } from "@/server/functions/dashboard.fun";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Activity } from "lucide-react";

interface ICratedata {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    monthlyRevenue: { [key: string]: number };
}

export default function OverviewTab() {
    const [stats, setStats] = useState<ICratedata>();
    const [loading, setLoading] = useState(true);

    async function fetchData () {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 animate-pulse rounded-[2rem] h-32"></div>
                    ))}
                </div>
                <div className="bg-white/5 border border-white/10 animate-pulse rounded-[3rem] h-96"></div>
            </div>
        );
    }

    const cards = [
        { title: "TOTAL ATHLETES", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
        { title: "ELITE GEAR", value: stats?.totalProducts || 0, icon: Package, color: "text-primary" },
        { title: "DEPLOYMENTS", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-green-500" },
        { title: "SETTLEMENTS", value: `৳ ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    ];

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end px-4">
                <div>
                    <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">PERFORMANCE <span className="text-primary">OVERVIEW</span></h1>
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Real-time operational analytics</p>
                </div>
                <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full">
                    <Activity size={16} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE FEED ACTIVE</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:border-primary/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black rounded-2xl border border-white/5 group-hover:border-primary/20 transition-all">
                                <card.icon size={20} className="text-primary" />
                            </div>
                            <TrendingUp size={16} className="text-white/10" />
                        </div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{card.title}</p>
                        <h2 className="text-2xl font-black text-white tracking-tighter">{card.value}</h2>
                    </div>
                ))}
            </div>

            {/* Main Chart */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-1.5 h-8 bg-primary rounded-full" />
                    <h3 className="text-sm font-custom font-bold text-white uppercase tracking-widest">REVENUE TRAJECTORY</h3>
                </div>
                <div className="h-[400px] w-full">
                    <RevenueChart data={stats?.monthlyRevenue || {}} />
                </div>
            </div>
        </div>
    );
}
