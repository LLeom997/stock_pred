<<<<<<< HEAD
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SimResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
    data: SimResult | null;
}

export function MonteCarloChart({ data }: ChartProps) {
    if (!data) return <div className="h-[300px] flex items-center justify-center">Loading Chart...</div>;

    // Transform data for Recharts range area
    const chartData = data.forecast.map((d, i) => ({
        step: i,
        range90: [d.p5, d.p95] as [number, number],
        range50: [d.p25, d.p75] as [number, number],
        median: d.p50
    }));

    const lastPrice = data.metrics.lastPrice;

    return (
        <Card className="col-span-1 md:col-span-2 border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle>Forecast Distributions (1 Year)</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="color90" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="color50" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="step" hide />
                            <YAxis domain={['auto', 'auto']} fontSize={10} tickFormatter={(val) => val.toFixed(0)} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}
                                itemStyle={{ color: 'white' }}
                                formatter={(val: any) => typeof val === 'number' ? val.toFixed(2) : val}
                                labelFormatter={(label) => `Day ${label}`}
                            />

                            {/* Reference Line for Start Price */}
                            <ReferenceLine y={lastPrice} stroke="gray" strokeDasharray="3 3" />

                            {/* 90% Confidence Interval */}
                            <Area
                                type="monotone"
                                dataKey="range90"
                                stroke="none"
                                fill="url(#color90)"
                                animationDuration={500}
                            />

                            {/* 50% Confidence Interval */}
                            <Area
                                type="monotone"
                                dataKey="range50"
                                stroke="none"
                                fill="url(#color50)"
                                animationDuration={500}
                            />

                            {/* Median Line */}
                            <Area
                                type="monotone"
                                dataKey="median"
                                stroke="#2563eb"
                                strokeWidth={2}
                                fill="none"
                                animationDuration={500}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
=======
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SimResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
    data: SimResult | null;
}

export function MonteCarloChart({ data }: ChartProps) {
    if (!data) return <div className="h-[300px] flex items-center justify-center">Loading Chart...</div>;

    // Transform data for Recharts range area
    const chartData = data.forecast.map((d, i) => ({
        step: i,
        range90: [d.p5, d.p95] as [number, number],
        range50: [d.p25, d.p75] as [number, number],
        median: d.p50
    }));

    const lastPrice = data.metrics.lastPrice;

    return (
        <Card className="col-span-1 md:col-span-2 border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle>Forecast Distributions (1 Year)</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="color90" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="color50" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="step" hide />
                            <YAxis domain={['auto', 'auto']} fontSize={10} tickFormatter={(val) => val.toFixed(0)} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}
                                itemStyle={{ color: 'white' }}
                                formatter={(val: any) => typeof val === 'number' ? val.toFixed(2) : val}
                                labelFormatter={(label) => `Day ${label}`}
                            />

                            {/* Reference Line for Start Price */}
                            <ReferenceLine y={lastPrice} stroke="gray" strokeDasharray="3 3" />

                            {/* 90% Confidence Interval */}
                            <Area
                                type="monotone"
                                dataKey="range90"
                                stroke="none"
                                fill="url(#color90)"
                                animationDuration={500}
                            />

                            {/* 50% Confidence Interval */}
                            <Area
                                type="monotone"
                                dataKey="range50"
                                stroke="none"
                                fill="url(#color50)"
                                animationDuration={500}
                            />

                            {/* Median Line */}
                            <Area
                                type="monotone"
                                dataKey="median"
                                stroke="#2563eb"
                                strokeWidth={2}
                                fill="none"
                                animationDuration={500}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
>>>>>>> 35515f0 (Initial local commit)
