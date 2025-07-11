'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import AISuggestionPanel from '../components/AISuggestionPanel';
import DynamicStrategyBuilder, { StrategyConfig } from '../components/DynamicStrategyBuilder';
import StrategyDiagnostics from '../components/StrategyDiagnostics';
import UltimateROIStrategy from '../components/UltimateROIStrategy';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '@/lib/config';

const sidebarItems = [
  { icon: '📂', label: 'Dashboard', dropdown: true, options: [
    { label: 'Overview' },
    { label: 'Analytics' },
    { label: 'Logs' },
    { label: 'Profile' },
    { label: 'Connections' },
    { label: 'Strategy Editor', href: '/strategy-editor' },
  ] },
];

// Bot controls moved to StrategyEditor component

const botPerformanceData = [
  { time: '11:58 PM', value: 10000 },
  { time: '03:58 AM', value: 10200 },
  { time: '07:58 AM', value: 10100 },
  { time: '11:58 AM', value: 10400 },
  { time: '03:58 PM', value: 10600 },
  { time: '07:58 PM', value: 10800 },
];

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative ml-1 cursor-pointer group" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <svg className="inline w-4 h-4 text-cyan-400 hover:text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text>
      </svg>
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-[#232837] text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
          {text}
        </span>
      )}
    </span>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [activePage, setActivePage] = useState('Overview');
  const [botRunning, setBotRunning] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [showStrategyBreakdown, setShowStrategyBreakdown] = useState(false);
  const [moneyMode, setMoneyMode] = useState<'fake' | 'real'>('fake');
  const [exchangeConfig, setExchangeConfig] = useState({
    exchange: 'binance',
    is_testnet: true,
    trading_pair: 'BTCUSDT',
    test_balance: 10000.0
  });
  const [availablePairs, setAvailablePairs] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [showStrategyBuilder, setShowStrategyBuilder] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyConfig | null>(null);
  const [customStrategies, setCustomStrategies] = useState<StrategyConfig[]>([]);
  const [profile, setProfile] = useState({
    username: 'trader_jane',
    email: 'jane@example.com',
    phone: '+1 (555) 123-4567',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [savedStrategies, setSavedStrategies] = useState<Record<string, any>>({});
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [botSchedule, setBotSchedule] = useState<'24/7' | 'market'>('24/7');
  // Performance page stocks and state
  const stocks = [
    { key: 'BTC', label: 'BTC/USDT', color: '#00FFA3' },
    { key: 'ETH', label: 'ETH/USDT', color: '#FF4C60' },
    { key: 'SOL', label: 'SOL/USDT', color: '#4F8CFF' },
  ];
  const timeRanges = ['Day', 'Week', 'Month', 'Year'];
  const [selectedRange, setSelectedRange] = useState('Week');
  // Placeholder data for each range
  const stockDataRawDay: Array<{ date: string; [key: string]: number | string }> = [
    { date: '09:00', BTC: 10700, ETH: 5450, SOL: 2380 },
    { date: '10:00', BTC: 10720, ETH: 5460, SOL: 2385 },
    { date: '11:00', BTC: 10750, ETH: 5470, SOL: 2390 },
    { date: '12:00', BTC: 10780, ETH: 5480, SOL: 2395 },
    { date: '13:00', BTC: 10800, ETH: 5500, SOL: 2400 },
  ];
  const stockDataRawWeek: Array<{ date: string; [key: string]: number | string }> = [
    { date: 'Jul 1', BTC: 10000, ETH: 5000, SOL: 2000 },
    { date: 'Jul 2', BTC: 10150, ETH: 5100, SOL: 2100 },
    { date: 'Jul 3', BTC: 10200, ETH: 5200, SOL: 2200 },
    { date: 'Jul 4', BTC: 10080, ETH: 5150, SOL: 2150 },
    { date: 'Jul 5', BTC: 10400, ETH: 5300, SOL: 2250 },
    { date: 'Jul 6', BTC: 10600, ETH: 5400, SOL: 2300 },
    { date: 'Jul 7', BTC: 10800, ETH: 5500, SOL: 2400 },
  ];
  const stockDataRawMonth: Array<{ date: string; [key: string]: number | string }> = [
    { date: 'Jun 1', BTC: 9500, ETH: 4800, SOL: 1800 },
    { date: 'Jun 7', BTC: 9700, ETH: 4900, SOL: 1900 },
    { date: 'Jun 14', BTC: 9900, ETH: 4950, SOL: 1950 },
    { date: 'Jun 21', BTC: 10200, ETH: 5200, SOL: 2200 },
    { date: 'Jun 28', BTC: 10800, ETH: 5500, SOL: 2400 },
  ];
  const stockDataRawYear: Array<{ date: string; [key: string]: number | string }> = [
    { date: '2023 Q3', BTC: 7000, ETH: 3000, SOL: 1000 },
    { date: '2023 Q4', BTC: 8500, ETH: 4000, SOL: 1500 },
    { date: '2024 Q1', BTC: 9500, ETH: 4800, SOL: 1800 },
    { date: '2024 Q2', BTC: 10800, ETH: 5500, SOL: 2400 },
  ];
  let stockDataRaw = stockDataRawWeek;
  if (selectedRange === 'Day') stockDataRaw = stockDataRawDay;
  if (selectedRange === 'Month') stockDataRaw = stockDataRawMonth;
  if (selectedRange === 'Year') stockDataRaw = stockDataRawYear;
  // Calculate overall line
  const stockData = stockDataRaw.map(row => ({
    ...row,
    Overall: stocks.reduce((sum, s) => sum + (typeof row[s.key] === 'number' ? (row[s.key] as number) : 0), 0),
  }));
  const allLines = [
    ...stocks,
    { key: 'Overall', label: 'Overall', color: '#1E90FF' },
  ];
  const [visibleStocks, setVisibleStocks] = useState(allLines.map(s => true));
  const toggleStock = (idx: number) => setVisibleStocks(v => v.map((on, i) => i === idx ? !on : on));

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleNotifToggle = (type: 'email' | 'sms' | 'push') => {
    setNotifications(n => ({ ...n, [type]: !n[type] }));
  };

  const handleScheduleToggle = async (schedule: '24/7' | 'market') => {
    try {
      const response = await fetch(`${API_BASE_URL}/update-bot-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule)
      });

      if (response.ok) {
        setBotSchedule(schedule);
        console.log(`Bot schedule updated to: ${schedule}`);
      } else {
        console.error('Failed to update bot schedule');
      }
    } catch (error) {
      console.error('Error updating bot schedule:', error);
    }
  };

  const handleQuickStrategy = async (strategyType: 'RSI' | 'Momentum' | 'Breakout') => {
    try {
      // Define strategy configurations
      const strategyConfigs = {
        RSI: {
          active_strategy: 'RSI',
          rsi_overbought: 70,
          rsi_oversold: 30,
          rsi_timeframe: '1h',
          momentum_lookback: 14,
          momentum_threshold: 0.5,
          breakout_period: 20,
          breakout_multiplier: 2.0
        },
        Momentum: {
          active_strategy: 'Momentum',
          rsi_overbought: 75,
          rsi_oversold: 25,
          rsi_timeframe: '4h',
          momentum_lookback: 20,
          momentum_threshold: 0.8,
          breakout_period: 15,
          breakout_multiplier: 1.5
        },
        Breakout: {
          active_strategy: 'Breakout',
          rsi_overbought: 80,
          rsi_oversold: 20,
          rsi_timeframe: '1d',
          momentum_lookback: 30,
          momentum_threshold: 1.0,
          breakout_period: 10,
          breakout_multiplier: 2.5
        }
      };

      const config = strategyConfigs[strategyType];
      
      // Send to backend
      const response = await fetch('${API_BASE_URL}/strategy-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        console.log(`${strategyType} strategy activated successfully`);
      }
    } catch (error) {
      console.error('Error activating strategy:', error);
    }
  };

  const handleAdvancedBot = async (botType: 'High Voltage' | 'Steady Shield' | 'Balance Mode') => {
    try {
      const config = botConfigs[botType];
      
      // Send to backend
      const response = await fetch('${API_BASE_URL}/strategy-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        console.log(`${botType} bot activated successfully`);
        // Show success notification
        alert(`🚀 ${botType} bot activated! Check the Strategy Editor for detailed configuration.`);
      }
    } catch (error) {
      console.error('Error activating advanced bot:', error);
      alert('❌ Error activating bot. Please try again.');
    }
  };

  // Load saved strategies function
  const loadSavedStrategies = async () => {
    try {
      setLoadingStrategies(true);
      const response = await fetch(`${API_BASE_URL}/saved-strategies`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded saved strategies:', data);
        setSavedStrategies(data.strategies || {});
        console.log('Updated savedStrategies state:', data.strategies);
      } else {
        console.error('Failed to load saved strategies:', response.status);
      }
    } catch (error) {
      console.error('Error loading saved strategies:', error);
    } finally {
      setLoadingStrategies(false);
    }
  };

  // Load saved strategies on component mount
  React.useEffect(() => {
    loadSavedStrategies();
  }, []);

  // Load bot status including schedule
  const loadBotStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bot-status`);
      if (response.ok) {
        const data = await response.json();
        setBotRunning(data.running);
        if (data.bot_schedule) {
          setBotSchedule(data.bot_schedule);
        }
      }
    } catch (error) {
      console.error('Error loading bot status:', error);
    }
  };

  // Load bot status on component mount
  React.useEffect(() => {
    loadBotStatus();
  }, []);

  // Profitable trades data (placeholder)
  const winningTrades = 34;
  const totalClosedTrades = 50;
  const winPercent = Math.round((winningTrades / totalClosedTrades) * 100);

  // Strategy page edit/delete state
  const [editForm, setEditForm] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  // Placeholder strategies state
  const [strategies, setStrategies] = useState([
    { name: 'Grid Bot #1', type: 'Grid', status: 'Active', perf: '+12.3%', enabled: true },
    { name: 'DCA Bot #2', type: 'DCA', status: 'Paused', perf: '+7.8%', enabled: false },
    { name: 'Arbitrage Bot', type: 'Arbitrage', status: 'Error', perf: '-2.1%', enabled: false },
  ]);
  // Add this state near other strategy states
  const [addingStrategy, setAddingStrategy] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; type: string; status: string }>({ name: '', type: 'Grid', status: 'Active' });

  // Add state for chart selection
  const [selectedChart, setSelectedChart] = useState('BTC');
  
  // Static strategy configuration state
  const [selectedStaticStrategy, setSelectedStaticStrategy] = useState('rsi');
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiTimeframe, setRsiTimeframe] = useState('1min');
  const [longRsiOverbought, setLongRsiOverbought] = useState(70);
  const [longRsiOversold, setLongRsiOversold] = useState(30);
  const [longRsiTimeframe, setLongRsiTimeframe] = useState('1min');
  const [shortRsiOverbought, setShortRsiOverbought] = useState(80);
  const [shortRsiOversold, setShortRsiOversold] = useState(20);
  const [shortRsiTimeframe, setShortRsiTimeframe] = useState('5min');
  const [aiTradeFilter, setAiTradeFilter] = useState(false);
  const [trailingStops, setTrailingStops] = useState(false);
  const [leverageTrading, setLeverageTrading] = useState(false);
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [compounding, setCompounding] = useState(false);
  const [compoundingPercent, setCompoundingPercent] = useState(10);
  const [leverageMultiplier, setLeverageMultiplier] = useState(2);
  const [trailingStopPercent, setTrailingStopPercent] = useState(2.0);
  const [liveMode, setLiveMode] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  
  // Risk Management Controls
  const [maxDailyLossLimit, setMaxDailyLossLimit] = useState(5);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(3);
  const [maxDrawdownLimit, setMaxDrawdownLimit] = useState(15);
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');
  
  // Signal Confirmation Settings
  const [minVolumeThreshold, setMinVolumeThreshold] = useState(100000);
  const [macdConfirmation, setMacdConfirmation] = useState(true);
  const [multiTimeframeConfirmation, setMultiTimeframeConfirmation] = useState('15m + 1h align');
  
  // Custom Exit Conditions
  const [profitTarget, setProfitTarget] = useState(8);
  const [stopLoss, setStopLoss] = useState(4);
  const [timeBasedExit, setTimeBasedExit] = useState(60);
  
  // Backtest Controls
  const [backtestStartDate, setBacktestStartDate] = useState('');
  const [backtestEndDate, setBacktestEndDate] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  
  // Strategy Management
  const [strategyNotes, setStrategyNotes] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [cloneName, setCloneName] = useState('');
  
  // Visual Feedback
  const [riskMeter, setRiskMeter] = useState(45); // 0-100 scale
  const [showMiniChart, setShowMiniChart] = useState(false);
  
  // Strategy state
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);
  const [switchingStrategy, setSwitchingStrategy] = useState(false);
  
  // Advanced Bot Configurations
  const botConfigs: Record<string, any> = {
    'High Voltage': {
      active_strategy: 'High Voltage',
      rsi_overbought: 75,
      rsi_oversold: 25,
      rsi_timeframe: '5min',
      momentum_lookback: 10,
      momentum_threshold: 1.2,
      breakout_period: 15,
      breakout_multiplier: 3.0,
      max_daily_loss: 10,
      max_consecutive_losses: 5,
      max_drawdown: 20,
      risk_tolerance: 'Aggressive',
      min_volume_threshold: 500000,
      macd_confirmation: true,
      multi_timeframe_confirmation: '5m + 15m align',
      profit_target: 15,
      stop_loss: 6,
      time_based_exit: 30,
      leverage_trading: true,
      leverage_multiplier: 5,
      trailing_stops: true,
      trailing_stop_percent: 3.0,
      compounding: true,
      compounding_percent: 20,
      ai_trade_filter: true,
      auto_withdraw: false
    },
    'Steady Shield': {
      active_strategy: 'Steady Shield',
      rsi_overbought: 65,
      rsi_oversold: 35,
      rsi_timeframe: '1hour',
      momentum_lookback: 20,
      momentum_threshold: 0.5,
      breakout_period: 25,
      breakout_multiplier: 1.5,
      max_daily_loss: 3,
      max_consecutive_losses: 2,
      max_drawdown: 8,
      risk_tolerance: 'Conservative',
      min_volume_threshold: 200000,
      macd_confirmation: true,
      multi_timeframe_confirmation: '1h + 4h align',
      profit_target: 5,
      stop_loss: 2,
      time_based_exit: 120,
      leverage_trading: false,
      leverage_multiplier: 1,
      trailing_stops: true,
      trailing_stop_percent: 1.5,
      compounding: false,
      compounding_percent: 0,
      ai_trade_filter: true,
      auto_withdraw: true
    },
    'Balance Mode': {
      active_strategy: 'Balance Mode',
      rsi_overbought: 70,
      rsi_oversold: 30,
      rsi_timeframe: '15min',
      momentum_lookback: 15,
      momentum_threshold: 0.8,
      breakout_period: 20,
      breakout_multiplier: 2.0,
      max_daily_loss: 5,
      max_consecutive_losses: 3,
      max_drawdown: 12,
      risk_tolerance: 'Moderate',
      min_volume_threshold: 300000,
      macd_confirmation: true,
      multi_timeframe_confirmation: '15m + 1h align',
      profit_target: 8,
      stop_loss: 4,
      time_based_exit: 60,
      leverage_trading: true,
      leverage_multiplier: 2,
      trailing_stops: true,
      trailing_stop_percent: 2.0,
      compounding: true,
      compounding_percent: 10,
      ai_trade_filter: true,
      auto_withdraw: false
    }
  };

  // Fetch active strategy from backend
  const fetchActiveStrategy = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/strategy-config');
      if (response.ok) {
        const data = await response.json();
        setActiveStrategy(data.active_strategy || null);
      }
    } catch (error) {
      console.error('Error fetching active strategy:', error);
    }
  };

  React.useEffect(() => {
    fetchActiveStrategy();
  }, []);

  const handleActivateStrategy = async (name: string, config: any) => {
    try {
      setSwitchingStrategy(true);
      const response = await fetch('${API_BASE_URL}/strategy-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setActiveStrategy(name);
        // Show success toast
        alert(`✅ ${name} strategy activated successfully!`);
      }
    } catch (error) {
      console.error('Error activating strategy:', error);
      alert('❌ Error activating strategy. Please try again.');
    } finally {
      setSwitchingStrategy(false);
    }
  };

  const handleStrategyClick = (strategy: any, type: 'quick' | 'custom' | 'bot') => {
    setSelectedStrategy({ ...strategy, type });
    setShowStrategyBreakdown(true);
  };

  const closeStrategyBreakdown = () => {
    setShowStrategyBreakdown(false);
    setSelectedStrategy(null);
  };

  const toggleBotRunning = async () => {
    try {
      if (!botRunning) {
        // Start trading
        const response = await fetch('${API_BASE_URL}/start-trading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setBotRunning(true);
        } else {
          console.error('Failed to start trading');
        }
      } else {
        // Stop trading
        const response = await fetch('${API_BASE_URL}/stop-trading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setBotRunning(false);
        } else {
          console.error('Failed to stop trading');
        }
      }
    } catch (error) {
      console.error('Error toggling bot:', error);
    }
  };

  // Exchange configuration functions
  const loadExchangeConfig = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/get-exchange-config');
      if (response.ok) {
        const data = await response.json();
        setExchangeConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading exchange config:', error);
    }
  };

  const updateExchangeConfig = async (newConfig: any) => {
    try {
      const response = await fetch('${API_BASE_URL}/set-exchange-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        setExchangeConfig(newConfig);
        console.log('Exchange config updated');
      }
    } catch (error) {
      console.error('Error updating exchange config:', error);
    }
  };

  const loadAvailablePairs = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/available-pairs');
      if (response.ok) {
        const data = await response.json();
        setAvailablePairs(data.pairs || []);
      }
    } catch (error) {
      console.error('Error loading pairs:', error);
    }
  };

  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/get-current-price');
      if (response.ok) {
        const data = await response.json();
        if (data.price) {
          setCurrentPrice(data.price);
        }
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  };

  // Load exchange config and pairs on component mount
  useEffect(() => {
    loadExchangeConfig();
    loadAvailablePairs();
    // Fetch price every 10 seconds
    const priceInterval = setInterval(fetchCurrentPrice, 10000);
    
    // Sync money mode with exchange config
    const syncModeWithConfig = async () => {
      try {
        const response = await fetch('${API_BASE_URL}/get-exchange-config');
        if (response.ok) {
          const data = await response.json();
          const isTestnet = data.config.is_testnet;
          setMoneyMode(isTestnet ? 'fake' : 'real');
        }
      } catch (error) {
        console.error('Error syncing mode:', error);
      }
    };
    
    // Fetch bot status
    const fetchBotStatus = async () => {
      try {
        const response = await fetch('${API_BASE_URL}/bot-status');
        if (response.ok) {
          const data = await response.json();
          setBotRunning(data.running);
        }
      } catch (error) {
        console.error('Error fetching bot status:', error);
      }
    };
    
    syncModeWithConfig();
    fetchBotStatus();
    
    // Set up interval to refresh bot status every 5 seconds
    const botStatusInterval = setInterval(fetchBotStatus, 5000);
    
    return () => {
      clearInterval(priceInterval);
      clearInterval(botStatusInterval);
    };
  }, []);

  const toggleLiveMode = () => {
    // Implement live mode toggle logic
  };

  const toggleAiTradeFilter = () => {
    // Implement AI trade filter toggle logic
  };

  const toggleTrailingStops = () => {
    // Implement trailing stops toggle logic
  };

  const toggleLeverageTrading = () => {
    // Implement leverage trading toggle logic
  };

  const toggleAutoWithdraw = () => {
    // Implement auto withdraw toggle logic
  };

  const toggleCompounding = () => {
    // Implement compounding toggle logic
  };





  // Update handleSaveStrategy to use these values
  const handleSaveStrategy = async (strategyConfig: StrategyConfig) => {
    // Prepare payload for backend
    const payload = {
      name: strategyConfig.name,
      description: strategyConfig.description,
      config: {
        type: strategyConfig.type,
        parameters: strategyConfig.parameters,
        createdAt: strategyConfig.createdAt,
        updatedAt: strategyConfig.updatedAt,
      },
      bot_controls: {
        enabled: true,
        riskLevel: strategyConfig.riskLevel,
      },
    };
    try {
      const response = await fetch(`${API_BASE_URL}/save-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        alert('Strategy saved successfully!');
        setShowStrategyBuilder(false);
        loadSavedStrategies();
      } else {
        alert('Failed to save strategy.');
      }
    } catch (error) {
      alert('Error saving strategy.');
    }
  };

  const handleEditStrategy = (strategy: StrategyConfig) => {
    setEditingStrategy(strategy);
    setShowStrategyBuilder(true);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/custom-strategy/${strategyId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setCustomStrategies(prev => prev.filter(s => s.id !== strategyId));
          alert('Strategy deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting strategy:', error);
        alert('Error deleting strategy. Please try again.');
      }
    }
  };

  const handleCreateNewStrategy = () => {
    setEditingStrategy(null);
    setShowStrategyBuilder(true);
  };

  // Remove static RSI/Momentum/Breakout fields and use dynamic builder
  const [strategyParams, setStrategyParams] = useState<any[]>([]);
  const [showAddParam, setShowAddParam] = useState(false);
  const [newParam, setNewParam] = useState<any>({ name: '', type: 'number', value: '', min: '', max: '', options: '' });

  // Performance data for different time ranges
  const botPerformanceDataDay = botPerformanceData;
  const botPerformanceDataMonth = botPerformanceData;
  const botPerformanceDataYear = botPerformanceData;

  // Replace static config section with dynamic builder
  return (
    <ProtectedRoute>
    <div className="min-h-screen flex bg-[#0f1117] text-white font-['Inter']">
      {showConfirmation && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#232837] border border-green-400 text-green-300 px-6 py-3 rounded-xl shadow-lg text-lg font-bold animate-fade-in">
          {showConfirmation}
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-64 bg-[#181c23] border-r border-[#232837] flex flex-col py-6 px-4">
        <div className="mb-8 text-2xl font-bold text-cyan-400 tracking-wide">Money Machine</div>
        <nav className="flex-1">
          {/* Dashboard Dropdown */}
          <div className="relative">
            <div
              className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg cursor-pointer transition-colors hover:bg-[#222633] text-[#A0A0A0] select-none`}
              onClick={() => setDashboardOpen(open => !open)}
            >
              <span className="text-xl">📂</span>
              <span>Dashboard</span>
              <svg className={`ml-auto w-4 h-4 transition-transform ${dashboardOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
            {dashboardOpen && sidebarItems[0]?.options && (
              <div className="ml-8 mb-2 flex flex-col gap-1 bg-[#232837] rounded-lg shadow-lg py-2 z-10">
                {sidebarItems[0].options.map(opt => (
                  <div
                    key={opt.label}
                    className={`px-4 py-2 text-sm rounded cursor-pointer transition-colors ${activePage === opt.label ? 'bg-cyan-900/40 text-cyan-300 font-semibold' : 'text-[#A0A0A0] hover:bg-cyan-900/40 hover:text-cyan-300'}`}
                    onClick={() => { 
                      setActivePage(opt.label); 
                      setDashboardOpen(false); 
                      // If Strategy Editor is selected, show the strategy editor content
                      if (opt.label === 'Strategy Editor') {
                        // The content will be rendered in the main area based on activePage
                      }
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Bot Status */}
          <div className="mb-6 p-4 bg-[#232837] rounded-lg border border-[#2d3748]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-lg mr-2">🤖</span>
                <span className="font-semibold text-white">Bot Status</span>
              </div>
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded font-bold ${botRunning ? 'bg-green-600/40 text-green-300' : 'bg-gray-600/40 text-gray-300'}`}>
                  {botRunning ? 'RUNNING' : 'STOPPED'}
                </span>
              </div>
            </div>
            
            {/* Bot Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#A0A0A0]">Bot</span>
              <button
                onClick={() => setBotRunning(!botRunning)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#181c23] ${
                  botRunning ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    botRunning ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Trading Mode Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#A0A0A0]">Mode</span>
              <button
                onClick={async () => {
                  const newMode = moneyMode === 'fake' ? 'real' : 'fake';
                  setMoneyMode(newMode);
                  
                  // Update backend exchange config based on mode
                  const newConfig = {
                    ...exchangeConfig,
                    is_testnet: newMode === 'fake' // fake = testnet, real = mainnet
                  };
                  await updateExchangeConfig(newConfig);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#181c23] ${
                  moneyMode === 'real' ? 'bg-red-600' : 'bg-green-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    moneyMode === 'real' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="mt-2 text-xs text-[#A0A0A0]">
              {moneyMode === 'real' ? '⚠️ Real Money' : '🎮 Fake Money'}
            </div>

            {/* Add this near other state declarations */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-[#A0A0A0]">Schedule</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${botSchedule === '24/7' ? 'text-cyan-400 font-bold' : 'text-[#A0A0A0]'}`}>24/7</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={botSchedule === 'market'} onChange={e => handleScheduleToggle(e.target.checked ? 'market' : '24/7')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#232837] peer-focus:outline-none rounded-full peer peer-checked:bg-[#232837] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#00FFA3] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-[#FF4C60]" />
                </label>
                <span className={`text-xs ${botSchedule === 'market' ? 'text-cyan-400 font-bold' : 'text-[#A0A0A0]'}`}>Market Hours</span>
              </div>
            </div>

          </div>
          
          {/* Quick Strategies */}
          <div className="mt-6">
            <div className="text-sm text-[#A0A0A0] mb-3 font-semibold">⚡ Quick Strategies</div>
            <div className="space-y-3">
              {[
                { name: 'High Voltage', stats: { winRate: 68, totalTrades: 156, profit: '+23.4%', risk: 'HIGH' } },
                { name: 'Steady Shield', stats: { winRate: 82, totalTrades: 89, profit: '+8.7%', risk: 'LOW' } },
                { name: 'Balance Mode', stats: { winRate: 74, totalTrades: 124, profit: '+15.2%', risk: 'MEDIUM' } },
                { name: '🔥 Ultimate ROI', stats: { winRate: 85, totalTrades: 142, profit: '+56.8%', risk: 'HIGH' } }
              ].map(({ name, stats }) => (
                <div 
                  key={name} 
                  className={`w-full p-3 text-sm bg-gradient-to-r from-red-900/40 to-orange-900/40 hover:from-red-800/50 hover:to-orange-800/50 text-[#A0A0A0] rounded-lg transition-all border ${activeStrategy === name ? 'border-green-400 shadow-neon-glow' : 'border-red-500/30 hover:border-orange-400/50'} shadow-lg cursor-pointer`}
                  onClick={() => handleStrategyClick({ name, stats }, 'quick')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{name}</span>
                      <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#181c23] ${activeStrategy === name ? 'bg-green-600' : 'bg-gray-600'}`}
                      onClick={e => { e.stopPropagation(); if (activeStrategy !== name) handleActivateStrategy(name, botConfigs[name]); }}
                      >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activeStrategy === name ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                      </button>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="text-green-400 font-bold">{stats.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Trades:</span>
                      <span className="text-cyan-400">{stats.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit:</span>
                      <span className="text-orange-400 font-bold">{stats.profit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className={`px-1 rounded text-xs ${stats.risk === 'HIGH' ? 'bg-red-600/40 text-red-300' : stats.risk === 'MEDIUM' ? 'bg-yellow-600/40 text-yellow-300' : 'bg-green-600/40 text-green-300'}`}>{stats.risk}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* My Strategies */}
          <div className="mt-6">
            <div className="text-sm text-[#A0A0A0] mb-3 font-semibold">🎯 My Strategies</div>
            <div className="space-y-3">
              {loadingStrategies ? (
                <div className="p-3 text-sm bg-[#232837] rounded-lg border border-[#2d3748] text-center text-[#A0A0A0]">
                  Loading strategies...
                </div>
              ) : Object.keys(savedStrategies).length === 0 ? (
                <div className="p-3 text-sm bg-[#232837] rounded-lg border border-[#2d3748] text-center">
                  <div className="text-[#A0A0A0] mb-2">No custom strategies yet</div>
                  <div className="text-xs text-[#666]">Create strategies in the Strategy Editor below</div>
                  <div className="text-xs text-[#666] mt-1">Debug: savedStrategies count = {Object.keys(savedStrategies).length}</div>
                </div>
              ) : (
                <>
                  {console.log('Rendering saved strategies:', savedStrategies)}
                  {Object.entries(savedStrategies).map(([name, strategy]) => (
                  <div 
                    key={name} 
                    className={`p-3 bg-[#232837] rounded-lg border ${activeStrategy === name ? 'border-green-400 shadow-neon-glow' : 'border-[#2d3748]'} flex flex-col gap-1 cursor-pointer`}
                    onClick={() => handleStrategyClick({ name, ...strategy }, 'custom')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{name}</span>
                      {strategy.type && strategy.type !== 'Custom' && (
                        <span className="text-xs px-2 py-1 rounded bg-cyan-900/40 text-cyan-300 font-bold">{strategy.type}</span>
                      )}
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#181c23] ${activeStrategy === name ? 'bg-green-600' : 'bg-gray-600'}`}
                          onClick={e => { e.stopPropagation(); if (activeStrategy !== name) handleActivateStrategy(name, { ...strategy, active_strategy: name }); }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activeStrategy === name ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                    </div>
                    <div className="text-xs text-[#A0A0A0]">{strategy.description || 'No description'}</div>
                    {/* Add statistics for custom strategies */}
                    <div className="text-xs space-y-1 mt-2">
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="text-green-400 font-bold">{strategy.winRate || Math.floor(Math.random() * 30) + 60}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Trades:</span>
                        <span className="text-cyan-400">{strategy.totalTrades || Math.floor(Math.random() * 100) + 20}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit:</span>
                          <span className={`font-bold ${(strategy.profit || Math.random() * 20 - 5) > 0 ? 'text-green-400' : 'text-red-400'}`}>{strategy.profit || `${(Math.random() * 20 - 5).toFixed(1)}%`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Level:</span>
                          <span className={`px-1 rounded text-xs ${strategy.risk === 'HIGH' ? 'bg-red-600/40 text-red-300' : strategy.risk === 'MEDIUM' ? 'bg-yellow-600/40 text-yellow-300' : 'bg-green-600/40 text-green-300'}`}>{strategy.risk || ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)]}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1 items-center">
                      {strategy.status && <span className="text-xs px-2 py-1 rounded bg-blue-900/40 text-blue-300">{strategy.status}</span>}
                    </div>
                  </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </nav>
        

        

        
        {/* Bot controls moved to StrategyEditor */}
        <div className="mt-6 text-center">
          <div className="text-sm text-[#A0A0A0] mb-2">Bot Controls</div>
          <div className="text-xs text-[#A0A0A0]">All bot controls are now available in the Strategy Editor panel below.</div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-[#232837] bg-[#181c23]">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-cyan-400">Money Machine</span>
            <span className="ml-2 px-3 py-1 rounded-full bg-cyan-900/40 text-cyan-300 text-xs font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full inline-block animate-pulse"></span>
              Live Data
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-2 text-sm ${botRunning ? 'text-green-400' : 'text-[#A0A0A0]'}`}> 
              {botRunning ? 'Bot Active' : 'Bot Inactive'}
              <span className={`w-3 h-3 rounded-full ${botRunning ? 'bg-green-400' : 'bg-[#FF4C60]'}`}></span>
            </span>
            {/* Trading Mode and Platform Status */}
            <span className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-2 bg-[#232837] border border-[#232837] text-cyan-300">
              {moneyMode === 'real' ? '⚠️ Live Trading' : '🎮 Paper Trading'}
              <span className="text-[#A0A0A0]">|</span>
              <span className="text-cyan-400">{exchangeConfig.exchange.charAt(0).toUpperCase() + exchangeConfig.exchange.slice(1)}</span>
            </span>
            {/* User Menu */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#A0A0A0]">
                Welcome, {user?.username || 'User'}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 text-xs bg-red-600/40 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-8 bg-[#10131a]">
          {activePage === 'Overview' && (
            <>
              {/* Overview Section */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl font-extrabold text-cyan-400 tracking-tight">Overview</span>
                  <InfoTooltip text="This page provides a summary of your trading bot's performance, profit, and key metrics at a glance." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Profit Card */}
                  <div className="bg-[#181c23] rounded-xl p-6 border border-[#232837] flex flex-col justify-between">
                    <div>
                      <div className="text-[#A0A0A0] text-sm font-semibold mb-1">Profit</div>
                      <div className="text-3xl font-bold text-cyan-400">$0.00</div>
                      <div className="flex justify-between mt-2 text-xs text-[#A0A0A0]">
                        <span>Today: <span className="text-cyan-300 font-semibold">+$0.00</span></span>
                        <span>Balance: <span className="text-white font-semibold">$10000.00</span></span>
                      </div>
                    </div>
                  </div>
                  {/* Bot Snapshot Card */}
                  <div className="bg-[#181c23] rounded-xl p-6 border border-[#232837] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[#A0A0A0] text-sm font-semibold">Bot Snapshot</div>
                      <span className="text-xs px-2 py-1 rounded bg-[#232837] text-[#A0A0A0]">PAUSED</span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                      <span>🕒 7:58:09 PM</span>
                      <span>Daily: <span className="text-cyan-300">+$0.00</span></span>
                      <span>Open Positions: <span className="text-white">0</span></span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div className="my-8 border-t border-[#232837] w-full" />
              {/* Performance Section */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-cyan-400 tracking-tight">Performance</span>
                  <InfoTooltip text="Track your portfolio's performance over time, including returns, drawdowns, and other key metrics." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0] flex items-center gap-1">
                      Total Return
                      <InfoTooltip text="Cumulative percentage return since the start of trading" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">+23.4%</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0] flex items-center gap-1">
                      Avg Daily Return
                      <InfoTooltip text="Average daily percentage return on investment" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">+0.7%</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0] flex items-center gap-1">
                      Max Drawdown
                      <InfoTooltip text="Largest peak-to-trough decline in portfolio value" />
                    </div>
                    <div className="text-2xl font-bold text-[#FF4C60]">-8.2%</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0] flex items-center gap-1">
                      Sharpe Ratio
                      <InfoTooltip text="Risk-adjusted return measure. Higher values indicate better risk-adjusted performance" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">1.42</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0] flex items-center gap-1">
                      Profitable Trades
                      <InfoTooltip text="Percentage and count of winning trades out of all closed trades" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">{winPercent}%</div>
                    <div className="text-xs text-[#A0A0A0] mt-1">{winningTrades} / {totalClosedTrades} closed</div>
                  </div>
                </div>
                <div className="bg-[#232837] rounded-xl p-8 border border-[#232837]">
                  <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedChart === 'Portfolio' ? 'bg-cyan-400 text-black border-cyan-400' : 'bg-[#232837] text-[#A0A0A0] border-[#232837] hover:bg-cyan-900/40 hover:text-cyan-300'}`}
                        onClick={() => setSelectedChart('Portfolio')}
                      >Portfolio Value</button>
                      <button
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedChart === 'Bot' ? 'bg-cyan-400 text-black border-cyan-400' : 'bg-[#232837] text-[#A0A0A0] border-[#232837] hover:bg-cyan-900/40 hover:text-cyan-300'}`}
                        onClick={() => setSelectedChart('Bot')}
                      >Bot Performance</button>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      {timeRanges.map(range => (
                        <button
                          key={range}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedRange === range ? 'bg-cyan-400 text-black border-cyan-400' : 'bg-[#232837] text-[#A0A0A0] border-[#232837] hover:bg-cyan-900/40 hover:text-cyan-300'}`}
                          onClick={() => setSelectedRange(range)}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {selectedChart === 'Portfolio' && allLines.map((s, idx) => (
                      <button
                        key={s.key}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${visibleStocks[idx] ? '' : 'opacity-50'} `}
                        style={{
                          background: visibleStocks[idx] ? s.color : 'transparent',
                          color: visibleStocks[idx] ? '#181c23' : s.color,
                          borderColor: s.color,
                          borderWidth: '1px',
                        }}
                        onClick={() => toggleStock(idx)}
                      >
                        <span style={{ color: visibleStocks[idx] ? '#181c23' : s.color }}>●</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="h-64 w-full">
                    {selectedChart === 'Portfolio' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="#232837" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke="#A0A0A0" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis stroke="#A0A0A0" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${Number(v).toLocaleString()}`} />
                          <Tooltip contentStyle={{ background: '#232837', border: 'none', color: '#fff' }} />
                          {allLines.map((s, idx) => visibleStocks[idx] && (
                            <Line
                              key={s.key}
                              type="monotone"
                              dataKey={s.key}
                              stroke={s.color}
                              strokeWidth={3}
                              dot={{ r: 5, fill: s.color }}
                              activeDot={{ r: 7 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={
                          selectedRange === 'Day' ? botPerformanceDataDay :
                          selectedRange === 'Month' ? botPerformanceDataMonth :
                          selectedRange === 'Year' ? botPerformanceDataYear :
                          botPerformanceData
                        } margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="#232837" strokeDasharray="3 3" />
                          <XAxis dataKey="time" stroke="#A0A0A0" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis stroke="#A0A0A0" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${Number(v).toLocaleString()}`} />
                          <Tooltip contentStyle={{ background: '#232837', border: 'none', color: '#fff' }} />
                          <Line type="monotone" dataKey="value" stroke="#00FFA3" strokeWidth={3} dot={{ r: 5, fill: '#00FFA3' }} activeDot={{ r: 7 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div className="my-8 border-t border-[#232837] w-full" />
              
              {/* Strategy Diagnostics */}
              <div className="mb-8">
                <div className="text-lg font-semibold text-white mb-2">Strategy Diagnostics</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-[#A0A0A0] border-b border-[#232837]">
                        <th className="px-3 py-2 text-left font-semibold">Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Type</th>
                        <th className="px-3 py-2 text-left font-semibold">Win Rate <InfoTooltip text="The percentage and count of profitable trades vs total trades" /></th>
                        <th className="px-3 py-2 text-left font-semibold">P&L <InfoTooltip text="Total profit/loss including unrealized gains" /></th>
                        <th className="px-3 py-2 text-left font-semibold">Drawdown <InfoTooltip text="Maximum percentage loss from peak to trough" /></th>
                        <th className="px-3 py-2 text-left font-semibold">Sharpe <InfoTooltip text="Risk-adjusted return measure (higher is better)" /></th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Grid Bot #1', type: 'Grid', winRate: '68% (34/50)', pnl: '+$2,450', drawdown: '8.2%', sharpe: '1.8', status: 'Active' },
                        { name: 'DCA Bot #2', type: 'DCA', winRate: '72% (18/25)', pnl: '+$1,200', drawdown: '12.1%', sharpe: '1.4', status: 'Active' },
                        { name: 'Arbitrage Bot', type: 'Arbitrage', winRate: '85% (17/20)', pnl: '+$890', drawdown: '3.5%', sharpe: '2.1', status: 'Paused' },
                        { name: 'Manual Trades', type: 'Manual', winRate: '55% (11/20)', pnl: '-$320', drawdown: '15.3%', sharpe: '0.8', status: 'Inactive' },
                      ].map((strategy, i) => (
                        <tr key={i} className="border-b border-[#232837] hover:bg-[#232837] transition-colors">
                          <td className="px-3 py-2 font-medium text-white">{strategy.name}</td>
                          <td className="px-3 py-2 text-[#A0A0A0]">{strategy.type}</td>
                          <td className="px-3 py-2 text-[#A0A0A0]">{strategy.winRate}</td>
                          <td className={`px-3 py-2 font-semibold ${strategy.pnl.startsWith('+') ? 'text-cyan-400' : 'text-[#FF4C60]'}`}>{strategy.pnl}</td>
                          <td className="px-3 py-2 text-[#A0A0A0]">{strategy.drawdown}</td>
                          <td className="px-3 py-2 text-[#A0A0A0]">{strategy.sharpe}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              strategy.status === 'Active' ? 'bg-green-900 text-green-400' :
                              strategy.status === 'Paused' ? 'bg-yellow-900 text-yellow-400' :
                              'bg-gray-900 text-gray-400'
                            }`}>
                              {strategy.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* AI Strategy Suggestions */}
              <div className="mb-8">
                <AISuggestionPanel selectedStocks={['BTC', 'ETH', 'SOL', 'ADA', 'XRP']} />
              </div>
              {/* Add this where you want the diagnostics section to appear in the dashboard: */}
              <div className="mb-8">
                <StrategyDiagnostics />
              </div>
              
              {/* Ultimate ROI Strategy */}
              <div className="mb-8">
                <UltimateROIStrategy 
                  isActive={activeStrategy === '🔥 Ultimate ROI'}
                  onToggle={(active) => {
                    if (active) {
                      handleActivateStrategy('🔥 Ultimate ROI', {
                        name: 'Ultimate ROI Strategy',
                        description: 'Dynamic Compounding + Auto-Reallocation + Leverage',
                        daily_target_return: 2.0,
                        compounding_enabled: true,
                        reallocation_interval_minutes: 15,
                        leverage_enabled: true,
                        max_leverage: 5.0
                      });
                    } else {
                      handleActivateStrategy('', {});
                    }
                  }}
                />
              </div>
            </>
          )}
          {activePage === 'Analytics' && (
            <div className="max-w-5xl mx-auto bg-[#181c23] rounded-xl p-8 border border-[#232837]">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl font-bold text-cyan-400">Analytics</span>
                <InfoTooltip text="Analyze your trading activity, top bots, most traded pairs, and trade distribution with charts and statistics." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                  <div className="text-sm text-[#A0A0A0]">Top Bot</div>
                  <div className="text-lg font-bold text-cyan-400">Grid Bot #1</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                  <div className="text-sm text-[#A0A0A0]">Most Traded Pair</div>
                  <div className="text-lg font-bold text-cyan-400">BTC/USDT</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                  <div className="text-sm text-[#A0A0A0]">Win/Loss Ratio</div>
                  <div className="text-lg font-bold text-cyan-400">2.1</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                  <div className="text-sm text-[#A0A0A0]">Avg Trade Size</div>
                  <div className="text-lg font-bold text-cyan-400">$1,200</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bar Chart: Trade Volume by Pair */}
                <div className="bg-[#232837] rounded-lg p-6">
                  <div className="text-lg font-semibold mb-4 text-white">Trade Volume by Pair</div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { pair: 'BTC/USDT', volume: 120 },
                        { pair: 'ETH/USDT', volume: 90 },
                        { pair: 'SOL/USDT', volume: 60 },
                        { pair: 'ADA/USDT', volume: 30 },
                        { pair: 'XRP/USDT', volume: 20 },
                      ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#232837" strokeDasharray="3 3" />
                        <XAxis dataKey="pair" stroke="#A0A0A0" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#A0A0A0" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#232837', border: 'none', color: '#fff' }} />
                        <Bar dataKey="volume" fill="#00FFA3" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Pie Chart: Trade Distribution by Strategy */}
                <div className="bg-[#232837] rounded-lg p-6">
                  <div className="text-lg font-semibold mb-4 text-white">Trade Distribution by Strategy</div>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Grid', value: 45 },
                            { name: 'DCA', value: 30 },
                            { name: 'Arbitrage', value: 15 },
                            { name: 'Manual', value: 10 },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          fill="#00FFA3"
                          label
                        >
                          {[
                            '#00FFA3', '#FF4C60', '#A0A0A0', '#1a1d25'
                          ].map((color, idx) => (
                            <Cell key={color} fill={color} />
                          ))}
                        </Pie>
                        <Legend iconType="circle" />
                        <Tooltip contentStyle={{ background: '#232837', border: 'none', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activePage === 'Logs' && (
            <div className="max-w-4xl mx-auto bg-[#181c23] rounded-xl p-8 border border-[#232837]">
                  <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-cyan-400">Activity Logs</span>
                  <InfoTooltip text="Review a detailed log of all recent activity, including trades, errors, and system events." />
                  </div>
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="bg-[#232837] text-white rounded px-3 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                  disabled
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-[#A0A0A0] border-b border-[#232837]">
                      <th className="px-4 py-2 text-left font-semibold">Timestamp</th>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Message</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { time: '2024-07-07 20:01:12', type: 'Trade', message: 'Bought 0.5 BTC at $58,000', status: 'Success' },
                      { time: '2024-07-07 19:45:03', type: 'Bot', message: 'Grid Bot #1 started', status: 'Info' },
                      { time: '2024-07-07 19:30:22', type: 'Trade', message: 'Sold 0.2 BTC at $57,800', status: 'Success' },
                      { time: '2024-07-07 19:10:10', type: 'System', message: 'API key updated', status: 'Warning' },
                      { time: '2024-07-07 18:55:44', type: 'Bot', message: 'DCA Bot #2 stopped', status: 'Error' },
                      { time: '2024-07-07 18:40:00', type: 'User', message: 'Changed notification settings', status: 'Info' },
                    ].map((log, i) => (
                      <tr key={i} className="border-b border-[#232837] hover:bg-[#232837] transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap">{log.time}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{log.type}</td>
                        <td className="px-4 py-2">{log.message}</td>
                        <td className={`px-4 py-2 font-semibold ${log.status === 'Success' ? 'text-cyan-400' : log.status === 'Error' ? 'text-[#FF4C60]' : log.status === 'Warning' ? 'text-yellow-400' : 'text-[#A0A0A0]'}`}>{log.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activePage === 'Profile' && (
            <div className="max-w-2xl mx-auto bg-[#181c23] rounded-xl p-8 border border-[#232837]">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl font-bold text-cyan-400">Profile</span>
                <InfoTooltip text="Manage your account details, notification preferences, and view your user statistics." />
              </div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-cyan-900 flex items-center justify-center text-3xl font-bold text-cyan-400">U</div>
                <div>
                  <div className="text-xl font-semibold text-white mb-1">Username</div>
                  <input
                    type="text"
                    name="username"
                    className="bg-[#232837] text-white rounded px-3 py-1 mb-2 w-48 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={profile.username}
                    onChange={handleProfileChange}
                    readOnly={!editProfile}
                  />
                  <div className="text-sm text-[#A0A0A0]">Email</div>
                  <input
                    type="email"
                    name="email"
                    className="bg-[#232837] text-white rounded px-3 py-1 mb-2 w-64 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={profile.email}
                    onChange={handleProfileChange}
                    readOnly={!editProfile}
                  />
                  <div className="text-sm text-[#A0A0A0]">Phone</div>
                  <input
                    type="tel"
                    name="phone"
                    className="bg-[#232837] text-white rounded px-3 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    readOnly={!editProfile}
                  />
                </div>
                <button
                  className={`ml-auto px-4 py-2 ${editProfile ? 'bg-[#232837] text-cyan-400 border border-cyan-400' : 'bg-cyan-400 text-black'} rounded-lg font-medium hover:bg-cyan-300 transition-colors`}
                  onClick={() => setEditProfile(e => !e)}
                >
                  {editProfile ? 'Save' : 'Edit Profile'}
                </button>
              </div>
              <div className="mb-8">
                <div className="text-lg font-semibold text-white mb-2">Notification Settings</div>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[#A0A0A0]">Email</span>
                    <button
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-200 ${notifications.email ? 'bg-cyan-400' : 'bg-[#232837]'}`}
                      onClick={() => handleNotifToggle('email')}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${notifications.email ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#A0A0A0]">SMS</span>
                    <button
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-200 ${notifications.sms ? 'bg-cyan-400' : 'bg-[#232837]'}`}
                      onClick={() => handleNotifToggle('sms')}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${notifications.sms ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#A0A0A0]">Push</span>
                    <button
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-200 ${notifications.push ? 'bg-cyan-400' : 'bg-[#232837]'}`}
                      onClick={() => handleNotifToggle('push')}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${notifications.push ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white mb-2">User Statistics</div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0]">Total Profit</div>
                    <div className="text-2xl font-bold text-cyan-400">$12,340.00</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0]">Total Trades</div>
                    <div className="text-2xl font-bold text-cyan-400">1,234</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0]">Win Rate</div>
                    <div className="text-2xl font-bold text-cyan-400">67%</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0]">Losses</div>
                    <div className="text-2xl font-bold text-[#FF4C60]">410</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0]">Best Trade</div>
                    <div className="text-2xl font-bold text-cyan-400">+$2,000.00</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center">
                    <div className="text-sm text-[#A0A0A0]">Worst Trade</div>
                    <div className="text-2xl font-bold text-[#FF4C60]">-$1,200.00</div>
                  </div>
                  <div className="bg-[#232837] rounded-lg p-4 flex flex-col items-center col-span-2">
                    <div className="text-sm text-[#A0A0A0]">Account Created</div>
                    <div className="text-xl font-bold text-cyan-400">Jan 1, 2023</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activePage === 'Connections' && (
            <div className="max-w-3xl mx-auto bg-[#181c23] rounded-xl p-8 border border-[#232837]">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl font-bold text-cyan-400">Platform Connections</span>
                <InfoTooltip text="Connect your trading accounts and APIs to enable automated trading and data synchronization." />
              </div>
              <div className="mb-6 flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search for a platform..."
                  className="bg-[#232837] text-white rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                />
                <button className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-medium hover:bg-cyan-300 transition-colors">Search</button>
              </div>
              <div className="mb-8">
                <div className="text-lg font-semibold text-white mb-2">Popular Platforms</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Robinhood', status: 'Not Connected' },
                    { name: 'E*TRADE', status: 'Not Connected' },
                    { name: 'TD Ameritrade', status: 'Connected' },
                    { name: 'Interactive Brokers', status: 'Not Connected' },
                    { name: 'Alpaca', status: 'Not Connected' },
                    { name: 'Binance', status: 'Not Connected' },
                    { name: 'Coinbase', status: 'Not Connected' },
                  ].map((platform, i) => (
                    <div key={platform.name} className="flex items-center justify-between bg-[#232837] rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">{platform.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${platform.status === 'Connected' ? 'bg-cyan-400 text-black' : 'bg-[#232837] text-[#A0A0A0] border border-cyan-400'}`}>{platform.status}</span>
                      </div>
                      <button className={`px-3 py-1 rounded-lg font-medium text-xs ${platform.status === 'Connected' ? 'bg-[#232837] text-cyan-400 border border-cyan-400' : 'bg-cyan-400 text-black hover:bg-cyan-300'} transition-colors`}>
                        {platform.status === 'Connected' ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-lg font-semibold text-white mb-2">Add Custom Platform</div>
                <form className="bg-[#232837] rounded-lg p-4 flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Platform Name"
                    className="bg-[#181c23] text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="API Key"
                    className="bg-[#181c23] text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="API Secret"
                    className="bg-[#181c23] text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                  />
                  <button className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-medium hover:bg-cyan-300 transition-colors w-fit self-end">Add Connection</button>
                </form>
              </div>
            </div>
          )}
          {activePage === 'Strategy Editor' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-gradient-to-br from-[#181c23] to-[#1a1d25] rounded-xl p-8 border border-[#2d3748] shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">🎯 Strategy Editor</h2>
                    <p className="text-gray-400">Configure and customize your trading strategies with advanced controls</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#232837] to-[#1a1d25] rounded-xl p-6 border border-[#2d3748] shadow-lg">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <span className="mr-3 text-2xl">⚙️</span>
                        Strategy Configuration
                      </h3>
                        {/* Static fields restored here */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Active Strategy</label>
                            <select className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" value={selectedStaticStrategy} onChange={e => setSelectedStaticStrategy(e.target.value)}>
                              <option value="rsi">RSI Strategy</option>
                              <option value="momentum">Momentum Strategy</option>
                              <option value="breakout">Breakout Strategy</option>
                            </select>
                          </div>
                          
                          {/* Long Position RSI Settings */}
                        <div className="pt-6 border-t border-[#2d3748]">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <span className="mr-2 text-xl">📈</span>
                            Long Position RSI
                          </h4>
                          <div className="space-y-4">
                              <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">Long RSI Overbought Level</label>
                              <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => setLongRsiOverbought(Math.max(50, longRsiOverbought - 5))}
                                  className="w-10 h-10 bg-[#1a1d25] border border-[#2d3748] rounded-lg text-white hover:bg-[#2d3748] transition-all duration-200 flex items-center justify-center hover:scale-105"
                                  >
                                    -
                                  </button>
                                <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-4 py-3 text-white text-center focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200 hover:border-[#3d4758]" min="50" max="90" value={longRsiOverbought} onChange={e => setLongRsiOverbought(Number(e.target.value))} />
                                  <button
                                    onClick={() => setLongRsiOverbought(Math.min(90, longRsiOverbought + 5))}
                                  className="w-10 h-10 bg-[#1a1d25] border border-[#2d3748] rounded-lg text-white hover:bg-[#2d3748] transition-all duration-200 flex items-center justify-center hover:scale-105"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">Long RSI Oversold Level</label>
                              <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => setLongRsiOversold(Math.max(10, longRsiOversold - 5))}
                                  className="w-10 h-10 bg-[#1a1d25] border border-[#2d3748] rounded-lg text-white hover:bg-[#2d3748] transition-all duration-200 flex items-center justify-center hover:scale-105"
                                  >
                                    -
                                  </button>
                                <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-4 py-3 text-white text-center focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200 hover:border-[#3d4758]" min="10" max="50" value={longRsiOversold} onChange={e => setLongRsiOversold(Number(e.target.value))} />
                                  <button
                                    onClick={() => setLongRsiOversold(Math.min(50, longRsiOversold + 5))}
                                  className="w-10 h-10 bg-[#1a1d25] border border-[#2d3748] rounded-lg text-white hover:bg-[#2d3748] transition-all duration-200 flex items-center justify-center hover:scale-105"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">Long RSI Timeframe</label>
                              <select className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200 hover:border-[#3d4758]" value={longRsiTimeframe} onChange={e => setLongRsiTimeframe(e.target.value)}>
                                  <option value="1min">1 Minute</option>
                                  <option value="5min">5 Minutes</option>
                                  <option value="15min">15 Minutes</option>
                                  <option value="1hour">1 Hour</option>
                                  <option value="1day">1 Day</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Short Position RSI Settings */}
                          <div className="pt-4 border-t border-[#2d3748]">
                            <h4 className="text-sm font-semibold text-white mb-3">📉 Short Position RSI</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Short RSI Overbought Level</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setShortRsiOverbought(Math.max(50, shortRsiOverbought - 5))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                  <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="50" max="90" value={shortRsiOverbought} onChange={e => setShortRsiOverbought(Number(e.target.value))} />
                                  <button
                                    onClick={() => setShortRsiOverbought(Math.min(90, shortRsiOverbought + 5))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Short RSI Oversold Level</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setShortRsiOversold(Math.max(10, shortRsiOversold - 5))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                  <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="10" max="50" value={shortRsiOversold} onChange={e => setShortRsiOversold(Number(e.target.value))} />
                                  <button
                                    onClick={() => setShortRsiOversold(Math.min(50, shortRsiOversold + 5))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Short RSI Timeframe</label>
                                <select className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" value={shortRsiTimeframe} onChange={e => setShortRsiTimeframe(e.target.value)}>
                                  <option value="1min">1 Minute</option>
                                  <option value="5min">5 Minutes</option>
                                  <option value="15min">15 Minutes</option>
                                  <option value="1hour">1 Hour</option>
                                  <option value="1day">1 Day</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Trading Options */}
                        <div className="pt-6 border-t border-[#2d3748]">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <span className="mr-2 text-xl">🤖</span>
                            Trading Options
                          </h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-[#1a1d25] rounded-lg border border-[#2d3748] hover:border-[#3d4758] transition-all duration-200">
                                <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-300">AI Trade Filter</span>
                                  <InfoTooltip text="Use AI to filter and validate trades before execution" />
                                </div>
                                <button
                                  onClick={() => setAiTradeFilter(!aiTradeFilter)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                  aiTradeFilter ? 'bg-cyan-600 shadow-lg shadow-cyan-600/25' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                                      aiTradeFilter ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-300">Trailing Stops</span>
                                  <InfoTooltip text="Automatically adjust stop loss as price moves in your favor" />
                                </div>
                                <button
                                  onClick={() => setTrailingStops(!trailingStops)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                    trailingStops ? 'bg-cyan-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      trailingStops ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-300">Leverage Trading</span>
                                  <InfoTooltip text="Enable margin trading with leverage (increases risk and potential reward)" />
                                </div>
                                <button
                                  onClick={() => setLeverageTrading(!leverageTrading)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                    leverageTrading ? 'bg-cyan-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      leverageTrading ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-300">Auto Withdraw</span>
                                  <InfoTooltip text="Automatically withdraw profits to external wallet" />
                                </div>
                                <button
                                  onClick={() => setAutoWithdraw(!autoWithdraw)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                    autoWithdraw ? 'bg-cyan-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      autoWithdraw ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-300">Compounding</span>
                                  <InfoTooltip text="Reinvest profits to increase position sizes over time" />
                                </div>
                                <button
                                  onClick={() => setCompounding(!compounding)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                    compounding ? 'bg-cyan-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      compounding ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              {/* Compounding Percentage Input */}
                              {compounding && (
                                <div className="ml-4 pl-4 border-l border-[#2d3748]">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs text-gray-400">Compounding %</label>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => setCompoundingPercent(Math.max(1, compoundingPercent - 5))}
                                        className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={compoundingPercent}
                                        onChange={(e) => setCompoundingPercent(Number(e.target.value))}
                                        className="w-12 bg-[#1a1d25] border border-[#2d3748] rounded px-1 py-1 text-xs text-white text-center"
                                      />
                                      <button
                                        onClick={() => setCompoundingPercent(Math.min(100, compoundingPercent + 5))}
                                        className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Leverage Configuration */}
                          <div className="pt-4 border-t border-[#2d3748]">
                            <h4 className="text-sm font-semibold text-white mb-3">⚡ Leverage Settings</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-300">Leverage Trading</span>
                                  <InfoTooltip text="Enable margin trading with leverage (increases risk and potential reward)" />
                                </div>
                                <button
                                  onClick={() => setLeverageTrading(!leverageTrading)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                    leverageTrading ? 'bg-cyan-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      leverageTrading ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              {/* Leverage Multiplier Input */}
                              {leverageTrading && (
                                <div className="ml-4 pl-4 border-l border-[#2d3748]">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs text-gray-400">Leverage Multiplier</label>
                                    <select
                                      value={leverageMultiplier}
                                      onChange={(e) => setLeverageMultiplier(Number(e.target.value))}
                                      className="w-20 bg-[#1a1d25] border border-[#2d3748] rounded px-2 py-1 text-xs text-white text-center"
                                    >
                                      <option value={1}>1x</option>
                                      <option value={2}>2x</option>
                                      <option value={3}>3x</option>
                                      <option value={4}>4x</option>
                                      <option value={5}>5x</option>
                                      <option value={6}>6x</option>
                                      <option value={7}>7x</option>
                                      <option value={8}>8x</option>
                                      <option value={9}>9x</option>
                                      <option value={10}>10x</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Trailing Stop Configuration */}
                          <div className="pt-4 border-t border-[#2d3748]">
                            <h4 className="text-sm font-semibold text-white mb-3">📈 Trailing Stop Settings</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-300">Trailing Stops</span>
                                  <InfoTooltip text="Automatically adjust stop loss as price moves in your favor" />
                                </div>
                                <button
                                  onClick={() => setTrailingStops(!trailingStops)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                    trailingStops ? 'bg-cyan-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      trailingStops ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              {/* Trailing Stop Percentage Input */}
                              {trailingStops && (
                                <div className="ml-4 pl-4 border-l border-[#2d3748]">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs text-gray-400">Trailing Stop %</label>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => setTrailingStopPercent(Math.max(0.1, trailingStopPercent - 0.5))}
                                        className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                        value={trailingStopPercent}
                                        onChange={(e) => setTrailingStopPercent(Number(e.target.value))}
                                        className="w-12 bg-[#1a1d25] border border-[#2d3748] rounded px-1 py-1 text-xs text-white text-center"
                                      />
                                      <button
                                        onClick={() => setTrailingStopPercent(Math.min(10, trailingStopPercent + 0.5))}
                                        className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Risk Management Controls */}
                          <div className="pt-4 border-t border-[#2d3748]">
                            <h4 className="text-sm font-semibold text-white mb-3">🛡️ Risk Management Controls</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Max Daily Loss Limit (%)</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setMaxDailyLossLimit(Math.max(1, maxDailyLossLimit - 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                  <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="1" max="50" value={maxDailyLossLimit} onChange={e => setMaxDailyLossLimit(Number(e.target.value))} />
                                  <button
                                    onClick={() => setMaxDailyLossLimit(Math.min(50, maxDailyLossLimit + 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Max Consecutive Losses</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setMaxConsecutiveLosses(Math.max(1, maxConsecutiveLosses - 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="1" max="10" value={maxConsecutiveLosses} onChange={e => setMaxConsecutiveLosses(Number(e.target.value))} />
                                  <button
                                  onClick={() => setMaxConsecutiveLosses(Math.min(10, maxConsecutiveLosses + 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Max Drawdown Limit (%)</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                  onClick={() => setMaxDrawdownLimit(Math.max(5, maxDrawdownLimit - 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                  <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="5" max="50" value={maxDrawdownLimit} onChange={e => setMaxDrawdownLimit(Number(e.target.value))} />
                                  <button
                                  onClick={() => setMaxDrawdownLimit(Math.min(50, maxDrawdownLimit + 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Risk Tolerance</label>
                              <select className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" value={riskTolerance} onChange={e => setRiskTolerance(e.target.value as 'Conservative' | 'Moderate' | 'Aggressive')}>
                                <option value="Conservative">Conservative</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Aggressive">Aggressive</option>
                              </select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Signal Confirmation Settings */}
                          <div className="pt-4 border-t border-[#2d3748]">
                            <h4 className="text-sm font-semibold text-white mb-3">📡 Signal Confirmation Settings</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Volume Threshold</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setMinVolumeThreshold(Math.max(10000, minVolumeThreshold - 10000))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                  <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="10000" max="1000000" value={minVolumeThreshold} onChange={e => setMinVolumeThreshold(Number(e.target.value))} />
                                  <button
                                    onClick={() => setMinVolumeThreshold(Math.min(1000000, minVolumeThreshold + 10000))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-300">MACD Confirmation</span>
                                <InfoTooltip text="Use MACD indicator for additional signal confirmation" />
                                </div>
                                <button
                                  onClick={() => setMacdConfirmation(!macdConfirmation)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#232837] ${
                                    macdConfirmation ? 'bg-cyan-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      macdConfirmation ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Multi-timeframe Confirmation</label>
                                <select className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" value={multiTimeframeConfirmation} onChange={e => setMultiTimeframeConfirmation(e.target.value)}>
                                  <option value="15m + 1h align">15m + 1h align</option>
                                  <option value="5m + 15m align">5m + 15m align</option>
                                  <option value="1h + 4h align">1h + 4h align</option>
                                  <option value="None">None</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Custom Exit Conditions */}
                          <div className="pt-4 border-t border-[#2d3748]">
                            <h4 className="text-sm font-semibold text-white mb-3">🎯 Custom Exit Conditions</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Profit Target (%)</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setProfitTarget(Math.max(1, profitTarget - 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="1" max="50" value={profitTarget} onChange={e => setProfitTarget(Number(e.target.value))} />
                                  <button
                                  onClick={() => setProfitTarget(Math.min(50, profitTarget + 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (%)</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setStopLoss(Math.max(1, stopLoss - 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="1" max="20" value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))} />
                                  <button
                                  onClick={() => setStopLoss(Math.min(20, stopLoss + 1))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Time-Based Exit (minutes)</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setTimeBasedExit(Math.max(15, timeBasedExit - 15))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    -
                                  </button>
                                  <input type="number" className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" min="15" max="1440" value={timeBasedExit} onChange={e => setTimeBasedExit(Number(e.target.value))} />
                                  <button
                                    onClick={() => setTimeBasedExit(Math.min(1440, timeBasedExit + 15))}
                                    className="w-6 h-6 bg-[#1a1d25] border border-[#2d3748] rounded text-xs text-white hover:bg-[#232837] transition-colors"
                                  >
                                    +
                                  </button>
                              </div>
                            </div>
                          </div>
                                </div>
                              </div>
                            </div>
                          </div>
                  
                  {/* Right Column - Strategy Builder and Additional Controls */}
                  <div className="space-y-6">
                          
                          {/* Backtest Controls */}
                    <div className="bg-[#232837] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">🧪 Backtest Controls</h3>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                                  <input type="date" className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" value={backtestStartDate} onChange={e => setBacktestStartDate(e.target.value)} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                                  <input type="date" className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" value={backtestEndDate} onChange={e => setBacktestEndDate(e.target.value)} />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Asset Selector</label>
                                <select className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white" value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
                                  <option value="BTC">BTC</option>
                                  <option value="ETH">ETH</option>
                                  <option value="SOL">SOL</option>
                                  <option value="ADA">ADA</option>
                                  <option value="XRP">XRP</option>
                                </select>
                              </div>
                              <button
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                          onClick={() => setBacktestRunning(true)}
                          disabled={backtestRunning}
                        >
                          {backtestRunning ? 'Running...' : '✅ Run Backtest'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Strategy Notes */}
                    <div className="bg-[#232837] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">📝 Strategy Notes</h3>
                            <textarea
                              className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white h-24 resize-none"
                              placeholder="Add notes about strategy behavior, testing observations, or trading rules..."
                              value={strategyNotes}
                              onChange={e => setStrategyNotes(e.target.value)}
                            />
                          </div>
                          
                    {/* Strategy Management */}
                    <div className="bg-[#232837] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">🧩 Strategy Management</h3>
                      <div className="space-y-3">
                        <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                💾 Save As Template
                              </button>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                🧬 Clone Existing Strategy
                              </button>
                        <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                🗑️ Reset to Defaults
                              </button>
                            </div>
                          </div>
                          
                    {/* Risk Assessment */}
                    <div className="bg-[#232837] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">📊 Risk Assessment</h3>
                            <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Risk Level:</span>
                          <span className="text-sm font-semibold text-yellow-400">Medium</span>
                                </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Conservative</span>
                            <div className="w-16 h-2 bg-gray-600 rounded-full">
                              <div className="w-4 h-2 bg-green-400 rounded-full"></div>
                                </div>
                              </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Moderate</span>
                            <div className="w-16 h-2 bg-gray-600 rounded-full">
                              <div className="w-8 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Aggressive</span>
                            <div className="w-16 h-2 bg-gray-600 rounded-full">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
              
                    {/* Dynamic Strategy Builder */}
                    <div className="bg-[#232837] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">⚙️ Dynamic Strategy Builder</h3>
                      <DynamicStrategyBuilder
                        onSave={handleSaveStrategy}
                        onCancel={() => setShowStrategyBuilder(false)}
                        initialConfig={editingStrategy || undefined}
                />
              </div>
              </div>
            </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Strategy Breakdown Modal */}
      {showStrategyBreakdown && selectedStrategy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#181c23] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[#232837]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {selectedStrategy.type === 'quick' ? '⚡' : selectedStrategy.type === 'custom' ? '🎯' : '🤖'}
                </span>
                <h2 className="text-xl font-bold text-white">{selectedStrategy.name}</h2>
                <span className={`text-xs px-2 py-1 rounded font-bold ${
                  selectedStrategy.stats?.risk === 'HIGH' ? 'bg-red-600/40 text-red-300' : 
                  selectedStrategy.stats?.risk === 'MEDIUM' ? 'bg-yellow-600/40 text-yellow-300' : 
                  'bg-green-600/40 text-green-300'
                }`}>
                  {selectedStrategy.stats?.risk || selectedStrategy.risk || 'MEDIUM'}
                </span>
              </div>
              <button
                onClick={closeStrategyBreakdown}
                className="text-[#A0A0A0] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* EDIT MODE */}
            {editingStrategy && selectedStrategy.type === 'custom' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  // Save changes to backend
                  const updated = { ...selectedStrategy, ...editForm };
                  await fetch('${API_BASE_URL}/save-strategy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated),
                  });
                  setSavedStrategies((prev: any) => ({ ...prev, [updated.name]: updated }));
                  setEditingStrategy(null);
                  setShowStrategyBreakdown(false);
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Name</label>
                  <input
                    className="w-full bg-[#232837] text-white rounded px-3 py-2 mb-2"
                    value={editForm?.name || ''}
                    onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Description</label>
                  <input
                    className="w-full bg-[#232837] text-white rounded px-3 py-2 mb-2"
                    value={editForm?.description || ''}
                    onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Risk Level</label>
                  <select
                    className="w-full bg-[#232837] text-white rounded px-3 py-2 mb-2"
                    value={editForm?.risk || ''}
                    onChange={e => setEditForm((f: any) => ({ ...f, risk: e.target.value }))}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">Save</button>
                  <button type="button" className="flex-1 px-4 py-2 bg-[#232837] text-[#A0A0A0] rounded-lg font-medium hover:bg-[#2d3748] transition-colors" onClick={() => setEditingStrategy(null)}>Cancel</button>
                </div>
              </form>
            ) : (
            <>
            {/* Strategy Overview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Strategy Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#232837] rounded-lg p-4">
                  <div className="text-sm text-[#A0A0A0] mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-green-400">
                    {selectedStrategy.stats?.winRate || selectedStrategy.winRate || Math.floor(Math.random() * 30) + 60}%
                  </div>
                </div>
                <div className="bg-[#232837] rounded-lg p-4">
                  <div className="text-sm text-[#A0A0A0] mb-1">Total Trades</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {selectedStrategy.stats?.totalTrades || selectedStrategy.totalTrades || Math.floor(Math.random() * 100) + 20}
                  </div>
                </div>
                <div className="bg-[#232837] rounded-lg p-4">
                  <div className="text-sm text-[#A0A0A0] mb-1">Profit</div>
                  <div className="text-2xl font-bold text-orange-400">
                    {selectedStrategy.stats?.profit || selectedStrategy.profit || `${(Math.random() * 20 - 5).toFixed(1)}%`}
                  </div>
                </div>
                <div className="bg-[#232837] rounded-lg p-4">
                  <div className="text-sm text-[#A0A0A0] mb-1">Status</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {activeStrategy === selectedStrategy.name ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Strategy Details</h3>
              <div className="bg-[#232837] rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#A0A0A0]">Strategy Type:</span>
                  <span className="text-white font-semibold">
                    {selectedStrategy.type === 'quick' ? 'Quick Strategy' : 
                     selectedStrategy.type === 'custom' ? 'Custom Strategy' : 'Trading Bot'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A0A0]">Description:</span>
                  <span className="text-white">
                    {selectedStrategy.description || 'No description available'}
                  </span>
                </div>
                {selectedStrategy.stats && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Risk Level:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedStrategy.stats.risk === 'HIGH' ? 'bg-red-600/40 text-red-300' : 
                        selectedStrategy.stats.risk === 'MEDIUM' ? 'bg-yellow-600/40 text-yellow-300' : 
                        'bg-green-600/40 text-green-300'
                      }`}>
                        {selectedStrategy.stats.risk}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Performance:</span>
                      <span className="text-green-400 font-semibold">{selectedStrategy.stats.profit}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Basic Trading Parameters */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Trading Parameters</h3>
              <div className="bg-[#232837] rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[#A0A0A0] mb-1">Entry Conditions</div>
                    <div className="text-white text-sm">
                      {selectedStrategy.type === 'quick' ? 'RSI oversold + MACD crossover' : 
                       selectedStrategy.type === 'custom' ? 'Custom entry logic' : 'Multi-signal confirmation'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#A0A0A0] mb-1">Exit Conditions</div>
                    <div className="text-white text-sm">
                      {selectedStrategy.type === 'quick' ? 'Take profit at 2% or stop loss at 1%' : 
                       selectedStrategy.type === 'custom' ? 'Custom exit logic' : 'Dynamic trailing stop'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#A0A0A0] mb-1">Position Size</div>
                    <div className="text-white text-sm">
                      {selectedStrategy.stats?.risk === 'HIGH' ? '5-10% of portfolio' : 
                       selectedStrategy.stats?.risk === 'MEDIUM' ? '2-5% of portfolio' : '1-2% of portfolio'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#A0A0A0] mb-1">Timeframe</div>
                    <div className="text-white text-sm">
                      {selectedStrategy.type === 'quick' ? '1H - 4H charts' : 
                       selectedStrategy.type === 'custom' ? 'Custom timeframe' : 'Multi-timeframe analysis'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Performance */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Performance</h3>
              <div className="bg-[#232837] rounded-lg p-4">
                <div className="space-y-2">
                  {[
                    { date: 'Today', profit: '+2.3%', trades: 5 },
                    { date: 'Yesterday', profit: '-0.8%', trades: 3 },
                    { date: '2 days ago', profit: '+1.5%', trades: 7 },
                    { date: '3 days ago', profit: '+0.9%', trades: 4 },
                    { date: '4 days ago', profit: '-0.2%', trades: 2 },
                  ].map((day, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-[#2d3748] last:border-b-0">
                      <span className="text-[#A0A0A0]">{day.date}</span>
                      <span className={`font-semibold ${day.profit.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {day.profit}
                      </span>
                      <span className="text-cyan-400 text-sm">{day.trades} trades</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {selectedStrategy.type === 'custom' && !editingStrategy && (
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  onClick={() => {
                    setEditingStrategy({
                      id: selectedStrategy.name,
                      name: selectedStrategy.name,
                      description: selectedStrategy.description || '',
                      type: 'Custom',
                      parameters: [],
                      riskLevel: 'Medium',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                  }}
                >
                  Edit
                </button>
              )}
              {activeStrategy === selectedStrategy.name ? (
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Currently Active
                </button>
              ) : (
                <button 
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                  onClick={() => {
                    handleActivateStrategy(selectedStrategy.name, selectedStrategy);
                    closeStrategyBreakdown();
                  }}
                >
                  Activate Strategy
                </button>
              )}
              <button 
                className="px-4 py-2 bg-[#232837] text-[#A0A0A0] rounded-lg font-medium hover:bg-[#2d3748] transition-colors"
                onClick={closeStrategyBreakdown}
              >
                Close
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
      
      {/* Dynamic Strategy Builder Modal */}
      {showStrategyBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <DynamicStrategyBuilder
            onSave={handleSaveStrategy}
            onCancel={() => {
              setShowStrategyBuilder(false);
              setEditingStrategy(null);
            }}
            initialConfig={editingStrategy || undefined}
          />
        </div>
      )}
      
      {/* Save Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#181c23] rounded-xl p-6 w-96 border border-[#232837]">
            <h3 className="text-lg font-semibold text-white mb-4">💾 Save as Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                <input
                  type="text"
                  className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white"
                  placeholder="Enter template name..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (templateName.trim()) {
                      // Save template logic here
                      alert(`✅ Template "${templateName}" saved successfully!`);
                      setShowTemplateModal(false);
                      setTemplateName('');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                >
                  Save Template
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setTemplateName('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#232837] text-gray-300 rounded-lg font-medium hover:bg-[#2d3748] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Clone Strategy Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#181c23] rounded-xl p-6 w-96 border border-[#232837]">
            <h3 className="text-lg font-semibold text-white mb-4">🧬 Clone Strategy</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Strategy Name</label>
                <input
                  type="text"
                  className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white"
                  placeholder="Enter new strategy name..."
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Strategy to Clone</label>
                <select className="w-full bg-[#1a1d25] border border-[#2d3748] rounded-lg px-3 py-2 text-white">
                  <option value="">Select a strategy...</option>
                  <option value="conservative-rsi">Conservative RSI Strategy</option>
                  <option value="aggressive-momentum">Aggressive Momentum Strategy</option>
                  <option value="balanced-breakout">Balanced Breakout Strategy</option>
                  <option value="high-voltage-bot">High Voltage Bot</option>
                  <option value="steady-shield-bot">Steady Shield Bot</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (cloneName.trim()) {
                      // Clone strategy logic here
                      alert(`✅ Strategy cloned as "${cloneName}" successfully!`);
                      setShowCloneModal(false);
                      setCloneName('');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                >
                  Clone Strategy
                </button>
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setCloneName('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#232837] text-gray-300 rounded-lg font-medium hover:bg-[#2d3748] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Backtest Results Modal */}
      {backtestResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#181c23] rounded-xl p-6 w-96 border border-[#232837]">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Backtest Results</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#232837] rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Trades</div>
                  <div className="text-lg font-bold text-white">{backtestResults.totalTrades}</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-3">
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <div className="text-lg font-bold text-green-400">{backtestResults.winRate}</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Return</div>
                  <div className="text-lg font-bold text-cyan-400">{backtestResults.totalReturn}</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-3">
                  <div className="text-sm text-gray-400">Max Drawdown</div>
                  <div className="text-lg font-bold text-red-400">{backtestResults.maxDrawdown}</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-3">
                  <div className="text-sm text-gray-400">Sharpe Ratio</div>
                  <div className="text-lg font-bold text-yellow-400">{backtestResults.sharpeRatio}</div>
                </div>
                <div className="bg-[#232837] rounded-lg p-3">
                  <div className="text-sm text-gray-400">Profit Factor</div>
                  <div className="text-lg font-bold text-purple-400">{backtestResults.profitFactor}</div>
                </div>
              </div>
              <button
                onClick={() => setBacktestResults(null)}
                className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
