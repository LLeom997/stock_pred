"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

import { Progress } from "@/components/ui/progress"
import { RiskStats } from "@/components/RiskStats"
import { MonteCarloChart } from "@/components/MonteCarloChart"
import { SimResult, StockData } from "@/lib/types"
import { RefreshCw, BarChart3, ShieldAlert, History, Layers } from "lucide-react"
import { BacktestPanel } from "@/components/BacktestPanel"
import { StockPicker } from "@/components/StockPicker"
import { StockDeck } from "@/components/StockDeck"

// API Base
const API_BASE =
  "https://gtmyjimhspaycvhzjxby.supabase.co/functions/v1/fyersHistory"


export default function Dashboard() {
  const [symbol, setSymbol] = useState("NSE:PERSISTENT-EQ")


  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<SimResult | null>(null)
  const [history, setHistory] = useState<StockData[]>([])
  const [error, setError] = useState<string | null>(null)

  // Live Price
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [prevPrice, setPrevPrice] = useState<number | null>(null)
  const [wsStatus, setWsStatus] =
    useState<"connecting" | "connected" | "error">("connecting")

  const workerRef = useRef<Worker | null>(null)

  // 1. Fetch Live Price
  useEffect(() => {
    let interval: NodeJS.Timeout

    const fetchLive = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]

        const res = await fetch(
          `${API_BASE}?symbol=${symbol}&resolution=D&range_from=${today}&range_to=${today}`
        )

        const json = await res.json()

        if (json.candles && json.candles.length > 0) {
          const latest = json.candles[json.candles.length - 1]
          const price = latest[4]

          setLivePrice((prev) => {
            setPrevPrice(prev)
            return price
          })

          setWsStatus("connected")
        }
      } catch {
        setWsStatus("error")
      }
    }

    fetchLive()
    interval = setInterval(fetchLive, 5000)

    return () => clearInterval(interval)
  }, [symbol])

  // 2. Run Simulation
  const runSimulation = useCallback(async () => {
    setLoading(true)
    setProgress(10)
    setError(null)

    try {
      const toDate = new Date().toISOString().split("T")[0]
      const fromDateObj = new Date()
      fromDateObj.setFullYear(fromDateObj.getFullYear() - 6)
      const fromDate = fromDateObj.toISOString().split("T")[0]

      const res = await fetch(
        `${API_BASE}?symbol=${symbol}&resolution=D&range_from=${fromDate}&range_to=${toDate}`
      )

      if (!res.ok) throw new Error("Failed to fetch market data")

      const json = await res.json()
      setProgress(30)

      let candles: StockData[] = []
      if (Array.isArray(json.candles)) {
        candles = json.candles.map((c: any) => ({
          t: c[0],
          o: c[1],
          h: c[2],
          l: c[3],
          c: c[4],
          v: c[5],
        }))
      } else {
        throw new Error("Invalid data format")
      }

      if (candles.length > 0) {
        setLivePrice(candles[candles.length - 1].c)
        setHistory(candles)
      }

      setProgress(50)

      if (!workerRef.current) {
        workerRef.current = new Worker("/worker.js")

        workerRef.current.onmessage = (e) => {
          const { type, result, error } = e.data

          if (type === "SUCCESS") {
            setData(result)
            setLoading(false)
            setProgress(100)
          }

          if (type === "ERROR") {
            setError(error)
            setLoading(false)
          }
        }
      }

      workerRef.current.postMessage({
        type: "START_SIMULATION",
        payload: {
          history: candles,
          horizon: 252,
          iterations: 10000,
        },
      })
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    runSimulation()
  }, [runSimulation])

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b px-4 py-3 space-y-3">

        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-sm">
            <StockPicker
              currentSymbol={symbol}
              onSelect={setSymbol}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={runSimulation}
            disabled={loading}
            className={loading ? "animate-spin" : ""}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        {/* PRICE BAR */}
        <div className="flex justify-between items-center">

          <div>
            <p className="text-xs text-muted-foreground">
              Live Price
            </p>

            <div className="flex items-center gap-2">
              <span
                className={`text-3xl font-bold font-mono ${livePrice && prevPrice && livePrice > prevPrice
                  ? "text-green-500"
                  : livePrice && prevPrice && livePrice < prevPrice
                    ? "text-red-500"
                    : ""
                  }`}
              >
                {livePrice ? livePrice.toFixed(2) : "---"}
              </span>

              <span className="flex h-2 w-2">
                <span
                  className={`animate-ping absolute h-2 w-2 rounded-full ${wsStatus === "connected"
                    ? "bg-green-400"
                    : "bg-amber-400"
                    }`}
                />
                <span
                  className={`relative h-2 w-2 rounded-full ${wsStatus === "connected"
                    ? "bg-green-500"
                    : "bg-amber-500"
                    }`}
                />
              </span>
            </div>
          </div>

          <span className="text-xs bg-muted px-3 py-1 rounded-full">
            GARCH model
          </span>
        </div>
      </header>


      {/* MAIN */}
      <main className="flex-1 p-4 space-y-6 w-full">
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Simulation running...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}

        {error && (
          <Card className="border-red-500 bg-red-500/10">
            <CardContent className="p-4 text-red-500 text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="forecast" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Forecast
            </TabsTrigger>

            <TabsTrigger value="stats" className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Risk
            </TabsTrigger>

            <TabsTrigger value="backtest" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Backtest
            </TabsTrigger>

            <TabsTrigger value="deck" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Deck
            </TabsTrigger>
          </TabsList>
          <TabsContent value="forecast">
            {data && (
              <div className="text-center py-8 bg-muted rounded-xl shadow-sm">
                <p className="text-xs uppercase">
                  Target 1 Yr
                </p>

                <div className="text-5xl font-bold">
                  {data.metrics.medianPrice.toFixed(2)}
                </div>

                {livePrice && (
                  <div className="mt-2 text-xs bg-muted px-3 py-1 rounded-full inline-block">
                    Potential{" "}
                    <span
                      className={
                        data.metrics.medianPrice >
                          livePrice
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {(
                        ((data.metrics.medianPrice -
                          livePrice) /
                          livePrice) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                )}
              </div>
            )}

            <MonteCarloChart data={data} />

            <Card>
              <CardContent className="p-4 text-sm">
                10,000 paths simulated
                <br />
                Bull{" "}
                {data?.metrics.bullTarget.toFixed(2)} | Bear{" "}
                {data?.metrics.bearTarget.toFixed(2)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <RiskStats data={data} />
          </TabsContent>

          <TabsContent value="backtest">
            <BacktestPanel history={history} />
          </TabsContent>

          <TabsContent value="deck">
            <StockDeck />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
