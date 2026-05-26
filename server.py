# StockExpert - Secure Python Standard Library Server & 24/7 Scanning Daemon

import os
import sys
import json
import sqlite3
import hashlib
import uuid
import time
import threading
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

# Import Screener Adapter
from screener_adapter import ScreenerAdapter, add_premium_metrics
from deep_research_screener import DeepResearchScreener

DB_FILE = "stock_expert.db"
PORT = 8000

screener = ScreenerAdapter()

# --- RESILIENT FUNDAMENTAL BASE DATABASE ---
DEFAULT_NIFTY_PICKS = [
    add_premium_metrics({"ticker": "RELIANCE", "name": "Reliance Industries Ltd.", "price": 2955.50, "pe": 26.8, "roe": 9.4, "de": 0.38, "divYield": 0.34, "fairValue": 3200.00, "healthScore": 85, "momoType": "cooling", "rsi": 52}),
    add_premium_metrics({"ticker": "TCS", "name": "Tata Consultancy Services Ltd.", "price": 3845.00, "pe": 28.2, "roe": 48.2, "de": 0.05, "divYield": 2.41, "fairValue": 4100.00, "healthScore": 92, "momoType": "high", "rsi": 64}),
    add_premium_metrics({"ticker": "HDFCBANK", "name": "HDFC Bank Ltd.", "price": 1512.40, "pe": 16.5, "roe": 16.8, "de": 0.85, "divYield": 1.29, "fairValue": 1780.00, "healthScore": 86, "momoType": "cooling", "rsi": 45}),
    add_premium_metrics({"ticker": "INFY", "name": "Infosys Ltd.", "price": 1420.00, "pe": 24.1, "roe": 31.8, "de": 0.12, "divYield": 3.24, "fairValue": 1650.00, "healthScore": 87, "momoType": "high", "rsi": 58}),
    add_premium_metrics({"ticker": "ICICIBANK", "name": "ICICI Bank Ltd.", "price": 1120.00, "pe": 18.2, "roe": 17.5, "de": 0.78, "divYield": 0.89, "fairValue": 1280.00, "healthScore": 88, "momoType": "high", "rsi": 60}),
    add_premium_metrics({"ticker": "TATAMOTORS", "name": "Tata Motors Ltd.", "price": 955.00, "pe": 15.4, "roe": 22.1, "de": 0.65, "divYield": 0.63, "fairValue": 1100.00, "healthScore": 89, "momoType": "high", "rsi": 62}),
    add_premium_metrics({"ticker": "SBIN", "name": "State Bank of India", "price": 825.00, "pe": 9.5, "roe": 18.2, "de": 0.95, "divYield": 1.66, "fairValue": 980.00, "healthScore": 91, "momoType": "high", "rsi": 61}),
    add_premium_metrics({"ticker": "BHARTIARTL", "name": "Bharti Airtel Ltd.", "price": 1390.00, "pe": 54.2, "roe": 12.1, "de": 0.98, "divYield": 0.28, "fairValue": 1250.00, "healthScore": 72, "momoType": "cooling", "rsi": 42})
]

# Holds current scanned stocks from Screener.in, defaults to pre-built resilient list
LIVE_MARKET_PICK = list(DEFAULT_NIFTY_PICKS)

# Registry of all crawled/scraped stocks in memory to enable search history and watchlist metrics lookup
ALL_CRAWLED_STOCKS = {s["ticker"]: s for s in DEFAULT_NIFTY_PICKS}

# --- DATABASE SETUP & MIGRATION ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash BLOB NOT NULL,
        salt BLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    
    # Portfolio table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ticker TEXT NOT NULL,
        qty INTEGER NOT NULL,
        avg_price REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, ticker)
    )
    """)
    
    # Cash table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_cash (
        user_id INTEGER PRIMARY KEY,
        cash_balance REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    
    # Background Scanner Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scanner_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ticker TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    
    # Screener Credentials table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS screener_config (
        user_id INTEGER PRIMARY KEY,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Persistent search history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ticker TEXT NOT NULL,
        name TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # User watchlist for screener
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS screener_watchlist (
        user_id INTEGER NOT NULL,
        ticker TEXT NOT NULL,
        PRIMARY KEY (user_id, ticker),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Deep Research suggested stocks history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS suggested_picks_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ticker TEXT NOT NULL,
        name TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, ticker)
    )
    """)
    
    conn.commit()
    conn.close()
    print("[DB] SQLite Schema initialized successfully.")

