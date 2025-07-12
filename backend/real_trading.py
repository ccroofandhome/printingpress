import threading
import time
import datetime
import pytz
from typing import Dict, Any, Optional
from exchange_connectors import ExchangeConnectorFactory, Order
from user_data import user_data_manager
from trading_state import state
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealTradingBot:
    def __init__(self):
        self.running = False
        self.thread = None
        self.user_exchanges = {}  # Store user-specific exchange connections
        self.trade_history = []
        self.risk_limits = {
            'max_daily_loss': 5.0,  # 5% max daily loss
            'max_position_size': 0.1,  # 10% max position size
            'max_consecutive_losses': 3,
            'stop_loss_percent': 2.0,
            'take_profit_percent': 5.0
        }
        
    def start_trading(self, user_email: str):
        """Start real trading for a specific user"""
        if self.running:
            logger.warning("Trading bot is already running")
            return False
            
        # Load user's connected exchanges
        user_data = user_data_manager.get_user_data(user_email)
        connected_exchanges = user_data.get('connected_exchanges', {})
        
        if not connected_exchanges:
            logger.error(f"No connected exchanges found for user {user_email}")
            return False
            
        self.user_exchanges[user_email] = connected_exchanges
        self.running = True
        self.thread = threading.Thread(target=self._trading_loop, args=(user_email,), daemon=True)
        self.thread.start()
        logger.info(f"Started real trading bot for user {user_email}")
        return True
        
    def stop_trading(self):
        """Stop the trading bot"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Stopped real trading bot")
        
    def _trading_loop(self, user_email: str):
        """Main trading loop that executes real trades"""
        while self.running:
            try:
                # Get current strategy configuration
                with state.lock:
                    strategy_config = state.strategy_config.copy()
                    
                # Get user's exchange connections
                exchanges = self.user_exchanges.get(user_email, {})
                
                for exchange_name, exchange_data in exchanges.items():
                    if not self.running:
                        break
                        
                    # Execute trading logic for this exchange
                    self._execute_trading_logic(user_email, exchange_name, exchange_data, strategy_config)
                    
                # Sleep between iterations
                time.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in trading loop: {e}")
                time.sleep(30)  # Wait longer on error
                
    def _execute_trading_logic(self, user_email: str, exchange_name: str, exchange_data: Dict, strategy_config: Dict):
        """Execute trading logic for a specific exchange"""
        try:
            # Create exchange connector
            connector = ExchangeConnectorFactory.create_connector(
                exchange_name,
                ExchangeCredentials(
                    api_key=exchange_data['api_key'],
                    api_secret=exchange_data['api_secret'],
                    passphrase=exchange_data.get('passphrase'),
                    sandbox=exchange_data.get('sandbox', False)
                )
            )
            
            # Get current market data
            tickers = connector.get_tickers(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'])
            if not tickers:
                logger.warning(f"No ticker data available for {exchange_name}")
                return
                
            # Get account balance
            balances = connector.get_balances()
            if not balances:
                logger.warning(f"No balance data available for {exchange_name}")
                return
                
            # Analyze market and generate signals
            signals = self._generate_trading_signals(tickers, strategy_config)
            
            # Execute trades based on signals
            for signal in signals:
                if self._should_execute_trade(signal, balances, user_email):
                    self._execute_real_trade(connector, signal, user_email, exchange_name)
                    
        except Exception as e:
            logger.error(f"Error executing trading logic for {exchange_name}: {e}")
            
    def _generate_trading_signals(self, tickers: Dict, strategy_config: Dict) -> list:
        """Generate trading signals based on strategy configuration"""
        signals = []
        strategy_type = strategy_config.get('active_strategy', 'rsi')
        
        for symbol, ticker in tickers.items():
            current_price = float(ticker['price'])
            
            # Calculate technical indicators
            rsi = self._calculate_rsi(symbol, current_price)  # Simplified RSI
            momentum = self._calculate_momentum(symbol, current_price)
            
            signal = None
            
            if strategy_type == 'rsi':
                rsi_oversold = strategy_config.get('rsi_oversold', 30)
                rsi_overbought = strategy_config.get('rsi_overbought', 70)
                
                if rsi < rsi_oversold:
                    signal = {'action': 'buy', 'symbol': symbol, 'price': current_price, 'reason': 'RSI oversold'}
                elif rsi > rsi_overbought:
                    signal = {'action': 'sell', 'symbol': symbol, 'price': current_price, 'reason': 'RSI overbought'}
                    
            elif strategy_type == 'momentum':
                momentum_threshold = strategy_config.get('momentum_threshold', 0.5)
                
                if momentum > momentum_threshold:
                    signal = {'action': 'buy', 'symbol': symbol, 'price': current_price, 'reason': 'Positive momentum'}
                elif momentum < -momentum_threshold:
                    signal = {'action': 'sell', 'symbol': symbol, 'price': current_price, 'reason': 'Negative momentum'}
                    
            elif strategy_type == 'breakout':
                # Simplified breakout detection
                breakout_multiplier = strategy_config.get('breakout_multiplier', 2.0)
                avg_price = self._get_average_price(symbol)
                
                if current_price > avg_price * (1 + breakout_multiplier / 100):
                    signal = {'action': 'buy', 'symbol': symbol, 'price': current_price, 'reason': 'Breakout detected'}
                elif current_price < avg_price * (1 - breakout_multiplier / 100):
                    signal = {'action': 'sell', 'symbol': symbol, 'price': current_price, 'reason': 'Breakdown detected'}
                    
            if signal:
                signals.append(signal)
                
        return signals
        
    def _should_execute_trade(self, signal: Dict, balances: Dict, user_email: str) -> bool:
        """Check if a trade should be executed based on risk management rules"""
        try:
            # Check daily loss limit
            daily_pnl = self._get_daily_pnl(user_email)
            if daily_pnl < -self.risk_limits['max_daily_loss']:
                logger.info(f"Daily loss limit reached: {daily_pnl}%")
                return False
                
            # Check consecutive losses
            consecutive_losses = self._get_consecutive_losses(user_email)
            if consecutive_losses >= self.risk_limits['max_consecutive_losses']:
                logger.info(f"Max consecutive losses reached: {consecutive_losses}")
                return False
                
            # Check position size limits
            symbol = signal['symbol']
            if signal['action'] == 'buy':
                # Check if we have enough balance
                usdt_balance = balances.get('USDT', 0)
                if usdt_balance < 100:  # Minimum $100 for trading
                    return False
                    
            return True
            
        except Exception as e:
            logger.error(f"Error checking trade conditions: {e}")
            return False
            
    def _execute_real_trade(self, connector, signal: Dict, user_email: str, exchange_name: str):
        """Execute a real trade on the exchange"""
        try:
            symbol = signal['symbol']
            action = signal['action']
            price = signal['price']
            
            # Calculate position size based on risk management
            position_size = self._calculate_position_size(signal, connector)
            
            if position_size <= 0:
                return
                
            # Create order
            order = Order(
                symbol=symbol,
                side=action,
                order_type='market',
                quantity=position_size,
                price=price
            )
            
            # Execute the order
            result = connector.place_order(order)
            
            if result and result.get('status') == 'filled':
                # Log successful trade
                trade_log = {
                    'timestamp': datetime.datetime.utcnow().isoformat(),
                    'user_email': user_email,
                    'exchange': exchange_name,
                    'symbol': symbol,
                    'action': action,
                    'quantity': position_size,
                    'price': price,
                    'reason': signal['reason'],
                    'status': 'executed'
                }
                
                self.trade_history.append(trade_log)
                logger.info(f"Executed {action} order for {symbol}: {position_size} @ {price}")
                
                # Update user's trading data
                self._update_user_trading_data(user_email, trade_log)
                
            else:
                logger.warning(f"Failed to execute {action} order for {symbol}")
                
        except Exception as e:
            logger.error(f"Error executing real trade: {e}")
            
    def _calculate_position_size(self, signal: Dict, connector) -> float:
        """Calculate position size based on risk management rules"""
        try:
            balances = connector.get_balances()
            usdt_balance = balances.get('USDT', 0)
            
            # Use a small percentage of balance for each trade
            risk_per_trade = 0.02  # 2% of balance per trade
            position_value = usdt_balance * risk_per_trade
            
            # Convert to quantity based on current price
            price = signal['price']
            quantity = position_value / price
            
            # Round to appropriate decimal places
            if 'BTC' in signal['symbol']:
                quantity = round(quantity, 6)
            elif 'ETH' in signal['symbol']:
                quantity = round(quantity, 5)
            else:
                quantity = round(quantity, 4)
                
            return quantity
            
        except Exception as e:
            logger.error(f"Error calculating position size: {e}")
            return 0
            
    def _update_user_trading_data(self, user_email: str, trade_log: Dict):
        """Update user's trading data with the new trade"""
        try:
            user_data = user_data_manager.get_user_data(user_email)
            
            # Initialize trading data if not exists
            if 'trading_data' not in user_data:
                user_data['trading_data'] = {
                    'trades': [],
                    'total_pnl': 0.0,
                    'win_rate': 0.0,
                    'total_trades': 0
                }
                
            # Add new trade
            user_data['trading_data']['trades'].append(trade_log)
            user_data['trading_data']['total_trades'] += 1
            
            # Update win rate and PnL (simplified calculation)
            # In a real implementation, you'd calculate actual PnL from closed positions
            
            # Save updated data
            user_data_manager.save_user_data(user_email, user_data)
            
        except Exception as e:
            logger.error(f"Error updating user trading data: {e}")
            
    def _calculate_rsi(self, symbol: str, current_price: float) -> float:
        """Calculate RSI (simplified implementation)"""
        # In a real implementation, you'd calculate RSI from historical price data
        # For now, return a random value between 20-80
        import random
        return random.uniform(20, 80)
        
    def _calculate_momentum(self, symbol: str, current_price: float) -> float:
        """Calculate momentum (simplified implementation)"""
        # In a real implementation, you'd calculate momentum from price changes
        # For now, return a random value between -1 and 1
        import random
        return random.uniform(-1, 1)
        
    def _get_average_price(self, symbol: str) -> float:
        """Get average price for breakout calculation (simplified)"""
        # In a real implementation, you'd get this from historical data
        # For now, return a reasonable price
        if 'BTC' in symbol:
            return 50000
        elif 'ETH' in symbol:
            return 3000
        else:
            return 100
            
    def _get_daily_pnl(self, user_email: str) -> float:
        """Get daily PnL percentage"""
        try:
            user_data = user_data_manager.get_user_data(user_email)
            trading_data = user_data.get('trading_data', {})
            
            # Simplified PnL calculation
            # In a real implementation, you'd calculate actual PnL
            return trading_data.get('total_pnl', 0.0)
            
        except Exception as e:
            logger.error(f"Error getting daily PnL: {e}")
            return 0.0
            
    def _get_consecutive_losses(self, user_email: str) -> int:
        """Get number of consecutive losses"""
        try:
            user_data = user_data_manager.get_user_data(user_email)
            trading_data = user_data.get('trading_data', {})
            
            # Simplified consecutive losses calculation
            # In a real implementation, you'd track actual consecutive losses
            return trading_data.get('consecutive_losses', 0)
            
        except Exception as e:
            logger.error(f"Error getting consecutive losses: {e}")
            return 0
            
    def get_trade_history(self, user_email: str) -> list:
        """Get trade history for a user"""
        return [trade for trade in self.trade_history if trade['user_email'] == user_email]
        
    def get_trading_status(self, user_email: str) -> Dict:
        """Get current trading status for a user"""
        return {
            'running': self.running,
            'connected_exchanges': list(self.user_exchanges.get(user_email, {}).keys()),
            'total_trades': len(self.get_trade_history(user_email)),
            'daily_pnl': self._get_daily_pnl(user_email),
            'consecutive_losses': self._get_consecutive_losses(user_email)
        }

# Create global instance
real_trading_bot = RealTradingBot() 