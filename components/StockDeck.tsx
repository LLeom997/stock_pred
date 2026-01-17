
"use client"

import { useState, useEffect } from "react"
import { StockPicker } from "@/components/StockPicker"
import { StockDeckCard } from "@/components/StockDeckCard"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

export function StockDeck() {
    // initialize with empty, load from localstorage
    const [deck, setDeck] = useState<string[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("stock_deck")
        if (saved) {
            try {
                setDeck(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse deck", e)
            }
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem("stock_deck", JSON.stringify(deck))
    }, [deck, mounted])

    const addStock = (symbol: string) => {
        if (deck.includes(symbol)) return
        setDeck(prev => [symbol, ...prev])
    }

    const removeStock = (symbol: string) => {
        setDeck(prev => prev.filter(s => s !== symbol))
    }

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-muted/30 p-4 rounded-xl border">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">Comparison Deck</h2>
                    <p className="text-sm text-muted-foreground">
                        Add stocks to compare GARCH predictions vs Actual returns
                    </p>
                </div>

                <div className="w-full md:w-auto">
                    {/* We pass a dummy symbol so the picker doesn't show a 'selected' state 
                        Use a Key to reset it maybe? or just ignore visual state? 
                        The StockPicker is designed to be a controlled component. 
                        We'll overlay a "Add Stock" button or just use it as is.
                        Let's use it as is but with a placeholder prop logic?
                        Actually, let's just render the picker with NO current symbol. 
                    */}
                    <div className="w-full md:w-[300px]">
                        <StockPicker
                            currentSymbol=""
                            onSelect={addStock}
                        />
                    </div>
                </div>
            </div>

            {deck.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl opacity-50">
                    <p className="text-sm">Your deck is empty. Add stocks to start comparing.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {deck.map(symbol => (
                    <StockDeckCard
                        key={symbol}
                        symbol={symbol}
                        onRemove={removeStock}
                    />
                ))}
            </div>

            {deck.length > 0 && (
                <div className="flex justify-center pt-8">
                    <Button variant="outline" size="sm" onClick={() => setDeck([])} className="text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear Deck
                    </Button>
                </div>
            )}
        </div>
    )
}