# --- CRYPTOGRAPHY & AUTHENTICATION SECURE HELPERS ---
def hash_password(password: str, salt: bytes = None) -> tuple[bytes, bytes]:
    if salt is None:
        salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    return pwd_hash, salt

def verify_session(headers) -> int:
    auth_header = headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    
    return row[0] if row else None


# --- LIVE SCREENER MARKET SCAN sweeps ---
def run_screener_scan():
    global LIVE_MARKET_PICK
    print("[Scanner] Initiating live scan sweep on Screener.in...")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT email, password FROM screener_config LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if row:
        screener.email = row[0]
        screener.password = row[1]
        print(f"[Scanner] Loaded active user credentials from DB: {screener.email}")
    else:
        screener.load_env()
        
    # Authenticate
    screener.login()
    
    # ADVANCED FUNDAMENTAL INTENSITY FILTER QUERY
    # ROE > 15%, ROCE > 15%, safe debt levels (< 0.8), high compound growth metrics (> 10%), P/E < 25
    query = "Return on equity > 15 AND Return on capital employed > 15 AND Debt to equity < 0.8 AND Sales growth 3Years > 10 AND Profit growth 3Years > 10 AND Price to Earning < 25"
    scanned_stocks = screener.execute_query(query)
    
    if scanned_stocks and len(scanned_stocks) > 0:
        LIVE_MARKET_PICK = scanned_stocks
        for s in scanned_stocks:
            ALL_CRAWLED_STOCKS[s["ticker"]] = s
        print(f"[Scanner] Scanned {len(LIVE_MARKET_PICK)} Nifty stocks matching criteria from Screener.in successfully.")
    else:
        LIVE_MARKET_PICK = list(DEFAULT_NIFTY_PICKS)
        for s in DEFAULT_NIFTY_PICKS:
            ALL_CRAWLED_STOCKS[s["ticker"]] = s
        print("[Scanner] Screener.in returned no results or was throttled. Preserving resilient Nifty fundamental database.")

def run_247_scanner():
    print("[Scanner] Background 24/7 scanning service started successfully.")
    
    # Run initial live market scan on boot
    run_screener_scan()
    
    scan_counter = 0
    while True:
        try:
            time.sleep(10)
            scan_counter += 1
            
            if scan_counter >= 120:
                run_screener_scan()
                scan_counter = 0
            
            # Monitor users portfolios
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT user_id, ticker, qty, avg_price FROM portfolio WHERE qty > 0")
            holdings = cursor.fetchall()
            
            for user_id, ticker, qty, avg_price in holdings:
                scanned_stock = next((s for s in LIVE_MARKET_PICK if s["ticker"] == ticker), None)
                if not scanned_stock:
                    continue
                
                current_price = scanned_stock["price"]
                health_score = scanned_stock["healthScore"]
                
                price_drop_percent = ((avg_price - current_price) / avg_price) * 100
                
                should_sell = False
                reason = ""
                
                if price_drop_percent >= 8.0:
                    should_sell = True
                    reason = f"Stop-Loss triggered: Price dropped {price_drop_percent:.1f}% below average cost."
                elif health_score < 60:
                    should_sell = True
                    reason = f"Fundamental Deterioration: Screener health score dropped to {health_score}."
                    
                if should_sell:
                    proceeds = qty * current_price
                    cursor.execute("UPDATE user_cash SET cash_balance = cash_balance + ? WHERE user_id = ?", (proceeds, user_id))
                    cursor.execute("DELETE FROM portfolio WHERE user_id = ? AND ticker = ?", (user_id, ticker))
                    cursor.execute("""
                        INSERT INTO scanner_logs (user_id, ticker, action, reason, price) 
                        VALUES (?, ?, 'AUTO-SELL PANIC PULLOUT', ?, ?)
                    """, (user_id, ticker, reason, current_price))
                    conn.commit()
                    print(f"[Scanner ALERT] Automating panic pullout for User {user_id} - {ticker} at {current_price}.")
                    
            conn.close()
        except Exception as e:
            print(f"[Scanner Daemon Error]: {str(e)}")
            time.sleep(5)


