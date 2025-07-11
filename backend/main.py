from fastapi import FastAPI, Body, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from trading_state import TradingState
from pydantic import BaseModel
from datetime import datetime, timedelta
from trading_loop import start_trading_loop
from typing import Dict, Any, List
import random
import json
import os
import requests
import time
from auth import (
    UserCreate, UserLogin, Token, UserInDB, 
    authenticate_user, create_user, create_access_token,
    get_current_active_user, get_user
)

# Create singleton instance
state = TradingState()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to ["http://localhost:3003"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and keep-alive pings"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "trading-bot-api"
    }

# Authentication endpoints
@app.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        user = create_user(user_data)
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "is_active": user.is_active
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Login user"""
    user = authenticate_user(user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "is_active": user.is_active
        }
    }

@app.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(current_user: UserInDB = Depends(get_current_active_user)):
    """Get current user information"""
    return {
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat()
    }

# Binance API configuration
BINANCE_TESTNET_BASE_URL = "https://testnet.binance.vision"
BINANCE_MAINNET_BASE_URL = "https://api.binance.com"

# Strategy management
STRATEGIES_FILE = "saved_strategies.json"
CUSTOM_STRATEGIES_FILE = "custom_strategies.json"

def load_saved_strategies():
    """Load saved strategies from file"""
    if os.path.exists(STRATEGIES_FILE):
        try:
            with open(STRATEGIES_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_strategies_to_file(strategies):
    """Save strategies to file"""
    with open(STRATEGIES_FILE, 'w') as f:
        json.dump(strategies, f, indent=2)

def load_custom_strategies():
    """Load custom strategies from file"""
    if os.path.exists(CUSTOM_STRATEGIES_FILE):
        try:
            with open(CUSTOM_STRATEGIES_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_custom_strategies_to_file(strategies):
    """Save custom strategies to file"""
    with open(CUSTOM_STRATEGIES_FILE, 'w') as f:
        json.dump(strategies, f, indent=2)

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

class TradeRequest(BaseModel):
    symbol: str
    side: str  # 'buy' or 'sell'
    qty: float
    price: float

class ExchangeConfig(BaseModel):
    exchange: str = "binance"
    is_testnet: bool = True
    trading_pair: str = "BTCUSDT"
    test_balance: float = 10000.0

class SavedStrategy(BaseModel):
    name: str
    description: str
    created_at: str
    updated_at: str
    config: Dict[str, Any]
    bot_controls: Dict[str, Any]

class StrategySaveRequest(BaseModel):
    name: str
    description: str
    config: Dict[str, Any]
    bot_controls: Dict[str, Any]

class StrategyLoadRequest(BaseModel):
    name: str

class StrategyDeleteRequest(BaseModel):
    name: str

class RiskManagementConfig(BaseModel):
    max_daily_loss_limit: float = 5.0
    max_consecutive_losses: int = 3
    max_drawdown_limit: float = 15.0
    risk_tolerance: str = "Moderate"  # Conservative, Moderate, Aggressive

class SignalConfirmationConfig(BaseModel):
    min_volume_threshold: int = 100000
    macd_confirmation: bool = True
    multi_timeframe_confirmation: str = "15m + 1h align"

class CustomExitConfig(BaseModel):
    profit_target: float = 8.0
    stop_loss: float = 4.0
    time_based_exit: int = 60  # minutes

class BacktestConfig(BaseModel):
    start_date: str
    end_date: str
    asset: str = "BTC"
    strategy_config: Dict[str, Any]

class StrategyTemplate(BaseModel):
    name: str
    description: str
    config: Dict[str, Any]
    risk_management: RiskManagementConfig
    signal_confirmation: SignalConfirmationConfig
    custom_exit: CustomExitConfig
    created_at: str
    updated_at: str

class BacktestResult(BaseModel):
    total_trades: int
    win_rate: str
    total_return: str
    max_drawdown: str
    sharpe_ratio: str
    profit_factor: str
    strategy_name: str
    asset: str
    period: str

class UltimateROIStrategy(BaseModel):
    name: str = "Ultimate ROI Strategy"
    description: str = "Dynamic Compounding + Auto-Reallocation + Leverage"
    daily_target_return: float = 2.0
    compounding_enabled: bool = True
    reallocation_interval_minutes: int = 15
    leverage_enabled: bool = True
    max_leverage: float = 5.0
    allocation_rules: Dict[str, float] = {
        "highest_roi": 0.40,
        "second_roi": 0.30,
        "third_roi": 0.20,
        "remainder": 0.10
    }
    risk_management: Dict[str, Any] = {
        "max_daily_drawdown": 5.0,
        "max_consecutive_losses": 3,
        "risk_score_threshold": 75,
        "max_position_size": 0.05
    }
    trading_rules: Dict[str, Any] = {
        "allow_long_short": True,
        "trailing_stops": True,
        "auto_take_profits": True,
        "momentum_strategies": ["RSI", "MACD", "Breakout"],
        "min_volume_threshold": 100000
    }

class PortfolioAllocation(BaseModel):
    asset: str
    allocation_percentage: float
    current_roi: float
    leverage: float
    risk_score: float
    strategy_confidence: float
    last_reallocation: str

class ReallocationLog(BaseModel):
    timestamp: str
    asset: str
    old_allocation: float
    new_allocation: float
    reason: str
    roi_change: float

@app.get("/positions")
def get_positions():
    with state.lock:
        return {"positions": state.positions}

@app.get("/risk-status")
def get_risk_status():
    """Get real-time risk assessment"""
    try:
        risk_status = {
            "overall_risk_score": 45,
            "daily_drawdown": 3.2,
            "max_drawdown_limit": 5.0,
            "consecutive_losses": 1,
            "max_consecutive_losses": 3,
            "portfolio_volatility": 12.5,
            "risk_alerts": [
                {
                    "level": "low",
                    "message": "Portfolio performing within risk parameters",
                    "timestamp": "2024-01-15T14:30:00Z"
                }
            ],
            "asset_risk_scores": {
                "BTCUSDT": {"risk_score": 45, "status": "safe"},
                "ETHUSDT": {"risk_score": 52, "status": "safe"},
                "ADAUSDT": {"risk_score": 68, "status": "warning"},
                "DOTUSDT": {"risk_score": 58, "status": "safe"}
            },
            "recommendations": [
                "Consider reducing ADAUSDT position due to elevated risk score",
                "Maintain current leverage levels across portfolio",
                "Monitor ETHUSDT for potential reallocation"
            ]
        }
        
        return risk_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get risk status: {str(e)}")

@app.post("/execute-mock-trade")
def execute_mock_trade(trade: TradeRequest):
    with state.lock:
        # Update positions
        pos = state.positions.get(trade.symbol, {"qty": 0, "avg_price": 0})
        realized_pnl = 0.0
        if trade.side == "buy":
            total_cost = pos["qty"] * pos["avg_price"] + trade.qty * trade.price
            new_qty = pos["qty"] + trade.qty
            new_avg = total_cost / new_qty if new_qty > 0 else 0
            pos["qty"] = new_qty
            pos["avg_price"] = new_avg
            state.cash -= trade.qty * trade.price
        elif trade.side == "sell":
            sell_qty = min(trade.qty, pos["qty"])
            realized_pnl = (trade.price - pos["avg_price"]) * sell_qty
            pos["qty"] = max(0, pos["qty"] - trade.qty)
            state.cash += trade.qty * trade.price
            state.performance_metrics["total_realized_pnl"] += realized_pnl
        state.positions[trade.symbol] = pos
        # Log trade
        trade_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "symbol": trade.symbol,
            "side": trade.side,
            "qty": trade.qty,
            "price": trade.price,
            "realized_pnl": realized_pnl
        }
        state.trades.append(trade_entry)
        state.performance_metrics["trade_count"] += 1
        return {"position": pos, "trade": trade_entry, "cash": state.cash}

@app.get("/performance-metrics")
def get_performance_metrics():
    with state.lock:
        return {"performance_metrics": state.performance_metrics}

@app.post("/strategy-config")
def update_strategy_config(config: Dict[str, Any] = Body(...)):
    with state.lock:
        state.strategy_config.update(config)
    return {"status": "updated", "strategy_config": state.strategy_config}

# Strategy Management Endpoints
@app.get("/saved-strategies")
def get_saved_strategies():
    """Get all saved strategies"""
    strategies = load_saved_strategies()
    return {"strategies": strategies}

@app.post("/save-strategy")
def save_strategy(request: StrategySaveRequest):
    """Save a new strategy or update existing one"""
    strategies = load_saved_strategies()
    
    now = datetime.utcnow().isoformat() + "Z"
    
    if request.name in strategies:
        # Update existing strategy
        strategies[request.name]["updated_at"] = now
        strategies[request.name]["description"] = request.description
        strategies[request.name]["config"] = request.config
        strategies[request.name]["bot_controls"] = request.bot_controls
    else:
        # Create new strategy
        strategies[request.name] = {
            "name": request.name,
            "description": request.description,
            "created_at": now,
            "updated_at": now,
            "config": request.config,
            "bot_controls": request.bot_controls
        }
    
    save_strategies_to_file(strategies)
    return {"status": "saved", "strategy": strategies[request.name]}

@app.post("/load-strategy")
def load_strategy(request: StrategyLoadRequest):
    """Load a saved strategy and apply it"""
    strategies = load_saved_strategies()
    
    if request.name not in strategies:
        return {"error": "Strategy not found"}
    
    strategy = strategies[request.name]
    
    with state.lock:
        # Apply the strategy configuration
        state.strategy_config.update(strategy["config"])
        # Note: bot_controls would need to be handled in the frontend
        # since they're not stored in the backend state
    
    return {"status": "loaded", "strategy": strategy}

@app.delete("/delete-strategy")
def delete_strategy(request: StrategyDeleteRequest):
    """Delete a saved strategy"""
    strategies = load_saved_strategies()
    
    if request.name not in strategies:
        return {"error": "Strategy not found"}
    
    del strategies[request.name]
    save_strategies_to_file(strategies)
    
    return {"status": "deleted", "name": request.name}

# Custom Strategy Management Endpoints
@app.get("/custom-strategies")
def get_custom_strategies():
    """Get all custom strategies"""
    strategies = load_custom_strategies()
    return {"strategies": strategies}

@app.post("/custom-strategy")
def save_custom_strategy(strategy: Dict[str, Any] = Body(...)):
    """Save a custom strategy"""
    strategies = load_custom_strategies()
    
    # Generate ID if not provided
    if 'id' not in strategy:
        strategy['id'] = f"strategy_{len(strategies) + 1}"
    
    # Update timestamps
    now = datetime.utcnow().isoformat() + "Z"
    if 'createdAt' not in strategy:
        strategy['createdAt'] = now
    strategy['updatedAt'] = now
    
    # Find existing strategy or add new one
    existing_index = next((i for i, s in enumerate(strategies) if s.get('id') == strategy['id']), None)
    if existing_index is not None:
        strategies[existing_index] = strategy
    else:
        strategies.append(strategy)
    
    save_custom_strategies_to_file(strategies)
    return {"status": "saved", "strategy": strategy}

@app.delete("/custom-strategy/{strategy_id}")
def delete_custom_strategy(strategy_id: str):
    """Delete a custom strategy"""
    strategies = load_custom_strategies()
    
    # Find and remove the strategy
    strategies = [s for s in strategies if s.get("id") != strategy_id]
    save_custom_strategies_to_file(strategies)
    
    return {"status": "deleted", "strategy_id": strategy_id}

# Risk Management Endpoints
@app.post("/risk-management-config")
def update_risk_management_config(config: RiskManagementConfig):
    """Update risk management configuration"""
    with state.lock:
        state.strategy_config["risk_management"] = config.dict()
    return {"status": "updated", "risk_management": config.dict()}

@app.get("/risk-management-config")
def get_risk_management_config():
    """Get current risk management configuration"""
    with state.lock:
        risk_config = state.strategy_config.get("risk_management", {})
        return {"risk_management": risk_config}

# Signal Confirmation Endpoints
@app.post("/signal-confirmation-config")
def update_signal_confirmation_config(config: SignalConfirmationConfig):
    """Update signal confirmation configuration"""
    with state.lock:
        state.strategy_config["signal_confirmation"] = config.dict()
    return {"status": "updated", "signal_confirmation": config.dict()}

@app.get("/signal-confirmation-config")
def get_signal_confirmation_config():
    """Get current signal confirmation configuration"""
    with state.lock:
        signal_config = state.strategy_config.get("signal_confirmation", {})
        return {"signal_confirmation": signal_config}

# Custom Exit Conditions Endpoints
@app.post("/custom-exit-config")
def update_custom_exit_config(config: CustomExitConfig):
    """Update custom exit conditions configuration"""
    with state.lock:
        state.strategy_config["custom_exit"] = config.dict()
    return {"status": "updated", "custom_exit": config.dict()}

@app.get("/custom-exit-config")
def get_custom_exit_config():
    """Get current custom exit conditions configuration"""
    with state.lock:
        exit_config = state.strategy_config.get("custom_exit", {})
        return {"custom_exit": exit_config}

# Backtest Endpoints
@app.post("/run-backtest")
def run_backtest(config: BacktestConfig):
    """Run a backtest with the given configuration"""
    try:
        # Simulate backtest results
        import random
        
        # Generate realistic backtest results based on strategy type
        strategy_type = config.strategy_config.get("active_strategy", "RSI")
        
        if "High Voltage" in strategy_type:
            total_trades = random.randint(80, 120)
            win_rate = random.randint(55, 75)
            total_return = random.uniform(15, 35)
            max_drawdown = random.uniform(8, 20)
            sharpe_ratio = random.uniform(1.5, 2.5)
            profit_factor = random.uniform(1.8, 3.0)
        elif "Steady Shield" in strategy_type:
            total_trades = random.randint(40, 80)
            win_rate = random.randint(65, 85)
            total_return = random.uniform(5, 15)
            max_drawdown = random.uniform(3, 10)
            sharpe_ratio = random.uniform(1.2, 2.0)
            profit_factor = random.uniform(1.5, 2.5)
        else:  # Default/Balance Mode
            total_trades = random.randint(60, 100)
            win_rate = random.randint(60, 80)
            total_return = random.uniform(8, 20)
            max_drawdown = random.uniform(5, 15)
            sharpe_ratio = random.uniform(1.3, 2.2)
            profit_factor = random.uniform(1.6, 2.8)
        
        result = BacktestResult(
            total_trades=total_trades,
            win_rate=f"{win_rate}%",
            total_return=f"+{total_return:.1f}%",
            max_drawdown=f"{max_drawdown:.1f}%",
            sharpe_ratio=f"{sharpe_ratio:.1f}",
            profit_factor=f"{profit_factor:.1f}",
            strategy_name=config.strategy_config.get("active_strategy", "Unknown"),
            asset=config.asset,
            period=f"{config.start_date} to {config.end_date}"
        )
        
        return {"status": "completed", "results": result.dict()}
        
    except Exception as e:
        return {"error": f"Backtest failed: {str(e)}"}

# Strategy Template Endpoints
TEMPLATES_FILE = "strategy_templates.json"

def load_strategy_templates():
    """Load strategy templates from file"""
    if os.path.exists(TEMPLATES_FILE):
        try:
            with open(TEMPLATES_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_strategy_templates_to_file(templates):
    """Save strategy templates to file"""
    with open(TEMPLATES_FILE, 'w') as f:
        json.dump(templates, f, indent=2)

@app.get("/strategy-templates")
def get_strategy_templates():
    """Get all strategy templates"""
    templates = load_strategy_templates()
    return {"templates": templates}

@app.post("/save-strategy-template")
def save_strategy_template(template: StrategyTemplate):
    """Save a strategy template"""
    templates = load_strategy_templates()
    
    now = datetime.utcnow().isoformat() + "Z"
    template_dict = template.dict()
    template_dict["created_at"] = now
    template_dict["updated_at"] = now
    
    templates[template.name] = template_dict
    save_strategy_templates_to_file(templates)
    
    return {"status": "saved", "template": template_dict}

@app.post("/load-strategy-template")
def load_strategy_template(name: str):
    """Load a strategy template"""
    templates = load_strategy_templates()
    
    if name not in templates:
        return {"error": "Template not found"}
    
    template = templates[name]
    
    with state.lock:
        # Apply the template configuration
        state.strategy_config.update(template["config"])
        if "risk_management" in template:
            state.strategy_config["risk_management"] = template["risk_management"]
        if "signal_confirmation" in template:
            state.strategy_config["signal_confirmation"] = template["signal_confirmation"]
        if "custom_exit" in template:
            state.strategy_config["custom_exit"] = template["custom_exit"]
    
    return {"status": "loaded", "template": template}

@app.delete("/delete-strategy-template")
def delete_strategy_template(name: str):
    """Delete a strategy template"""
    templates = load_strategy_templates()
    
    if name not in templates:
        return {"error": "Template not found"}
    
    del templates[name]
    save_strategy_templates_to_file(templates)
    
    return {"status": "deleted", "name": name}

# Strategy Clone Endpoint
@app.post("/clone-strategy")
def clone_strategy(original_name: str, new_name: str):
    """Clone an existing strategy with a new name"""
    strategies = load_saved_strategies()
    
    if original_name not in strategies:
        return {"error": "Original strategy not found"}
    
    if new_name in strategies:
        return {"error": "Strategy with new name already exists"}
    
    original_strategy = strategies[original_name].copy()
    original_strategy["name"] = new_name
    original_strategy["created_at"] = datetime.utcnow().isoformat() + "Z"
    original_strategy["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    strategies[new_name] = original_strategy
    save_strategies_to_file(strategies)
    
    return {"status": "cloned", "strategy": original_strategy}

# Comprehensive Strategy Configuration Endpoint
@app.post("/comprehensive-strategy-config")
def update_comprehensive_strategy_config(
    strategy_config: Dict[str, Any] = Body(...),
    risk_management: RiskManagementConfig = None,
    signal_confirmation: SignalConfirmationConfig = None,
    custom_exit: CustomExitConfig = None,
    strategy_notes: str = ""
):
    """Update comprehensive strategy configuration including all new features"""
    with state.lock:
        # Update main strategy config
        state.strategy_config.update(strategy_config)
        
        # Update risk management if provided
        if risk_management:
            state.strategy_config["risk_management"] = risk_management.dict()
        
        # Update signal confirmation if provided
        if signal_confirmation:
            state.strategy_config["signal_confirmation"] = signal_confirmation.dict()
        
        # Update custom exit conditions if provided
        if custom_exit:
            state.strategy_config["custom_exit"] = custom_exit.dict()
        
        # Store strategy notes
        if strategy_notes:
            state.strategy_config["strategy_notes"] = strategy_notes
    
    return {
        "status": "updated",
        "strategy_config": state.strategy_config
    }

@app.get("/comprehensive-strategy-config")
def get_comprehensive_strategy_config():
    """Get comprehensive strategy configuration including all features"""
    with state.lock:
        return {
            "strategy_config": state.strategy_config,
            "risk_management": state.strategy_config.get("risk_management", {}),
            "signal_confirmation": state.strategy_config.get("signal_confirmation", {}),
            "custom_exit": state.strategy_config.get("custom_exit", {}),
            "strategy_notes": state.strategy_config.get("strategy_notes", "")
        }

@app.get("/strategy-info")
def get_strategy_info():
    """Get information about available strategies and their descriptions"""
    strategy_info = {
        "rsi": {
            "name": "RSI Strategy",
            "description": "Relative Strength Index strategy that buys when RSI is oversold and sells when overbought",
            "best_for": "Range-bound markets, mean reversion trading",
            "parameters": {
                "rsi_overbought": "RSI level considered overbought (default: 70)",
                "rsi_oversold": "RSI level considered oversold (default: 30)",
                "rsi_timeframe": "Time period for RSI calculation (1min to 1day)"
            },
            "risk_level": "Medium",
            "expected_return": "5-15% annually",
            "drawdown": "10-20%"
        },
        "momentum": {
            "name": "Momentum Strategy",
            "description": "Follows price momentum by measuring rate of price change over a lookback period",
            "best_for": "Trending markets, strong directional moves",
            "parameters": {
                "momentum_lookback": "Number of periods to calculate momentum (5-100)",
                "momentum_threshold": "Minimum momentum required to trigger trades (0.1-2.0)"
            },
            "risk_level": "High",
            "expected_return": "15-30% annually",
            "drawdown": "20-35%"
        },
        "breakout": {
            "name": "Breakout Strategy",
            "description": "Identifies and trades breakouts from support/resistance levels using volatility bands",
            "best_for": "Range-bound markets about to break out, volatility expansion",
            "parameters": {
                "breakout_period": "Periods for calculating support/resistance (5-100)",
                "breakout_multiplier": "Volatility multiplier for breakout confirmation (0.5-5.0)"
            },
            "risk_level": "Medium-High",
            "expected_return": "10-25% annually",
            "drawdown": "15-30%"
        }
    }
    
    return {"strategy_info": strategy_info}

@app.on_event("startup")
def on_startup():
    start_trading_loop()

@app.post("/start-trading")
def start_trading():
    with state.lock:
        state.running = True
    return {"status": "started"}

@app.post("/stop-trading")
def stop_trading():
    with state.lock:
        state.running = False
    return {"status": "stopped"}

@app.get("/bot-status")
def get_bot_status():
    """Get current bot running status"""
    with state.lock:
        return {
            "running": state.running,
            "bot_schedule": state.bot_schedule
        }

@app.post("/update-bot-schedule")
def update_bot_schedule(schedule: str = Body(...)):
    """Update bot schedule (24/7 or market)"""
    if schedule not in ["24/7", "market"]:
        raise HTTPException(status_code=400, detail="Schedule must be '24/7' or 'market'")
    
    with state.lock:
        state.bot_schedule = schedule
    
    return {"status": "updated", "bot_schedule": state.bot_schedule}

# Exchange and trading configuration endpoints
@app.post("/set-exchange-config")
def set_exchange_config(config: ExchangeConfig):
    """Set exchange configuration (testnet/mainnet, trading pair, test balance)"""
    with state.lock:
        state.exchange_config = {
            "exchange": config.exchange,
            "is_testnet": config.is_testnet,
            "trading_pair": config.trading_pair,
            "test_balance": config.test_balance
        }
        # Update cash balance for test mode
        if config.is_testnet:
            state.cash = config.test_balance
    return {"status": "updated", "config": state.exchange_config}

@app.get("/get-exchange-config")
def get_exchange_config():
    """Get current exchange configuration"""
    with state.lock:
        config = getattr(state, 'exchange_config', {
            "exchange": "binance",
            "is_testnet": True,
            "trading_pair": "BTCUSDT",
            "test_balance": 10000.0
        })
    return {"config": config}

@app.get("/get-current-price")
def get_current_price():
    """Get current price for the configured trading pair"""
    with state.lock:
        config = getattr(state, 'exchange_config', {
            "exchange": "binance",
            "is_testnet": True,
            "trading_pair": "BTCUSDT",
            "test_balance": 10000.0
        })
    
    price = get_binance_price(config["trading_pair"], config["is_testnet"])
    if price:
        return {"symbol": config["trading_pair"], "price": price, "timestamp": datetime.utcnow().isoformat()}
    else:
        return {"error": "Failed to fetch price"}

@app.get("/available-pairs")
def get_available_pairs():
    """Get list of available trading pairs on Binance"""
    try:
        # Common pairs for demo - in production you'd fetch this from Binance API
        pairs = [
            "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT", 
            "XRPUSDT", "DOTUSDT", "DOGEUSDT", "AVAXUSDT", "MATICUSDT",
            "HBARUSDT", "LINKUSDT", "UNIUSDT", "ATOMUSDT", "LTCUSDT"
        ]
        return {"pairs": pairs}
    except Exception as e:
        return {"error": f"Failed to fetch pairs: {e}"}

class StockAnalysisRequest(BaseModel):
    symbol: str
    timeframe: str = "1D"

class StockAnalysis(BaseModel):
    symbol: str
    name: str
    current_price: float
    change_24h: float
    change_percent: float
    volume: float
    market_cap: float
    rsi: float
    macd: float
    bollinger_upper: float
    bollinger_lower: float
    support: float
    resistance: float
    trend: str
    volatility: str
    recommendation: str
    strategy: str
    risk_level: str
    confidence: float
    chart_data: List[Dict[str, Any]]
    
    class Config:
        arbitrary_types_allowed = True

@app.post("/ai-analysis")
def get_ai_analysis(request: StockAnalysisRequest):
    """Generate AI-powered analysis for a given stock symbol"""
    
    # Mock data for different stocks
    mock_data = {
        "BTC": {
            "name": "Bitcoin",
            "current_price": 58000,
            "change_24h": 1200,
            "change_percent": 2.1,
            "volume": 25000000000,
            "market_cap": 1100000000000,
            "rsi": 65,
            "macd": 0.8,
            "bollinger_upper": 59500,
            "bollinger_lower": 56500,
            "support": 57000,
            "resistance": 59000,
            "trend": "bullish",
            "volatility": "medium",
            "recommendation": "Strong momentum with RSI at 65. Consider grid trading strategy with tight stop-loss at $57,000. MACD shows positive divergence.",
            "strategy": "Grid Trading with 2% intervals",
            "risk_level": "medium",
            "confidence": 85,
        },
        "ETH": {
            "name": "Ethereum",
            "current_price": 3200,
            "change_24h": -50,
            "change_percent": -1.5,
            "volume": 15000000000,
            "market_cap": 380000000000,
            "rsi": 45,
            "macd": -0.2,
            "bollinger_upper": 3300,
            "bollinger_lower": 3100,
            "support": 3150,
            "resistance": 3250,
            "trend": "neutral",
            "volatility": "low",
            "recommendation": "RSI at 45 indicates oversold conditions. Consider DCA strategy with accumulation at $3,150 support level.",
            "strategy": "Dollar Cost Averaging",
            "risk_level": "low",
            "confidence": 72,
        },
        "SOL": {
            "name": "Solana",
            "current_price": 140,
            "change_24h": 8,
            "change_percent": 6.0,
            "volume": 8000000000,
            "market_cap": 65000000000,
            "rsi": 78,
            "macd": 1.2,
            "bollinger_upper": 145,
            "bollinger_lower": 135,
            "support": 138,
            "resistance": 142,
            "trend": "bullish",
            "volatility": "high",
            "recommendation": "RSI at 78 indicates overbought conditions. Consider momentum strategy with trailing stops. High volatility requires careful position sizing.",
            "strategy": "Momentum Trading with Trailing Stops",
            "risk_level": "high",
            "confidence": 68,
        },
        "ADA": {
            "name": "Cardano",
            "current_price": 0.45,
            "change_24h": -0.02,
            "change_percent": -4.3,
            "volume": 2000000000,
            "market_cap": 16000000000,
            "rsi": 35,
            "macd": -0.5,
            "bollinger_upper": 0.48,
            "bollinger_lower": 0.42,
            "support": 0.43,
            "resistance": 0.47,
            "trend": "bearish",
            "volatility": "medium",
            "recommendation": "RSI at 35 shows oversold conditions. Consider breakout strategy if price breaks above $0.47 resistance. Risk-reward favorable.",
            "strategy": "Breakout Trading",
            "risk_level": "medium",
            "confidence": 75,
        },
        "XRP": {
            "name": "Ripple",
            "current_price": 0.52,
            "change_24h": 0.03,
            "change_percent": 6.1,
            "volume": 3000000000,
            "market_cap": 28000000000,
            "rsi": 70,
            "macd": 0.3,
            "bollinger_upper": 0.54,
            "bollinger_lower": 0.50,
            "support": 0.51,
            "resistance": 0.53,
            "trend": "bullish",
            "volatility": "low",
            "recommendation": "Strong uptrend with RSI at 70. Consider scalping strategy with tight profit targets. Low volatility makes it suitable for frequent trades.",
            "strategy": "Scalping with 1% targets",
            "risk_level": "low",
            "confidence": 82,
        }
    }
    
    # Generate mock chart data
    def generate_chart_data(base_price: float, trend: str, volatility: str):
        data = []
        price = base_price
        for i in range(8):
            # Add some randomness based on volatility
            volatility_factor = {"low": 0.005, "medium": 0.015, "high": 0.03}[volatility]
            change = random.uniform(-volatility_factor, volatility_factor) * price
            
            # Add trend bias
            if trend == "bullish":
                change += random.uniform(0, 0.01) * price
            elif trend == "bearish":
                change -= random.uniform(0, 0.01) * price
                
            price += change
            volume = random.uniform(0.8, 1.2) * 1000000
            
            data.append({
                "time": f"{9+i:02d}:00",
                "price": round(price, 2),
                "volume": int(volume)
            })
        return data
    
    if request.symbol in mock_data:
        stock_data = mock_data[request.symbol]
        chart_data = generate_chart_data(
            stock_data["current_price"], 
            stock_data["trend"], 
            stock_data["volatility"]
        )
        
        analysis = StockAnalysis(
            symbol=request.symbol,
            name=stock_data["name"],
            current_price=stock_data["current_price"],
            change_24h=stock_data["change_24h"],
            change_percent=stock_data["change_percent"],
            volume=stock_data["volume"],
            market_cap=stock_data["market_cap"],
            rsi=stock_data["rsi"],
            macd=stock_data["macd"],
            bollinger_upper=stock_data["bollinger_upper"],
            bollinger_lower=stock_data["bollinger_lower"],
            support=stock_data["support"],
            resistance=stock_data["resistance"],
            trend=stock_data["trend"],
            volatility=stock_data["volatility"],
            recommendation=stock_data["recommendation"],
            strategy=stock_data["strategy"],
            risk_level=stock_data["risk_level"],
            confidence=stock_data["confidence"],
            chart_data=chart_data
        )
        
        return {"analysis": analysis}
    else:
        return {"error": f"Analysis not available for {request.symbol}"}

@app.get("/available-stocks")
def get_available_stocks():
    """Get list of available stocks for analysis"""
    return {
        "stocks": [
            {"symbol": "BTC", "name": "Bitcoin"},
            {"symbol": "ETH", "name": "Ethereum"},
            {"symbol": "SOL", "name": "Solana"},
            {"symbol": "ADA", "name": "Cardano"},
            {"symbol": "XRP", "name": "Ripple"},
            {"symbol": "DOT", "name": "Polkadot"},
            {"symbol": "LINK", "name": "Chainlink"},
            {"symbol": "UNI", "name": "Uniswap"},
            {"symbol": "MATIC", "name": "Polygon"},
            {"symbol": "AVAX", "name": "Avalanche"}
        ]
    } 

@app.post("/ultimate-roi-strategy")
def save_ultimate_roi_strategy(strategy: UltimateROIStrategy):
    """Save Ultimate ROI Strategy configuration"""
    try:
        # Save to file
        with open("ultimate_roi_strategy.json", "w") as f:
            json.dump(strategy.dict(), f, indent=2)
        
        return {"message": "Ultimate ROI Strategy saved successfully", "strategy": strategy.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save strategy: {str(e)}")

@app.get("/ultimate-roi-strategy")
def get_ultimate_roi_strategy():
    """Get Ultimate ROI Strategy configuration"""
    try:
        if os.path.exists("ultimate_roi_strategy.json"):
            with open("ultimate_roi_strategy.json", "r") as f:
                return json.load(f)
        else:
            # Return default strategy
            default_strategy = UltimateROIStrategy()
            return default_strategy.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load strategy: {str(e)}")

@app.get("/allocate-capital")
def allocate_capital():
    """Dynamic capital allocation based on ROI and strategy performance"""
    try:
        # Simulate asset performance data
        assets = [
            {"symbol": "BTCUSDT", "roi": 2.5, "volume": 1500000, "risk_score": 45, "confidence": 85},
            {"symbol": "ETHUSDT", "roi": 1.8, "volume": 1200000, "risk_score": 52, "confidence": 78},
            {"symbol": "ADAUSDT", "roi": 3.2, "volume": 800000, "risk_score": 68, "confidence": 72},
            {"symbol": "DOTUSDT", "roi": 1.2, "volume": 600000, "risk_score": 58, "confidence": 65}
        ]
        
        # Sort by ROI (highest first)
        sorted_assets = sorted(assets, key=lambda x: x["roi"], reverse=True)
        
        # Apply allocation rules
        allocation_rules = {
            "highest_roi": 0.40,
            "second_roi": 0.30,
            "third_roi": 0.20,
            "remainder": 0.10
        }
        
        allocations = []
        for i, asset in enumerate(sorted_assets):
            if i == 0:
                allocation = allocation_rules["highest_roi"]
            elif i == 1:
                allocation = allocation_rules["second_roi"]
            elif i == 2:
                allocation = allocation_rules["third_roi"]
            else:
                allocation = allocation_rules["remainder"] / (len(sorted_assets) - 3)
            
            # Calculate leverage based on risk score
            leverage = min(5.0, max(1.0, (100 - asset["risk_score"]) / 20))
            
            allocations.append({
                "asset": asset["symbol"],
                "allocation_percentage": allocation * 100,
                "current_roi": asset["roi"],
                "leverage": leverage,
                "risk_score": asset["risk_score"],
                "strategy_confidence": asset["confidence"],
                "volume": asset["volume"],
                "recommended_position_size": allocation * 10000  # Assuming $10k portfolio
            })
        
        return {
            "message": "Capital allocation calculated",
            "allocations": allocations,
            "total_allocated": sum(a["allocation_percentage"] for a in allocations),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to allocate capital: {str(e)}")

@app.get("/portfolio-status")
def get_portfolio_status():
    """Get current portfolio status and allocations"""
    try:
        # Simulate portfolio data
        portfolio = {
            "total_value": 15000.0,
            "daily_pnl": 320.0,
            "daily_return": 2.13,
            "max_drawdown": 3.2,
            "risk_score": 45,
            "active_positions": 4,
            "allocations": [
                {
                    "asset": "BTCUSDT",
                    "allocation": 40.0,
                    "current_value": 6000.0,
                    "pnl": 150.0,
                    "leverage": 3.2,
                    "status": "active"
                },
                {
                    "asset": "ETHUSDT",
                    "allocation": 30.0,
                    "current_value": 4500.0,
                    "pnl": 90.0,
                    "leverage": 2.8,
                    "status": "active"
                },
                {
                    "asset": "ADAUSDT",
                    "allocation": 20.0,
                    "current_value": 3000.0,
                    "pnl": 60.0,
                    "leverage": 3.5,
                    "status": "active"
                },
                {
                    "asset": "DOTUSDT",
                    "allocation": 10.0,
                    "current_value": 1500.0,
                    "pnl": 20.0,
                    "leverage": 2.0,
                    "status": "active"
                }
            ],
            "compounding_enabled": True,
            "last_reallocation": "2024-01-15T14:30:00Z",
            "next_reallocation": "2024-01-15T14:45:00Z"
        }
        
        return portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio status: {str(e)}")

@app.get("/reallocation-log")
def get_reallocation_log():
    """Get reallocation history"""
    try:
        # Simulate reallocation log
        log_entries = [
            {
                "timestamp": "2024-01-15T14:30:00Z",
                "asset": "BTCUSDT",
                "old_allocation": 35.0,
                "new_allocation": 40.0,
                "reason": "Highest ROI performance",
                "roi_change": 0.8
            },
            {
                "timestamp": "2024-01-15T14:15:00Z",
                "asset": "ETHUSDT",
                "old_allocation": 25.0,
                "new_allocation": 30.0,
                "reason": "Strong momentum signals",
                "roi_change": 0.5
            },
            {
                "timestamp": "2024-01-15T14:00:00Z",
                "asset": "ADAUSDT",
                "old_allocation": 15.0,
                "new_allocation": 20.0,
                "reason": "Breakout confirmation",
                "roi_change": 1.2
            }
        ]
        
        return {
            "message": "Reallocation log retrieved",
            "entries": log_entries,
            "total_entries": len(log_entries)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reallocation log: {str(e)}")

@app.post("/trade-simulation")
def simulate_trade(config: Dict[str, Any] = Body(...)):
    """Backtest Ultimate ROI Strategy on historical data"""
    try:
        # Simulate backtest results
        simulation_results = {
            "strategy_name": "Ultimate ROI Strategy",
            "backtest_period": "30 days",
            "initial_capital": 10000.0,
            "final_capital": 15680.0,
            "total_return": 56.8,
            "daily_average_return": 2.13,
            "max_drawdown": 8.5,
            "sharpe_ratio": 1.85,
            "win_rate": 68.5,
            "total_trades": 142,
            "profitable_trades": 97,
            "losing_trades": 45,
            "largest_win": 4.2,
            "largest_loss": -2.1,
            "compounding_effect": "Exponential growth achieved",
            "reallocation_frequency": "Every 15 minutes",
            "leverage_utilization": "Average 2.8x across portfolio"
        }
        
        return {
            "message": "Trade simulation completed",
            "results": simulation_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to simulate trades: {str(e)}") 