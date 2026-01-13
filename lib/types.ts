export interface SimResult {
    garchParams: {
        omega: number;
        alpha: number;
        beta: number;
        longRunVariance: number;
    };
    currentVol: number;
    forecast: {
        step: number;
        p5: number;
        p25: number;
        p50: number;
        p75: number;
        p95: number;
        mean: number
    }[];
    metrics: {
        lastPrice: number;
        bullTarget: number;
        bearTarget: number;
        medianPrice: number;
        riskReward: number;
        annualizedVol: number;
        atr: {
            value: number;
            upper: number;
            lower: number;
        };
    };
}

export interface StockData {
    t: number;
    c: number;
    o: number;
    h: number;
    l: number;
    v: number;
}
