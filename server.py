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

DB_FILE = "stock_expert.db"
PORT = 8000

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
    
    conn.commit()
    conn.close()
    print("[DB] SQLite Schema initialized successfully.")

# --- CRYPTOGRAPHY & AUTHENTICATION SECURE HELPERS ---
def hash_password(password: str, salt: bytes = None) -> tuple[bytes, bytes]:
    if salt is None:
        salt = os.urandom(16)
    # PBKDF2 secure password hashing using standard library
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000 # 100,000 iterations for modern security
    )
    return pwd_hash, salt

def verify_session(headers) -> int:
    # Extracts authorization token from request headers
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


# --- 24/7 BACKGROUND STOCK SCANNER DAEMON ---
# Mock pricing array for stocks to simulate real-time scan calculations
MOCK_MARKET = {
    "AAPL": {"price": 189.84, "rsi": 62},
    "NVDA": {"price": 949.50, "rsi": 74},
    "MSFT": {"price": 430.32, "rsi": 58},
    "TSLA": {"price": 179.24, "rsi": 38},
    "RELIANCE": {"price": 2955.50, "rsi": 61},
    "TCS": {"price": 3845.00, "rsi": 48},
    "HDFCBANK": {"price": 1512.40, "rsi": 54}
}

def run_247_scanner():
    print("[Scanner] Background 24/7 scanning service started successfully.")
    
    # Infinite loop to keep running in background indefinitely
    while True:
        try:
            time.sleep(10) # Checks active investments every 10 seconds for visual simulation
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            # Fetch all user holdings
            cursor.execute("SELECT user_id, ticker, qty, avg_price FROM portfolio WHERE qty > 0")
            holdings = cursor.fetchall()
            
            for user_id, ticker, qty, avg_price in holdings:
                # Retrieve simulated pricing
                market_info = MOCK_MARKET.get(ticker)
                if not market_info:
                    continue
                
                current_price = market_info["price"]
                
                # SIMULATED DOWNTREND CALCULATION
                # Let's trigger a panic sell:
                # 1. If stock price drops more than 8% below avg purchase price (Stop-Loss rule) OR
                # 2. If RSI drops below 35 (extreme technical weakness)
                
                price_drop_percent = ((avg_price - current_price) / avg_price) * 100
                rsi_value = market_info["rsi"]
                
                should_sell = False
                reason = ""
                
                # Check for criteria breach
                if price_drop_percent >= 8.0:
                    should_sell = True
                    reason = f"Stop-Loss triggered: Ticker price dropped {price_drop_percent:.1f}% below average cost."
                elif rsi_value < 40: # Panic indicator threshold
                    should_sell = True
                    reason = f"Downtrend Detected: RSI momentum index plummeted to {rsi_value}."
                
                if should_sell:
                    print(f"[Scanner ALERT] Executing Auto-Sell for User {user_id} - {ticker}. Reason: {reason}")
                    
                    # 1. Calculate proceeds
                    proceeds = qty * current_price
                    
                    # 2. Update user cash balance
                    cursor.execute("UPDATE user_cash SET cash_balance = cash_balance + ? WHERE user_id = ?", (proceeds, user_id))
                    
                    # 3. Clear the stock holding
                    cursor.execute("DELETE FROM portfolio WHERE user_id = ? AND ticker = ?", (user_id, ticker))
                    
                    # 4. Insert detailed Scan activity log
                    cursor.execute("""
                        INSERT INTO scanner_logs (user_id, ticker, action, reason, price) 
                        VALUES (?, ?, 'AUTO-SELL PANIC PULLOUT', ?, ?)
                    """, (user_id, ticker, reason, current_price))
                    
                    conn.commit()
                    
            conn.close()
            
            # Randomly fluctuate RSI & Prices of mock market to simulate live ticks
            # This triggers scanner auto-sell reactions dynamically for the user!
            for tk in MOCK_MARKET:
                # Random fluctuations
                import random
                # 30% chance of sudden drop on TSLA or Apple to trigger the scanner live!
                if random.random() < 0.25:
                    if tk == "TSLA":
                        MOCK_MARKET["TSLA"]["rsi"] = random.randint(28, 37) # Trigger panic
                        MOCK_MARKET["TSLA"]["price"] *= 0.95
                    elif tk == "AAPL":
                        MOCK_MARKET["AAPL"]["rsi"] = random.randint(30, 39) # Trigger panic
                        MOCK_MARKET["AAPL"]["price"] *= 0.94
                else:
                    # Normal random walk
                    MOCK_MARKET[tk]["rsi"] = max(20, min(95, MOCK_MARKET[tk]["rsi"] + random.choice([-2, -1, 0, 1, 2])))
                    MOCK_MARKET[tk]["price"] += random.choice([-5.0, -1.0, 1.0, 5.0])
                    
        except Exception as e:
            print(f"[Scanner Error]: {str(e)}")
            time.sleep(5)


