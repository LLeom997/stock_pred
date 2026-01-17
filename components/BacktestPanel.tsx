"use client"

import { useState, useRef, useEffect } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import { StockData, SimResult } from "@/lib/types"
import { BacktestChart } from "./BacktestChart"

interface BacktestPanelProps {
    history: StockData[]
}

interface BacktestItem {
    targetYear: number
    loading: boolean
    result: SimResult | null
    actualPrices: number[]
    error: string | null
    stats: {
        predicted: number
        actual: number
        diffPercent: number
        hit: boolean
    } | null
}

export function BacktestPanel({ history }: BacktestPanelProps) {


    const [view, setView] = useState<"price" | "percent">("price")
    const [scenarios, setScenarios] = useState<BacktestItem[]>([
        { targetYear: 2025, loading: false, result: null, actualPrices: [], error: null, stats: null },
        { targetYear: 2024, loading: false, result: null, actualPrices: [], error: null, stats: null },
        { targetYear: 2023, loading: false, result: null, actualPrices: [], error: null, stats: null }
    ])

    const hasAutoRun = useRef(false)

    const normalizeTime = (t: number) =>
        t > 10000000000 ? t : t * 1000

    /* ---------------- AUTO RUN ---------------- */

    useEffect(() => {
        if (!history.length) return
        if (hasAutoRun.current) return

        hasAutoRun.current = true

        runScenario(0)
        runScenario(1)
        runScenario(2)

    }, [history])

    /* ---------------- RUN ---------------- */

    const runScenario = async (index: number) => {
        const year = scenarios[index].targetYear

        setScenarios(prev => {
            const next = [...prev]
            next[index].loading = true
            next[index].error = null
            return next
        })

        try {
            const cutoffTs = new Date(`${year}-01-01`).getTime()
            const startTs = new Date(`${year - 4}-01-01`).getTime()
            const endTs = new Date(`${year}-12-31`).getTime()

            const simHistory = history
                .filter(d => {
                    const t = normalizeTime(d.t)
                    return t < cutoffTs && t >= startTs
                })
                .sort((a, b) => a.t - b.t)

            if (simHistory.length < 200) {
                throw new Error("Not enough history")
            }

            const actuals = history
                .filter(d => {
                    const t = normalizeTime(d.t)
                    return t >= cutoffTs && t <= endTs
                })
                .sort((a, b) => a.t - b.t)

            const result = await new Promise<SimResult>((resolve, reject) => {
                const worker = new Worker("/worker.js")

                worker.onmessage = e => {
                    const { type, result, error } = e.data
                    if (type === "SUCCESS") resolve(result)
                    else reject(new Error(error))
                    worker.terminate()
                }

                worker.postMessage({
                    type: "START_SIMULATION",
                    payload: {
                        history: simHistory,
                        horizon: 252,
                        iterations: 5000
                    }
                })
            })

            const lastForecast = result.metrics.medianPrice
            const lastActual =
                actuals.length > 0
                    ? actuals[actuals.length - 1].c
                    : 0

            const diff =
                lastActual === 0
                    ? 0
                    : Math.abs(
                        ((lastForecast - lastActual) /
                            lastActual) *
                        100
                    )

            const hit = lastActual > lastForecast * 1.02

            setScenarios(prev => {
                const next = [...prev]
                next[index] = {
                    ...next[index],
                    loading: false,
                    result,
                    actualPrices: actuals.map(d => d.c),
                    stats: {
                        predicted: lastForecast,
                        actual: lastActual,
                        diffPercent: diff,
                        hit
                    }
                }
                return next
            })

        } catch (e: any) {
            setScenarios(prev => {
                const next = [...prev]
                next[index].loading = false
                next[index].error = e.message
                return next
            })
        }
    }

    return (
        <div className="space-y-6">

            <div className="flex justify-end space-x-2 bg-muted/30 p-1 rounded-lg w-fit ml-auto">
                <Button
                    variant={view === "price" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("price")}
                    className="h-7 text-xs"
                >
                    Price
                </Button>
                <Button
                    variant={view === "percent" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("percent")}
                    className="h-7 text-xs"
                >
                    % Return
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {scenarios.map((item, idx) => (
                    <Card key={item.targetYear} className="flex flex-col">

                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="font-mono">
                                    {item.targetYear}
                                </CardTitle>

                                {item.stats && (
                                    <Badge
                                        className={
                                            item.stats.hit
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-red-500/20 text-red-500"
                                        }
                                    >
                                        {item.stats.hit ? "HIT" : "MISS"}
                                    </Badge>
                                )}
                            </div>

                            <CardDescription>
                                Forecast from Jan 1 {item.targetYear}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-4">

                            {item.loading && (
                                <div className="h-40 flex flex-col items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-xs">Simulating</p>
                                </div>
                            )}

                            {item.error && (
                                <div className="h-40 flex flex-col items-center justify-center text-red-500">
                                    <AlertTriangle className="h-8 w-8" />
                                    <p className="text-xs text-center">
                                        {item.error}
                                    </p>
                                </div>
                            )}

                            {item.result && item.stats && (
                                <>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Predicted
                                            </p>
                                            <p className="font-bold">
                                                {item.stats.predicted.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">
                                                Actual
                                            </p>
                                            <p
                                                className={
                                                    item.stats.hit
                                                        ? "font-bold text-green-500"
                                                        : "font-bold text-red-500"
                                                }
                                            >
                                                {item.stats.actual.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="col-span-2 border-t pt-2">
                                            <p className="text-xs text-muted-foreground">
                                                Error
                                            </p>
                                            <p className="font-mono">
                                                {item.stats.diffPercent.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>

                                    <BacktestChart
                                        data={item.result}
                                        actualPrices={item.actualPrices}
                                        mode={view}
                                    />
                                </>
                            )}

                        </CardContent>
                    </Card>
                ))}

            </div>

            {/* MANUAL RE RUN (OPTIONAL) */}
            <div className="flex justify-center">
                <Button
                    size="lg"
                    onClick={() => {
                        hasAutoRun.current = false
                        runScenario(0)
                        runScenario(1)
                        runScenario(2)
                    }}
                    disabled={scenarios.some(s => s.loading)}
                >
                    Re Run All
                </Button>
            </div>

        </div>
    )
}
