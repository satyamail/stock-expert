// StockExpert - Core Application Intelligence

// --- STOCKS DATABASE ---
const stocksData = [
    {
        ticker: "AAPL",
        name: "Apple Inc.",
        sector: "Technology",
        market: "US",
        currency: "$",
        price: 189.84,
        change: 1.45,
        changePercent: 0.77,
        pe: 29.5,
        de: 1.42,
        roe: 154.3,
        fairValue: 205.00,
        healthScore: 88,
        momoType: "high", // high, reversal, cooling
        rsi: 62,
        macd: "Bullish Crossover",
        description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Its robust services ecosystem contributes to steady high-margin recurring cash flows.",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [90.75, 85.78, 94.93, 119.58], // in Billions
            profit: [23.64, 21.45, 22.96, 33.92]
        },
        projections: {
            years: ["2026 (Est)", "2027 (Est)", "2028 (Est)"],
            revenue: [412.5, 445.8, 480.2],
            profit: [105.2, 116.4, 128.5]
        },
        history: {
            dates: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
            prices: [180.20, 185.50, 182.10, 172.60, 179.30, 189.84]
        },
        pros: ["Immense brand loyalty and ecosystem lock-in.", "Aggressive share buyback programs.", "Expanding high-margin Services revenue."],
        cons: ["Slower hardware growth cycles.", "Antitrust scrutiny in the US and EU."]
    },
    {
        ticker: "NVDA",
        name: "NVIDIA Corporation",
        sector: "Semiconductors",
        market: "US",
        currency: "$",
        price: 949.50,
        change: 24.30,
        changePercent: 2.63,
        pe: 72.8,
        de: 0.18,
        roe: 115.6,
        fairValue: 880.00,
        healthScore: 92,
        momoType: "high",
        rsi: 74,
        macd: "Accelerating Bullish",
        description: "NVIDIA Corporation designs graphics processing units (GPUs) for the gaming and professional markets, as well as system on a chip units for the mobile computing and automotive market. It is the absolute leader in AI computing hardware.",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [13.51, 18.12, 22.10, 26.04],
            profit: [6.19, 9.24, 12.29, 14.88]
        },
        projections: {
            years: ["2026 (Est)", "2027 (Est)", "2028 (Est)"],
            revenue: [110.5, 135.2, 160.0],
            profit: [58.4, 72.1, 86.8]
        },
        history: {
            dates: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
            prices: [495.20, 615.30, 790.80, 902.50, 875.12, 949.50]
        },
        pros: ["Near-monopoly in enterprise AI training chips.", "Virtually debt-free balance sheet with high free cash flow.", "Outstanding pricing power."],
        cons: ["Extremely high P/E ratio leaves little room for operational misses.", "Supply chain bottlenecks for chip packaging."]
    },
    {
        ticker: "MSFT",
        name: "Microsoft Corporation",
        sector: "Technology",
        market: "US",
        currency: "$",
        price: 430.32,
        change: 4.12,
        changePercent: 0.97,
        pe: 36.2,
        de: 0.44,
        roe: 38.5,
        fairValue: 450.00,
        healthScore: 89,
        momoType: "high",
        rsi: 58,
        macd: "Bullish Trend Confirmed",
        description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Its Azure Cloud computing infrastructure paired with deep OpenAI integration drives multi-industry expansion.",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [56.52, 62.02, 61.86, 61.86],
            profit: [22.29, 21.86, 21.93, 21.93]
        },
        projections: {
            years: ["2026 (Est)", "2027 (Est)", "2028 (Est)"],
            revenue: [245.8, 275.4, 308.2],
            profit: [88.5, 100.2, 114.6]
        },
        history: {
            dates: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
            prices: [375.40, 398.20, 415.50, 420.70, 406.32, 430.32]
        },
        pros: ["Unrivaled enterprise software dominance.", "Azure continues fast-paced secular growth.", "Generative AI leader via partnership with OpenAI."],
        cons: ["Intense cloud competition from Amazon AWS and Google Cloud.", "Heavy capital expenditures for AI data centers."]
    },
    {
        ticker: "TSLA",
        name: "Tesla Inc.",
        sector: "Automotive",
        market: "US",
        currency: "$",
        price: 179.24,
        change: -3.40,
        changePercent: -1.86,
        pe: 45.3,
        de: 0.08,
        roe: 22.8,
        fairValue: 195.00,
        healthScore: 74,
        momoType: "reversal",
        rsi: 38,
        macd: "Neutral to Bullish Cross",
        description: "Tesla, Inc. designs, develops, manufactures, sells, and leases fully electric vehicles, energy generation, and storage systems. It represents a major bet on autonomous driving and humanoid robotics.",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [24.93, 23.35, 25.17, 21.30],
            profit: [2.70, 1.85, 7.93, 1.13]
        },
        projections: {
            years: ["2026 (Est)", "2027 (Est)", "2028 (Est)"],
            revenue: [98.5, 112.4, 130.0],
            profit: [8.2, 11.5, 15.6]
        },
        history: {
            dates: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
            prices: [248.50, 187.30, 201.80, 175.40, 168.20, 179.24]
        },
        pros: ["Industry-leading profit margins on EV manufacturing.", "Huge cash reserves and low long-term debt.", "Uncapped energy storage sector tailwinds."],
        cons: ["Price wars compression on automotive margins.", "Regulatory probes into Autopilot software."]
    },
    {
        ticker: "RELIANCE",
        name: "Reliance Industries Ltd.",
        sector: "Conglomerate",
        market: "IN",
        currency: "₹",
        price: 2955.50,
        change: 32.10,
        changePercent: 1.10,
        pe: 26.8,
        de: 0.38,
        roe: 9.4,
        fairValue: 3200.00,
        healthScore: 85,
        momoType: "high",
        rsi: 61,
        macd: "Bullish Signal Active",
        description: "Reliance Industries Limited is India's largest private sector conglomerate, spanning hydrocarbon exploration and production, petroleum refining, petrochemicals, retail, and digital services (Jio).",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [2345, 2250, 2400, 2460], // in Billions INR
            profit: [198, 172, 201, 212]
        },
        projections: {
            years: ["FY26 (Est)", "FY27 (Est)", "FY28 (Est)"],
            revenue: [10200, 11500, 13000],
            profit: [850, 960, 1100]
        },
        history: {
            dates: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
            prices: [2580, 2710, 2900, 2880, 2920, 2955.50]
        },
        pros: ["Jio dominates India's digital/telecom landscape.", "Retail segment expanding rapidly at 20%+ YoY.", "Massive shift towards green and renewable energy scaling."],
        cons: ["Heavy capital expenditure cycles keeping debt levels stable.", "Refining margins remain exposed to global crude volatility."]
    },
    {
        ticker: "TCS",
        name: "Tata Consultancy Services Ltd.",
        sector: "IT Services",
        market: "IN",
        currency: "₹",
        price: 3845.00,
        change: -12.40,
        changePercent: -0.32,
        pe: 28.2,
        de: 0.05,
        roe: 48.2,
        fairValue: 4100.00,
        healthScore: 87,
        momoType: "cooling",
        rsi: 48,
        macd: "Slight Bearish Divergence",
        description: "Tata Consultancy Services is a global leader in IT services, consulting, and business solutions. Possessing one of the most resilient operating models in enterprise software globally.",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [596.9, 605.8, 612.3, 612.4],
            profit: [113.4, 110.6, 113.5, 122.4]
        },
        projections: {
            years: ["FY26 (Est)", "FY27 (Est)", "FY28 (Est)"],
            revenue: [2640, 2880, 3180],
            profit: [500, 560, 630]
        },
        history: {
            dates: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
            prices: [3620, 3810, 4120, 3950, 3820, 3845]
        },
        pros: ["Exceptional capital efficiency with industry-best ROE.", "Unbeatable cash retention and dividend payout ratio.", "Deep client relationships and multi-billion-dollar backlog."],
        cons: ["Headwinds in BFSI segment in US & European geographies.", "Higher local workforce inflation costs."]
    },
    {
        ticker: "HDFCBANK",
        name: "HDFC Bank Ltd.",
        sector: "Banking",
        market: "IN",
        currency: "₹",
        price: 1512.40,
        change: 18.50,
        changePercent: 1.24,
        pe: 16.5,
        de: 0.85,
        roe: 16.8,
        fairValue: 1780.00,
        healthScore: 86,
        momoType: "reversal",
        rsi: 54,
        macd: "Bullish Reversal Confirmed",
        description: "HDFC Bank is the leading private sector bank in India. Post-merger with HDFC Ltd, it stands as a massive financial services titan with unmatched domestic retail credit distribution.",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [780.5, 810.3, 825.9, 895.4],
            profit: [168.2, 172.5, 177.1, 180.1]
        },
        projections: {
            years: ["FY26 (Est)", "FY27 (Est)", "FY28 (Est)"],
            revenue: [3800, 4350, 5000],
            profit: [750, 860, 1000]
        },
        history: {
            dates: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
            prices: [1650, 1530, 1420, 1440, 1505, 1512.40]
        },
        pros: ["Robust asset quality and industry-low Gross NPA.", "Massive retail deposits network scaling rapidly.", "Valuation at a historic discount post-merger correction."],
        cons: ["Near-term compression in Net Interest Margins (NIM).", "Regulatory scrutiny on loan-to-deposit ratios."]
    }
];