# --- REST API & ASSETS HTTP HANDLER ---
class StockRequestHandler(BaseHTTPRequestHandler):
    
    def end_headers(self):
        # Prevent Clickjacking & MIME-type sniffing threats
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
            
            # Fetch cash
            cursor.execute("SELECT cash_balance FROM user_cash WHERE user_id = ?", (user_id,))
            cash_row = cursor.fetchone()
            cash = cash_row[0] if cash_row else 100000.00
            
            # Fetch holdings
            cursor.execute("SELECT ticker, qty, avg_price FROM portfolio WHERE user_id = ?", (user_id,))
            holdings = [{"ticker": row[0], "qty": row[1], "avgPrice": row[2]} for row in cursor.fetchall()]
            
            conn.close()
            
            # Enrich active pricing from scanner mock market
            for h in holdings:
                if h["ticker"] in MOCK_MARKET:
                    MOCK_MARKET[h["ticker"]]["price"] = round(MOCK_MARKET[h["ticker"]]["price"], 2)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "cash": cash,
                "holdings": holdings,
                "marketPrices": {tk: info["price"] for tk, info in MOCK_MARKET.items()},
                "marketRSIs": {tk: info["rsi"] for tk, info in MOCK_MARKET.items()}
            }).encode("utf-8"))
            return

        elif path == "/api/scanner/logs":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized session"}).encode("utf-8"))
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
            
        # --- SERVE STATIC FRONTEND FILES ---
        if path == "/":
            path = "/index.html"
            
        local_path = "." + path
        if not os.path.exists(local_path) or os.path.isdir(local_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return
            
        # Select correct MIME Content-Type
        content_type = "text/plain"
        if path.endswith(".html"): content_type = "text/html"
        elif path.endswith(".css"): content_type = "text/css"
        elif path.endswith(".js"): content_type = "application/javascript"
        elif path.endswith(".png"): content_type = "image/png"
        elif path.endswith(".svg"): content_type = "image/svg+xml"
        
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        with open(local_path, "rb") as f:
            self.wfile.write(f.read())

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        
        # Read request body safely
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            body = json.loads(post_data) if post_data else {}
        except json.JSONDecodeError:
            body = {}
            
        # --- REGISTRATION ENDPOINT ---
        if path == "/api/auth/register":
            username = body.get("username", "").strip()
            password = body.get("password", "")
            
            if not username or len(password) < 6:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Username required, and password must be at least 6 characters."}).encode("utf-8"))
                return
                
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            # Secure parameterization prevents SQL injection
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cursor.fetchone():
                conn.close()
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Username already exists."}).encode("utf-8"))
                return
                
            pwd_hash, salt = hash_password(password)
            try:
                cursor.execute("INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)", (username, pwd_hash, salt))
                user_id = cursor.lastrowid
                # Set default virtual capital $100,000.00
                cursor.execute("INSERT INTO user_cash (user_id, cash_balance) VALUES (?, ?)", (user_id, 100000.00))
                conn.commit()
                status = 201
                response = {"success": "Account registered successfully! Please login."}
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
                self.wfile.write(json.dumps({"error": "Invalid username or password."}).encode("utf-8"))
                return
                
            user_id, saved_hash, salt = row
            input_hash, _ = hash_password(password, salt)
            
            # Constant-time comparison mitigates timing attacks
            if hmac_compare(saved_hash, input_hash):
                token = str(uuid.uuid4())
                cursor.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
                conn.commit()
                status = 200
                response = {"token": token, "username": username}
            else:
                status = 400
                response = {"error": "Invalid username or password."}
                
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

        # --- PORTFOLIO TRANSACTION EXECUTION ---
        elif path == "/api/portfolio/trade":
            user_id = verify_session(self.headers)
            if not user_id:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized session"}).encode("utf-8"))
                return
                
            ticker = body.get("ticker")
            qty = int(body.get("qty", 0))
            action = body.get("action") # BUY or SELL
            
            if not ticker or qty <= 0 or action not in ["BUY", "SELL"]:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid transaction values."}).encode("utf-8"))
                return
                
            market_price = MOCK_MARKET.get(ticker, {}).get("price", 0.0)
            if market_price == 0.0:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Failed to fetch live stock price."}).encode("utf-8"))
                return
                
            total_cost = market_price * qty
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            # Fetch user cash balance
            cursor.execute("SELECT cash_balance FROM user_cash WHERE user_id = ?", (user_id,))
            cash = cursor.fetchone()[0]
            
            # Fetch current stock holding
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
                    
                # Update cash
                new_cash = cash - total_cost
                cursor.execute("UPDATE user_cash SET cash_balance = ? WHERE user_id = ?", (new_cash, user_id))
                
                # Update holdings
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
                    self.wfile.write(json.dumps({"error": "Insufficient shares to sell."}).encode("utf-8"))
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
    # Basic constant-time comparison to prevent side-channel timing attacks
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= x ^ y
    return result == 0

# --- RUNNING THE SERVER ---
def run_server():
    init_db()
    
    # Start the 24/7 scanning background daemon thread
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
