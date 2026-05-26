// StockExpert - Core Application Intelligence & Secure API Connector

// --- DYNAMIC STOCKS LIST (Fetched from Screener.in) ---
let stocksData = [];

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

const defAuthHeaders = () => {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
};

// --- CURRENCY & PERCENTAGE HELPERS ---
function formatCurrency(val, currency = "₹") {
    // Standard currency for Indian Nifty stocks
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
                    body: JSON.stringify({ username, password })
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
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.success, "success");
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

    document.getElementById("btn-logout").addEventListener("click", async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: defAuthHeaders()
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
    
    document.getElementById("user-display-name").textContent = username;
    document.getElementById("avatar-letter").textContent = username.charAt(0).toUpperCase();

    setupTabListeners();
    setupManualScanButton();
    setupScreenerConfigListener();
    switchTab("dashboard");
    
    // Initial data load
    syncStocksList().then(() => {
        syncBackendData();
        syncScreenerConfig();
    });
    
    if (activePollingInterval) clearInterval(activePollingInterval);
    activePollingInterval = setInterval(syncBackendData, 5000);
}

// --- SCREENER CREDENTIALS DATABASE INTEGRATION ---
function setupScreenerConfigListener() {
    const toggleBtn = document.getElementById("btn-toggle-screener-form");
    const form = document.getElementById("screener-config-form");
    
    if (toggleBtn && form) {
        toggleBtn.addEventListener("click", () => {
            if (form.classList.contains("hidden")) {
                form.classList.remove("hidden");
                toggleBtn.textContent = "Close Configuration";
            } else {
                form.classList.add("hidden");
                toggleBtn.textContent = "Configure Credentials";
            }
        });
    }

    const configForm = document.getElementById("screener-config-form");
    if (configForm) {
        configForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("screener-input-email").value.trim();
            const password = document.getElementById("screener-input-password").value;

            try {
                const res = await fetch("/api/screener/config", {
                    method: "POST",
                    headers: defAuthHeaders(),
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (res.ok) {
                    showToast(data.success, "success");
                    configForm.reset();
                    configForm.classList.add("hidden");
                    if (toggleBtn) toggleBtn.textContent = "Configure Credentials";
                    await syncScreenerConfig();
                    
                    // Immediately re-trigger scanning database load to fetch live picks
                    setTimeout(() => {
                        syncStocksList().then(() => syncBackendData());
                    }, 2000);
                } else {
                    showToast(data.error || "Failed to save configuration", "error");
                }
            } catch (err) {
                showToast("Screener configuration connection error.", "error");
            }
        });
    }
}

async function syncScreenerConfig() {
    if (!getToken()) return;
    try {
        const res = await fetch("/api/screener/config", {
            headers: defAuthHeaders()
        });
        const data = await res.json();
        
        const badge = document.getElementById("screener-status-badge");
        const display = document.getElementById("screener-config-display");
        const emailLabel = document.getElementById("screener-connected-email");
        
        if (res.ok && data.connected) {
            if (badge) {
                badge.textContent = "CONNECTED";
                badge.className = "badge badge-success";
            }
            if (display) display.classList.remove("hidden");
            if (emailLabel) emailLabel.textContent = data.email;
        } else {
            if (badge) {
                badge.textContent = "DISCONNECTED";
                badge.className = "badge badge-danger";
            }
            if (display) display.classList.add("hidden");
        }
    } catch (e) {
        console.error("Screener config sync error:", e);
    }
}

