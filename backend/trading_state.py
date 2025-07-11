import threading

class TradingState:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = False
        self.positions = {}  # symbol -> position info
        self.trades = []
        self.cash = 10000
        self.config = {"interval": 5}
        self.risk_metrics = {
            "risk_score": 0.0,
            "volatility": 0.0,
            "drawdown": 0.0,
            "value_at_risk": 0.0
        }
        self.strategy_stats = {
            "total_return": 0.0,
            "win_rate": 0.0,
            "avg_trade": 0.0,
            "sharpe_ratio": 0.0
        }
        self.performance_metrics = {
            "total_realized_pnl": 0.0,
            "total_fees": 0.0,
            "trade_count": 0
        }
        self.strategy_config = {
            "active_strategy": "rsi",
            "rsi_overbought": 70,
            "rsi_oversold": 30,
            "rsi_timeframe": "5min",
            "momentum_lookback": 14,
            "momentum_threshold": 0.5,
            "breakout_period": 20,
            "breakout_multiplier": 2.0
        }
        self.bot_schedule = "24/7"  # "24/7" or "market"
        # ...other state 

# Singleton instance for import
state = TradingState() 