// --- PORTFOLIO INITIAL STATE ---
let portfolio = {
    cash: 15750.00,
    holdings: [
        { ticker: "AAPL", qty: 200, avgPrice: 175.20 },
        { ticker: "NVDA", qty: 50, avgPrice: 820.00 },
        { ticker: "HDFCBANK", qty: 150, avgPrice: 1440.00 }
    ]
};

// --- GLOBAL VARIABLES & STATE ---
let activeTab = "dashboard";
let currentCharts = {}; // Track active chart objects to avoid canvas reuse errors

// --- HELPER FUNCTIONS ---
function formatCurrency(val, currency = "$") {
    return `${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calculateDiscount(fair, current) {
    const disc = ((fair - current) / fair) * 100;
    return disc.toFixed(1);
}

// --- TAB SWAP NAVIGATION ---
window.switchTab = function(tabId) {
    activeTab = tabId;
    
    // Toggle active classes on nav buttons
    document.querySelectorAll(".nav-item").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Toggle active tab panels
    document.querySelectorAll(".tab-panel").forEach(panel => {
        if (panel.id === `tab-${tabId}`) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    // Run Tab Specific Render Initializers
    if (tabId === "dashboard") {
        renderDashboard();
    } else if (tabId === "screener") {
        renderScreener();
    } else if (tabId === "analyzer") {
        renderAnalyzer();
    } else if (tabId === "portfolio") {
        renderPortfolio();
    } else if (tabId === "mood") {
        renderMoodTab();
    }
};

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "success") {
    const toast = document.getElementById("toast-notification");
    toast.textContent = message;
    toast.className = `toast show toast-${type}`;
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

// --- DYNAMIC SEARCH & AUTOCOMPLETE ---
function setupSearch() {
    const searchInput = document.getElementById("global-search");
    const dropdown = document.getElementById("search-suggestions");

    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 1) {
            dropdown.classList.add("hidden");
            return;
        }

        const matches = stocksData.filter(s => 
            s.ticker.toLowerCase().includes(query) || 
            s.name.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            dropdown.innerHTML = `<div class="search-suggestion-item">No results found</div>`;
        } else {
            dropdown.innerHTML = matches.map(s => `
                <div class="search-suggestion-item" data-ticker="${s.ticker}">
                    <div>
                        <span class="suggestion-ticker">${s.ticker}</span> - 
                        <span class="suggestion-name">${s.name}</span>
                    </div>
                    <span class="suggestion-market">${s.market}</span>
                </div>
            `).join('');

            // Click suggestion to view in Analyzer
            dropdown.querySelectorAll(".search-suggestion-item").forEach(item => {
                item.addEventListener("click", () => {
                    const ticker = item.getAttribute("data-ticker");
                    if (ticker) {
                        searchInput.value = "";
                        dropdown.classList.add("hidden");
                        loadAnalyzerForTicker(ticker);
                    }
                });
            });
        }
        dropdown.classList.remove("hidden");
    });

    // Close search dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });
}

// --- MOOD GAUGE CHART DRAWING ---
function drawMoodGauge(score) {
    const canvas = document.getElementById("moodGaugeCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height - 10;
    const r = 90;

    // Draw background track
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 16;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.stroke();

    // Draw gradient color track (Fear -> Greed)
    const gradient = ctx.createLinearGradient(0, cy, canvas.width, cy);
    gradient.addColorStop(0, '#ef4444');   // Fear (Red)
    gradient.addColorStop(0.5, '#f59e0b'); // Neutral (Orange)
    gradient.addColorStop(1, '#10b981');   // Greed (Green)

    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 16;
    ctx.strokeStyle = gradient;
    ctx.stroke();

    // Calculate angle for current score
    const scoreFraction = score / 100;
    const targetAngle = Math.PI + (scoreFraction * Math.PI);

    // Draw needle
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(targetAngle - Math.PI / 2);
    
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(0, -r + 10);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fillStyle = '#f1f3f9';
    ctx.fill();
    ctx.restore();

    // Needle pivot center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
}

// --- RENDER: DASHBOARD HOME ---
function renderDashboard() {
    drawMoodGauge(78); // Hardcode standard mock sentiment gauge

    // Top Fundamental Picks list
    const tbody = document.getElementById("top-picks-tbody");
    if (!tbody) return;

    // Filter to stocks with high score
    const topStocks = [...stocksData].sort((a,b) => b.healthScore - a.healthScore).slice(0, 4);

    tbody.innerHTML = topStocks.map(s => {
        const disc = calculateDiscount(s.fairValue, s.price);
        const discClass = disc > 0 ? "positive" : "negative";
        const scoreClass = s.healthScore >= 88 ? "score-excellent" : "score-good";
        const momoIcon = s.momoType === "high" ? "trending-up" : "rotate-ccw";
        const momoColor = s.momoType === "high" ? "var(--success-glow)" : "var(--info-glow)";

        return `
            <tr>
                <td>
                    <div class="stock-ticker-cell">
                        <span class="stock-sym">${s.ticker}</span>
                        <span class="stock-name">${s.market} Market</span>
                    </div>
                </td>
                <td><strong>${s.name}</strong></td>
                <td><span class="score-badge ${scoreClass}">${s.healthScore}</span></td>
                <td>${formatCurrency(s.fairValue, s.currency)}</td>
                <td><span class="${discClass}">${disc > 0 ? '+' : ''}${disc}%</span></td>
                <td>
                    <div class="momo-indicator" style="color: ${momoColor}">
                        <i data-lucide="${momoIcon}" style="width: 14px; height: 14px"></i>
                        <span>${s.momoType.toUpperCase()}</span>
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary" onclick="loadAnalyzerForTicker('${s.ticker}')">Analyze</button>
                </td>
            </tr>
        `;
    }).join('');

    // Render Momo Trends list
    renderMomoTrendsList("high");

    // Donut chart & legend initialization
    renderPortfolioDonut();

    lucide.createIcons();
}

// --- RENDER: MOMO LIST FILTER ---
function renderMomoTrendsList(momoType) {
    const list = document.getElementById("momo-trends-list");
    if (!list) return;

    const filtered = stocksData.filter(s => s.momoType === momoType);

    list.innerHTML = filtered.map(s => {
        const isUp = s.change >= 0;
        const iconBg = isUp ? "up" : "down";
        const icon = isUp ? "arrow-up-right" : "arrow-down-right";

        return `
            <div class="momo-item" onclick="loadAnalyzerForTicker('${s.ticker}')" style="cursor: pointer">
                <div class="momo-info">
                    <div class="momo-icon-bg ${iconBg}">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div class="momo-details">
                        <span class="momo-title">${s.ticker}</span>
                        <span class="momo-reason">${s.name} (${s.sector})</span>
                    </div>
                </div>
                <div class="momo-stats">
                    <span class="momo-val ${isUp ? 'positive' : 'negative'}">${isUp ? '+' : ''}${s.changePercent}%</span>
                    <div class="momo-metric">RSI: ${s.rsi} (${s.rsi > 70 ? 'Overbought' : s.rsi < 40 ? 'Oversold' : 'Neutral'})</div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// --- RENDER: SCREENER ---
function renderScreener() {
    const tbody = document.getElementById("screener-table-tbody");
    if (!tbody) return;

    const marketFilter = document.getElementById("filter-market").value;
    const scoreFilter = parseInt(document.getElementById("filter-score").value);
    const valuationFilter = document.getElementById("filter-valuation").value;

    const filtered = stocksData.filter(s => {
        if (marketFilter !== "ALL" && s.market !== marketFilter) return false;
        if (s.healthScore < scoreFilter) return false;
        
        const disc = parseFloat(calculateDiscount(s.fairValue, s.price));
        if (valuationFilter === "UNDERVALUED" && disc <= 0) return false;
        if (valuationFilter === "FAIRVALUE" && disc < 0) return false;
        
        return true;
    });

    tbody.innerHTML = filtered.map(s => {
        const disc = calculateDiscount(s.fairValue, s.price);
        const discClass = disc > 0 ? "positive" : "negative";
        const scoreClass = s.healthScore >= 88 ? "score-excellent" : s.healthScore >= 80 ? "score-good" : "score-average";

        return `
            <tr>
                <td><span class="stock-sym">${s.ticker}</span></td>
                <td><strong>${s.name}</strong></td>
                <td><span class="score-badge ${scoreClass}">${s.healthScore}</span></td>
                <td>${s.pe}</td>
                <td>${s.de}</td>
                <td>${s.roe}%</td>
                <td>${formatCurrency(s.fairValue, s.currency)}</td>
                <td><strong>${formatCurrency(s.price, s.currency)}</strong></td>
                <td><span class="${discClass}">${disc > 0 ? '+' : ''}${disc}%</span></td>
                <td>
                    <button class="btn btn-primary" onclick="loadAnalyzerForTicker('${s.ticker}')">Analyze</button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- RENDER: ANALYZER SIDEBAR & LIST ---
function renderAnalyzer() {
    const list = document.getElementById("analyzer-stock-list");
    if (!list) return;

    list.innerHTML = stocksData.map(s => `
        <div class="analyzer-stock-item" data-ticker="${s.ticker}" onclick="loadAnalyzerForTicker('${s.ticker}')">
            <div class="stock-ticker-cell">
                <span class="analyzer-stock-ticker">${s.ticker}</span>
                <span class="analyzer-stock-name">${s.name}</span>
            </div>
            <span class="badge ${s.healthScore >= 88 ? 'badge-success' : 'badge-info'}">${s.healthScore}</span>
        </div>
    `).join('');
}

// --- RENDER PORTFOLIO & MOCK TRANSACTION ENGINE ---
function renderPortfolio() {
    const tbody = document.getElementById("portfolio-table-tbody");
    if (!tbody) return;

    let totalValue = portfolio.cash;
    
    const rowHTML = portfolio.holdings.map(hold => {
        const s = stocksData.find(st => st.ticker === hold.ticker);
        if (!s) return '';

        const currentVal = hold.qty * s.price;
        totalValue += currentVal;

        const pnl = ((s.price - hold.avgPrice) / hold.avgPrice) * 100;
        const pnlClass = pnl >= 0 ? "positive" : "negative";

        return `
            <tr>
                <td>
                    <div class="stock-ticker-cell">
                        <span class="stock-sym">${hold.ticker}</span>
                        <span class="stock-name">${s.name}</span>
                    </div>
                </td>
                <td>${hold.qty} shares</td>
                <td>${formatCurrency(hold.avgPrice, s.currency)}</td>
                <td><strong>${formatCurrency(s.price, s.currency)}</strong></td>
                <td><span class="${pnlClass}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%</span></td>
                <td><strong>${formatCurrency(currentVal, s.currency)}</strong></td>
                <td>
                    <button class="btn btn-text" onclick="loadAnalyzerForTicker('${hold.ticker}')">View Chart</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rowHTML;

    // Update Header Metric Displays
    const totalPnlVal = totalValue - 100000; // Mock standard initially invested capital of 100k
    const totalPnlPercent = (totalPnlVal / 100000) * 100;

    document.getElementById("port-total-value").textContent = formatCurrency(totalValue, "$");
    document.getElementById("port-total-cash").textContent = `Cash Balance: ${formatCurrency(portfolio.cash, "$")}`;
    document.getElementById("port-total-pnl-val").textContent = `${totalPnlVal >= 0 ? '+' : ''}${formatCurrency(totalPnlVal, "$")}`;
    document.getElementById("port-total-pnl-val").className = `metric-value ${totalPnlVal >= 0 ? 'positive' : 'negative'}`;

    // Fill Quick Order dropdown options
    const select = document.getElementById("order-ticker");
    if (select) {
        select.innerHTML = stocksData.map(s => `
            <option value="${s.ticker}">${s.ticker} - ${s.name} (${formatCurrency(s.price, s.currency)})</option>
        `).join('');
        
        // Recalculate quick price estimate on selection/quantity change
        updateEstOrderCost();
    }
}

// --- RENDER PORTFOLIO DONUT CHART ---
function renderPortfolioDonut() {
    const canvas = document.getElementById("portfolioDonutChart");
    if (!canvas) return;

    // Destroy prior chart if active to clear canvas reuse bug
    if (currentCharts["portfolioDonut"]) {
        currentCharts["portfolioDonut"].destroy();
    }

    const labels = [];
    const data = [];
    const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

    portfolio.holdings.forEach(hold => {
        const s = stocksData.find(st => st.ticker === hold.ticker);
        if (s) {
            labels.push(hold.ticker);
            data.push(hold.qty * s.price);
        }
    });

    // Add Cash remaining
    labels.push("CASH");
    data.push(portfolio.cash);

    currentCharts["portfolioDonut"] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            cutout: '70%'
        }
    });

    // Set custom Legend
    const legendList = document.getElementById("portfolio-legend-list");
    if (legendList) {
        legendList.innerHTML = labels.map((lbl, idx) => `
            <div class="legend-item">
                <span class="legend-color-dot" style="background: ${colors[idx]}"></span>
                <span>${lbl}: <strong>${((data[idx] / data.reduce((a,b) => a+b, 0)) * 100).toFixed(0)}%</strong></span>
            </div>
        `).join('');
    }
}

