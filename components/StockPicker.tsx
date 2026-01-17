"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Search, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Company {
    id: string
    company_name: string
    symbol: string
    industry: string
}

interface StockPickerProps {
    currentSymbol: string
    onSelect: (symbol: string) => void
}

export function StockPicker({ currentSymbol, onSelect }: StockPickerProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Clean symbol for display (remove NSE: and -EQ)
    const displaySymbol = currentSymbol.replace("NSE:", "").replace("-EQ", "")

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch("https://gtmyjimhspaycvhzjxby.supabase.co/functions/v1/getNseCompanies")
                const json = await res.json()
                if (json.data) {
                    setCompanies(json.data)
                }
            } catch (error) {
                console.error("Failed to fetch companies", error)
            } finally {
                setLoading(false)
            }
        }

        fetchCompanies()
    }, [])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filtered = companies.filter(c =>
        c.company_name.toLowerCase().includes(query.toLowerCase()) ||
        c.symbol.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 100)

    const selectedCompany = companies.find(c => c.symbol === displaySymbol)

    return (
        <div className="relative w-full max-w-sm" ref={dropdownRef}>
            <div
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full p-2 pl-4 pr-3 text-sm border rounded-lg cursor-pointer bg-background hover:bg-muted/50 transition-colors h-12 shadow-sm"
            >
                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                    <span className="font-bold text-base leading-none">
                        {displaySymbol}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate w-full">
                        {selectedCompany?.company_name || selectedCompany?.industry || "Select Stock"}
                    </span>
                </div>
                <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
            </div>

            {/* DROPDOWN */}
            {open && (
                <Card className="absolute top-14 left-0 w-full z-50 flex flex-col shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                    <div className="p-2 border-b bg-muted/30">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                autoFocus
                                placeholder="Search symbol or company..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                        {loading && (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                Loading companies...
                            </div>
                        )}

                        {!loading && filtered.length === 0 && (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No stocks found
                            </div>
                        )}

                        {filtered.map(company => (
                            <div
                                key={company.id}
                                className={`
                                    flex items-center justify-between p-2 rounded-md cursor-pointer text-sm mb-1 group
                                    ${company.symbol === displaySymbol ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                                `}
                                onClick={() => {
                                    onSelect(`NSE:${company.symbol}-EQ`)
                                    setQuery("")
                                    setOpen(false)
                                }}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">
                                        {company.symbol}
                                    </span>
                                    <span className={`text-[10px] ${company.symbol === displaySymbol ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                        {company.company_name}
                                    </span>
                                </div>

                                {company.symbol === displaySymbol && (
                                    <Check className="w-4 h-4 ml-2" />
                                )}

                                {company.industry && company.symbol !== displaySymbol && (
                                    <Badge
                                        variant="outline"
                                        className="ml-auto text-[9px] h-5 px-1.5 font-normal bg-background/50 border-muted-foreground/20 text-muted-foreground"
                                    >
                                        {company.industry.split(" ")[0]}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    )
}
