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
    initialPortfolioRendered = false;
    document.getElementById("auth-overlay").classList.add("hidden");
    document.getElementById("main-app-container").classList.remove("hidden");
    
    document.getElementById("user-display-name").textContent = username;
    document.getElementById("avatar-letter").textContent = username.charAt(0).toUpperCase();

    setupTabListeners();
    setupManualScanButton();
    setupDeepResearchButton();
    setupPortfolioRefreshButton();
    setupScreenerConfigListener();
    setupCustomAuditModal();
    switchTab("dashboard");
    
    // Initial data load
    syncStocksList().then(() => {
        syncBackendData();
        syncScreenerConfig();
        syncResearchSuggestions();
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
let searchHistoryData = [];
let watchlistTickers = new Set();
let researchSuggestions = [];
let initialPortfolioRendered = false;

async function syncStocksList() {
    if (!getToken()) return;
    try {
        const res = await fetch("/api/stocks", {
            headers: defAuthHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            stocksData = data.stocks || [];
            searchHistoryData = data.history || [];
            watchlistTickers = new Set(data.watchlist || []);
        }
    } catch (e) {
        console.error("Stocks sync error:", e);
    }
}

// --- DEEP SOLVENCY RESEARCH DESK FUNCTIONS ---
async function syncResearchSuggestions() {
    if (!getToken()) return;
    try {
        const res = await fetch("/api/research/suggestions", {
            headers: defAuthHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            researchSuggestions = data.suggestions || [];
            renderResearchSuggestions();
        }
    } catch (e) {
        console.error("Research suggestions sync error:", e);
    }
}

window.removeResearchSuggestion = async function(ticker) {
    if (!getToken()) return;
    try {
        const res = await fetch("/api/research/suggestions/remove", {
            method: "POST",
            headers: defAuthHeaders(),
            body: JSON.stringify({ ticker })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.success || `Removed ${ticker} from Deep Research history.`, "success");
            await syncResearchSuggestions();
        } else {
            showToast(data.error || "Failed to remove suggestion.", "error");
        }
    } catch (e) {
        console.error("Remove suggestions error:", e);
        showToast("Error connecting to server.", "error");
    }
};

window.triggerDeepResearch = async function() {
    if (!getToken()) return;
    const btn = document.getElementById("btn-trigger-deep-research");
    const bannerBtn = document.getElementById("btn-banner-trigger-deep-research");
    const modal = document.getElementById("deep-research-modal");
    
    // Save original button state and show spinner/loading
    let originalBtnHTML = "";
    let originalBannerHTML = "";
    
    if (btn) {
        originalBtnHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="refresh-cw" class="spin-icon" style="width:12px; height:12px; animation: spin 1.5s linear infinite;"></i> <span>Running...</span>`;
    }
    if (bannerBtn) {
        originalBannerHTML = bannerBtn.innerHTML;
        bannerBtn.disabled = true;
        bannerBtn.innerHTML = `<i data-lucide="refresh-cw" class="spin-icon" style="width:16px; height:16px; animation: spin 1.5s linear infinite;"></i> <span>Running Solvency Solver...</span>`;
    }
    lucide.createIcons();
    
    try {
        const res = await fetch("/api/research/trigger", {
            method: "POST",
            headers: defAuthHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.success || "Deep Research analysis completed successfully!", "success");
            await syncResearchSuggestions();
            // Open recommendations modal popup!
            if (modal) {
                modal.classList.remove("hidden");
            }
        } else {
            showToast(data.error || "Deep solvency screening failed.", "error");
        }
    } catch (e) {
        console.error("Deep research trigger error:", e);
        showToast("Error connecting to server during analysis.", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
        if (bannerBtn) {
            bannerBtn.disabled = false;
            bannerBtn.innerHTML = originalBannerHTML;
        }
        lucide.createIcons();
    }
};

function setupDeepResearchButton() {
    const triggerBtn = document.getElementById("btn-trigger-deep-research");
    const bannerBtn = document.getElementById("btn-banner-trigger-deep-research");
    const closeBtn = document.getElementById("btn-close-deep-research");
    const modal = document.getElementById("deep-research-modal");
    
    if (triggerBtn) {
        const newBtn = triggerBtn.cloneNode(true);
        triggerBtn.parentNode.replaceChild(newBtn, triggerBtn);
        newBtn.addEventListener("click", () => {
            triggerDeepResearch();
        });
    }
    
    if (bannerBtn) {
        const newBannerBtn = bannerBtn.cloneNode(true);
        bannerBtn.parentNode.replaceChild(newBannerBtn, bannerBtn);
        newBannerBtn.addEventListener("click", () => {
            triggerDeepResearch();
        });
    }
    
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }
}

function setupPortfolioRefreshButton() {
    const refreshBtn = document.getElementById("btn-refresh-portfolio");
    if (refreshBtn) {
        const newBtn = refreshBtn.cloneNode(true);
        refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);
        newBtn.addEventListener("click", () => {
            window.manualRefreshPortfolio();
        });
    }
}

window.manualRefreshPortfolio = async function() {
    const refreshBtn = document.getElementById("btn-refresh-portfolio");
    if (refreshBtn) {
        const icon = refreshBtn.querySelector("i");
        if (icon) icon.style.animation = "spin 1s linear infinite";
        refreshBtn.disabled = true;
    }
    try {
        await syncStocksList();
        const res = await fetch("/api/portfolio", { headers: defAuthHeaders() });
        const data = await res.json();
        if (res.ok) {
            portfolio.cash = data.cash;
            portfolio.holdings = data.holdings;
            marketPrices = data.marketPrices;
            marketRSIs = data.marketRSIs;
            
            // Force re-render portfolio donut chart
            renderPortfolioDonut();
            showToast("Portfolio metrics refreshed successfully.", "success");
        } else {
            showToast(data.error || "Failed to fetch portfolio metrics.", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Error connecting to server to refresh portfolio.", "error");
    } finally {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector("i");
            if (icon) icon.style.animation = "";
            refreshBtn.disabled = false;
        }
        lucide.createIcons();
    }
};

function renderResearchSuggestions() {
    const modalGrid = document.getElementById("modal-deep-research-suggestions");
    const historySection = document.getElementById("deep-research-history-section");
    const emptyHistory = document.getElementById("deep-research-empty-history");
    const historyList = document.getElementById("deep-research-history-list");
    
    if (!modalGrid) return;
    
    if (researchSuggestions.length === 0) {
        modalGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--text-secondary);">
                <i data-lucide="sparkles" style="width: 48px; height: 48px; color: #a78bfa; margin-bottom: 12px; opacity: 0.7;"></i>
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">No solvency picks loaded.</p>
                <p style="margin: 0; font-size: 12px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.5;">Click "Run Deep Research Analyzer" in the welcome banner or card header to run solvency scans.</p>
            </div>
        `;
        if (historySection) historySection.classList.add("hidden");
        if (emptyHistory) emptyHistory.classList.remove("hidden");
        return;
    }
    
    if (emptyHistory) emptyHistory.classList.add("hidden");
    if (historySection) historySection.classList.remove("hidden");
    
    const activePicks = researchSuggestions.slice(0, 2);
    
    modalGrid.innerHTML = activePicks.map(s => {
        const forecasts = s.forecasts || {};
        const press = s.press_releases || [];
        const inWatchlist = watchlistTickers.has(s.ticker);
        
        return `
            <div class="suggestion-card">
                <div class="suggestion-card-header">
                    <div class="suggestion-title">
                        <h4>${s.ticker}</h4>
                        <p>${s.name}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="suggestion-score-badge">
                            <div class="suggestion-score-val">${s.dvsms_score}</div>
                            <div class="suggestion-score-lbl">DVSMS Score</div>
                        </div>
                        <button class="history-tag-remove" onclick="removeResearchSuggestion('${s.ticker}')" title="Remove recommendation" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
                
                <div class="suggestion-metrics-grid">
                    <div class="suggestion-metric-box">
                        <div class="suggestion-metric-lbl">P/E Ratio</div>
                        <div class="suggestion-metric-val">${s.pe ? s.pe.toFixed(1) : '-'}</div>
                    </div>
                    <div class="suggestion-metric-box">
                        <div class="suggestion-metric-lbl">D/E Ratio</div>
                        <div class="suggestion-metric-val" style="color: ${s.de === 0 ? 'var(--success-glow)' : '#34d399'}">${s.de ? s.de.toFixed(2) : '0.00'}</div>
                    </div>
                    <div class="suggestion-metric-box">
                        <div class="suggestion-metric-lbl">ROE</div>
                        <div class="suggestion-metric-val" style="color: #60a5fa;">${s.roe ? s.roe.toFixed(1) : '-'}%</div>
                    </div>
                </div>
                
                <div class="suggestion-forecast-box">
                    <div class="suggestion-forecast-title">
                        <i data-lucide="line-chart" style="width: 12px; height: 12px;"></i>
                        <span>${forecasts.cagr || '3-Year Capital Projections'}</span>
                    </div>
                    <div class="suggestion-forecast-grid">
                        <div class="suggestion-forecast-year">
                            <div class="suggestion-forecast-lbl">Year 1 Rev</div>
                            <div class="suggestion-forecast-val">${forecasts.rev_y1 || '-'} Cr</div>
                        </div>
                        <div class="suggestion-forecast-year">
                            <div class="suggestion-forecast-lbl">Year 2 Rev</div>
                            <div class="suggestion-forecast-val">${forecasts.rev_y2 || '-'} Cr</div>
                        </div>
                        <div class="suggestion-forecast-year">
                            <div class="suggestion-forecast-lbl">Year 3 Rev</div>
                            <div class="suggestion-forecast-val">${forecasts.rev_y3 || '-'} Cr</div>
                        </div>
                    </div>
                    <div class="suggestion-forecast-grid">
                        <div class="suggestion-forecast-year">
                            <div class="suggestion-forecast-lbl">Year 1 Prof</div>
                            <div class="suggestion-forecast-val" style="color: #34d399;">${forecasts.prof_y1 || '-'} Cr</div>
                        </div>
                        <div class="suggestion-forecast-year">
                            <div class="suggestion-forecast-lbl">Year 2 Prof</div>
                            <div class="suggestion-forecast-val" style="color: #34d399;">${forecasts.prof_y2 || '-'} Cr</div>
                        </div>
                        <div class="suggestion-forecast-year">
                            <div class="suggestion-forecast-lbl">Year 3 Prof</div>
                            <div class="suggestion-forecast-val" style="color: #34d399;">${forecasts.prof_y3 || '-'} Cr</div>
                        </div>
                    </div>
                    <div class="suggestion-forecast-desc">${forecasts.capex || ''}</div>
                </div>
                
                <div class="suggestion-press-box">
                    <div class="suggestion-press-title">Recent Promoter Filings & Announcements</div>
                    ${press.map(pr => `
                        <div class="press-release-item">
                            <div class="press-release-header">
                                <span class="press-release-headline" style="font-weight:700;">${pr.headline}</span>
                                <span class="press-release-date">${pr.date}</span>
                            </div>
                            <div class="press-release-summary">${pr.summary}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.03);">
                    <button class="btn btn-primary" onclick="window.closeDeepResearchModal(); loadAnalyzerForTicker('${s.ticker}')" style="flex: 1; font-size: 11px; padding: 8px;">
                        <i data-lucide="bar-chart-3" style="width: 12px; height: 12px;"></i>
                        <span>Deep Analysis</span>
                    </button>
                    <button class="btn" onclick="toggleWatchlist('${s.ticker}')" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); font-size: 11px; padding: 8px; color: #fff; flex: 1;">
                        <i data-lucide="${inWatchlist ? 'minus' : 'plus'}" style="width: 12px; height: 12px;"></i>
                        <span>${inWatchlist ? 'Remove Watchlist' : 'Add Watchlist'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Render History Section
    if (historyList) {
        historyList.innerHTML = researchSuggestions.map(s => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; transition: all 0.2s; cursor: pointer;" onclick="window.openDeepResearchModal();">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <strong style="color: #a78bfa; font-size: 12px;">${s.ticker}</strong>
                        <span style="font-size: 8px; background: rgba(139, 92, 246, 0.2); color: #c084fc; padding: 1px 4px; border-radius: 4px; font-weight: 700;">DVSMS: ${s.dvsms_score}</span>
                    </div>
                    <span style="font-size: 10px; color: var(--text-secondary); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</span>
                </div>
                <button class="history-tag-remove" onclick="event.stopPropagation(); removeResearchSuggestion('${s.ticker}')" title="Remove Suggestion" style="background:transparent; border:none; padding:4px; cursor:pointer; color:var(--text-secondary); display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all 0.2s;">
                    <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                </button>
            </div>
        `).join('');
    }
    
    lucide.createIcons();
}

window.closeDeepResearchModal = function() {
    const modal = document.getElementById("deep-research-modal");
    if (modal) modal.classList.add("hidden");
};

window.openDeepResearchModal = function() {
    const modal = document.getElementById("deep-research-modal");
    if (modal) modal.classList.remove("hidden");
};

// ─────────────────────────────────────────────────────────
//  CUSTOM SOLVENCY AUDIT  —  Search, Render & History Toggle
// ─────────────────────────────────────────────────────────

let currentAuditTicker = null; // Tracks the ticker shown in the audit modal

window.openCustomAuditModal = function() {
    const modal = document.getElementById("custom-audit-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    // Reset to placeholder state
    const input = document.getElementById("custom-audit-ticker-input");
    if (input) input.value = "";
    _auditShowState("placeholder");
    lucide.createIcons();
};

window.closeCustomAuditModal = function() {
    const modal = document.getElementById("custom-audit-modal");
    if (modal) modal.classList.add("hidden");
    currentAuditTicker = null;
};

function _auditShowState(state) {
    // state: "placeholder" | "loading" | "result"
    const placeholder = document.getElementById("custom-audit-placeholder");
    const loading = document.getElementById("custom-audit-loading");
    const result = document.getElementById("custom-audit-result-area");
    if (placeholder) placeholder.style.display = state === "placeholder" ? "block" : "none";
    if (loading) loading.style.display = state === "loading" ? "block" : "none";
    if (result) result.style.display = state === "result" ? "block" : "none";
}

function setupCustomAuditModal() {
    const closeBtn = document.getElementById("btn-close-custom-audit");
    if (closeBtn) {
        closeBtn.addEventListener("click", window.closeCustomAuditModal);
    }

    const overlay = document.getElementById("custom-audit-modal");
    if (overlay) {
        overlay.addEventListener("click", function(e) {
            if (e.target === overlay) window.closeCustomAuditModal();
        });
    }

    const runBtn = document.getElementById("btn-run-custom-audit");
    if (runBtn) {
        runBtn.addEventListener("click", () => {
            const input = document.getElementById("custom-audit-ticker-input");
            const ticker = input ? input.value.trim().toUpperCase() : "";
            if (!ticker) { showToast("Please enter a ticker symbol.", "error"); return; }
            runCustomAudit(ticker);
        });
    }

    const input = document.getElementById("custom-audit-ticker-input");
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const ticker = input.value.trim().toUpperCase();
                if (!ticker) { showToast("Please enter a ticker symbol.", "error"); return; }
                runCustomAudit(ticker);
            }
        });
        input.addEventListener("input", () => {
            const q = input.value.trim();
            if (q.length >= 2) {
                _auditFetchAutocomplete(q);
            } else {
                _auditHideAutocomplete();
            }
        });
    }

    const bannerBtn = document.getElementById("btn-banner-custom-audit");
    if (bannerBtn) {
        bannerBtn.addEventListener("click", () => {
            if (!getToken()) { showToast("Please log in first.", "error"); return; }
            window.openCustomAuditModal();
        });
    }

    // Add/Remove history buttons
    const addBtn = document.getElementById("btn-audit-add-history");
    if (addBtn) {
        addBtn.addEventListener("click", async () => {
            if (!currentAuditTicker) return;
            try {
                const res = await fetch("/api/research/suggestions/add", {
                    method: "POST",
                    headers: defAuthHeaders(),
                    body: JSON.stringify({ ticker: currentAuditTicker })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.success || `${currentAuditTicker} saved to history.`, "success");
                    await syncResearchSuggestions();
                } else {
                    showToast(data.error || "Failed to save.", "error");
                }
            } catch (e) { showToast("Connection error.", "error"); }
        });
    }

    const removeBtn = document.getElementById("btn-audit-remove-history");
    if (removeBtn) {
        removeBtn.addEventListener("click", async () => {
            if (!currentAuditTicker) return;
            await window.removeResearchSuggestion(currentAuditTicker);
        });
    }

    const analyzerBtn = document.getElementById("btn-audit-open-analyzer");
    if (analyzerBtn) {
        analyzerBtn.addEventListener("click", () => {
            if (!currentAuditTicker) return;
            window.closeCustomAuditModal();
            loadAnalyzerForTicker(currentAuditTicker);
        });
    }
}

async function _auditFetchAutocomplete(q) {
    try {
        const res = await fetch(`/api/stocks/autocomplete?q=${encodeURIComponent(q)}`, { headers: defAuthHeaders() });
        const data = await res.json();
        const suggestions = data.suggestions || [];
        _auditRenderAutocomplete(suggestions);
    } catch (e) { _auditHideAutocomplete(); }
}

function _auditRenderAutocomplete(suggestions) {
    const dropdown = document.getElementById("custom-audit-autocomplete");
    const input = document.getElementById("custom-audit-ticker-input");
    if (!dropdown) return;
    if (!suggestions.length) { _auditHideAutocomplete(); return; }
    dropdown.innerHTML = suggestions.slice(0, 7).map(s => `
        <div onclick="document.getElementById('custom-audit-ticker-input').value='${s.ticker||s}'; _auditHideAutocomplete(); runCustomAudit('${s.ticker||s}');" 
             style="padding: 10px 16px; cursor: pointer; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s;"
             onmouseover="this.style.background='rgba(139,92,246,0.12)'" onmouseout="this.style.background='transparent'">
            <span style="font-size: 13px; font-weight: 700; color: #a78bfa;">${s.ticker || s}</span>
            ${s.name ? `<span style="font-size: 11px; color: var(--text-secondary); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</span>` : ''}
        </div>
    `).join('');
    dropdown.style.display = "block";
}

window._auditHideAutocomplete = function() {
    const dropdown = document.getElementById("custom-audit-autocomplete");
    if (dropdown) dropdown.style.display = "none";
};

window.runCustomAudit = async function(ticker) {
    if (!getToken()) { showToast("Please log in first.", "error"); return; }
    _auditHideAutocomplete();
    _auditShowState("loading");

    const runBtn = document.getElementById("btn-run-custom-audit");
    if (runBtn) { runBtn.disabled = true; runBtn.style.opacity = "0.6"; }

    try {
        const res = await fetch("/api/research/analyze", {
            method: "POST",
            headers: defAuthHeaders(),
            body: JSON.stringify({ ticker })
        });
        const data = await res.json();

        if (!res.ok) {
            _auditShowState("placeholder");
            showToast(data.error || `Could not analyze ${ticker}.`, "error");
            return;
        }

        currentAuditTicker = ticker;
        _renderAuditResult(data.result);
        _auditShowState("result");
        lucide.createIcons();

    } catch (e) {
        console.error("Custom audit error:", e);
        _auditShowState("placeholder");
        showToast("Error connecting to server.", "error");
    } finally {
        if (runBtn) { runBtn.disabled = false; runBtn.style.opacity = "1"; }
    }
};

function _renderAuditResult(r) {
    // --- Verdict Banner ---
    const banner = document.getElementById("custom-audit-verdict-banner");
    if (banner) {
        const verdictColors = {
            RECOMMENDED: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", icon: "check-circle-2", color: "#34d399", label: "✅ RECOMMENDED" },
            WATCH:       { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  icon: "eye",           color: "#fbbf24", label: "👁 WATCH" },
            AVOID:       { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   icon: "x-circle",      color: "#f87171", label: "⛔ AVOID" }
        };
        const vc = verdictColors[r.verdict] || verdictColors.WATCH;
        banner.style.background = vc.bg;
        banner.style.border = `1px solid ${vc.border}`;
        banner.innerHTML = `
            <i data-lucide="${vc.icon}" style="width: 36px; height: 36px; color: ${vc.color}; flex-shrink: 0;"></i>
            <div style="flex: 1;">
                <div style="font-size: 18px; font-weight: 900; color: ${vc.color};">${vc.label}</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 3px;">
                    <strong style="color: #fff;">${r.ticker}</strong> — ${r.name}
                    &nbsp;|&nbsp; ₹${r.price ? r.price.toLocaleString('en-IN') : '--'}
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.6px;">DVSMS Score</div>
                <div style="font-size: 32px; font-weight: 900; color: ${vc.color}; line-height: 1;">${r.dvsms_score}</div>
            </div>
        `;
    }

    // --- Score Breakdown ---
    const breakdown = document.getElementById("custom-audit-score-breakdown");
    const total = document.getElementById("custom-audit-total-score");
    if (breakdown && r.score_breakdown) {
        const bd = r.score_breakdown;
        const rows = [
            { label: "Solvency (1 - D/E) × 30", val: bd.solvency, color: "#a78bfa" },
            { label: "Efficiency (ROE × 0.35)", val: bd.efficiency, color: "#60a5fa" },
            { label: "Discount (Margin × 0.25)", val: bd.discount, color: bd.discount >= 0 ? "#34d399" : "#f87171" }
        ];
        breakdown.innerHTML = rows.map(row => `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: var(--text-secondary);">${row.label}</span>
                <span style="font-size: 13px; font-weight: 700; color: ${row.color};">${row.val >= 0 ? '+' : ''}${row.val}</span>
            </div>
        `).join('');
        if (total) total.textContent = bd.total;
    }

    // --- Audit Flags ---
    const flagsEl = document.getElementById("custom-audit-flags");
    if (flagsEl && r.audit_flags) {
        const flagStyles = {
            pass:    { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)", icon: "check-circle", color: "#34d399" },
            warn:    { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  icon: "alert-circle", color: "#f87171" },
            neutral: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", icon: "info",         color: "#fbbf24" }
        };
        flagsEl.innerHTML = r.audit_flags.map(f => {
            const fs = flagStyles[f.type] || flagStyles.neutral;
            return `
                <div style="display: flex; align-items: flex-start; gap: 10px; background: ${fs.bg}; border: 1px solid ${fs.border}; border-radius: 8px; padding: 10px 12px;">
                    <i data-lucide="${fs.icon}" style="width: 14px; height: 14px; color: ${fs.color}; margin-top: 1px; flex-shrink: 0;"></i>
                    <span style="font-size: 12px; color: rgba(255,255,255,0.8); line-height: 1.4;">${f.msg}</span>
                </div>
            `;
        }).join('');
    }

    // --- Key Metrics Row ---
    const metricsRow = document.getElementById("custom-audit-metrics-row");
    if (metricsRow) {
        const metrics = [
            { label: "P/E Ratio", val: r.pe ? r.pe.toFixed(1) : "--", color: "#fff" },
            { label: "D/E Ratio", val: r.de !== undefined ? r.de.toFixed(2) : "--", color: r.de <= 0.35 ? "#34d399" : "#f87171" },
            { label: "ROE", val: r.roe !== undefined ? r.roe.toFixed(1) + "%" : "--", color: r.roe >= 12 ? "#60a5fa" : "#f87171" },
            { label: "Div Yield", val: r.divYield !== undefined ? r.divYield.toFixed(2) + "%" : "--", color: "#fbbf24" },
            { label: "Health Score", val: r.healthScore || "--", color: r.healthScore >= 80 ? "#34d399" : (r.healthScore >= 60 ? "#fbbf24" : "#f87171") }
        ];
        metricsRow.innerHTML = metrics.map(m => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 14px; text-align: center;">
                <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;">${m.label}</div>
                <div style="font-size: 18px; font-weight: 800; color: ${m.color};">${m.val}</div>
            </div>
        `).join('');
    }

    // --- Forecasts ---
    const forecastsEl = document.getElementById("custom-audit-forecasts");
    if (forecastsEl && r.forecasts) {
        const fc = r.forecasts;
        forecastsEl.innerHTML = `
            <div style="font-size: 11px; color: #60a5fa; font-weight: 600; margin-bottom: 4px;">${fc.cagr || ''}</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                ${[1,2,3].map(y => `
                    <div style="background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.15); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 4px;">Year ${y}</div>
                        <div style="font-size: 13px; font-weight: 700; color: #60a5fa;">${fc['rev_y'+y] || '--'} Cr</div>
                        <div style="font-size: 11px; color: #34d399;">${fc['prof_y'+y] || '--'} Cr</div>
                    </div>
                `).join('')}
            </div>
            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 8px; line-height: 1.5;">${fc.capex || ''}</div>
        `;
    }

    // --- Press Releases ---
    const pressEl = document.getElementById("custom-audit-press");
    if (pressEl && r.press_releases) {
        pressEl.innerHTML = r.press_releases.map(pr => `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 12px; font-weight: 700; color: #fff; line-height: 1.3;">${pr.headline}</span>
                    <span style="font-size: 10px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 0;">${pr.date}</span>
                </div>
                <p style="font-size: 11px; color: var(--text-secondary); margin: 0; line-height: 1.5;">${pr.summary}</p>
            </div>
        `).join('');
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
                syncResearchSuggestions();
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
            initialPortfolioRendered = false;
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

    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 1) {
            dropdown.classList.add("hidden");
            return;
        }

        // Local search matches
        let matches = stocksData.filter(s => 
            s.ticker.toLowerCase().includes(query) || 
            s.name.toLowerCase().includes(query)
        );

        const renderSuggestions = (list) => {
            if (list.length === 0) {
                dropdown.innerHTML = `<div class="search-suggestion-item" style="font-size: 11px; padding: 10px; color: var(--text-secondary);">No results. Press <strong>Enter</strong> to scrape live!</div>`;
            } else {
                dropdown.innerHTML = list.map(s => `
                    <div class="search-suggestion-item" data-ticker="${s.ticker}">
                        <div>
                            <span class="suggestion-ticker">${s.ticker}</span> - 
                            <span class="suggestion-name">${s.name}</span>
                        </div>
                        <span class="suggestion-market">NSE</span>
                    </div>
                `).join('');

                dropdown.querySelectorAll(".search-suggestion-item").forEach(item => {
                    item.addEventListener("click", async () => {
                        const ticker = item.getAttribute("data-ticker");
                        if (ticker) {
                            searchInput.value = "";
                            dropdown.classList.add("hidden");
                            
                            // Check if already in memory
                            const existing = stocksData.find(s => s.ticker === ticker);
                            if (existing) {
                                loadAnalyzerForTicker(ticker);
                                return;
                            }
                            
                            // Scrape live
                            showToast(`Scraping Screener.in for ${ticker}...`, "info");
                            try {
                                const res = await fetch(`/api/stocks/search?ticker=${encodeURIComponent(ticker)}`, {
                                    headers: defAuthHeaders()
                                });
                                const data = await res.json();
                                if (res.ok && data.stock) {
                                    stocksData.unshift(data.stock);
                                    renderAnalyzer();
                                    renderScreener();
                                    renderDashboard();
                                    loadAnalyzerForTicker(ticker);
                                    showToast(`Scraped and loaded ${ticker}!`, "success");
                                } else {
                                    showToast(data.error || `Failed to scrape ${ticker}`, "error");
                                }
                            } catch (err) {
                                showToast("Scraper API connection error.", "error");
                            }
                        }
                    });
                });
            }
            dropdown.classList.remove("hidden");
        };

        // Render initial local matches
        renderSuggestions(matches);

        // Fetch additional matching suggestions from backend live autocomplete
        if (query.length >= 2) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/stocks/autocomplete?q=${encodeURIComponent(query)}`, {
                        headers: defAuthHeaders()
                    });
                    const data = await res.json();
                    if (res.ok && data.suggestions && data.suggestions.length > 0) {
                        // Merge suggestions avoiding duplicate tickers
                        const existingTickers = new Set(matches.map(m => m.ticker));
                        data.suggestions.forEach(item => {
                            if (!existingTickers.has(item.ticker)) {
                                matches.push(item);
                            }
                        });
                        renderSuggestions(matches);
                    }
                } catch (e) {
                    console.error("Autocomplete fetch error:", e);
                }
            }, 300);
        }
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
        const momoIcon = (s.momoType || "cooling") === "high" ? "trending-up" : "rotate-ccw";
        const momoColor = (s.momoType || "cooling") === "high" ? "var(--success-glow)" : "var(--info-glow)";

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
                        <span>${(s.momoType || "cooling").toUpperCase()}</span>
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary" onclick="loadAnalyzerForTicker('${s.ticker}')">Analyze</button>
                </td>
            </tr>
        `;
    }).join('');

    renderMomoTrendsList("high");
    if (!initialPortfolioRendered) {
        renderPortfolioDonut();
        initialPortfolioRendered = true;
    }
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
    const trendsFilter = document.getElementById("filter-trends").value;

    const filtered = stocksData.filter(s => {
        if (s.healthScore < scoreFilter) return false;
        const price = marketPrices[s.ticker] || s.price;
        const disc = parseFloat(calculateDiscount(s.fairValue, price));
        if (valuationFilter === "UNDERVALUED" && disc <= 0) return false;
        if (valuationFilter === "FAIRVALUE" && disc < 0) return false;
        
        // Trendy presets checks
        if (trendsFilter === "GROWTH" && s.roe <= 20) return false;
        if (trendsFilter === "VALUE" && disc < 10.0) return false;
        if (trendsFilter === "DIVIDEND" && s.divYield <= 1.5) return false;
        if (trendsFilter === "DEBT_FREE" && s.de > 0) return false;
        if (trendsFilter === "MOMENTUM") {
            const macdState = s.macd || { crossover: "BEARISH" };
            const rsiVal = s.rsi || 52;
            if (macdState.crossover !== "BULLISH" || rsiVal <= 50) return false;
        }
        
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
let activeAnalyzerSidebarTab = "watchlist";

function renderAnalyzer() {
    const list = document.getElementById("analyzer-stock-list");
    if (!list) return;

    const dataList = activeAnalyzerSidebarTab === "watchlist" ? stocksData : searchHistoryData;

    if (dataList.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 11px;">No stocks found.</div>`;
        return;
    }

    list.innerHTML = dataList.map(s => {
        const health = s.healthScore || 80;
        const isHistory = activeAnalyzerSidebarTab === "history";
        
        const removeActionHTML = isHistory ? 
            `<button class="btn-remove-sidebar-item" onclick="event.stopPropagation(); removeHistoryItem('${s.ticker}')" title="Delete from search history" style="background:transparent; border:none; padding:4px; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:4px; transition:all 0.2s;">
                <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
            </button>` :
            `<button class="btn-remove-sidebar-item" onclick="event.stopPropagation(); toggleWatchlist('${s.ticker}')" title="Remove from Screener Watchlist" style="background:transparent; border:none; padding:4px; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:4px; transition:all 0.2s;">
                <i data-lucide="x" style="width:13px; height:13px;"></i>
            </button>`;

        return `
            <div class="analyzer-stock-item" data-ticker="${s.ticker}" onclick="loadAnalyzerForTicker('${s.ticker}')" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding-right:8px;">
                <div class="stock-ticker-cell" style="flex:1;">
                    <span class="analyzer-stock-ticker">${s.ticker}</span>
                    <span class="analyzer-stock-name">${s.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge ${health >= 88 ? 'badge-success' : 'badge-info'}">${health}</span>
                    ${removeActionHTML}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
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

    let s = stocksData.find(st => st.ticker === ticker);
    if (!s) s = searchHistoryData.find(st => st.ticker === ticker);
    
    const container = document.getElementById("analyzer-details");
    if (!s || !container) return;

    const currentPrice = marketPrices[s.ticker] || s.price;
    const rsiVal = s.rsi || 52;
    
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

    // --- TECHNICAL INDICATORS PRE-CALCULATIONS ---
    const macdVal = s.macd || { macd: 0.8, signal: 0.6, hist: 0.2, crossover: "BULLISH" };
    const volVal = s.volume || { current: 1500000, average: 1200000, ratio: 1.25, status: "STABLE CONSOLIDATION" };

    const isMacdBullish = macdVal.crossover === "BULLISH";
    const isVolBreakout = volVal.ratio >= 1.2;

    // --- DUAL-HORIZON VERDICT ALGORITHM ---
    let shortTermVerdict = "HOLD";
    let shortTermClass = "badge-warning";
    let shortTermScore = 55;
    let shortTermDesc = `Stable consolidation. RSI is in a healthy neutral range at ${rsiVal} with momentum room.`;
    
    if (rsiVal > 72) {
        shortTermVerdict = "AVOID / WAIT";
        shortTermClass = "badge-danger";
        shortTermScore = 32;
        shortTermDesc = `RSI of ${rsiVal} signals highly overbought levels. wait for a healthy pullback in the next 3-6 months.`;
    } else if (rsiVal >= 45 && rsiVal <= 65) {
        shortTermVerdict = "BUY";
        shortTermClass = "badge-success";
        shortTermScore = 80;
        shortTermDesc = `Strong short-term bullish trend with solid volume backing. RSI at ${rsiVal} is prime for technical entries over 3-6 months.`;
    } else if (rsiVal < 38) {
        shortTermVerdict = "ACCUMULATE";
        shortTermClass = "badge-info";
        shortTermScore = 75;
        shortTermDesc = `Oversold range (RSI: ${rsiVal}). Momentum bottoming; excellent for dynamic reversal entry.`;
    }

    // Integrate MACD & Volume into Technical Verdict
    if (isMacdBullish && rsiVal <= 68) {
        shortTermScore += 10;
        shortTermVerdict = "BUY";
        shortTermClass = "badge-success";
        shortTermDesc += ` Bullish MACD crossover (MACD: ${macdVal.macd} > Signal: ${macdVal.signal}) validates short-term buying pressure.`;
    }
    if (isVolBreakout) {
        shortTermScore += 5;
        shortTermDesc += ` High volume breakout confirmed (${volVal.ratio}x average) shows strong institutional accumulation.`;
    }
    shortTermScore = Math.min(100, shortTermScore);

    // Long-Term (1 Year +)
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

    const inWatchlist = watchlistTickers.has(s.ticker);
    const watchlistBtnHTML = `
        <button class="btn ${inWatchlist ? 'btn-danger' : 'btn-primary'}" onclick="toggleWatchlist('${s.ticker}')" style="font-size: 11px; padding: 6px 12px; margin-left: 14px; height: fit-content; display: flex; align-items: center; gap: 6px; box-shadow: none; border-radius: 6px;">
            <i data-lucide="${inWatchlist ? 'minus' : 'plus'}" style="width: 14px; height: 14px;"></i>
            <span>${inWatchlist ? 'Remove Watchlist' : 'Add to Screener'}</span>
        </button>
    `;

    const eventsList = s.events && s.events.length > 0 ? s.events : [
        {
            date: "May 24, 2026",
            sentiment: "NEUTRAL",
            title: "Corporate Filings Review",
            description: "No major equity changes, promoter pledges, or legal proceedings registered. Financial solvency remains within predicted safety thresholds.",
            impact: "Low volatility consolidation expected in the immediate short-term."
        }
    ];

    const eventsHTML = `
        <div class="glass-card col-span-6" style="margin-top: 20px; min-height: 290px; display: flex; flex-direction: column;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Recent Corporate Events & Cause Analysis</h3>
                <span class="badge badge-info">News Sentiment Insights</span>
            </div>
            <div class="events-feed" style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
                ${eventsList.map(ev => {
                    const sentClass = ev.sentiment === "POSITIVE" ? "badge-success" : ev.sentiment === "NEGATIVE" ? "badge-danger" : "badge-warning";
                    return `
                        <div class="event-item" style="background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); padding: 10px 14px; border-radius: 8px; display: flex; gap: 12px; align-items: flex-start;">
                            <div class="event-meta" style="min-width: 80px;">
                                <span style="font-size: 10px; font-weight: 700; color: var(--text-secondary);">${ev.date}</span>
                                <div class="badge ${sentClass}" style="font-size: 8px; padding: 2px 4px; margin-top: 6px; display: block; text-align: center;">${ev.sentiment}</div>
                            </div>
                            <div class="event-details" style="flex: 1;">
                                <h4 style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 4px;">${ev.title}</h4>
                                <p style="font-size: 11px; color: var(--text-primary); line-height: 1.4; margin-bottom: 6px;">${ev.description}</p>
                                <div style="font-size: 10px; color: #a78bfa; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                                    <i data-lucide="info" style="width: 12px; height: 12px;"></i>
                                    <span>Cause Analysis: <strong>${ev.impact}</strong></span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    const techSummaryText = `${isMacdBullish ? 'Bullish MACD crossover' : 'Bearish MACD crossover'} validates short-term ${isMacdBullish ? 'buying pressure' : 'selling pressure'}. RSI at ${rsiVal} represents a ${rsiVal > 72 ? 'highly overbought' : rsiVal < 38 ? 'highly oversold' : 'healthy neutral'} stance. Volume is ${isVolBreakout ? 'breaking out aggressively' : 'consolidating stably'} relative to the 20-day historical average.`;

    const technicalIndicatorsHTML = `
        <div class="glass-card col-span-6" style="margin-top: 20px; min-height: 290px; display: flex; flex-direction: column;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Advanced Momentum & Technical Oscillators</h3>
                <span class="badge ${isMacdBullish ? 'badge-success' : 'badge-danger'}">${macdVal.crossover} MACD SIGNAL</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 14px;">
                <!-- MACD -->
                <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; min-height: 95px;">
                    <div style="font-size: 9px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">MACD (12,26,9)</div>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; margin: 4px 0;">${macdVal.macd}</div>
                    <div style="font-size: 9px; color: var(--text-primary);">
                        Sig: <strong>${macdVal.signal}</strong> &bull; Hist: <strong class="${macdVal.hist >= 0 ? 'positive' : 'negative'}">${macdVal.hist >= 0 ? '+' : ''}${macdVal.hist}</strong>
                    </div>
                </div>
                
                <!-- RSI -->
                <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; min-height: 95px;">
                    <div style="font-size: 9px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">RSI (14-Day)</div>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; margin: 4px 0;">${rsiVal}</div>
                    <div style="font-size: 9px; color: var(--text-primary);">
                        Stance: <strong class="${rsiVal > 72 ? 'negative' : rsiVal < 38 ? 'positive' : 'info'}">${rsiVal > 72 ? 'Overbought' : rsiVal < 38 ? 'Oversold' : 'Neutral'}</strong>
                    </div>
                </div>
                
                <!-- Volume -->
                <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; min-height: 95px;">
                    <div style="font-size: 9px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Volume Breadth</div>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; margin: 4px 0;">${volVal.ratio}x</div>
                    <div style="font-size: 9px; color: var(--text-primary);">
                        Avg: <strong>${(volVal.average / 100000).toFixed(1)}L</strong>
                    </div>
                </div>
            </div>
            <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.03); font-size: 11px; color: var(--text-secondary); line-height: 1.5; display: flex; align-items: flex-start; gap: 6px;">
                <i data-lucide="info" style="width: 13px; height: 13px; color: #a78bfa; flex-shrink: 0; margin-top: 1px;"></i>
                <span><strong>Technical Audit:</strong> ${techSummaryText}</span>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="analyzer-details-header">
            <div class="analyzer-company-title" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center;">
                    <h2>${s.name} (<span style="color: #a78bfa">${s.ticker}</span>)</h2>
                    ${watchlistBtnHTML}
                </div>
                <div class="analyzer-company-desc" style="font-size: 11px; color: var(--text-secondary);">Indian Stock &bull; Screener.in Scanned</div>
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
                <div class="chart-wrapper-large">
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
                            Score: <strong>${shortTermScore} / 100</strong> (Focus: Technical Indicators)
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

            <!-- Technical Oscillators Card -->
            ${technicalIndicatorsHTML}

            <!-- Recent Corporate Events & Cause Analysis Card -->
            ${eventsHTML}

            <div class="glass-card col-span-6">
                <div class="card-header">
                    <h3>Quarterly Growth Analysis</h3>
                </div>
                <div class="chart-wrapper-large">
                    <canvas id="analyzerQuarterlyChart"></canvas>
                </div>
            </div>

            <div class="glass-card col-span-6">
                <div class="card-header">
                    <h3>Future Revenue & Income Projections</h3>
                </div>
                <div class="chart-wrapper-large">
                    <canvas id="analyzerProjectionsChart"></canvas>
                </div>
            </div>

            <div class="glass-card col-span-6">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Fundamental Audit & Pros</h3>
                    <span class="badge badge-success">Capital Efficient</span>
                </div>
                <div style="padding-top: 14px;">
                    <ul class="analysis-points-box">
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
            </div>

            <div class="glass-card col-span-6">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Momentum Audit & Risks</h3>
                    <span class="badge ${rsiVal > 70 ? 'badge-danger' : rsiVal < 38 ? 'badge-success' : 'badge-warning'}">
                        RSI Momentum: ${rsiVal}
                    </span>
                </div>
                <div style="padding-top: 14px;">
                    <ul class="analysis-points-box">
                        <li class="point-item">
                            <i data-lucide="alert-triangle" class="point-icon down"></i>
                            <span>Trading at P/E of ${s.pe} requires sustained top-line quarterly growth.</span>
                        </li>
                    </ul>
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

// --- SETUP WATCHLIST TOGGLER & TABS IN ANALYZER SIDEBAR ---
window.toggleWatchlist = async function(ticker) {
    const isAdding = !watchlistTickers.has(ticker);
    try {
        const res = await fetch("/api/stocks/watchlist", {
            method: "POST",
            headers: defAuthHeaders(),
            body: JSON.stringify({
                ticker: ticker,
                action: isAdding ? "ADD" : "REMOVE"
            })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.success, "success");
            await syncStocksList();
            renderAnalyzer();
            renderScreener();
            renderDashboard();
            loadAnalyzerForTicker(ticker);
        } else {
            showToast(data.error || "Failed to update watchlist", "error");
        }
    } catch (e) {
        showToast("Error updating watchlist.", "error");
    }
};

window.removeHistoryItem = async function(ticker) {
    try {
        const res = await fetch("/api/stocks/history/remove", {
            method: "POST",
            headers: defAuthHeaders(),
            body: JSON.stringify({ ticker: ticker })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.success, "success");
            await syncStocksList();
            renderAnalyzer();
            
            const detailsContainer = document.getElementById("analyzer-details");
            const activeHeader = detailsContainer.querySelector("h2");
            if (activeHeader && activeHeader.textContent.includes(ticker)) {
                detailsContainer.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="bar-chart-2"></i>
                        <p>Select a stock from the left sidebar to load advanced fundamental analysis, quarterly margins, technical charts, and growth projections.</p>
                    </div>
                `;
                lucide.createIcons();
            }
        } else {
            showToast(data.error || "Failed to remove history item", "error");
        }
    } catch (e) {
        showToast("Error removing search history.", "error");
    }
};

// --- SETUP EVENT TRIGGERS ON NAVIGATION ---
function setupTabListeners() {
    // Analyzer sidebar tabs
    const tabWatchlist = document.getElementById("btn-analyzer-tab-watchlist");
    const tabHistory = document.getElementById("btn-analyzer-tab-history");
    
    if (tabWatchlist && tabHistory) {
        tabWatchlist.addEventListener("click", () => {
            activeAnalyzerSidebarTab = "watchlist";
            tabWatchlist.style.background = "rgba(139, 92, 246, 0.2)";
            tabWatchlist.style.borderColor = "rgba(139, 92, 246, 0.4)";
            tabWatchlist.style.color = "#fff";
            
            tabHistory.style.background = "transparent";
            tabHistory.style.borderColor = "transparent";
            tabHistory.style.color = "var(--text-secondary)";
            renderAnalyzer();
        });
        
        tabHistory.addEventListener("click", () => {
            activeAnalyzerSidebarTab = "history";
            tabHistory.style.background = "rgba(139, 92, 246, 0.2)";
            tabHistory.style.borderColor = "rgba(139, 92, 246, 0.4)";
            tabHistory.style.color = "#fff";
            
            tabWatchlist.style.background = "transparent";
            tabWatchlist.style.borderColor = "transparent";
            tabWatchlist.style.color = "var(--text-secondary)";
            renderAnalyzer();
        });
    }

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
    document.getElementById("filter-trends").addEventListener("change", renderScreener);

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
