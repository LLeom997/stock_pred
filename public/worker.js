// Hedge Fund Grade GARCH(1,1) + Monte Carlo Worker
self.onmessage = function (e) {
    const { type, payload } = e.data;

    if (type === 'START_SIMULATION') {
        try {
            const result = runSimulation(payload);
            self.postMessage({ type: 'SUCCESS', result });
        } catch (err) {
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }
};

// --- Math & Simulation Logic ---

function runSimulation({ history, horizon, iterations }) {
    // 1. Prepare Data
    const prices = [];
    const logReturns = [];
    const trs = [];

    // Need O, H, L, C, PrevC for ATR
    // History is array of {t, o, h, l, c, v}

    for (let i = 0; i < history.length; i++) {
        prices.push(history[i].c);
        if (i > 0) {
            logReturns.push(Math.log(history[i].c / history[i - 1].c));

            // ATR Calculation
            // TR = max(H-L, abs(H-PrevC), abs(L-PrevC))
            const h = history[i].h;
            const l = history[i].l;
            const c = history[i].c;
            const pc = history[i - 1].c;

            const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
            trs.push(tr);
        }
    }

    // ATR (EMA 14)
    let atr = 0;
    if (trs.length > 0) {
        const period = 14;
        // Simple MA for first 14? Or just start.
        // Standard EMA: alpha = 2 / (N+1)? ATR usually uses alpha = 1/N (Wilde's Smoothing)
        // Wilder's: EMA_t = (EMA_{t-1} * (n-1) + TR_t) / n

        let sum = 0;
        let count = 0;
        for (let i = 0; i < trs.length; i++) {
            if (i < period) {
                sum += trs[i];
                count++;
                if (i === period - 1) atr = sum / period;
            } else {
                atr = (atr * (period - 1) + trs[i]) / period;
            }
        }
    }

    const lastPrice = prices[prices.length - 1];
    const atrUpper = lastPrice + (2 * atr);
    const atrLower = lastPrice - (2 * atr);

    // 2. Fit GARCH(1,1)
    const garchParams = fitGarch(logReturns);

    // 3. Monte Carlo Setup
    // ... (Same as before)
    const mu = mean(logReturns);
    let currentHistSigma2 = garchParams.longRunVariance;
    for (let r of logReturns) {
        currentHistSigma2 = garchParams.omega + garchParams.alpha * (r * r) + garchParams.beta * currentHistSigma2;
    }
    const startSigma2 = currentHistSigma2;

    const percentileLevels = [5, 25, 50, 75, 95];
    const timeStepsData = [];

    let currentPrices = new Float64Array(iterations).fill(lastPrice);
    let currentSigmas2 = new Float64Array(iterations).fill(startSigma2);
    const currentVol = Math.sqrt(startSigma2) * Math.sqrt(252);

    for (let t = 1; t <= horizon; t++) {
        for (let i = 0; i < iterations; i++) {
            const sigma2 = currentSigmas2[i];
            const sigma = Math.sqrt(sigma2);
            const Z = boxMuller();
            const r = (mu - 0.5 * sigma2) + sigma * Z;
            const newPrice = currentPrices[i] * Math.exp(r);
            currentPrices[i] = newPrice;
            const newSigma2 = garchParams.omega + garchParams.alpha * (r * r) + garchParams.beta * sigma2;
            currentSigmas2[i] = newSigma2;
        }
        const pricesSorted = Float64Array.from(currentPrices).sort();
        timeStepsData.push({
            step: t,
            p5: quantile(pricesSorted, 0.05),
            p25: quantile(pricesSorted, 0.25),
            p50: quantile(pricesSorted, 0.50),
            p75: quantile(pricesSorted, 0.75),
            p95: quantile(pricesSorted, 0.95),
            mean: mean(pricesSorted)
        });
    }

    const finalPrices = currentPrices.sort();
    const bullTarget = quantile(finalPrices, 0.95);
    const bearTarget = quantile(finalPrices, 0.05);
    const medianPrice = quantile(finalPrices, 0.50);

    const upside = (bullTarget - lastPrice) / lastPrice;
    const downside = (lastPrice - bearTarget) / lastPrice;
    const riskReward = downside === 0 ? 0 : upside / downside;

    return {
        garchParams,
        currentVol,
        forecast: timeStepsData,
        metrics: {
            lastPrice,
            bullTarget,
            bearTarget,
            medianPrice,
            riskReward,
            annualizedVol: currentVol,
            atr: {
                value: atr,
                upper: atrUpper,
                lower: atrLower
            }
        }
    };
}

// --- Helpers ---
function boxMuller() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function mean(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
}

function variance(arr) {
    const m = mean(arr);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += (arr[i] - m) ** 2;
    return sum / arr.length;
}

function quantile(sortedArr, q) {
    const pos = (sortedArr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedArr[base + 1] !== undefined) {
        return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
    } else {
        return sortedArr[base];
    }
}

// --- GARCH Fitting (MLE via Nelder-Mead) ---
function fitGarch(returns) {
    const longRunVar = variance(returns);
    const initialAlpha = 0.05;
    const initialBeta = 0.90;
    const initialOmega = longRunVar * (1 - initialAlpha - initialBeta);
    const startParams = [initialOmega, initialAlpha, initialBeta];
    const solved = nelderMead(
        (params) => negativeLogLikelihood(params, returns, longRunVar),
        startParams
    );
    return { omega: solved[0], alpha: solved[1], beta: solved[2], longRunVariance: longRunVar };
}

function negativeLogLikelihood(params, returns, longRunVar) {
    const [omega, alpha, beta] = params;
    if (omega <= 0 || alpha < 0 || beta < 0 || (alpha + beta) >= 0.9999) return 1e9;

    let sigma2 = longRunVar;
    let logL = 0;
    const n = returns.length;

    for (let i = 0; i < n; i++) {
        const r = returns[i];
        logL += (-0.5 * (Math.log(sigma2) + (r * r) / sigma2));
        sigma2 = omega + alpha * (r * r) + beta * sigma2;
    }
    return -logL;
}

function nelderMead(f, x0) {
    const alpha = 1, gamma = 2, rho = 0.5, sigma = 0.5;
    const dim = x0.length;
    let simplex = [];
    simplex.push({ p: x0.slice(), v: f(x0) });
    for (let i = 0; i < dim; i++) {
        const point = x0.slice();
        point[i] = point[i] === 0 ? 0.00025 : point[i] * 1.05;
        simplex.push({ p: point, v: f(point) });
    }
    simplex.sort((a, b) => a.v - b.v);
    const maxIter = 200;
    for (let k = 0; k < maxIter; k++) {
        const best = simplex[0];
        const worst = simplex[dim];
        const secondWorst = simplex[dim - 1];
        const centroid = new Array(dim).fill(0);
        for (let i = 0; i < dim; i++) {
            for (let j = 0; j < dim; j++) centroid[j] += simplex[i].p[j];
        }
        for (let j = 0; j < dim; j++) centroid[j] /= dim;
        const xr_p = add(centroid, mul(sub(centroid, worst.p), alpha));
        const vr = f(xr_p);
        if (vr < secondWorst.v && vr >= best.v) {
            simplex[dim] = { p: xr_p, v: vr };
        } else if (vr < best.v) {
            const xe_p = add(centroid, mul(sub(xr_p, centroid), gamma));
            const ve = f(xe_p);
            if (ve < vr) simplex[dim] = { p: xe_p, v: ve };
            else simplex[dim] = { p: xr_p, v: vr };
        } else {
            const vc_p = (vr < worst.v) ? add(centroid, mul(sub(xr_p, centroid), rho)) : add(centroid, mul(sub(worst.p, centroid), rho));
            const vc = f(vc_p);
            if (vc < Math.min(vr, worst.v)) {
                simplex[dim] = { p: vc_p, v: vc };
            } else {
                for (let i = 1; i <= dim; i++) {
                    simplex[i].p = add(best.p, mul(sub(simplex[i].p, best.p), sigma));
                    simplex[i].v = f(simplex[i].p);
                }
            }
        }
        simplex.sort((a, b) => a.v - b.v);
    }
    return simplex[0].p;
}
function add(a, b) { return a.map((v, i) => v + b[i]); }
function sub(a, b) { return a.map((v, i) => v - b[i]); }
function mul(a, s) { return a.map(v => v * s); }
