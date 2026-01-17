"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
<<<<<<< HEAD
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RiskStats } from "@/components/RiskStats"
import { MonteCarloChart } from "@/components/MonteCarloChart"
import { SimResult } from "@/lib/types"
import { RefreshCw, BarChart3, ShieldAlert } from "lucide-react"
=======

import { Progress } from "@/components/ui/progress"
import { RiskStats } from "@/components/RiskStats"
import { MonteCarloChart } from "@/components/MonteCarloChart"
import { SimResult, StockData } from "@/lib/types"
import { RefreshCw, BarChart3, ShieldAlert, History, Layers } from "lucide-react"
import { BacktestPanel } from "@/components/BacktestPanel"
import { StockPicker } from "@/components/StockPicker"
import { StockDeck } from "@/components/StockDeck"
>>>>>>> 35515f0 (Initial local commit)

// API Base
const API_BASE =
  "https://gtmyjimhspaycvhzjxby.supabase.co/functions/v1/fyersHistory"

<<<<<<< HEAD
// 🔥 Symbol normalizer
const normalizeSymbol = (raw: string) => {
  let s = raw.trim().toUpperCase()

  // Remove exchange if user typed it
  s = s.replace(/^NSE:/, "").replace(/^BSE:/, "")

  // Remove suffix if user typed it
  s = s.replace(/-EQ$/, "")

  // Final API format
  return `NSE:${s}-EQ`
}

export default function Dashboard() {
  const [symbol, setSymbol] = useState("NSE:PERSISTENT-EQ")
  const [inputVal, setInputVal] = useState("PERSISTENT")
=======


export default function Dashboard() {
  const [symbol, setSymbol] = useState("NSE:PERSISTENT-EQ")

>>>>>>> 35515f0 (Initial local commit)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<SimResult | null>(null)
<<<<<<< HEAD
=======
  const [history, setHistory] = useState<StockData[]>([])
>>>>>>> 35515f0 (Initial local commit)
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
<<<<<<< HEAD
      fromDateObj.setFullYear(fromDateObj.getFullYear() - 3)
=======
      fromDateObj.setFullYear(fromDateObj.getFullYear() - 6)
>>>>>>> 35515f0 (Initial local commit)
      const fromDate = fromDateObj.toISOString().split("T")[0]

      const res = await fetch(
        `${API_BASE}?symbol=${symbol}&resolution=D&range_from=${fromDate}&range_to=${toDate}`
      )

      if (!res.ok) throw new Error("Failed to fetch market data")

      const json = await res.json()
      setProgress(30)

<<<<<<< HEAD
      let candles = []
=======
      let candles: StockData[] = []
>>>>>>> 35515f0 (Initial local commit)
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
<<<<<<< HEAD
=======
        setHistory(candles)
>>>>>>> 35515f0 (Initial local commit)
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
<<<<<<< HEAD
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <form
            className="flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              // 1. Clean the user input (UI State)
              let clean = inputVal.trim().toUpperCase();
              clean = clean.replace("NSE:", "").replace("-EQ", "");

              // 2. Construct API symbol (Logic State)
              const apiSymbol = `NSE:${clean}-EQ`;

              setSymbol(apiSymbol);
              setInputVal(clean); // Enforce clean display
            }}
          >
            <Input
              className="h-9 font-mono uppercase bg-muted/50 border-0 focus-visible:ring-1"
              value={inputVal}
              onChange={(e) =>
                setInputVal(e.target.value.toUpperCase())
              }
              placeholder="SYMBOL"
            />

            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="h-9"
            >
              Load
            </Button>
          </form>
=======
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b px-4 py-3 space-y-3">

        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-sm">
            <StockPicker
              currentSymbol={symbol}
              onSelect={setSymbol}
            />
          </div>
>>>>>>> 35515f0 (Initial local commit)

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

<<<<<<< HEAD
        {/* LIVE PRICE */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">
=======
        {/* PRICE BAR */}
        <div className="flex justify-between items-center">

          <div>
            <p className="text-xs text-muted-foreground">
>>>>>>> 35515f0 (Initial local commit)
              Live Price
            </p>

            <div className="flex items-center gap-2">
              <span
<<<<<<< HEAD
                className={`text-2xl font-bold font-mono ${livePrice &&
                  prevPrice &&
                  livePrice > prevPrice
                  ? "text-green-500"
                  : livePrice &&
                    prevPrice &&
                    livePrice < prevPrice
=======
                className={`text-3xl font-bold font-mono ${livePrice && prevPrice && livePrice > prevPrice
                  ? "text-green-500"
                  : livePrice && prevPrice && livePrice < prevPrice
>>>>>>> 35515f0 (Initial local commit)
                    ? "text-red-500"
                    : ""
                  }`}
              >
                {livePrice ? livePrice.toFixed(2) : "---"}
              </span>

<<<<<<< HEAD
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${wsStatus === "connected"
=======
              <span className="flex h-2 w-2">
                <span
                  className={`animate-ping absolute h-2 w-2 rounded-full ${wsStatus === "connected"
>>>>>>> 35515f0 (Initial local commit)
                    ? "bg-green-400"
                    : "bg-amber-400"
                    }`}
                />
                <span
<<<<<<< HEAD
                  className={`relative inline-flex rounded-full h-2 w-2 ${wsStatus === "connected"
=======
                  className={`relative h-2 w-2 rounded-full ${wsStatus === "connected"
>>>>>>> 35515f0 (Initial local commit)
                    ? "bg-green-500"
                    : "bg-amber-500"
                    }`}
                />
              </span>
            </div>
          </div>

<<<<<<< HEAD
          <span className="text-[10px] bg-muted px-2 py-1 rounded">
            GARCH(1,1)
=======
          <span className="text-xs bg-muted px-3 py-1 rounded-full">
            GARCH model
>>>>>>> 35515f0 (Initial local commit)
          </span>
        </div>
      </header>

<<<<<<< HEAD
      {/* MAIN */}
      <main className="flex-1 p-4 space-y-4">
=======

      {/* MAIN */}
      <main className="flex-1 p-4 space-y-6 w-full">
>>>>>>> 35515f0 (Initial local commit)
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

<<<<<<< HEAD
        <Tabs defaultValue="forecast">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="forecast">
              <BarChart3 className="w-4 h-4 mr-2" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="stats">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Risk Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast">
            {data && (
              <div className="text-center py-6">
=======
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
>>>>>>> 35515f0 (Initial local commit)
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
<<<<<<< HEAD
=======

          <TabsContent value="backtest">
            <BacktestPanel history={history} />
          </TabsContent>

          <TabsContent value="deck">
            <StockDeck />
          </TabsContent>
>>>>>>> 35515f0 (Initial local commit)
        </Tabs>
      </main>
    </div>
  )
}
