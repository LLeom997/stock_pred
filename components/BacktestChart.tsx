"use client"
import React from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Line,
    Legend
} from "recharts"
import { SimResult } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartProps {
    data: SimResult
    actualPrices: number[]
    forecastP50?: number[]
    mode?: "price" | "percent"
}

export function BacktestChart({
    data,
    actualPrices,
    forecastP50,
    mode = "price"
}: ChartProps) {

    if (!data)
        return (
            <div className="h-[300px] flex items-center justify-center">
                Loading Chart...
            </div>
        )

    const isPercent = mode === "percent"

    /* ---------- BUILD SERIES ---------- */

    const chartData = data.forecast.map((d, i) => {
        return {
            step: i + 1,
            p5: d.p5,
            p25: d.p25,
            p50: d.p50,
            p75: d.p75,
            p95: d.p95,
            actual: actualPrices[i]
        }
    })


    const startPrice = data.metrics.lastPrice

    /* ---------- FORMATTERS ---------- */

    const yFormatter = (v: number) =>
        isPercent
            ? `${v.toFixed(1)}%`
            : `₹${v.toFixed(0)}`

    const tooltipFormatter = (
        val: any,
        name: string
    ) => {
        if (typeof val !== "number") return val

        const labelMap: any = {
            p50: "Median Forecast",
            actual: "Actual",
            p95: "Bull (95%)",
            p5: "Bear (5%)"
        }

        const label =
            labelMap[name] || name

        return [
            isPercent
                ? `${val.toFixed(2)}%`
                : `₹${val.toFixed(2)}`,
            label
        ]
    }

    /* ---------- TRANSFORM IF % MODE ---------- */

    const normalize = (v: number) => {
        if (!isPercent) return v
        return ((v - startPrice) / startPrice) * 100
    }

    const finalData = chartData.map(d => ({
        step: d.step,
        p5: normalize(d.p5),
        p25: normalize(d.p25),
        p50: normalize(d.p50),
        p75: normalize(d.p75),
        p95: normalize(d.p95),
        actual:
            d.actual !== undefined
                ? normalize(d.actual)
                : undefined
    }))

    /* ---------- REF LINE ---------- */

    const refValue =
        isPercent ? 0 : startPrice

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Forecast vs Actual ({isPercent ? "% Return" : "Price"})
                </CardTitle>
            </CardHeader>

            <CardContent className="px-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={finalData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >

                            <defs>
                                <linearGradient id="band90" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>

                                <linearGradient id="band50" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

                            <XAxis dataKey="step" hide />

                            <YAxis
                                fontSize={10}
                                tickFormatter={yFormatter}
                                domain={["auto", "auto"]}
                            />

                            <Tooltip
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "rgba(0,0,0,0.85)",
                                    color: "white"
                                }}
                                itemStyle={{ color: "white" }}
                                formatter={tooltipFormatter}
                                labelFormatter={l => `Day ${l}`}
                            />

                            <Legend verticalAlign="top" height={32} />

                            {/* Base Line */}
                            <ReferenceLine
                                y={refValue}
                                stroke="gray"
                                strokeDasharray="3 3"
                                label={isPercent ? "0%" : "Start"}
                            />

                            {/* 90% Band */}
                            <Area
                                name="90% Range"
                                type="monotone"
                                dataKey="p95"
                                stroke="none"
                                fill="url(#band90)"
                                baseValue={(d: any) => d.p5}
                            />

                            {/* 50% Band */}
                            <Area
                                name="50% Range"
                                type="monotone"
                                dataKey="p75"
                                stroke="none"
                                fill="url(#band50)"
                                baseValue={(d: any) => d.p25}
                            />

                            {/* Median */}
                            <Line
                                name="Median Forecast"
                                type="monotone"
                                dataKey="p50"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={false}
                            />

                            {/* Actual */}
                            <Line
                                name="Actual"
                                type="monotone"
                                dataKey="actual"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
