from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
import requests
import hmac
import hashlib
import time
import json
from datetime import datetime
from pydantic import BaseModel

class ExchangeCredentials(BaseModel):
    api_key: str
    api_secret: str
    passphrase: Optional[str] = None  # For exchanges like KuCoin that use passphrase
    sandbox: bool = False

class Balance(BaseModel):
    asset: str
    free: float
    used: float
    total: float

class Ticker(BaseModel):
    symbol: str
    price: float
    volume_24h: float
    change_24h: float

class Order(BaseModel):
    symbol: str
    side: str  # 'buy' or 'sell'
    quantity: float
    price: float
    order_type: str  # 'market' or 'limit'
    status: str

class ExchangeConnector(ABC):
    """Base class for all exchange connectors"""
    
    def __init__(self, credentials: ExchangeCredentials):
        self.credentials = credentials
        self.base_url = self._get_base_url()
    
    @abstractmethod
    def _get_base_url(self) -> str:
        """Return the base URL for the exchange API"""
        pass
    
    @abstractmethod
    def _get_auth_headers(self, method: str, endpoint: str, params: Dict = None, body: Dict = None) -> Dict[str, str]:
        """Generate authentication headers for API requests"""
        pass
    
    @abstractmethod
    def test_connection(self) -> Tuple[bool, str]:
        """Test if the API credentials are valid"""
        pass
    
    @abstractmethod
    def get_balances(self) -> List[Balance]:
        """Get account balances"""
        pass
    
    @abstractmethod
    def get_tickers(self, symbols: List[str] = None) -> List[Ticker]:
        """Get current ticker information"""
        pass
    
    @abstractmethod
    def place_order(self, order: Order) -> Dict[str, Any]:
        """Place a new order"""
        pass
    
    def _make_request(self, method: str, endpoint: str, params: Dict = None, body: Dict = None) -> Dict[str, Any]:
        """Make an authenticated API request"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_auth_headers(method, endpoint, params, body)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=body, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")

class BTCCConnector(ExchangeConnector):
    """BTCC Exchange Connector"""
    
    def _get_base_url(self) -> str:
        return "https://api.btcc.com" if not self.credentials.sandbox else "https://api-testnet.btcc.com"
    
    def _get_auth_headers(self, method: str, endpoint: str, params: Dict = None, body: Dict = None) -> Dict[str, str]:
        timestamp = str(int(time.time() * 1000))
        
        # Create signature string
        signature_string = f"{method.upper()}{endpoint}{timestamp}"
        if params:
            signature_string += json.dumps(params, separators=(',', ':'))
        if body:
            signature_string += json.dumps(body, separators=(',', ':'))
        
        # Generate signature
        signature = hmac.new(
            self.credentials.api_secret.encode('utf-8'),
            signature_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return {
            "X-BTCC-APIKEY": self.credentials.api_key,
            "X-BTCC-SIGNATURE": signature,
            "X-BTCC-TIMESTAMP": timestamp,
            "Content-Type": "application/json"
        }
    
    def test_connection(self) -> Tuple[bool, str]:
        """Test BTCC API connection by getting account info"""
        try:
            response = self._make_request("GET", "/api/v1/account")
            if "accountId" in response:
                return True, "Connection successful"
            else:
                return False, "Invalid response format"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"
    
    def get_balances(self) -> List[Balance]:
        """Get BTCC account balances"""
        try:
            response = self._make_request("GET", "/api/v1/account/balances")
            balances = []
            
            for balance_data in response.get("balances", []):
                balances.append(Balance(
                    asset=balance_data["currency"],
                    free=float(balance_data.get("available", 0)),
                    used=float(balance_data.get("locked", 0)),
                    total=float(balance_data.get("total", 0))
                ))
            
            return balances
        except Exception as e:
            raise Exception(f"Failed to get balances: {str(e)}")
    
    def get_tickers(self, symbols: List[str] = None) -> List[Ticker]:
        """Get BTCC ticker information"""
        try:
            if symbols:
                params = {"symbols": ",".join(symbols)}
                response = self._make_request("GET", "/api/v1/market/tickers", params=params)
            else:
                response = self._make_request("GET", "/api/v1/market/tickers")
            
            tickers = []
            for ticker_data in response.get("tickers", []):
                tickers.append(Ticker(
                    symbol=ticker_data["symbol"],
                    price=float(ticker_data.get("price", 0)),
                    volume_24h=float(ticker_data.get("volume", 0)),
                    change_24h=float(ticker_data.get("change", 0))
                ))
            
            return tickers
        except Exception as e:
            raise Exception(f"Failed to get tickers: {str(e)}")
    
    def place_order(self, order: Order) -> Dict[str, Any]:
        """Place an order on BTCC"""
        try:
            order_data = {
                "symbol": order.symbol,
                "side": order.side.upper(),
                "type": order.order_type.upper(),
                "quantity": str(order.quantity)
            }
            
            if order.order_type.lower() == "limit":
                order_data["price"] = str(order.price)
            
            response = self._make_request("POST", "/api/v1/order", body=order_data)
            return response
        except Exception as e:
            raise Exception(f"Failed to place order: {str(e)}")

class BinanceConnector(ExchangeConnector):
    """Binance Exchange Connector"""
    
    def _get_base_url(self) -> str:
        return "https://api.binance.com" if not self.credentials.sandbox else "https://testnet.binance.vision"
    
    def _get_auth_headers(self, method: str, endpoint: str, params: Dict = None, body: Dict = None) -> Dict[str, str]:
        timestamp = str(int(time.time() * 1000))
        
        # Create query string for signature
        query_string = ""
        if params:
            query_string = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
        
        # Create signature string
        signature_string = f"{method.upper()}{endpoint}{query_string}{timestamp}"
        if body:
            signature_string += json.dumps(body, separators=(',', ':'))
        
        # Generate signature
        signature = hmac.new(
            self.credentials.api_secret.encode('utf-8'),
            signature_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        headers = {
            "X-MBX-APIKEY": self.credentials.api_key,
            "Content-Type": "application/json"
        }
        
        if params:
            params["signature"] = signature
            params["timestamp"] = timestamp
        
        return headers
    
    def test_connection(self) -> Tuple[bool, str]:
        """Test Binance API connection by getting account info"""
        try:
            response = self._make_request("GET", "/api/v3/account")
            if "makerCommission" in response:
                return True, "Connection successful"
            else:
                return False, "Invalid response format"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"
    
    def get_balances(self) -> List[Balance]:
        """Get Binance account balances"""
        try:
            response = self._make_request("GET", "/api/v3/account")
            balances = []
            
            for balance_data in response.get("balances", []):
                free = float(balance_data.get("free", 0))
                used = float(balance_data.get("locked", 0))
                total = free + used
                
                if total > 0:  # Only include non-zero balances
                    balances.append(Balance(
                        asset=balance_data["asset"],
                        free=free,
                        used=used,
                        total=total
                    ))
            
            return balances
        except Exception as e:
            raise Exception(f"Failed to get balances: {str(e)}")
    
    def get_tickers(self, symbols: List[str] = None) -> List[Ticker]:
        """Get Binance ticker information"""
        try:
            if symbols:
                params = {"symbols": json.dumps(symbols)}
                response = self._make_request("GET", "/api/v3/ticker/24hr", params=params)
            else:
                response = self._make_request("GET", "/api/v3/ticker/24hr")
            
            tickers = []
            ticker_list = response if isinstance(response, list) else [response]
            
            for ticker_data in ticker_list:
                tickers.append(Ticker(
                    symbol=ticker_data["symbol"],
                    price=float(ticker_data.get("lastPrice", 0)),
                    volume_24h=float(ticker_data.get("volume", 0)),
                    change_24h=float(ticker_data.get("priceChangePercent", 0))
                ))
            
            return tickers
        except Exception as e:
            raise Exception(f"Failed to get tickers: {str(e)}")
    
    def place_order(self, order: Order) -> Dict[str, Any]:
        """Place an order on Binance"""
        try:
            order_data = {
                "symbol": order.symbol,
                "side": order.side.upper(),
                "type": order.order_type.upper(),
                "quantity": str(order.quantity)
            }
            
            if order.order_type.lower() == "limit":
                order_data["price"] = str(order.price)
                order_data["timeInForce"] = "GTC"
            
            response = self._make_request("POST", "/api/v3/order", body=order_data)
            return response
        except Exception as e:
            raise Exception(f"Failed to place order: {str(e)}")

class KuCoinConnector(ExchangeConnector):
    """KuCoin Exchange Connector"""
    
    def _get_base_url(self) -> str:
        return "https://api.kucoin.com" if not self.credentials.sandbox else "https://sandbox-api.kucoin.com"
    
    def _get_auth_headers(self, method: str, endpoint: str, params: Dict = None, body: Dict = None) -> Dict[str, str]:
        timestamp = str(int(time.time() * 1000))
        
        # Create signature string
        signature_string = f"{method.upper()}{endpoint}{timestamp}"
        if body:
            signature_string += json.dumps(body, separators=(',', ':'))
        
        # Generate signature
        signature = hmac.new(
            self.credentials.api_secret.encode('utf-8'),
            signature_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Generate passphrase signature
        passphrase_signature = hmac.new(
            self.credentials.api_secret.encode('utf-8'),
            self.credentials.passphrase.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return {
            "KC-API-KEY": self.credentials.api_key,
            "KC-API-SIGN": signature,
            "KC-API-TIMESTAMP": timestamp,
            "KC-API-PASSPHRASE": self.credentials.passphrase,
            "KC-API-KEY-VERSION": "2",
            "Content-Type": "application/json"
        }
    
    def test_connection(self) -> Tuple[bool, str]:
        """Test KuCoin API connection by getting account info"""
        try:
            response = self._make_request("GET", "/api/v1/accounts")
            if "data" in response:
                return True, "Connection successful"
            else:
                return False, "Invalid response format"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"
    
    def get_balances(self) -> List[Balance]:
        """Get KuCoin account balances"""
        try:
            response = self._make_request("GET", "/api/v1/accounts")
            balances = []
            
            for account_data in response.get("data", []):
                balances.append(Balance(
                    asset=account_data["currency"],
                    free=float(account_data.get("available", 0)),
                    used=float(account_data.get("holds", 0)),
                    total=float(account_data.get("balance", 0))
                ))
            
            return balances
        except Exception as e:
            raise Exception(f"Failed to get balances: {str(e)}")
    
    def get_tickers(self, symbols: List[str] = None) -> List[Ticker]:
        """Get KuCoin ticker information"""
        try:
            if symbols:
                params = {"symbol": ",".join(symbols)}
                response = self._make_request("GET", "/api/v1/market/orderbook/level1", params=params)
            else:
                response = self._make_request("GET", "/api/v1/market/allTickers")
            
            tickers = []
            ticker_list = response.get("data", {}).get("ticker", []) if "data" in response else [response]
            
            for ticker_data in ticker_list:
                tickers.append(Ticker(
                    symbol=ticker_data.get("symbol", ""),
                    price=float(ticker_data.get("price", 0)),
                    volume_24h=float(ticker_data.get("vol", 0)),
                    change_24h=float(ticker_data.get("changeRate", 0))
                ))
            
            return tickers
        except Exception as e:
            raise Exception(f"Failed to get tickers: {str(e)}")
    
    def place_order(self, order: Order) -> Dict[str, Any]:
        """Place an order on KuCoin"""
        try:
            order_data = {
                "clientOid": f"bot_{int(time.time() * 1000)}",
                "symbol": order.symbol,
                "side": order.side.lower(),
                "type": order.order_type.lower(),
                "size": str(order.quantity)
            }
            
            if order.order_type.lower() == "limit":
                order_data["price"] = str(order.price)
            
            response = self._make_request("POST", "/api/v1/orders", body=order_data)
            return response
        except Exception as e:
            raise Exception(f"Failed to place order: {str(e)}")

class ExchangeConnectorFactory:
    """Factory for creating exchange connectors"""
    
    @staticmethod
    def create_connector(exchange_name: str, credentials: ExchangeCredentials) -> ExchangeConnector:
        """Create a connector for the specified exchange"""
        exchange_name = exchange_name.lower()
        
        if exchange_name == "btcc":
            return BTCCConnector(credentials)
        elif exchange_name == "binance":
            return BinanceConnector(credentials)
        elif exchange_name == "kucoin":
            return KuCoinConnector(credentials)
        else:
            raise ValueError(f"Unsupported exchange: {exchange_name}")
    
    @staticmethod
    def get_supported_exchanges() -> List[str]:
        """Get list of supported exchanges"""
        return ["btcc", "binance", "kucoin"] 