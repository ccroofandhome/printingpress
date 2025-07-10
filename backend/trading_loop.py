import threading
import time
import random
import requests
from trading_state import state

# Binance API configuration
BINANCE_TESTNET_BASE_URL = "https://testnet.binance.vision"
BINANCE_MAINNET_BASE_URL = "https://api.binance.com"

def get_binance_price(symbol: str, is_testnet: bool = True):
    """Fetch real-time price from Binance"""
    try:
        base_url = BINANCE_TESTNET_BASE_URL if is_testnet else BINANCE_MAINNET_BASE_URL
        url = f"{base_url}/api/v3/ticker/price"
        params = {"symbol": symbol}
        
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return float(data["price"])
        else:
            print(f"Error fetching price for {symbol}: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception fetching price for {symbol}: {e}")
        return None

def get_market_data():
    """Get real market data from Binance or fallback to mock data"""
    try:
        # Get exchange config from state
        with state.lock:
            config = getattr(state, 'exchange_config', {
                "exchange": "binance",
                "is_testnet": True,
                "trading_pair": "BTCUSDT",
                "test_balance": 10000.0
            })
        
        # Try to get real price from Binance
        price = get_binance_price(config["trading_pair"], config["is_testnet"])
        if price:
            return price
        else:
            # Fallback to mock data if API fails
            print("Using mock data as fallback")
            return random.uniform(29000, 31000)
    except Exception as e:
        print(f"Error getting market data: {e}")
        # Fallback to mock data
        return random.uniform(29000, 31000)

def compute_mock_rsi(prices):
    # Very basic RSI mock: random between 20 and 80
    return random.uniform(20, 80)

def simple_strategy(price, rsi, config, prices=None):
    # Use strategy config from state
    strategy = config.get('active_strategy', 'rsi')
    
    if strategy == 'rsi':
        # RSI strategy: buy oversold, sell overbought
        oversold = config.get('rsi_oversold', 30)
        overbought = config.get('rsi_overbought', 70)
        
        if rsi < oversold:
            return 'buy'
        elif rsi > overbought:
            return 'sell'
        else:
            return 'hold'
    
    elif strategy == 'momentum':
        # Momentum strategy: buy on positive momentum
        lookback = config.get('momentum_lookback', 14)
        threshold = config.get('momentum_threshold', 0.5)
        
        # Simple momentum calculation (price change over lookback period)
        if prices and len(prices) >= lookback:
            momentum = (price - prices[-lookback]) / prices[-lookback]
            if momentum > threshold:
                return 'buy'
            elif momentum < -threshold:
                return 'sell'
        
        return 'hold'
    
    elif strategy == 'breakout':
        # Breakout strategy: buy on breakouts
        period = config.get('breakout_period', 20)
        multiplier = config.get('breakout_multiplier', 2.0)
        
        if prices and len(prices) >= period:
            # Calculate average and standard deviation
            recent_prices = prices[-period:]
            avg_price = sum(recent_prices) / len(recent_prices)
            std_dev = (sum((p - avg_price) ** 2 for p in recent_prices) / len(recent_prices)) ** 0.5
            
            # Buy if price breaks above upper band
            upper_band = avg_price + (multiplier * std_dev)
            lower_band = avg_price - (multiplier * std_dev)
            
            if price > upper_band:
                return 'buy'
            elif price < lower_band:
                return 'sell'
        
        return 'hold'
    
    else:
        # Default RSI strategy
        if rsi < 30:
            return 'buy'
        elif rsi > 70:
            return 'sell'
        else:
            return 'hold'

def risk_check(signal):
    # Always allow for this mock, but you can expand
    return signal in ['buy', 'sell']

def execute_trade(signal, price):
    if signal == 'buy':
        # Buy 1 unit
        from main import TradeRequest, execute_mock_trade
        req = TradeRequest(symbol='BTCUSDT', side='buy', qty=1, price=price)
        execute_mock_trade(req)
    elif signal == 'sell':
        from main import TradeRequest, execute_mock_trade
        req = TradeRequest(symbol='BTCUSDT', side='sell', qty=1, price=price)
        execute_mock_trade(req)

def trading_loop():
    prices = []
    while True:
        if state.running:
            price = get_market_data()
            prices.append(price)
            if len(prices) > 50:  # Keep more prices for momentum/breakout strategies
                prices = prices[-50:]
            rsi = compute_mock_rsi(prices)
            
            # Get current strategy config
            with state.lock:
                config = state.strategy_config.copy()
            
            signal = simple_strategy(price, rsi, config, prices)
            if risk_check(signal):
                execute_trade(signal, price)
        time.sleep(5)

def start_trading_loop():
    t = threading.Thread(target=trading_loop, daemon=True)
    t.start() 