// --- RENDER MARKET MOOD DETAILED TAB ---
function renderMoodTab() {
    const canvas = document.getElementById("moodHistoryChart");
    if (!canvas) return;

    if (currentCharts["moodHistory"]) {
        currentCharts["moodHistory"].destroy();
    }

    currentCharts["moodHistory"] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Today"],
            datasets: [{
                label: 'Fear & Greed Index Score',
                data: [42, 55, 68, 62, 75, 78],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
            }
        }
    });
}

// --- TRANSACTION EXECUTOR PANEL ---
function updateEstOrderCost() {
    const ticker = document.getElementById("order-ticker").value;
    const qty = parseInt(document.getElementById("order-qty").value) || 0;
    const s = stocksData.find(st => st.ticker === ticker);
    const estCostLabel = document.getElementById("order-est-cost");

    if (s && estCostLabel) {
        const cost = s.price * qty;
        estCostLabel.textContent = formatCurrency(cost, s.currency);
    }
}

function executeTransaction() {
    const ticker = document.getElementById("order-ticker").value;
    const qty = parseInt(document.getElementById("order-qty").value) || 0;
    const action = document.getElementById("btn-toggle-buy").classList.contains("active-buy") ? "BUY" : "SELL";

    const s = stocksData.find(st => st.ticker === ticker);
    if (!s) return;

    const totalCost = s.price * qty;

    if (qty <= 0) {
        showToast("Invalid quantity selected.", "error");
        return;
    }

    if (action === "BUY") {
        if (portfolio.cash < totalCost) {
            showToast("Insufficient cash balance for this order.", "error");
            return;
        }

        portfolio.cash -= totalCost;
        const existing = portfolio.holdings.find(h => h.ticker === ticker);
        if (existing) {
            // Recalculate average price
            const totalShares = existing.qty + qty;
            existing.avgPrice = ((existing.qty * existing.avgPrice) + totalCost) / totalShares;
            existing.qty = totalShares;
        } else {
            portfolio.holdings.push({ ticker: ticker, qty: qty, avgPrice: s.price });
        }
        showToast(`Successfully bought ${qty} shares of ${ticker}!`, "success");
    } else {
        const existing = portfolio.holdings.find(h => h.ticker === ticker);
        if (!existing || existing.qty < qty) {
            showToast("You do not hold enough shares of this stock to sell.", "error");
            return;
        }

        portfolio.cash += totalCost;
        existing.qty -= qty;
        if (existing.qty === 0) {
            portfolio.holdings = portfolio.holdings.filter(h => h.ticker !== ticker);
        }
        showToast(`Successfully sold ${qty} shares of ${ticker}!`, "success");
    }

    // Re-render portfolio content
    renderPortfolio();
}

