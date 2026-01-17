
import { StockData } from "./types"

const API_BASE = "https://gtmyjimhspaycvhzjxby.supabase.co/functions/v1/fyersHistory"

export async function fetchStockHistory(symbol: string, years: number = 6): Promise<StockData[]> {
    const toDate = new Date().toISOString().split("T")[0]
    const fromDateObj = new Date()
    fromDateObj.setFullYear(fromDateObj.getFullYear() - years)
    const fromDate = fromDateObj.toISOString().split("T")[0]

    const res = await fetch(
        `${API_BASE}?symbol=${symbol}&resolution=D&range_from=${fromDate}&range_to=${toDate}`
    )

    if (!res.ok) throw new Error("Failed to fetch market data")

    const json = await res.json()

    if (Array.isArray(json.candles)) {
        return json.candles.map((c: any) => ({
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
}
