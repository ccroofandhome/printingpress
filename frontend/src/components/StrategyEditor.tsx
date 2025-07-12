'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/config';
import { useAuth } from '../contexts/AuthContext';

interface StrategyConfig {
  active_strategy: string;
  rsi_overbought: number;
  rsi_oversold: number;
  rsi_timeframe: string;
  momentum_lookback: number;
  momentum_threshold: number;
  breakout_period: number;
  breakout_multiplier: number;
}

interface BotControls {
  botOn: boolean;
  liveMode: boolean;
  autoWithdraw: boolean;
  riskOffMode: boolean;
  trailingStops: boolean;
  trailingPercent: number;
  aiTradeFilter: boolean;
  leverage: boolean;
  leveragePercent: number;
  compounding: boolean;
  compoundingPercent: number;
}

interface StrategyEditorProps {
  className?: string;
}

// InfoTooltip component
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative ml-1 cursor-pointer group" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <svg className="inline w-4 h-4 text-cyan-400 hover:text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text>
      </svg>
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-[#232837] text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap max-w-xs">
          {text}
        </span>
      )}
    </span>
  );
}

const StrategyEditor: React.FC<StrategyEditorProps> = ({ className = '' }) => {
  const { token } = useAuth();
  const [config, setConfig] = useState<StrategyConfig>({
    active_strategy: 'rsi',
    rsi_overbought: 70,
    rsi_oversold: 30,
    rsi_timeframe: '5min',
    momentum_lookback: 14,
    momentum_threshold: 0.5,
    breakout_period: 20,
    breakout_multiplier: 2.0
  });

  const [botControls, setBotControls] = useState<BotControls>({
    botOn: true,
    liveMode: true,
    autoWithdraw: false,
    riskOffMode: false,
    trailingStops: true,
    trailingPercent: 0,
    aiTradeFilter: true,
    leverage: false,
    leveragePercent: 0,
    compounding: false,
    compoundingPercent: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load current config from backend on component mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    if (!token) {
      return; // Don't make API call if user is not authenticated
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/strategy-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data.strategy_config);
      } else if (response.status === 403) {
        console.log('User not authenticated for strategy config');
      }
    } catch (error) {
      console.error('Failed to fetch strategy config:', error);
    }
  };

  const saveConfig = async () => {
    if (!token) {
      setMessage('Please log in to save strategy changes');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/strategy-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMessage('Strategy updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else if (response.status === 403) {
        setMessage('Please log in to save strategy changes');
      } else {
        setMessage('Failed to update strategy');
      }
    } catch (error) {
      console.error('Error saving strategy config:', error);
      setMessage('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyChange = (strategy: string) => {
    setConfig(prev => ({ ...prev, active_strategy: strategy }));
  };

  const handleParamChange = (param: keyof StrategyConfig, value: number | string) => {
    setConfig(prev => ({ ...prev, [param]: value }));
  };

  const handleBotControlChange = (control: keyof BotControls, value: boolean | number) => {
    setBotControls(prev => ({ ...prev, [control]: value }));
  };

  const strategies = [
    { id: 'rsi', name: 'RSI Strategy', description: 'Relative Strength Index - buy oversold, sell overbought' },
    { id: 'momentum', name: 'Momentum Strategy', description: 'Follow price momentum with lookback period' },
    { id: 'breakout', name: 'Breakout Strategy', description: 'Trade breakouts from support/resistance levels' }
  ];

  const timeframes = ['1min', '5min', '15min', '30min', '1hour', '4hour', '1day'];

  return (
    <div className={`bg-[#181c23] rounded-xl p-6 border border-[#232837] ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl font-bold text-cyan-400">Bot Control Center</span>
        <span className="text-xs px-2 py-1 rounded bg-cyan-900/40 text-cyan-300">Live</span>
        <InfoTooltip text="Centralized control panel for all bot settings, trading strategies, and risk management features. All changes are saved to the backend and applied immediately." />
      </div>

      {/* Bot Status and Main Controls */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bot On/Off */}
          <div className="bg-[#232837] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-cyan-400 flex items-center">
                Bot Status
                <InfoTooltip text="Master switch to enable or disable all trading activity. When OFF, the bot stops all trading but maintains your positions and settings." />
              </span>
              <span className={`text-xs px-2 py-1 rounded ${botControls.botOn ? 'bg-cyan-400 text-black' : 'bg-[#FF4C60] text-white'}`}>
                {botControls.botOn ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Main Bot</span>
              <button
                onClick={() => handleBotControlChange('botOn', !botControls.botOn)}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.botOn ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
              >
                <span
                  className={`h-5 w-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.botOn ? 'translate-x-7' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Live Mode */}
          <div className="bg-[#232837] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-cyan-400 flex items-center">
                Trading Mode
                <InfoTooltip text="Switch between LIVE trading (real money) and TEST mode (paper trading). TEST mode allows you to practice strategies without financial risk." />
              </span>
              <span className={`text-xs px-2 py-1 rounded ${botControls.liveMode ? 'bg-cyan-400 text-black' : 'bg-yellow-400 text-black'}`}>
                {botControls.liveMode ? 'LIVE' : 'TEST'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Live Trading</span>
              <button
                onClick={() => handleBotControlChange('liveMode', !botControls.liveMode)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.liveMode ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
              >
                <span
                  className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.liveMode ? 'translate-x-6' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Controls */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          Trading Controls
          <InfoTooltip text="Core trading features that control how the bot executes trades and manages risk. These settings affect all active strategies." />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auto Withdraw */}
          <div className="flex items-center justify-between bg-[#232837] rounded-lg px-4 py-3">
            <span className="text-sm text-white flex items-center">
              Auto Withdraw
              <InfoTooltip text="Automatically withdraw profits to your linked bank account when they reach a certain threshold. Helps secure gains and manage cash flow." />
            </span>
            <button
              onClick={() => handleBotControlChange('autoWithdraw', !botControls.autoWithdraw)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.autoWithdraw ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
            >
              <span
                className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.autoWithdraw ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>

          {/* Risk-Off Mode */}
          <div className="flex items-center justify-between bg-[#232837] rounded-lg px-4 py-3">
            <span className="text-sm text-white flex items-center">
              Risk-Off Mode
              <InfoTooltip text="Reduces risk by limiting trade size, frequency, and exposure during volatile market conditions. Automatically activates during high volatility." />
            </span>
            <button
              onClick={() => handleBotControlChange('riskOffMode', !botControls.riskOffMode)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.riskOffMode ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
            >
              <span
                className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.riskOffMode ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>

          {/* Trailing Stops */}
          <div className="flex items-center justify-between bg-[#232837] rounded-lg px-4 py-3">
            <span className="text-sm text-white flex items-center">
              Trailing Stops
              <InfoTooltip text="Automatically adjust stop-loss orders to follow price movements and lock in profits. The stop-loss moves up as the price increases, protecting gains." />
            </span>
            <button
              onClick={() => handleBotControlChange('trailingStops', !botControls.trailingStops)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.trailingStops ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
            >
              <span
                className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.trailingStops ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>

          {/* AI Trade Filter */}
          <div className="flex items-center justify-between bg-[#232837] rounded-lg px-4 py-3">
            <span className="text-sm text-white flex items-center">
              AI Trade Filter
              <InfoTooltip text="Uses machine learning to analyze market conditions and filter out potentially risky trades. Improves win rate by avoiding unfavorable market setups." />
            </span>
            <button
              onClick={() => handleBotControlChange('aiTradeFilter', !botControls.aiTradeFilter)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.aiTradeFilter ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
            >
              <span
                className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.aiTradeFilter ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Trailing Stops Percentage */}
        {botControls.trailingStops && (
          <div className="mt-4 bg-[#232837] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white flex items-center">
                Trailing Stop %
                <InfoTooltip text="The percentage below the highest price reached that triggers the trailing stop-loss. Lower values (0.5-2%) are tighter, higher values (5-10%) give more room for price fluctuations." />
              </span>
              <span className="text-white font-semibold">{botControls.trailingPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="text-2xl text-cyan-400 hover:text-cyan-300 transition-colors"
                onClick={() => handleBotControlChange('trailingPercent', Math.max(0, Math.round((botControls.trailingPercent - 0.5) * 10) / 10))}
              >
                ➖
              </button>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={botControls.trailingPercent}
                onChange={(e) => handleBotControlChange('trailingPercent', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-[#181c23] rounded-lg appearance-none cursor-pointer slider"
              />
              <button
                className="text-2xl text-cyan-400 hover:text-cyan-300 transition-colors"
                onClick={() => handleBotControlChange('trailingPercent', Math.min(20, Math.round((botControls.trailingPercent + 0.5) * 10) / 10))}
              >
                ➕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Controls */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          Advanced Controls
          <InfoTooltip text="Advanced features for experienced traders. These settings can significantly increase potential returns but also increase risk. Use with caution." />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Leverage */}
          <div className="bg-[#232837] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white flex items-center">
                Leverage
                <InfoTooltip text="Amplify your trading position using borrowed funds. Higher leverage means larger potential profits but also larger potential losses. Use carefully!" />
              </span>
              <button
                onClick={() => handleBotControlChange('leverage', !botControls.leverage)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.leverage ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
              >
                <span
                  className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.leverage ? 'translate-x-6' : ''}`}
                />
              </button>
            </div>
            {botControls.leverage && (
              <div className="flex items-center gap-3">
                <button
                  className="text-xl text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={() => handleBotControlChange('leveragePercent', Math.max(0, botControls.leveragePercent - 10))}
                >
                  ➖
                </button>
                <span className="text-white font-semibold text-lg">{botControls.leveragePercent}%</span>
                <button
                  className="text-xl text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={() => handleBotControlChange('leveragePercent', Math.min(100, botControls.leveragePercent + 10))}
                >
                  ➕
                </button>
              </div>
            )}
          </div>

          {/* Compounding */}
          <div className="bg-[#232837] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white flex items-center">
                Compounding
                <InfoTooltip text="Automatically reinvest profits back into trading positions. This can lead to exponential growth over time as profits generate more profits." />
              </span>
              <button
                onClick={() => handleBotControlChange('compounding', !botControls.compounding)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${botControls.compounding ? 'bg-cyan-400' : 'bg-[#232837] border border-cyan-400'}`}
              >
                <span
                  className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${botControls.compounding ? 'translate-x-6' : ''}`}
                />
              </button>
            </div>
            {botControls.compounding && (
              <div className="flex items-center gap-3">
                <button
                  className="text-xl text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={() => handleBotControlChange('compoundingPercent', Math.max(0, botControls.compoundingPercent - 5))}
                >
                  ➖
                </button>
                <span className="text-white font-semibold text-lg">{botControls.compoundingPercent}%</span>
                <button
                  className="text-xl text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={() => handleBotControlChange('compoundingPercent', Math.min(100, botControls.compoundingPercent + 5))}
                >
                  ➕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-white mb-3 flex items-center">
          Active Strategy
          <InfoTooltip text="Choose which trading strategy the bot will use. Each strategy has different parameters and works best in different market conditions." />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handleStrategyChange(strategy.id)}
              className={`p-4 rounded-lg border transition-all ${
                config.active_strategy === strategy.id
                  ? 'border-cyan-400 bg-cyan-900/20 text-cyan-300'
                  : 'border-[#232837] bg-[#232837] text-[#A0A0A0] hover:border-cyan-400/50 hover:text-cyan-300'
              }`}
            >
              <div className="font-semibold text-sm">{strategy.name}</div>
              <div className="text-xs mt-1 opacity-75">{strategy.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Parameters */}
      <div className="space-y-6">
        {config.active_strategy === 'rsi' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              RSI Parameters
              <InfoTooltip text="Relative Strength Index (RSI) measures price momentum. Values above 70 indicate overbought conditions (sell), below 30 indicate oversold conditions (buy)." />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2 flex items-center">
                  Overbought Level (30-100)
                  <InfoTooltip text="RSI level at which the market is considered overbought. When RSI reaches this level, the strategy will generate sell signals. Higher values (80-90) are more conservative." />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={config.rsi_overbought}
                    onChange={(e) => handleParamChange('rsi_overbought', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-[#232837] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[3rem] text-center">
                    {config.rsi_overbought}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2 flex items-center">
                  Oversold Level (0-70)
                  <InfoTooltip text="RSI level at which the market is considered oversold. When RSI reaches this level, the strategy will generate buy signals. Lower values (10-20) are more aggressive." />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="70"
                    value={config.rsi_oversold}
                    onChange={(e) => handleParamChange('rsi_oversold', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-[#232837] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[3rem] text-center">
                    {config.rsi_oversold}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2 flex items-center">
                Timeframe
                <InfoTooltip text="The time period used to calculate RSI. Shorter timeframes (1min-15min) are more sensitive to price changes, longer timeframes (1hour-1day) are more stable but slower to react." />
              </label>
              <select
                value={config.rsi_timeframe}
                onChange={(e) => handleParamChange('rsi_timeframe', e.target.value)}
                className="w-full bg-[#232837] text-white rounded-lg px-3 py-2 border border-[#232837] focus:border-cyan-400 focus:outline-none"
              >
                {timeframes.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {config.active_strategy === 'momentum' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              Momentum Parameters
              <InfoTooltip text="Momentum strategy follows price trends by measuring the rate of price change over a specific period. It works best in trending markets." />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2 flex items-center">
                  Lookback Period (1-100)
                  <InfoTooltip text="Number of periods to look back when calculating momentum. Shorter periods (5-10) are more responsive, longer periods (20-50) are more stable but slower to react." />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={config.momentum_lookback}
                    onChange={(e) => handleParamChange('momentum_lookback', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-[#232837] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[3rem] text-center">
                    {config.momentum_lookback}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2 flex items-center">
                  Threshold (0.1-2.0)
                  <InfoTooltip text="Minimum momentum required to trigger a trade. Higher values (1.0-2.0) require stronger trends, lower values (0.1-0.5) trigger on smaller movements." />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={config.momentum_threshold}
                    onChange={(e) => handleParamChange('momentum_threshold', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-[#232837] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[3rem] text-center">
                    {config.momentum_threshold}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {config.active_strategy === 'breakout' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              Breakout Parameters
              <InfoTooltip text="Breakout strategy identifies when price breaks above resistance or below support levels. It works best in range-bound markets that are about to break out." />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2 flex items-center">
                  Period (5-100)
                  <InfoTooltip text="Number of periods used to calculate support and resistance levels. Shorter periods (5-15) are more sensitive, longer periods (30-100) identify stronger levels." />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={config.breakout_period}
                    onChange={(e) => handleParamChange('breakout_period', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-[#232837] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[3rem] text-center">
                    {config.breakout_period}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2 flex items-center">
                  Multiplier (0.5-5.0)
                  <InfoTooltip text="Multiplier applied to the breakout level to confirm a true breakout. Higher values (2.0-5.0) require stronger breakouts, lower values (0.5-1.0) trigger on smaller moves." />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={config.breakout_multiplier}
                    onChange={(e) => handleParamChange('breakout_multiplier', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-[#232837] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[3rem] text-center">
                    {config.breakout_multiplier}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button and Message */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={saveConfig}
          disabled={loading}
          className="px-6 py-2 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </button>
        
        {message && (
          <span className={`text-sm font-medium ${
            message.includes('successfully') ? 'text-cyan-400' : 'text-[#FF4C60]'
          }`}>
            {message}
          </span>
        )}
      </div>

      {/* Strategy Preview */}
      <div className="mt-6 p-4 bg-[#232837] rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
          Current Configuration
          <InfoTooltip text="Live preview of your current bot settings and strategy configuration. This shows exactly how your bot is configured and what it will do." />
        </h4>
        <div className="text-xs text-[#A0A0A0] space-y-1">
          <div>Bot Status: <span className={`${botControls.botOn ? 'text-cyan-300' : 'text-[#FF4C60]'}`}>{botControls.botOn ? 'Active' : 'Inactive'}</span></div>
          <div>Trading Mode: <span className={`${botControls.liveMode ? 'text-cyan-300' : 'text-yellow-300'}`}>{botControls.liveMode ? 'Live' : 'Test'}</span></div>
          <div>Strategy: <span className="text-cyan-300">{strategies.find(s => s.id === config.active_strategy)?.name}</span></div>
          {config.active_strategy === 'rsi' && (
            <>
              <div>Buy when RSI &lt; {config.rsi_oversold}</div>
              <div>Sell when RSI &gt; {config.rsi_overbought}</div>
              <div>Timeframe: {config.rsi_timeframe}</div>
            </>
          )}
          {config.active_strategy === 'momentum' && (
            <>
              <div>Lookback: {config.momentum_lookback} periods</div>
              <div>Threshold: {config.momentum_threshold}</div>
            </>
          )}
          {config.active_strategy === 'breakout' && (
            <>
              <div>Period: {config.breakout_period} periods</div>
              <div>Multiplier: {config.breakout_multiplier}x</div>
            </>
          )}
          {botControls.trailingStops && <div>Trailing Stop: {botControls.trailingPercent}%</div>}
          {botControls.leverage && <div>Leverage: {botControls.leveragePercent}%</div>}
          {botControls.compounding && <div>Compounding: {botControls.compoundingPercent}%</div>}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #00FFA3;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 255, 163, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #00FFA3;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 255, 163, 0.3);
        }
      `}</style>
    </div>
  );
};

export default StrategyEditor; 