// --- SCREENER MANUAL SCAN TRIGGERS ---
function setupManualScanButton() {
    const scanBtn = document.getElementById("btn-manual-scan");
    if (!scanBtn) return;

    scanBtn.addEventListener("click", async () => {
        // Add rotating spin animation classes
        const icon = scanBtn.querySelector("i");
        const span = scanBtn.querySelector("span");
        
        if (icon) icon.style.animation = "spin 1.5s linear infinite";
        if (span) span.textContent = "Scanning Screener.in Market Pages...";
        scanBtn.disabled = true;

        try {
            const res = await fetch("/api/scanner/trigger", {
                method: "POST",
                headers: defAuthHeaders()
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast(data.success, "success");
                await syncStocksList();
                await syncBackendData();
            } else {
                showToast(data.error || "Screener.in scan failed", "error");
            }
        } catch (e) {
            showToast("Failed to connect to scanner daemon.", "error");
        } finally {
            if (icon) icon.style.removeAttribute ? icon.style.removeAttribute("animation") : icon.style.animation = "";
            if (span) span.textContent = "Trigger Live Screener.in Scan";
            scanBtn.disabled = false;
        }
    });
}

// Add simple CSS spin animation dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}`;
document.head.appendChild(style);



// --- DYNAMIC STOCK DATA FETCHERS ---
async function syncStocksList() {
    if (!getToken()) return;
    try {
        const res = await fetch("/api/stocks", {
            headers: defAuthHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            stocksData = data.stocks || [];
        }
    } catch (e) {
        console.error("Stocks sync error:", e);
    }
}

async function syncBackendData() {
    if (!getToken()) return;

    try {
        const res = await fetch("/api/portfolio", {
            headers: defAuthHeaders()
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

            // Re-render views
            if (activeTab === "dashboard") {
                renderDashboard();
            } else if (activeTab === "screener") {
                renderScreener();
            } else if (activeTab === "portfolio") {
                renderPortfolio();
                renderScannerLogs();
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
            headers: defAuthHeaders(),
            body: JSON.stringify({ ticker, qty, action })
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
            headers: defAuthHeaders()
        });
        const data = await res.json();

        if (res.ok && data.logs.length > 0) {
            tbody.innerHTML = data.logs.map(log => {
                const s = stocksData.find(st => st.ticker === log.ticker);
                const currency = s ? s.currency : "₹";
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
                    <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 20px;">
                        No autonomous scanner pullouts logged yet. Scanning sweeps are operating...
                    </td>
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
            dropdown.innerHTML = `<div class="search-suggestion-item" style="font-size: 11px; padding: 10px; color: var(--text-secondary);">No scanned results. Press <strong>Enter</strong> to scrape live from Screener.in!</div>`;
        } else {
            dropdown.innerHTML = matches.map(s => `
                <div class="search-suggestion-item" data-ticker="${s.ticker}">
                    <div>
                        <span class="suggestion-ticker">${s.ticker}</span> - 
                        <span class="suggestion-name">${s.name}</span>
                    </div>
                    <span class="suggestion-market">NSE</span>
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

    // Add Keypress listener to capture ENTER key for live individual scraping
    searchInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            const query = searchInput.value.trim().toUpperCase();
            if (query.length < 2) return;

            dropdown.classList.add("hidden");
            searchInput.blur();
            
            // Check if already loaded in memory
            const existing = stocksData.find(s => s.ticker === query);
            if (existing) {
                searchInput.value = "";
                loadAnalyzerForTicker(query);
                return;
            }

            // Perform real-time scrape API request!
            showToast(`Scraping Screener.in details for individual ticker: ${query}...`, "info");
            
            try {
                const res = await fetch(`/api/stocks/search?ticker=${encodeURIComponent(query)}`, {
                    headers: defAuthHeaders()
                });
                const data = await res.json();
                
                if (res.ok && data.stock) {
                    // Prepend to our list
                    stocksData.unshift(data.stock);
                    
                    // Re-render components
                    renderAnalyzer();
                    renderScreener();
                    renderDashboard();
                    
                    // Immediately open in Stock Analyzer tab
                    searchInput.value = "";
                    loadAnalyzerForTicker(query);
                    showToast(`Scraped and loaded ${query}! verdict computed.`, "success");
                } else {
                    showToast(data.error || `Could not find stock '${query}' on Screener.in.`, "error");
                }
            } catch (err) {
                showToast("Failed to connect to search scraper API.", "error");
            }
        }
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

    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 16;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.stroke();

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
    drawMoodGauge(64); // Fear & Greed index score for Nifty

    const tbody = document.getElementById("top-picks-tbody");
    if (!tbody) return;

    if (stocksData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                    No stocks matching parameters. Click the "Trigger Live Screener.in Scan" button above to pull Nifty 100 picks!
                </td>
            </tr>
        `;
        return;
    }

    const topStocks = [...stocksData].sort((a,b) => b.healthScore - a.healthScore).slice(0, 4);

    tbody.innerHTML = topStocks.map(s => {
        const currentPrice = marketPrices[s.ticker] || s.price;
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
                        <span class="stock-name">NSE India</span>
                    </div>
                </td>
                <td><strong>${s.name}</strong></td>
                <td><span class="score-badge ${scoreClass}">${s.healthScore}</span></td>
                <td>${formatCurrency(s.fairValue)}</td>
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

    if (stocksData.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 13px;">No scans executed yet.</div>`;
        return;
    }

    const filtered = stocksData.slice(0, 3); // Display top momentum entries

    list.innerHTML = filtered.map(s => {
        const currentPrice = marketPrices[s.ticker] || s.price;
        const rsiVal = marketRSIs[s.ticker] || 52;
        const isUp = rsiVal >= 50;

        return `
            <div class="momo-item" onclick="loadAnalyzerForTicker('${s.ticker}')" style="cursor: pointer">
                <div class="momo-info">
                    <div class="momo-icon-bg ${isUp ? 'up' : 'down'}">
                        <i data-lucide="${isUp ? 'arrow-up-right' : 'arrow-down-right'}"></i>
                    </div>
                    <div class="momo-details">
                        <span class="momo-title">${s.ticker}</span>
                        <span class="momo-reason">${s.name}</span>
                    </div>
                </div>
                <div class="momo-stats">
                    <span class="momo-val ${isUp ? 'positive' : 'negative'}">${formatCurrency(currentPrice)}</span>
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

    if (stocksData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                    Empty screener. Trigger a live market scan on the Home Dashboard to load Nifty database.
                </td>
            </tr>
        `;
        return;
    }

    const marketFilter = document.getElementById("filter-market").value;
    const scoreFilter = parseInt(document.getElementById("filter-score").value);
    const valuationFilter = document.getElementById("filter-valuation").value;

    const filtered = stocksData.filter(s => {
        if (s.healthScore < scoreFilter) return false;
        const price = marketPrices[s.ticker] || s.price;
        const disc = parseFloat(calculateDiscount(s.fairValue, price));
        if (valuationFilter === "UNDERVALUED" && disc <= 0) return false;
        if (valuationFilter === "FAIRVALUE" && disc < 0) return false;
        return true;
    });

    tbody.innerHTML = filtered.map(s => {
        const price = marketPrices[s.ticker] || s.price;
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
                <td>${formatCurrency(s.fairValue)}</td>
                <td><strong>${formatCurrency(price)}</strong></td>
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

    if (stocksData.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No stocks scanned.</div>`;
        return;
    }

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
        const currency = s ? s.currency : "₹";
        const currentPrice = marketPrices[hold.ticker] || (s ? s.price : hold.avgPrice);
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
                        <span class="stock-name">${s ? s.name : 'NSE Asset'}</span>
                    </div>
                </td>
                <td>${hold.qty} shares</td>
                <td>${formatCurrency(hold.avgPrice)}</td>
                <td><strong>${formatCurrency(currentPrice)}</strong></td>
                <td><span class="${pnlClass}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%</span></td>
                <td><strong>${formatCurrency(currentVal)}</strong></td>
                <td>
                    <button class="btn btn-text" onclick="loadAnalyzerForTicker('${hold.ticker}')">View Chart</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rowHTML || `
        <tr>
            <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                You hold no stock deployments yet. Buy stocks on the simulated broker below to test autonomous scanner protection!
            </td>
        </tr>
    `;

    // Total calculations
    const totalPnlVal = totalValue - 100000.00;
    const totalPnlPercent = (totalPnlVal / 100000.00) * 100;
    const pnlClass = totalPnlVal >= 0 ? "positive" : "negative";

    document.getElementById("port-total-value").textContent = formatCurrency(totalValue);
    document.getElementById("port-total-cash").textContent = `Cash Balance: ${formatCurrency(portfolio.cash)}`;
    document.getElementById("port-invested").textContent = formatCurrency(investedValue);
    document.getElementById("port-total-pnl-val").textContent = `${totalPnlVal >= 0 ? '+' : ''}${formatCurrency(totalPnlVal)} (${totalPnlPercent.toFixed(1)}%)`;
    document.getElementById("port-total-pnl-val").className = `metric-value ${pnlClass}`;

    // Fill trade dropdown options
    const select = document.getElementById("order-ticker");
    if (select && stocksData.length > 0) {
        select.innerHTML = stocksData.map(s => {
            const price = marketPrices[s.ticker] || s.price;
            return `
                <option value="${s.ticker}">${s.ticker} - ${s.name} (${formatCurrency(price)})</option>
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
        const currentPrice = marketPrices[hold.ticker] || (s ? s.price : 0);
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

// --- MARKET MOOD LINE CHART ---
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
                label: 'Nifty Market Sentiment Score',
                data: [42, 48, 55, 50, 61, 64],
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
        const currentPrice = marketPrices[ticker] || s.price;
        const cost = currentPrice * qty;
        estCostLabel.textContent = formatCurrency(cost);
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

    const currentPrice = marketPrices[ticker] || s.price;
    const rsiVal = marketRSIs[ticker] || 52;
    
    // Formulate a 6-month historical graph
    const mockHistoryPrices = [
        currentPrice * 0.92,
        currentPrice * 0.95,
        currentPrice * 0.98,
        currentPrice * 0.94,
        currentPrice * 0.97,
        currentPrice
    ];

    const disc = calculateDiscount(s.fairValue, currentPrice);
    const discClass = parseFloat(disc) > 0 ? "positive" : "negative";

    // --- DUAL-HORIZON VERDICT ALGORITHM ---
    // Short-Term (3-6 Months) - Focus: Technical Momentum / RSI
    let shortTermVerdict = "HOLD";
    let shortTermClass = "badge-warning";
    let shortTermScore = 55;
    let shortTermDesc = `Stable neutral range. RSI is at a healthy ${rsiVal} indicating robust technical trend consolidation with headroom.`;
    
    if (rsiVal > 72) {
        shortTermVerdict = "AVOID / WAIT";
        shortTermClass = "badge-danger";
        shortTermScore = 32;
        shortTermDesc = `RSI of ${rsiVal} signals highly overbought conditions. Momentum is overextended; wait for a healthy pullback in the next 3-6 months.`;
    } else if (rsiVal >= 45 && rsiVal <= 65) {
        shortTermVerdict = "BUY";
        shortTermClass = "badge-success";
        shortTermScore = 82;
        shortTermDesc = `Strong short-term bullish trend with solid volume backing. RSI at ${rsiVal} is prime for technical entries over 3-6 months.`;
    } else if (rsiVal < 38) {
        shortTermVerdict = "ACCUMULATE";
        shortTermClass = "badge-info";
        shortTermScore = 75;
        shortTermDesc = `Oversold territory (RSI: ${rsiVal}). Momentum is carving a bottom; perfect for accumulating a reversal play.`;
    }

    // Long-Term (1 Year +) - Focus: Fundamental Solvency & Margin of Safety Discount
    let longTermVerdict = "HOLD";
    let longTermClass = "badge-warning";
    let longTermScore = 65;
    let longTermDesc = "Decent financial indicators, but trades close to fair value. Monitor top-line quarterly growth cycles.";
    
    const parsedDisc = parseFloat(disc);
    const isHealthy = s.roe > 15 && s.de < 0.8;
    
    if (isHealthy && parsedDisc >= 12.0) {
        longTermVerdict = "STRONG BUY";
        longTermClass = "badge-success";
        longTermScore = 94;
        longTermDesc = `Outstanding fundamental pillars! High ROCE/ROE (${s.roe}%), safe debt leverage (${s.de}), and trading at an excellent safety discount of ${parsedDisc}%. Ideal long-term compounder.`;
    } else if (isHealthy && parsedDisc > 0) {
        longTermVerdict = "ACCUMULATE";
        longTermClass = "badge-info";
        longTermScore = 82;
        longTermDesc = `Solid operational foundations with ROE of ${s.roe}%. Trading at a modest margin of safety (${parsedDisc}%). Suitable for active accumulation.`;
    } else if (parsedDisc < -10) {
        longTermVerdict = "AVOID / OVERVALUED";
        longTermClass = "badge-danger";
        longTermScore = 40;
        longTermDesc = `Fundamentally overvalued relative to computed intrinsic value. Trading at a premium of ${Math.abs(parsedDisc)}%. High risk for long-term entry at current prices.`;
    }

    container.innerHTML = `
        <div class="analyzer-details-header">
            <div class="analyzer-company-title">
                <h2>${s.name} (<span style="color: #a78bfa">${s.ticker}</span>)</h2>
                <div class="analyzer-company-desc">Indian Stock &bull; Screener.in Scanned</div>
            </div>
            <div class="analyzer-header-pricing">
                <div class="analyzer-live-price">${formatCurrency(currentPrice)}</div>
                <div class="analyzer-live-change positive">
                    Live Scanned Quotes
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

            <!-- Dual-Horizon Verdict Workspace -->
            <div class="glass-card col-span-4" style="border: 1px solid rgba(139, 92, 246, 0.25);">
                <div class="card-header">
                    <h3>Dual-Horizon Verdict</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 18px">
                    <!-- Short-Term (3-6 Months) -->
                    <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">SHORT-TERM (3-6 Mos)</span>
                            <span class="badge ${shortTermClass}" style="font-size: 10px;">${shortTermVerdict}</span>
                        </div>
                        <div style="font-size: 11px; color: var(--text-primary); line-height: 1.4;">
                            ${shortTermDesc}
                        </div>
                        <div style="font-size: 10px; color: var(--text-secondary); margin-top: 6px;">
                            Score: <strong>${shortTermScore} / 100</strong> (Focus: Technical Momentum)
                        </div>
                    </div>
                    
                    <!-- Long-Term (1 Year +) -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">LONG-TERM (1 Yr +)</span>
                            <span class="badge ${longTermClass}" style="font-size: 10px;">${longTermVerdict}</span>
                        </div>
                        <div style="font-size: 11px; color: var(--text-primary); line-height: 1.4;">
                            ${longTermDesc}
                        </div>
                        <div style="font-size: 10px; color: var(--text-secondary); margin-top: 6px;">
                            Score: <strong>${longTermScore} / 100</strong> (Focus: Fundamental Value)
                        </div>
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
                            <li class="point-item">
                                <i data-lucide="check" class="point-icon up"></i>
                                <span>High return on equity of ${s.roe}% shows excellent capital efficiency.</span>
                            </li>
                            <li class="point-item">
                                <i data-lucide="check" class="point-icon up"></i>
                                <span>Comfortable debt-to-equity leverage of ${s.de} validates clean solvency.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="col-span-6">
                        <h4>Risks & Concerns</h4>
                        <ul class="analysis-points-box" style="margin-top: 10px">
                            <li class="point-item">
                                <i data-lucide="alert-triangle" class="point-icon down"></i>
                                <span>Trading at P/E of ${s.pe} requires sustained top-line quarterly growth.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
    renderAnalyzerCharts(s, mockHistoryPrices);
};

// --- DRAW ACTIVE ANALYZER CHART OBJECTS ---
function renderAnalyzerCharts(s, historyPrices) {
    const priceCtx = document.getElementById("analyzerPriceChart");
    if (priceCtx) {
        if (currentCharts["analyzerPrice"]) currentCharts["analyzerPrice"].destroy();

        currentCharts["analyzerPrice"] = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
                datasets: [{
                    label: 'Close Price (INR)',
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

        // Calculate sample Nifty quarterly records
        const baseRev = s.price * 10;
        currentCharts["analyzerQuarterly"] = new Chart(quarterlyCtx, {
            type: 'bar',
            data: {
                labels: ["Q2-25", "Q3-25", "Q4-25", "Q1-26"],
                datasets: [
                    {
                        label: 'Sales Revenue (Cr)',
                        data: [baseRev * 0.9, baseRev * 0.95, baseRev * 1.05, baseRev],
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    },
                    {
                        label: 'Net Profit (Cr)',
                        data: [baseRev * 0.1, baseRev * 0.12, baseRev * 0.15, baseRev * 0.14],
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

        const baseRev = s.price * 10;
        currentCharts["analyzerProjections"] = new Chart(projectionsCtx, {
            type: 'line',
            data: {
                labels: ["2026 (Est)", "2027 (Est)", "2028 (Est)"],
                datasets: [
                    {
                        label: 'Projected Sales (Cr)',
                        data: [baseRev * 1.15, baseRev * 1.3, baseRev * 1.5],
                        borderColor: '#a78bfa',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.1
                    },
                    {
                        label: 'Projected Profit (Cr)',
                        data: [baseRev * 0.16, baseRev * 0.19, baseRev * 0.22],
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
        
        if (activeTab === "dashboard") drawMoodGauge(64);
    });
}