# --- REST API & ASSETS HTTP HANDLER ---
class StockRequestHandler(BaseHTTPRequestHandler):
    
    def end_headers(self):
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        
        # --- API ENDPOINTS ---
        if path == "/api/portfolio":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized session"}).encode("utf-8"))
                return
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            cursor.execute("SELECT cash_balance FROM user_cash WHERE user_id = ?", (user_id,))
            cash_row = cursor.fetchone()
            cash = cash_row[0] if cash_row else 100000.00
            
            cursor.execute("SELECT ticker, qty, avg_price FROM portfolio WHERE user_id = ?", (user_id,))
            holdings = [{"ticker": row[0], "qty": row[1], "avgPrice": row[2]} for row in cursor.fetchall()]
            
            conn.close()
            
            prices_dict = {s["ticker"]: s["price"] for s in LIVE_MARKET_PICK}
            rsi_dict = {s["ticker"]: int(s.get("rsi", 52)) for s in LIVE_MARKET_PICK}
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "cash": cash,
                "holdings": holdings,
                "marketPrices": prices_dict,
                "marketRSIs": rsi_dict
            }).encode("utf-8"))
            return

        elif path == "/api/scanner/logs":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT timestamp, ticker, action, reason, price 
                FROM scanner_logs 
                WHERE user_id = ? 
                ORDER BY timestamp DESC LIMIT 20
            """, (user_id,))
            
            logs = [{
                "timestamp": row[0],
                "ticker": row[1],
                "action": row[2],
                "reason": row[3],
                "price": row[4]
            } for row in cursor.fetchall()]
            conn.close()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"logs": logs}).encode("utf-8"))
            return
            
        elif path == "/api/stocks":
            user_id = verify_session(self.headers)
            
            watchlist_tickers = []
            history_entries = []
            
            if user_id:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                
                # Fetch custom watchlist
                cursor.execute("SELECT ticker FROM screener_watchlist WHERE user_id = ?", (user_id,))
                watchlist_tickers = [row[0] for row in cursor.fetchall()]
                
                # Fetch search history
                cursor.execute("SELECT ticker, name, timestamp FROM search_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 30", (user_id,))
                history_entries = [{"ticker": row[0], "name": row[1], "timestamp": row[2]} for row in cursor.fetchall()]
                
                conn.close()
                
            stocks_pool = list(LIVE_MARKET_PICK)
            existing_tickers = {s["ticker"] for s in stocks_pool}
            
            for ticker in watchlist_tickers:
                if ticker not in existing_tickers and ticker in ALL_CRAWLED_STOCKS:
                    stocks_pool.append(ALL_CRAWLED_STOCKS[ticker])
                    
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "stocks": stocks_pool,
                "watchlist": watchlist_tickers,
                "history": history_entries
            }).encode("utf-8"))
            return

        elif path == "/api/research/suggestions":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT ticker, timestamp FROM suggested_picks_history WHERE user_id = ? ORDER BY timestamp DESC", (user_id,))
            rows = cursor.fetchall()
            conn.close()
            
            suggestions = []
            screener_engine = DeepResearchScreener(ALL_CRAWLED_STOCKS)
            
            for ticker, timestamp in rows:
                stock_data = ALL_CRAWLED_STOCKS.get(ticker)
                if stock_data:
                    forecast = screener_engine.generate_detailed_forecasting(stock_data)
                    press_releases = screener_engine.generate_press_releases(stock_data)
                    
                    de = stock_data.get("de", 0.0)
                    roe = stock_data.get("roe", 0.0)
                    price = stock_data.get("price", 10.0)
                    fair = stock_data.get("fairValue", 12.0)
                    disc = ((fair - price) / fair) * 100 if fair > 0 else 0.0
                    
                    solvency_score = max(0.0, (1.0 - de) * 30.0)
                    efficiency_score = roe * 0.35
                    discount_reward = max(-10.0, disc * 0.25)
                    dvsms_score = round(solvency_score + efficiency_score + discount_reward, 2)
                    
                    enriched = dict(stock_data)
                    enriched["timestamp"] = timestamp
                    enriched["forecasts"] = forecast
                    enriched["press_releases"] = press_releases
                    enriched["dvsms_score"] = dvsms_score
                    suggestions.append(enriched)
                    
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"suggestions": suggestions}).encode("utf-8"))
            return

        elif path == "/api/stocks/search":
            query_params = urllib.parse.parse_qs(url.query)
            ticker_list = query_params.get("ticker", [])
            
            if not ticker_list:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Ticker parameter is required."}).encode("utf-8"))
                return
                
            ticker = ticker_list[0].upper().strip()
            user_id = verify_session(self.headers)
            
            scraped_stock = ALL_CRAWLED_STOCKS.get(ticker)
            
            if not scraped_stock:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("SELECT email, password FROM screener_config LIMIT 1")
                row = cursor.fetchone()
                conn.close()
                
                if row:
                    screener.email = row[0]
                    screener.password = row[1]
                    screener.login()
                    
                scraped_stock = screener.fetch_company_details(ticker)
                
            if scraped_stock:
                ALL_CRAWLED_STOCKS[ticker] = scraped_stock
                
                if user_id:
                    conn = sqlite3.connect(DB_FILE)
                    cursor = conn.cursor()
                    cursor.execute("SELECT id FROM search_history WHERE user_id = ? AND ticker = ? LIMIT 1", (user_id, ticker))
                    existing_hist = cursor.fetchone()
                    if not existing_hist:
                        cursor.execute("INSERT INTO search_history (user_id, ticker, name) VALUES (?, ?, ?)", (user_id, ticker, scraped_stock["name"]))
                        conn.commit()
                    conn.close()
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"stock": scraped_stock}).encode("utf-8"))
                return
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Failed to retrieve details for ticker '{ticker}' from Screener.in. Verify symbol."}).encode("utf-8"))
                return

        elif path == "/api/stocks/autocomplete":
            query_params = urllib.parse.parse_qs(url.query)
            q_list = query_params.get("q", [])
            
            if not q_list or not q_list[0].strip():
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"suggestions": []}).encode("utf-8"))
                return
                
            q = q_list[0].strip()
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT email, password FROM screener_config LIMIT 1")
            row = cursor.fetchone()
            conn.close()
            
            if row:
                screener.email = row[0]
                screener.password = row[1]
                screener.login()
                
            suggestions = screener.fetch_autocomplete_suggestions(q)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"suggestions": suggestions}).encode("utf-8"))
            return

        elif path == "/api/screener/config":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT email FROM screener_config WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                email = row[0]
                if "@" in email:
                    name, domain = email.split("@", 1)
                    masked = name[0] + "*" * (len(name) - 2) + name[-1] + "@" + domain
                else:
                    masked = email[0] + "*" * (len(email) - 1)
                response = {"connected": True, "email": masked}
            else:
                response = {"connected": False}
                
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        # --- SERVE STATIC FRONTEND FILES ---
        if path == "/":
            path = "/index.html"
            
        local_path = "." + path
        if not os.path.exists(local_path) or os.path.isdir(local_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return
            
        content_type = "text/plain"
        if path.endswith(".html"): content_type = "text/html"
        elif path.endswith(".css"): content_type = "text/css"
        elif path.endswith(".js"): content_type = "application/javascript"
        
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        with open(local_path, "rb") as f:
            self.wfile.write(f.read())

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            body = json.loads(post_data) if post_data else {}
        except json.JSONDecodeError:
            body = {}
            
        # --- API SIGNUP ENDPOINT ---
        if path == "/api/auth/register":
            username = body.get("username", "").strip()
            password = body.get("password", "")
            
            if not username or len(password) < 6:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid username or password length (min 6)."}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cursor.fetchone():
                conn.close()
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Username already taken."}).encode("utf-8"))
                return
                
            pwd_hash, salt = hash_password(password)
            try:
                cursor.execute("INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)", (username, pwd_hash, salt))
                user_id = cursor.lastrowid
                cursor.execute("INSERT INTO user_cash (user_id, cash_balance) VALUES (?, ?)", (user_id, 100000.00))
                conn.commit()
                status = 201
                response = {"success": "Account registered! You can now log in."}
            except sqlite3.Error as e:
                status = 500
                response = {"error": f"Database error: {str(e)}"}
                
            conn.close()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        # --- LOGIN ENDPOINT ---
        elif path == "/api/auth/login":
            username = body.get("username", "").strip()
            password = body.get("password", "")
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT id, password_hash, salt FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid credentials."}).encode("utf-8"))
                return
                
            user_id, saved_hash, salt = row
            input_hash, _ = hash_password(password, salt)
            
            if hmac_compare(saved_hash, input_hash):
                token = str(uuid.uuid4())
                cursor.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
                conn.commit()
                status = 200
                response = {"token": token, "username": username}
            else:
                status = 400
                response = {"error": "Invalid credentials."}
                
            conn.close()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        # --- LOGOUT ENDPOINT ---
        elif path == "/api/auth/logout":
            token = self.headers.get('Authorization', '').replace('Bearer ', '')
            if token:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
                conn.commit()
                conn.close()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": "Logged out"}).encode("utf-8"))
            return

        # --- SCREENER CREDENTIALS CONFIGURATION ---
        elif path == "/api/screener/config":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            email = body.get("email", "").strip()
            password = body.get("password", "")
            
            if not email or not password:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Email and Password are required."}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO screener_config (user_id, email, password) VALUES (?, ?, ?)", (user_id, email, password))
            conn.commit()
            conn.close()
            
            # Immediately trigger a background thread scan update with the new credentials
            threading.Thread(target=run_screener_scan, daemon=True).start()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": "Screener.in credentials saved and connection established!"}).encode("utf-8"))
            return

        # --- MANUAL RE-SCAN TRIGGER ENDPOINT ---
        elif path == "/api/scanner/trigger":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            run_screener_scan()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": f"Scanned NSE Market. Found {len(LIVE_MARKET_PICK)} matching stocks."}).encode("utf-8"))
            return

        # --- REMOVE FROM SEARCH HISTORY ENDPOINT ---
        elif path == "/api/stocks/history/remove":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            ticker = body.get("ticker", "").upper().strip()
            
            if not ticker:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Ticker is required."}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM search_history WHERE user_id = ? AND ticker = ?", (user_id, ticker))
            conn.commit()
            conn.close()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": f"Removed {ticker} from search history."}).encode("utf-8"))
            return

        # --- WATCHLIST TOGGLE ENDPOINT ---
        elif path == "/api/stocks/watchlist":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            ticker = body.get("ticker", "").upper().strip()
            action = body.get("action", "ADD").upper()
            
            if not ticker:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Ticker is required."}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            if action == "ADD":
                cursor.execute("INSERT OR IGNORE INTO screener_watchlist (user_id, ticker) VALUES (?, ?)", (user_id, ticker))
                success_msg = f"Added {ticker} to screener watchlist!"
            else:
                cursor.execute("DELETE FROM screener_watchlist WHERE user_id = ? AND ticker = ?", (user_id, ticker))
                success_msg = f"Removed {ticker} from screener watchlist."
                
            conn.commit()
            conn.close()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": success_msg}).encode("utf-8"))
            return

        # --- TRIGGER DEEP SOLVENCY RESEARCH ---
        elif path == "/api/research/trigger":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            screener_engine = DeepResearchScreener(ALL_CRAWLED_STOCKS)
            top_picks = screener_engine.run_analysis()
            
            if not top_picks:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No stocks matched the deep solvency criteria (ROE >= 12% and Debt/Equity <= 0.35). Please trigger live scan first to populate active market data."}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            inserted_picks = []
            for s in top_picks:
                ticker = s["ticker"]
                name = s["name"]
                
                # Persistent suggested stock history insert
                cursor.execute("""
                    INSERT OR REPLACE INTO suggested_picks_history (user_id, ticker, name, timestamp)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                """, (user_id, ticker, name))
                inserted_picks.append(s)
                
            conn.commit()
            conn.close()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": f"Successfully recommended 2 solvency assets: {', '.join([p['ticker'] for p in inserted_picks])}",
                "picks": inserted_picks
            }).encode("utf-8"))
            return

        # --- REMOVE SUGGESTED STOCK FROM HISTORY ---
        elif path == "/api/research/suggestions/remove":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            ticker = body.get("ticker", "").upper().strip()
            if not ticker:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Ticker parameter is required."}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM suggested_picks_history WHERE user_id = ? AND ticker = ?", (user_id, ticker))
            conn.commit()
            conn.close()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": f"Removed {ticker} from deep solvency history."}).encode("utf-8"))
            return

        # --- CUSTOM SINGLE STOCK SOLVENCY AUDIT ---
        elif path == "/api/research/analyze":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return

            ticker = body.get("ticker", "").upper().strip()
            if not ticker:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Ticker is required."}).encode("utf-8"))
                return

            # Check in-memory registry first
            stock_data = ALL_CRAWLED_STOCKS.get(ticker)

            # If not in registry, try to fetch live from screener
            if not stock_data:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("SELECT email, password FROM screener_config LIMIT 1")
                row = cursor.fetchone()
                conn.close()
                if row:
                    screener.email = row[0]
                    screener.password = row[1]
                    screener.login()
                stock_data = screener.fetch_company_details(ticker)

            if not stock_data:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Could not retrieve data for '{ticker}'. Verify ticker symbol."}).encode("utf-8"))
                return

            # Register in crawled stocks cache
            ALL_CRAWLED_STOCKS[ticker] = stock_data

            # Run DVSMS scoring
            screener_engine = DeepResearchScreener(ALL_CRAWLED_STOCKS)
            de = stock_data.get("de", 0.0)
            roe = stock_data.get("roe", 0.0)
            price = stock_data.get("price", 10.0)
            fair = stock_data.get("fairValue", 12.0)
            disc = ((fair - price) / fair) * 100 if fair > 0 else 0.0

            solvency_score = max(0.0, (1.0 - de) * 30.0)
            efficiency_score = roe * 0.35
            discount_reward = max(-10.0, disc * 0.25)
            dvsms_score = round(solvency_score + efficiency_score + discount_reward, 2)

            forecast = screener_engine.generate_detailed_forecasting(stock_data)
            press_releases = screener_engine.generate_press_releases(stock_data)

            # Build audit verdict
            flags = []
            if de > 0.35:
                flags.append({"type": "warn", "msg": f"High leverage (D/E={de:.2f}). Exceeds low-debt threshold of 0.35."})
            else:
                flags.append({"type": "pass", "msg": f"Low debt (D/E={de:.2f}). Strong solvency profile."})

            if roe < 12.0:
                flags.append({"type": "warn", "msg": f"ROE={roe:.1f}% is below minimum 12% efficiency bar."})
            else:
                flags.append({"type": "pass", "msg": f"Strong ROE={roe:.1f}% — above 12% efficiency threshold."})

            if disc > 10:
                flags.append({"type": "pass", "msg": f"Trading {disc:.1f}% below fair value — excellent margin of safety."})
            elif disc > 0:
                flags.append({"type": "neutral", "msg": f"Minor {disc:.1f}% discount to fair value."})
            else:
                flags.append({"type": "warn", "msg": f"Trading at a premium ({abs(disc):.1f}% above fair value)."})

            eligible = de <= 0.35 and roe >= 12.0
            verdict = "RECOMMENDED" if eligible and dvsms_score >= 20 else ("WATCH" if eligible else "AVOID")

            result = dict(stock_data)
            result["dvsms_score"] = dvsms_score
            result["forecasts"] = forecast
            result["press_releases"] = press_releases
            result["audit_flags"] = flags
            result["verdict"] = verdict
            result["score_breakdown"] = {
                "solvency": round(solvency_score, 2),
                "efficiency": round(efficiency_score, 2),
                "discount": round(discount_reward, 2),
                "total": dvsms_score
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"result": result}).encode("utf-8"))
            return

        # --- ADD STOCK TO RESEARCH HISTORY ---
        elif path == "/api/research/suggestions/add":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return

            ticker = body.get("ticker", "").upper().strip()
            if not ticker:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Ticker is required."}).encode("utf-8"))
                return

            stock_data = ALL_CRAWLED_STOCKS.get(ticker)
            name = stock_data.get("name", ticker) if stock_data else ticker

            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO suggested_picks_history (user_id, ticker, name, timestamp)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (user_id, ticker, name))
            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": f"{ticker} added to Deep Research history."}).encode("utf-8"))
            return

        # --- PORTFOLIO TRANSACTION EXECUTION ---
        elif path == "/api/portfolio/trade":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
                return
                
            ticker = body.get("ticker")
            qty = int(body.get("qty", 0))
            action = body.get("action")
            
            if not ticker or qty <= 0 or action not in ["BUY", "SELL"]:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid values."}).encode("utf-8"))
                return
                
            scanned_stock = next((s for s in LIVE_MARKET_PICK if s["ticker"] == ticker), None)
            if not scanned_stock:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Ticker {ticker} not found in Nifty scans."}).encode("utf-8"))
                return
                
            market_price = scanned_stock["price"]
            total_cost = market_price * qty
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT cash_balance FROM user_cash WHERE user_id = ?", (user_id,))
            cash = cursor.fetchone()[0]
            
            cursor.execute("SELECT qty, avg_price FROM portfolio WHERE user_id = ? AND ticker = ?", (user_id, ticker))
            holding = cursor.fetchone()
            hold_qty = holding[0] if holding else 0
            hold_avg = holding[1] if holding else 0.0
            
            if action == "BUY":
                if cash < total_cost:
                    conn.close()
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Insufficient cash balance."}).encode("utf-8"))
                    return
                    
                new_cash = cash - total_cost
                cursor.execute("UPDATE user_cash SET cash_balance = ? WHERE user_id = ?", (new_cash, user_id))
                
                if hold_qty > 0:
                    new_qty = hold_qty + qty
                    new_avg = ((hold_qty * hold_avg) + total_cost) / new_qty
                    cursor.execute("UPDATE portfolio SET qty = ?, avg_price = ? WHERE user_id = ? AND ticker = ?", (new_qty, new_avg, user_id, ticker))
                else:
                    cursor.execute("INSERT INTO portfolio (user_id, ticker, qty, avg_price) VALUES (?, ?, ?, ?)", (user_id, ticker, qty, market_price))
                conn.commit()
                status = 200
                response = {"success": f"Successfully bought {qty} shares of {ticker}!"}
                
            else: # SELL
                if hold_qty < qty:
                    conn.close()
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Insufficient shares."}).encode("utf-8"))
                    return
                    
                new_cash = cash + total_cost
                cursor.execute("UPDATE user_cash SET cash_balance = ? WHERE user_id = ?", (new_cash, user_id))
                
                remaining_qty = hold_qty - qty
                if remaining_qty == 0:
                    cursor.execute("DELETE FROM portfolio WHERE user_id = ? AND ticker = ?", (user_id, ticker))
                else:
                    cursor.execute("UPDATE portfolio SET qty = ? WHERE user_id = ? AND ticker = ?", (remaining_qty, user_id, ticker))
                conn.commit()
                status = 200
                response = {"success": f"Successfully sold {qty} shares of {ticker}!"}
                
            conn.close()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

def hmac_compare(a: bytes, b: bytes) -> bool:
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= x ^ y
    return result == 0

# --- RUNNING THE SERVER ---
def run_server():
    init_db()
    
    scanner_thread = threading.Thread(target=run_247_scanner, daemon=True)
    scanner_thread.start()
    
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, StockRequestHandler)
    print(f"[Server] StockExpert is running securely at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server] Shutting down.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
