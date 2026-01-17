import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SimResult } from "@/lib/types"
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Percent,
    Target,
    Zap
} from "lucide-react"

interface RiskStatsProps {
    data: SimResult | null
}

export function RiskStats({ data }: RiskStatsProps) {
    if (!data)
        return (
            <div className="p-4 text-center text-muted-foreground">
                No data available
            </div>
        )

    const m = data.metrics
    const p = data.garchParams

    const fmt = (n: number) => n.toFixed(2)
    const pct = (n: number) => (n * 100).toFixed(2) + "%"

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
            <KPI
                title="Expected Price"
                value={fmt(m.medianPrice)}
                sub="P50 Forecast"
                icon={<Target className="h-4 w-4" />}
                intent="neutral"
                meaning="This is the most likely price after 1 year based on simulation. 50 percent of outcomes end above and below this level."
                howToUse="Use this as your base target. If current price is far below this, it may indicate upside."
                goodRange="Higher than current price"
            />

            <KPI
                title="Annual Volatility"
                value={pct(m.annualizedVol)}
                sub={`GARCH α ${p.alpha.toFixed(3)}`}
                icon={<Activity className="h-4 w-4" />}
                intent="warn"
                meaning="Shows how much the price is expected to fluctuate in a year. Higher means more risk and faster moves."
                howToUse="High volatility is good for traders, risky for investors."
                goodRange="15% to 30%"
            />

            <KPI
                title="Bull Target"
                value={fmt(m.bullTarget)}
                sub="95th Percentile"
                icon={<TrendingUp className="h-4 w-4" />}
                intent="good"
                meaning="Only 5 percent of simulations exceed this price. This is your optimistic scenario."
                howToUse="Use as stretch target or partial profit booking zone."
                goodRange="Above expected price"
            />

            <KPI
                title="Bear Target"
                value={fmt(m.bearTarget)}
                sub="5th Percentile"
                icon={<TrendingDown className="h-4 w-4" />}
                intent="bad"
                meaning="Worst case zone where only 5 percent outcomes fall below."
                howToUse="Use as risk stop or disaster scenario planning."
                goodRange="Not too far below CMP"
            />

            <KPI
                title="Risk Reward"
                value={fmt(m.riskReward)}
                sub="Upside vs Downside"
                icon={<Percent className="h-4 w-4" />}
                intent={m.riskReward > 1.5 ? "good" : m.riskReward > 1 ? "neutral" : "bad"}
                meaning="Compares potential upside to downside risk."
                howToUse="Only take trades with ratio above 1.5."
                goodRange="> 1.5"
            />

            <KPI
                title="ATR Limit"
                value={fmt(m.atr.value)}
                sub={`2x Band ±${(m.atr.value * 2).toFixed(2)}`}
                icon={<Zap className="h-4 w-4" />}
                intent="warn"
                meaning="Average daily movement of the stock."
                howToUse="Set stop loss and targets using ATR multiples."
                goodRange="Depends on timeframe"
            />

        </div>
    )
}

/* ---------- KPI CARD ---------- */

function KPI({
    title,
    value,
    icon,
    sub,
    intent,
    meaning,
    howToUse,
    goodRange
}: {
    title: string
    value: string
    icon: React.ReactNode
    sub: string
    intent: "good" | "bad" | "warn" | "neutral"
    meaning: string
    howToUse: string
    goodRange: string
}) {
    const color =
        intent === "good"
            ? "text-green-500"
            : intent === "bad"
                ? "text-red-500"
                : intent === "warn"
                    ? "text-amber-500"
                    : "text-muted-foreground"

    return (
        <Card className="relative border-muted/50 bg-background/70 backdrop-blur">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                        {title}
                    </CardTitle>
                    <span className={color}>{icon}</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-2">
                {/* MAIN VALUE */}
                <div className={`text-2xl font-bold ${color}`}>
                    {value}
                </div>

                {/* SUB */}
                <p className="text-[11px] text-muted-foreground">
                    {sub}
                </p>

                {/* MEANING */}
                <div className="text-[11px] leading-relaxed">
                    <span className="font-semibold">What it means </span>
                    {meaning}
                </div>

                {/* HOW TO USE */}
                <div className="text-[11px] leading-relaxed">
                    <span className="font-semibold">How to use </span>
                    {howToUse}
                </div>

                {/* GOOD RANGE */}
                <div className="text-[10px] text-muted-foreground border-t pt-1">
                    Ideal range → {goodRange}
                </div>
            </CardContent>
        </Card>
    )
}
