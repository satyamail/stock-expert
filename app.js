// StockExpert - Core Application Intelligence & Secure API Connector

// --- STATIC STOCKS DATABASE ---
const stocksData = [
    {
        ticker: "AAPL",
        name: "Apple Inc.",
        sector: "Technology",
        market: "US",
        currency: "$",
        pe: 29.5,
        de: 1.42,
        roe: 154.3,
        fairValue: 205.00,
        healthScore: 88,
        momoType: "high",
        description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Its robust services ecosystem contributes to steady high-margin recurring cash flows.",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [90.75, 85.78, 94.93, 119.58],
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
        pe: 72.8,
        de: 0.18,
        roe: 115.6,
        fairValue: 880.00,
        healthScore: 92,
        momoType: "high",
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
        pe: 36.2,
        de: 0.44,
        roe: 38.5,
        fairValue: 450.00,
        healthScore: 89,
        momoType: "high",
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
        pe: 45.3,
        de: 0.08,
        roe: 22.8,
        fairValue: 195.00,
        healthScore: 74,
        momoType: "reversal",
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
        pe: 26.8,
        de: 0.38,
        roe: 9.4,
        fairValue: 3200.00,
        healthScore: 85,
        momoType: "high",
        description: "Reliance Industries Limited is India's largest private sector conglomerate, spanning hydrocarbon exploration and production, petroleum refining, petrochemicals, retail, and digital services (Jio).",
        quarterly: {
            quarters: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
            revenue: [2345, 2250, 2400, 2460],
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
        pe: 28.2,
        de: 0.05,
        roe: 48.2,
        fairValue: 4100.00,
        healthScore: 87,
        momoType: "cooling",
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
        pe: 16.5,
        de: 0.85,
        roe: 16.8,
        fairValue: 1780.00,
        healthScore: 86,
        momoType: "reversal",
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

// --- PORTFOLIO DYNAMIC STATE ---
let portfolio = {
    cash: 100000.00,
    holdings: []
};

// --- SIMULATED REALTIME PRICES (Synchronized with Python scanner updates) ---
let marketPrices = {};
let marketRSIs = {};

// --- GLOBAL VARIABLES & STATE ---
let activeTab = "dashboard";
let currentCharts = {};
let authMode = "LOGIN"; // LOGIN or REGISTER
let activePollingInterval = null;

// --- SECURE STORAGE ACCESS ---
function getToken() {
    return localStorage.getItem("auth_token");
}

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}

// --- CURRENCY & PERCENTAGE HELPERS ---
function formatCurrency(val, currency = "$") {
    return `${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calculateDiscount(fair, current) {
    const disc = ((fair - current) / fair) * 100;
    return disc.toFixed(1);
}

// --- SYSTEM INITIALIZATION & WORKSPACE LOAD ---
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    setupAuthListeners();
    setupSearch();

    const token = getToken();
    const username = localStorage.getItem("username");
    if (token && username) {
        loadWorkspace(username);
    } else {
        document.getElementById("auth-overlay").classList.remove("hidden");
    }
});

// --- AUTH HANDLERS & REGISTRATION flow ---
function setupAuthListeners() {
    const loginTab = document.getElementById("tab-btn-login");
    const registerTab = document.getElementById("tab-btn-register");
    const authForm = document.getElementById("auth-form");
    const submitBtn = document.getElementById("btn-auth-submit");

    loginTab.addEventListener("click", () => {
        authMode = "LOGIN";
        loginTab.classList.add("active");
        registerTab.classList.remove("active");
        submitBtn.textContent = "Access Workspace";
    });

    registerTab.addEventListener("click", () => {
        authMode = "REGISTER";
        registerTab.classList.add("active");
        loginTab.classList.remove("active");
        submitBtn.textContent = "Register Secure Account";
    });

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("auth-username").value.trim();
        const password = document.getElementById("auth-password").value;

        if (authMode === "LOGIN") {
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: jsonStringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem("auth_token", data.token);
                    localStorage.setItem("username", data.username);
                    showToast("Authentication Successful!", "success");
                    loadWorkspace(data.username);
                } else {
                    showToast(data.error || "Login Failed", "error");
                }
            } catch (err) {
                showToast("Server connection error.", "error");
            }
        } else {
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: jsonStringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.success, "success");
                    // Toggle back to login automatically
                    loginTab.click();
                    document.getElementById("auth-password").value = "";
                } else {
                    showToast(data.error || "Registration Failed", "error");
                }
            } catch (err) {
                showToast("Server connection error.", "error");
            }
        }
    });

    // Logout listener
    document.getElementById("btn-logout").addEventListener("click", async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: getAuthHeaders()
            });
        } catch (e) {}
        
        localStorage.removeItem("auth_token");
        localStorage.removeItem("username");
        
        if (activePollingInterval) clearInterval(activePollingInterval);
        
        document.getElementById("main-app-container").classList.add("hidden");
        document.getElementById("auth-overlay").classList.remove("hidden");
        showToast("Logged out successfully.", "success");
    });
}

function loadWorkspace(username) {
    document.getElementById("auth-overlay").classList.add("hidden");
    document.getElementById("main-app-container").classList.remove("hidden");
    
    // Set user headers
    document.getElementById("user-display-name").textContent = username;
    document.getElementById("avatar-letter").textContent = username.charAt(0).toUpperCase();

    // Trigger tab setup
    setupTabListeners();
    switchTab("dashboard");
    
    // Start active polling synchronization (sync portfolio/prices/logs every 5 seconds)
    if (activePollingInterval) clearInterval(activePollingInterval);
    activePollingInterval = setInterval(syncBackendData, 5000);
}

// JSON.stringify helper safeguarding formatting
function jsonStringify(obj) {
    return JSON.stringify(obj);
}

// --- DYNAMIC DATA SYNCHRONIZATION FROM PYTHON REST API ---
async function syncBackendData() {
    if (!getToken()) return;

    try {
        const res = await fetch("/api/portfolio", {
            headers: getAuthHeaders()
        });
        if (res.status === 401) {
            document.getElementById("btn-logout").click();
            return;
        }

        const data = await res.json();
        if (res.ok) {
            portfolio.cash = data.cash;
            portfolio.holdings = data.holdings;
            marketPrices = data.marketPrices;
            marketRSIs = data.marketRSIs;

            // Re-render UI components active in the current tab
            if (activeTab === "dashboard") {
                renderDashboard();
            } else if (activeTab === "screener") {
                renderScreener();
            } else if (activeTab === "portfolio") {
                renderPortfolio();
            }
        }
    } catch (e) {
        console.error("API Sync error:", e);
    }
}

// --- AUTHENTICATED MOCK TRANSACTION EXECUTOR ---
async function executeTransaction() {
    const ticker = document.getElementById("order-ticker").value;
    const qty = parseInt(document.getElementById("order-qty").value) || 0;
    const action = document.getElementById("btn-toggle-buy").classList.contains("active-buy") ? "BUY" : "SELL";

    if (qty <= 0) {
        showToast("Invalid quantity.", "error");
        return;
    }

    try {
        const res = await fetch("/api/portfolio/trade", {
            method: "POST",
            headers: getAuthHeaders(),
            body: jsonStringify({ ticker, qty, action })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast(data.success, "success");
            await syncBackendData();
        } else {
            showToast(data.error || "Trade Execution Failed", "error");
        }
    } catch (err) {
        showToast("Broker execution connection error.", "error");
    }
}

// --- RENDER PORTFOLIO LOGS DAEMON TABLE ---
async function renderScannerLogs() {
    const tbody = document.getElementById("scanner-logs-tbody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/scanner/logs", {
            headers: getAuthHeaders()
        });
        const data = await res.json();

        if (res.ok && data.logs.length > 0) {
            tbody.innerHTML = data.logs.map(log => {
                const s = stocksData.find(st => st.ticker === log.ticker);
                const currency = s ? s.currency : "$";
                const isSell = log.action.includes("SELL");

                return `
                    <tr>
                        <td style="color: var(--text-secondary); font-size: 11px;">${log.timestamp}</td>
                        <td><span class="stock-sym">${log.ticker}</span></td>
                        <td><span class="badge ${isSell ? 'badge-danger' : 'badge-success'}">${log.action}</span></td>
                        <td style="font-weight: 500;">${log.reason}</td>
                        <td class="negative" style="font-weight: 700;">${formatCurrency(log.price, currency)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary);">No scans executed yet. Active monitoring is polling...</td>
                </tr>
            `;
        }
    } catch (e) {
        console.error("Scanner log fetch error:", e);
    }
}

// --- TAB SWAP NAVIGATION ---
window.switchTab = function(tabId) {
    activeTab = tabId;
    
    document.querySelectorAll(".nav-item").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    document.querySelectorAll(".tab-panel").forEach(panel => {
        if (panel.id === `tab-${tabId}`) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    // Run Tab Initializers
    if (tabId === "dashboard") {
        renderDashboard();
    } else if (tabId === "screener") {
        renderScreener();
    } else if (tabId === "analyzer") {
        renderAnalyzer();
    } else if (tabId === "portfolio") {
        renderPortfolio();
        renderScannerLogs();
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

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 16;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.stroke();

    // Gradient
    const gradient = ctx.createLinearGradient(0, cy, canvas.width, cy);
    gradient.addColorStop(0, '#ef4444');
    gradient.addColorStop(0.5, '#f59e0b');
    gradient.addColorStop(1, '#10b981');

    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 16;
    ctx.strokeStyle = gradient;
    ctx.stroke();

    const scoreFraction = score / 100;
    const targetAngle = Math.PI + (scoreFraction * Math.PI);

    // Needle
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

    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
}

// --- RENDER: DASHBOARD HOME ---
function renderDashboard() {
    drawMoodGauge(78);

    const tbody = document.getElementById("top-picks-tbody");
    if (!tbody) return;

    const topStocks = [...stocksData].sort((a,b) => b.healthScore - a.healthScore).slice(0, 4);

    tbody.innerHTML = topStocks.map(s => {
        const currentPrice = marketPrices[s.ticker] || s.history.prices[s.history.prices.length - 1];
        const disc = calculateDiscount(s.fairValue, currentPrice);
        const discClass = parseFloat(disc) > 0 ? "positive" : "negative";
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
                <td><span class="${discClass}">${parseFloat(disc) > 0 ? '+' : ''}${disc}%</span></td>
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

    renderMomoTrendsList("high");
    renderPortfolioDonut();
    lucide.createIcons();
}

// --- RENDER: MOMO LIST FILTER ---
function renderMomoTrendsList(momoType) {
    const list = document.getElementById("momo-trends-list");
    if (!list) return;

    const filtered = stocksData.filter(s => s.momoType === momoType);

    list.innerHTML = filtered.map(s => {
        // Price fluctuations
        const prevPrice = s.history.prices[s.history.prices.length - 2];
        const currentPrice = marketPrices[s.ticker] || s.history.prices[s.history.prices.length - 1];
        const rsiVal = marketRSIs[s.ticker] || s.rsi || 50;

        const changePercent = (((currentPrice - prevPrice) / prevPrice) * 100).toFixed(2);
        const isUp = parseFloat(changePercent) >= 0;
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
                    <span class="momo-val ${isUp ? 'positive' : 'negative'}">${isUp ? '+' : ''}${changePercent}%</span>
                    <div class="momo-metric">RSI: ${rsiVal} (${rsiVal > 70 ? 'Overbought' : rsiVal < 40 ? 'Downtrend alert' : 'Neutral'})</div>
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
        
        const price = marketPrices[s.ticker] || s.history.prices[s.history.prices.length - 1];
        const disc = parseFloat(calculateDiscount(s.fairValue, price));
        if (valuationFilter === "UNDERVALUED" && disc <= 0) return false;
        if (valuationFilter === "FAIRVALUE" && disc < 0) return false;
        
        return true;
    });

    tbody.innerHTML = filtered.map(s => {
        const price = marketPrices[s.ticker] || s.history.prices[s.history.prices.length - 1];
        const disc = calculateDiscount(s.fairValue, price);
        const discClass = parseFloat(disc) > 0 ? "positive" : "negative";
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
                <td><strong>${formatCurrency(price, s.currency)}</strong></td>
                <td><span class="${discClass}">${parseFloat(disc) > 0 ? '+' : ''}${disc}%</span></td>
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

// --- RENDER PORTFOLIO SECTION ---
function renderPortfolio() {
    const tbody = document.getElementById("portfolio-table-tbody");
    if (!tbody) return;

    let totalValue = portfolio.cash;
    let investedValue = 0;

    const rowHTML = portfolio.holdings.map(hold => {
        const s = stocksData.find(st => st.ticker === hold.ticker);
        if (!s) return '';

        const currentPrice = marketPrices[hold.ticker] || s.history.prices[s.history.prices.length - 1];
        const currentVal = hold.qty * currentPrice;
        
        investedValue += (hold.qty * hold.avgPrice);
        totalValue += currentVal;

        const pnl = ((currentPrice - hold.avgPrice) / hold.avgPrice) * 100;
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
                <td><strong>${formatCurrency(currentPrice, s.currency)}</strong></td>
                <td><span class="${pnlClass}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%</span></td>
                <td><strong>${formatCurrency(currentVal, s.currency)}</strong></td>
                <td>
                    <button class="btn btn-text" onclick="loadAnalyzerForTicker('${hold.ticker}')">View Chart</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rowHTML || `
        <tr>
            <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                You hold no stock deployments yet. Use the Trade Simulator to buy stocks!
            </td>
        </tr>
    `;

    // Total calculations
    const totalPnlVal = totalValue - 100000.00;
    const totalPnlPercent = (totalPnlVal / 100000.00) * 100;
    const pnlClass = totalPnlVal >= 0 ? "positive" : "negative";

    document.getElementById("port-total-value").textContent = formatCurrency(totalValue, "$");
    document.getElementById("port-total-cash").textContent = `Cash Balance: ${formatCurrency(portfolio.cash, "$")}`;
    document.getElementById("port-invested").textContent = formatCurrency(investedValue, "$");
    document.getElementById("port-total-pnl-val").textContent = `${totalPnlVal >= 0 ? '+' : ''}${formatCurrency(totalPnlVal, "$")} (${totalPnlPercent.toFixed(1)}%)`;
    document.getElementById("port-total-pnl-val").className = `metric-value ${pnlClass}`;

    // Fill trade dropdown options
    const select = document.getElementById("order-ticker");
    if (select) {
        select.innerHTML = stocksData.map(s => {
            const price = marketPrices[s.ticker] || s.history.prices[s.history.prices.length - 1];
            return `
                <option value="${s.ticker}">${s.ticker} - ${s.name} (${formatCurrency(price, s.currency)})</option>
            `;
        }).join('');
        
        updateEstOrderCost();
    }
}

// --- RENDER PORTFOLIO DONUT ALLOCATION ---
function renderPortfolioDonut() {
    const canvas = document.getElementById("portfolioDonutChart");
    if (!canvas) return;

    if (currentCharts["portfolioDonut"]) {
        currentCharts["portfolioDonut"].destroy();
    }

    const labels = [];
    const data = [];
    const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#a78bfa", "#34d399"];

    portfolio.holdings.forEach(hold => {
        const s = stocksData.find(st => st.ticker === hold.ticker);
        const currentPrice = marketPrices[hold.ticker] || (s ? s.history.prices[s.history.prices.length - 1] : 0);
        labels.push(hold.ticker);
        data.push(hold.qty * currentPrice);
    });

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
            plugins: { legend: { display: false } },
            cutout: '70%'
        }
    });

    const legendList = document.getElementById("portfolio-legend-list");
    if (legendList) {
        legendList.innerHTML = labels.map((lbl, idx) => {
            const sum = data.reduce((a,b) => a+b, 0);
            const percentage = sum > 0 ? ((data[idx] / sum) * 100).toFixed(0) : 0;
            return `
                <div class="legend-item">
                    <span class="legend-color-dot" style="background: ${colors[idx]}"></span>
                    <span>${lbl}: <strong>${percentage}%</strong></span>
                </div>
            `;
        }).join('');
    }
}

// --- MARKET MOOD DETAIL LINE CHART ---
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
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
            }
        }
    });
}

// --- TRANSACTION CALC ---
function updateEstOrderCost() {
    const ticker = document.getElementById("order-ticker").value;
    const qty = parseInt(document.getElementById("order-qty").value) || 0;
    const s = stocksData.find(st => st.ticker === ticker);
    const estCostLabel = document.getElementById("order-est-cost");

    if (s && estCostLabel) {
        const currentPrice = marketPrices[ticker] || s.history.prices[s.history.prices.length - 1];
        const cost = currentPrice * qty;
        estCostLabel.textContent = formatCurrency(cost, s.currency);
    }
}

// --- RENDER DYNAMIC STOCK ANALYZER VIEW ---
window.loadAnalyzerForTicker = function(ticker) {
    switchTab("analyzer");

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

    const currentPrice = marketPrices[ticker] || s.history.prices[s.history.prices.length - 1];
    const change = s.change || 0.0;
    const rsiVal = marketRSIs[ticker] || s.rsi || 50;
    
    // Copy history price array and append dynamic price as last node
    const historyPrices = [...s.history.prices];
    historyPrices[historyPrices.length - 1] = currentPrice;

    const disc = calculateDiscount(s.fairValue, currentPrice);
    const discClass = parseFloat(disc) > 0 ? "positive" : "negative";

    container.innerHTML = `
        <div class="analyzer-details-header">
            <div class="analyzer-company-title">
                <h2>${s.name} (<span style="color: #a78bfa">${s.ticker}</span>)</h2>
                <div class="analyzer-company-desc">${s.sector} Segment &bull; ${s.market} Market Asset</div>
            </div>
            <div class="analyzer-header-pricing">
                <div class="analyzer-live-price">${formatCurrency(currentPrice, s.currency)}</div>
                <div class="analyzer-live-change positive">
                    Live Active Scanning
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
            <div class="glass-card col-span-8">
                <div class="card-header">
                    <h3>Performance Timeline (Last 6 Months)</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="analyzerPriceChart"></canvas>
                </div>
            </div>

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
                        <strong>${formatCurrency(currentPrice, s.currency)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px">
                        <span>Safety discount margin:</span>
                        <strong class="${discClass}">${parseFloat(disc) > 0 ? '+' : ''}${disc}%</strong>
                    </div>
                </div>
            </div>

            <div class="glass-card col-span-6">
                <div class="card-header">
                    <h3>Quarterly Growth Analysis</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="analyzerQuarterlyChart"></canvas>
                </div>
            </div>

            <div class="glass-card col-span-6">
                <div class="card-header">
                    <h3>Future Revenue & Income Projections</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="analyzerProjectionsChart"></canvas>
                </div>
            </div>

            <div class="glass-card col-span-12">
                <div class="card-header">
                    <h3>Fundamental Summary & Momentum Audit ("Momos")</h3>
                    <span class="badge ${rsiVal > 70 ? 'badge-danger' : rsiVal < 40 ? 'badge-success' : 'badge-warning'}">
                        Momentum RSI: ${rsiVal}
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
    renderAnalyzerCharts(s, historyPrices);
};

// --- DRAW ACTIVE ANALYZER CHART OBJECTS ---
function renderAnalyzerCharts(s, historyPrices) {
    const priceCtx = document.getElementById("analyzerPriceChart");
    if (priceCtx) {
        if (currentCharts["analyzerPrice"]) currentCharts["analyzerPrice"].destroy();

        currentCharts["analyzerPrice"] = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: s.history.dates,
                datasets: [{
                    label: 'Close Price',
                    data: historyPrices,
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

// --- SETUP EVENT TRIGGERS ON NAVIGATION ---
function setupTabListeners() {
    document.querySelectorAll("[data-momo]").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("[data-momo]").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderMomoTrendsList(tab.getAttribute("data-momo"));
        });
    });

    document.getElementById("filter-market").addEventListener("change", renderScreener);
    document.getElementById("filter-score").addEventListener("change", renderScreener);
    document.getElementById("filter-valuation").addEventListener("change", renderScreener);

    document.querySelectorAll(".nav-item").forEach(btn => {
        // Clear prior listeners to avoid duplication
        btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-tab");
            if (tabId) switchTab(tabId);
        });
    });

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

    const execBtn = document.getElementById("btn-execute-order");
    if (execBtn) {
        execBtn.replaceWith(execBtn.cloneNode(true));
        document.getElementById("btn-execute-order").addEventListener("click", executeTransaction);
    }

    const qtyInput = document.getElementById("order-qty");
    if (qtyInput) qtyInput.addEventListener("input", updateEstOrderCost);
    
    const tickerSelect = document.getElementById("order-ticker");
    if (tickerSelect) tickerSelect.addEventListener("change", updateEstOrderCost);

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
        
        if (activeTab === "dashboard") drawMoodGauge(78);
    });
}
