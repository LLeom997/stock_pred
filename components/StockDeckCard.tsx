
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { SimResult, StockData } from "@/lib/types"
import { fetchStockHistory } from "@/lib/api"

interface StockDeckCardProps {
    symbol: string
    onRemove: (symbol: string) => void
}

export function StockDeckCard({ symbol, onRemove }: StockDeckCardProps) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<{
        actualReturn: number
        predictedReturn: number
        diff: number
        hit: boolean
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        analyze()
    }, [symbol])

    const analyze = async () => {
        setLoading(true)
        setError(null)
        try {
            // 1. Fetch Data
            const history = await fetchStockHistory(symbol)
            if (history.length < 500) throw new Error("Not enough data")

            // 2. Setup Backtest (Last 1 Year)
            // We want to forecast from 1 year ago and see if it hit today's price.
            // Start Date: Today - 1 Year.
            const today = new Date()
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(today.getFullYear() - 1)

            const cutoffTs = oneYearAgo.getTime()

            // Simulation Input: Data UP TO 1 year ago
            const simHistory = history.filter(d => d.t <= cutoffTs)
            // Actual Outcome: Data FROM 1 year ago to NOW
            const actualHistory = history.filter(d => d.t > cutoffTs)

            if (simHistory.length < 252) throw new Error("Not enough history for sim")
            if (actualHistory.length === 0) throw new Error("No recent data")

            // 3. Run Worker
            const result = await new Promise<SimResult>((resolve, reject) => {
                const worker = new Worker("/worker.js")
                worker.onmessage = e => {
                    if (e.data.type === "SUCCESS") resolve(e.data.result)
                    else reject(new Error(e.data.error))
                    worker.terminate()
                }
                worker.postMessage({
                    type: "START_SIMULATION",
                    payload: {
                        history: simHistory,
                        horizon: 252, // 1 Year
                        iterations: 2000 // Lower iterations for speed
                    }
                })
            })

            // 4. Calculate Stats
            const startPrice = simHistory[simHistory.length - 1].c
            const endPrice = actualHistory[actualHistory.length - 1].c
            const predictedPrice = result.metrics.medianPrice

            const actualRet = ((endPrice - startPrice) / startPrice) * 100
            const predictedRet = ((predictedPrice - startPrice) / startPrice) * 100

            // Did actual price fall within 90% confidence?
            // Or simple simple hit if > pred
            // Let's use Error %
            const diff = Math.abs(predictedRet - actualRet)

            // Hit if direction matched? Or if close?
            // Let's say Hit if Actual is within predicted 50% band range? 
            // result.metrics.bearTarget (p5) and bullTarget (p95)
            // Let's simpler: Directional Accuracy
            const directionMatch = (actualRet > 0 && predictedRet > 0) || (actualRet < 0 && predictedRet < 0)

            setStats({
                actualReturn: actualRet,
                predictedReturn: predictedRet,
                diff,
                hit: directionMatch
            })

        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="w-full relative">
                <CardContent className="h-32 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (error || !stats) {
        return (
            <Card className="w-full relative border-red-500/20">
                <button
                    onClick={() => onRemove(symbol)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                >
                    &times;
                </button>
                <CardHeader className="p-4 py-3">
                    <CardTitle className="text-sm font-mono">{symbol}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 py-2 text-xs text-red-500">
                    {error || "Failed"}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full relative overflow-hidden group">
            <button
                onClick={() => onRemove(symbol)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
            >
                &times;
            </button>
            <CardHeader className="p-4 py-3 pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-mono">{symbol}</CardTitle>
                    <Badge variant={stats.hit ? "default" : "destructive"} className="text-[10px] h-5">
                        {stats.hit ? "HIT" : "MISS"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">

                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div>
                        <p className="text-xs text-muted-foreground">Actual 1Y</p>
                        <p className={`font-bold flex items-center gap-1 ${stats.actualReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.actualReturn >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {stats.actualReturn.toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Predicted</p>
                        <p className={`font-bold ${stats.predictedReturn >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                            {stats.predictedReturn.toFixed(1)}%
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                    <span>Diff</span>
                    <span>{stats.diff.toFixed(1)}%</span>
                </div>

            </CardContent>
        </Card>
    )
}
