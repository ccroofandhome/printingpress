import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

class UserDataManager:
    """Manages user-specific data storage"""
    
    def __init__(self):
        self.users_data_dir = "user_data"
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Ensure the user data directory exists"""
        if not os.path.exists(self.users_data_dir):
            os.makedirs(self.users_data_dir)
    
    def _get_user_file(self, user_email: str) -> str:
        """Get the file path for a user's data"""
        # Sanitize email for filename
        safe_email = user_email.replace('@', '_at_').replace('.', '_')
        return os.path.join(self.users_data_dir, f"{safe_email}.json")
    
    def _load_user_data(self, user_email: str) -> Dict[str, Any]:
        """Load user data from file"""
        file_path = self._get_user_file(user_email)
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    return json.load(f)
            except:
                return self._get_default_user_data()
        return self._get_default_user_data()
    
    def _save_user_data(self, user_email: str, data: Dict[str, Any]):
        """Save user data to file"""
        file_path = self._get_user_file(user_email)
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _get_default_user_data(self) -> Dict[str, Any]:
        """Get default user data structure"""
        return {
            "exchanges": {},
            "strategies": {},
            "custom_strategies": [],
            "exchange_config": {
                "exchange": "binance",
                "is_testnet": True,
                "trading_pair": "BTCUSDT",
                "test_balance": 10000.0
            },
            "risk_management": {
                "max_daily_loss_limit": 5.0,
                "max_consecutive_losses": 3,
                "max_drawdown_limit": 15.0,
                "risk_tolerance": "Moderate"
            },
            "signal_confirmation": {
                "min_volume_threshold": 100000,
                "macd_confirmation": True,
                "multi_timeframe_confirmation": "15m + 1h align"
            },
            "custom_exit": {
                "profit_target": 8.0,
                "stop_loss": 4.0,
                "time_based_exit": 60
            },
            "bot_status": {
                "running": False,
                "schedule": "24/7"
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    # Exchange management
    def get_user_exchanges(self, user_email: str) -> Dict[str, Any]:
        """Get user's connected exchanges"""
        data = self._load_user_data(user_email)
        return data.get("exchanges", {})
    
    def add_user_exchange(self, user_email: str, exchange_name: str, exchange_data: Dict[str, Any]):
        """Add or update user's exchange connection"""
        data = self._load_user_data(user_email)
        data["exchanges"][exchange_name.lower()] = exchange_data
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    def remove_user_exchange(self, user_email: str, exchange_name: str):
        """Remove user's exchange connection"""
        data = self._load_user_data(user_email)
        if exchange_name.lower() in data["exchanges"]:
            del data["exchanges"][exchange_name.lower()]
            data["updated_at"] = datetime.now().isoformat()
            self._save_user_data(user_email, data)
    
    def get_user_exchange(self, user_email: str, exchange_name: str) -> Optional[Dict[str, Any]]:
        """Get specific user exchange data"""
        exchanges = self.get_user_exchanges(user_email)
        return exchanges.get(exchange_name.lower())
    
    # Strategy management
    def get_user_strategies(self, user_email: str) -> Dict[str, Any]:
        """Get user's saved strategies"""
        data = self._load_user_data(user_email)
        return data.get("strategies", {})
    
    def save_user_strategy(self, user_email: str, strategy_name: str, strategy_data: Dict[str, Any]):
        """Save user's strategy"""
        data = self._load_user_data(user_email)
        data["strategies"][strategy_name] = strategy_data
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    def delete_user_strategy(self, user_email: str, strategy_name: str):
        """Delete user's strategy"""
        data = self._load_user_data(user_email)
        if strategy_name in data["strategies"]:
            del data["strategies"][strategy_name]
            data["updated_at"] = datetime.now().isoformat()
            self._save_user_data(user_email, data)
    
    # Custom strategies
    def get_user_custom_strategies(self, user_email: str) -> List[Dict[str, Any]]:
        """Get user's custom strategies"""
        data = self._load_user_data(user_email)
        return data.get("custom_strategies", [])
    
    def save_user_custom_strategy(self, user_email: str, strategy_data: Dict[str, Any]):
        """Save user's custom strategy"""
        data = self._load_user_data(user_email)
        data["custom_strategies"].append(strategy_data)
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    def delete_user_custom_strategy(self, user_email: str, strategy_id: str):
        """Delete user's custom strategy"""
        data = self._load_user_data(user_email)
        data["custom_strategies"] = [
            s for s in data["custom_strategies"] 
            if s.get("id") != strategy_id
        ]
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    # Exchange config
    def get_user_exchange_config(self, user_email: str) -> Dict[str, Any]:
        """Get user's exchange configuration"""
        data = self._load_user_data(user_email)
        return data.get("exchange_config", {})
    
    def update_user_exchange_config(self, user_email: str, config: Dict[str, Any]):
        """Update user's exchange configuration"""
        data = self._load_user_data(user_email)
        data["exchange_config"] = config
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    # Risk management
    def get_user_risk_management(self, user_email: str) -> Dict[str, Any]:
        """Get user's risk management settings"""
        data = self._load_user_data(user_email)
        return data.get("risk_management", {})
    
    def update_user_risk_management(self, user_email: str, settings: Dict[str, Any]):
        """Update user's risk management settings"""
        data = self._load_user_data(user_email)
        data["risk_management"] = settings
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    # Signal confirmation
    def get_user_signal_confirmation(self, user_email: str) -> Dict[str, Any]:
        """Get user's signal confirmation settings"""
        data = self._load_user_data(user_email)
        return data.get("signal_confirmation", {})
    
    def update_user_signal_confirmation(self, user_email: str, settings: Dict[str, Any]):
        """Update user's signal confirmation settings"""
        data = self._load_user_data(user_email)
        data["signal_confirmation"] = settings
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    # Custom exit
    def get_user_custom_exit(self, user_email: str) -> Dict[str, Any]:
        """Get user's custom exit settings"""
        data = self._load_user_data(user_email)
        return data.get("custom_exit", {})
    
    def update_user_custom_exit(self, user_email: str, settings: Dict[str, Any]):
        """Update user's custom exit settings"""
        data = self._load_user_data(user_email)
        data["custom_exit"] = settings
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    # Bot status
    def get_user_bot_status(self, user_email: str) -> Dict[str, Any]:
        """Get user's bot status"""
        data = self._load_user_data(user_email)
        return data.get("bot_status", {})
    
    def update_user_bot_status(self, user_email: str, status: Dict[str, Any]):
        """Update user's bot status"""
        data = self._load_user_data(user_email)
        data["bot_status"] = status
        data["updated_at"] = datetime.now().isoformat()
        self._save_user_data(user_email, data)
    
    # User data management
    def delete_user_data(self, user_email: str):
        """Delete all user data"""
        file_path = self._get_user_file(user_email)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    def get_user_data(self, user_email: str) -> Dict[str, Any]:
        """Get all user data"""
        return self._load_user_data(user_email)
    
    def save_user_data(self, user_email: str, data: Dict[str, Any]):
        """Save all user data"""
        self._save_user_data(user_email, data)
    
    def get_user_data_summary(self, user_email: str) -> Dict[str, Any]:
        """Get summary of user's data"""
        data = self._load_user_data(user_email)
        return {
            "exchanges_count": len(data.get("exchanges", {})),
            "strategies_count": len(data.get("strategies", {})),
            "custom_strategies_count": len(data.get("custom_strategies", [])),
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at")
        }

# Global instance
user_data_manager = UserDataManager() 