// --- RENDER DYNAMIC STOCK ANALYZER VIEW ---
window.loadAnalyzerForTicker = function(ticker) {
    switchTab("analyzer");

    // Set side selection active CSS class
    document.querySelectorAll(".analyzer-stock-item").forEach(item => {
        if (item.getAttribute("data-ticker") === ticker) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    const s = stocksData.find(st => st.ticker === ticker);
    const container = document.getElementById("analyzer-details");
    if (!s || !container) return;

    const disc = calculateDiscount(s.fairValue, s.price);
    const discClass = disc > 0 ? "positive" : "negative";

    container.innerHTML = `
        <div class="analyzer-details-header">
            <div class="analyzer-company-title">
                <h2>${s.name} (<span style="color: #a78bfa">${s.ticker}</span>)</h2>
                <div class="analyzer-company-desc">${s.sector} Segment &bull; ${s.market} Market Asset</div>
            </div>
            <div class="analyzer-header-pricing">
                <div class="analyzer-live-price">${formatCurrency(s.price, s.currency)}</div>
                <div class="analyzer-live-change ${s.change >= 0 ? 'positive' : 'negative'}">
                    ${s.change >= 0 ? '+' : ''}${s.change} (${s.changePercent}%)
                </div>
            </div>
        </div>

        <div class="metric-strip">
            <div class="strip-item">
                <div class="strip-label">Health Score</div>
                <div class="strip-val" style="color: var(--purple-glow)">${s.healthScore} / 100</div>
            </div>
            <div class="strip-item">
                <div class="strip-label">P/E Ratio</div>
                <div class="strip-val">${s.pe}</div>
            </div>
            <div class="strip-item">
                <div class="strip-label">D/E Ratio</div>
                <div class="strip-val">${s.de}</div>
            </div>
            <div class="strip-item">
                <div class="strip-label">Return on Equity</div>
                <div class="strip-val">${s.roe}%</div>
            </div>
        </div>

        <div class="analyzer-grid">
            <!-- Left Chart: History & Projections -->
            <div class="glass-card col-span-8">
                <div class="card-header">
                    <h3>Performance Timeline (Last 6 Months)</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="analyzerPriceChart"></canvas>
                </div>
            </div>

            <!-- Right: Health Valuation -->
            <div class="glass-card col-span-4">
                <div class="card-header">
                    <h3>Fair Valuation Math</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px">
                    <div style="display: flex; justify-content: space-between">
                        <span>Calculated Intrinsic Value:</span>
                        <strong>${formatCurrency(s.fairValue, s.currency)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between">
                        <span>Current Market Price:</span>
                        <strong>${formatCurrency(s.price, s.currency)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px">
                        <span>Safety discount margin:</span>
                        <strong class="${discClass}">${disc > 0 ? '+' : ''}${disc}%</strong>
                    </div>
                </div>
            </div>

            <!-- Left: Quarterly Results -->
            <div class="glass-card col-span-6">
                <div class="card-header">
                    <h3>Quarterly Growth Analysis</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="analyzerQuarterlyChart"></canvas>
                </div>
            </div>

            <!-- Right: Future Projections -->
            <div class="glass-card col-span-6">
                <div class="card-header">
                    <h3>Future Revenue & Income Projections</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="analyzerProjectionsChart"></canvas>
                </div>
            </div>

            <!-- Full-width Pro/Con and Momentum summary -->
            <div class="glass-card col-span-12">
                <div class="card-header">
                    <h3>Fundamental Summary & Momentum Audit ("Momos")</h3>
                    <span class="badge ${s.rsi > 70 ? 'badge-danger' : s.rsi < 40 ? 'badge-success' : 'badge-warning'}">
                        Momentum RSI: ${s.rsi}
                    </span>
                </div>
                <div class="analyzer-grid" style="gap: 16px">
                    <div class="col-span-6">
                        <h4>Strengths & Pros</h4>
                        <ul class="analysis-points-box" style="margin-top: 10px">
                            ${s.pros.map(p => `
                                <li class="point-item">
                                    <i data-lucide="check" class="point-icon up"></i>
                                    <span>${p}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="col-span-6">
                        <h4>Risks & Concerns</h4>
                        <ul class="analysis-points-box" style="margin-top: 10px">
                            ${s.cons.map(c => `
                                <li class="point-item">
                                    <i data-lucide="alert-triangle" class="point-icon down"></i>
                                    <span>${c}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Trigger Chart.js graph drawing handlers
    renderAnalyzerCharts(s);
};

// --- DRAW ACTIVE ANALYZER CHART OBJECTS ---
function renderAnalyzerCharts(s) {
    // 1. Price History Line Graph
    const priceCtx = document.getElementById("analyzerPriceChart");
    if (priceCtx) {
        if (currentCharts["analyzerPrice"]) currentCharts["analyzerPrice"].destroy();

        currentCharts["analyzerPrice"] = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: s.history.dates,
                datasets: [{
                    label: 'Close Price',
                    data: s.history.prices,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });
    }

    // 2. Quarterly Revenue Bar Graph
    const quarterlyCtx = document.getElementById("analyzerQuarterlyChart");
    if (quarterlyCtx) {
        if (currentCharts["analyzerQuarterly"]) currentCharts["analyzerQuarterly"].destroy();

        currentCharts["analyzerQuarterly"] = new Chart(quarterlyCtx, {
            type: 'bar',
            data: {
                labels: s.quarterly.quarters,
                datasets: [
                    {
                        label: 'Revenue',
                        data: s.quarterly.revenue,
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    },
                    {
                        label: 'Net Income / Profit',
                        data: s.quarterly.profit,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });
    }

    // 3. Earnings & Profit Future Projections Graph
    const projectionsCtx = document.getElementById("analyzerProjectionsChart");
    if (projectionsCtx) {
        if (currentCharts["analyzerProjections"]) currentCharts["analyzerProjections"].destroy();

        currentCharts["analyzerProjections"] = new Chart(projectionsCtx, {
            type: 'line',
            data: {
                labels: s.projections.years,
                datasets: [
                    {
                        label: 'Projected Revenue',
                        data: s.projections.revenue,
                        borderColor: '#a78bfa',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.1
                    },
                    {
                        label: 'Projected Profit',
                        data: s.projections.profit,
                        borderColor: '#34d399',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });
    }
}

// --- SETUP TRANSACTION TRIGGERS & ONLOAD ENGINE ---
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    setupSearch();
    renderDashboard();

    // Event listener setup for tab filter changes
    document.querySelectorAll("[data-momo]").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("[data-momo]").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderMomoTrendsList(tab.getAttribute("data-momo"));
        });
    });

    // Setup Screener Filtering listeners
    document.getElementById("filter-market").addEventListener("change", renderScreener);
    document.getElementById("filter-score").addEventListener("change", renderScreener);
    document.getElementById("filter-valuation").addEventListener("change", renderScreener);

    // Setup Navigation tab button listeners
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-tab");
            if (tabId) switchTab(tabId);
        });
    });

    // Transaction Panel Buy/Sell toggle
    const buyBtn = document.getElementById("btn-toggle-buy");
    const sellBtn = document.getElementById("btn-toggle-sell");
    if (buyBtn && sellBtn) {
        buyBtn.addEventListener("click", () => {
            buyBtn.classList.add("active-buy");
            sellBtn.classList.remove("active-sell");
            updateEstOrderCost();
        });
        sellBtn.addEventListener("click", () => {
            sellBtn.classList.add("active-sell");
            buyBtn.classList.remove("active-buy");
            updateEstOrderCost();
        });
    }

    // Execute order listener
    const execBtn = document.getElementById("btn-execute-order");
    if (execBtn) execBtn.addEventListener("click", executeTransaction);

    const qtyInput = document.getElementById("order-qty");
    if (qtyInput) qtyInput.addEventListener("input", updateEstOrderCost);
    
    const tickerSelect = document.getElementById("order-ticker");
    if (tickerSelect) tickerSelect.addEventListener("change", updateEstOrderCost);

    // Theme toggle setup (Light / Dark mode)
    const themeBtn = document.getElementById("theme-toggle-btn");
    themeBtn.addEventListener("click", () => {
        const body = document.body;
        const sun = themeBtn.querySelector(".sun-icon");
        const moon = themeBtn.querySelector(".moon-icon");

        if (body.getAttribute("data-theme") === "light") {
            body.removeAttribute("data-theme");
            sun.classList.remove("hidden");
            moon.classList.add("hidden");
        } else {
            body.setAttribute("data-theme", "light");
            sun.classList.add("hidden");
            moon.classList.remove("hidden");
        }
        
        // Re-render gauge
        if (activeTab === "dashboard") {
            drawMoodGauge(78);
        }
    });
});
