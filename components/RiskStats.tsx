import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimResult } from "@/lib/types";
import { TrendingUp, TrendingDown, Activity, Percent, Target, Zap } from "lucide-react";

interface RiskStatsProps {
    data: SimResult | null;
}

export function RiskStats({ data }: RiskStatsProps) {
    if (!data) return <div className="p-4 text-center text-muted-foreground">No data available</div>;

    const m = data.metrics;
    const p = data.garchParams;

    const fmt = (n: number) => n.toFixed(2);
    const pct = (n: number) => (n * 100).toFixed(2) + "%";

    return (
        <div className="grid grid-cols-2 gap-3 p-2">
            <StatsCard
                title="Expected Price"
                value={fmt(m.medianPrice)}
                icon={<Target className="h-4 w-4 text-primary" />}
                desc="50th Percentile"
            />

            <StatsCard
                title="Annual Volatility"
                value={pct(m.annualizedVol)}
                icon={<TrendingUp className="h-4 w-4 text-orange-500" />}
                desc={`GARCH alpha: ${p.alpha.toFixed(3)}`}
            />

            <StatsCard
                title="Bull Target"
                value={fmt(m.bullTarget)}
                icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                desc="95th Percentile"
            />

            <StatsCard
                title="Bear Target"
                value={fmt(m.bearTarget)}
                icon={<TrendingDown className="h-4 w-4 text-red-500" />}
                desc="5th Percentile"
            />

            <StatsCard
                title="Risk/Reward"
                value={fmt(m.riskReward)}
                icon={<Percent className="h-4 w-4 text-blue-500" />}
                desc={`Upside/Downside Ratio`}
            />

            <StatsCard
                title="ATR Limit (14)"
                value={fmt(m.atr.value)}
                icon={<Zap className="h-4 w-4 text-amber-500" />}
                desc={`±${(m.atr.value * 2).toFixed(2)} Bands`}
            />
        </div>
    );
}

function StatsCard({ title, value, icon, desc }: { title: string, value: string, icon: React.ReactNode, desc: string }) {
    return (
        <Card className="bg-card/50 backdrop-blur-sm border-muted/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-sans tracking-tight">{value}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
            </CardContent>
        </Card>
    );
}
