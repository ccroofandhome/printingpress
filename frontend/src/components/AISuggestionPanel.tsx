'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_BASE_URL } from '../lib/config';

interface StockAnalysis {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  rsi: number;
  macd: number;
  bollingerUpper: number;
  bollingerLower: number;
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
  recommendation: string;
  strategy: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  chartData: Array<{ time: string; price: number | string; volume: number }>;
}

interface AISuggestionPanelProps {
  selectedStocks?: string[];
}

const mockStockData: { [key: string]: StockAnalysis } = {
  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    currentPrice: 58000,
    change24h: 1200,
    changePercent: 2.1,
    volume: 25000000000,
    marketCap: 1100000000000,
    rsi: 65,
    macd: 0.8,
    bollingerUpper: 59500,
    bollingerLower: 56500,
    support: 57000,
    resistance: 59000,
    trend: 'bullish',
    volatility: 'medium',
    recommendation: 'Strong momentum with RSI at 65. Consider grid trading strategy with tight stop-loss at $57,000. MACD shows positive divergence.',
    strategy: 'Grid Trading with 2% intervals',
    riskLevel: 'medium',
    confidence: 85,
    chartData: [
      { time: '09:00', price: 56800, volume: 1200000 },
      { time: '10:00', price: 57200, volume: 1400000 },
      { time: '11:00', price: 57500, volume: 1600000 },
      { time: '12:00', price: 57800, volume: 1800000 },
      { time: '13:00', price: 58000, volume: 2000000 },
      { time: '14:00', price: 58200, volume: 2200000 },
      { time: '15:00', price: 58500, volume: 2400000 },
      { time: '16:00', price: 58000, volume: 2000000 },
    ]
  },
  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    currentPrice: 3200,
    change24h: -50,
    changePercent: -1.5,
    volume: 15000000000,
    marketCap: 380000000000,
    rsi: 45,
    macd: -0.2,
    bollingerUpper: 3300,
    bollingerLower: 3100,
    support: 3150,
    resistance: 3250,
    trend: 'neutral',
    volatility: 'low',
    recommendation: 'RSI at 45 indicates oversold conditions. Consider DCA strategy with accumulation at $3,150 support level.',
    strategy: 'Dollar Cost Averaging',
    riskLevel: 'low',
    confidence: 72,
    chartData: [
      { time: '09:00', price: 3250, volume: 800000 },
      { time: '10:00', price: 3230, volume: 900000 },
      { time: '11:00', price: 3210, volume: 1000000 },
      { time: '12:00', price: 3190, volume: 1100000 },
      { time: '13:00', price: 3170, volume: 1200000 },
      { time: '14:00', price: 3150, volume: 1300000 },
      { time: '15:00', price: 3180, volume: 1400000 },
      { time: '16:00', price: 3200, volume: 1500000 },
    ]
  },
  'SOL': {
    symbol: 'SOL',
    name: 'Solana',
    currentPrice: 140,
    change24h: 8,
    changePercent: 6.0,
    volume: 8000000000,
    marketCap: 65000000000,
    rsi: 78,
    macd: 1.2,
    bollingerUpper: 145,
    bollingerLower: 135,
    support: 138,
    resistance: 142,
    trend: 'bullish',
    volatility: 'high',
    recommendation: 'RSI at 78 indicates overbought conditions. Consider momentum strategy with trailing stops. High volatility requires careful position sizing.',
    strategy: 'Momentum Trading with Trailing Stops',
    riskLevel: 'high',
    confidence: 68,
    chartData: [
      { time: '09:00', price: 132, volume: 500000 },
      { time: '10:00', price: 134, volume: 600000 },
      { time: '11:00', price: 136, volume: 700000 },
      { time: '12:00', price: 138, volume: 800000 },
      { time: '13:00', price: 140, volume: 900000 },
      { time: '14:00', price: 142, volume: 1000000 },
      { time: '15:00', price: 144, volume: 1100000 },
      { time: '16:00', price: 140, volume: 1200000 },
    ]
  },
  'ADA': {
    symbol: 'ADA',
    name: 'Cardano',
    currentPrice: 0.45,
    change24h: -0.02,
    changePercent: -4.3,
    volume: 2000000000,
    marketCap: 16000000000,
    rsi: 35,
    macd: -0.5,
    bollingerUpper: 0.48,
    bollingerLower: 0.42,
    support: 0.43,
    resistance: 0.47,
    trend: 'bearish',
    volatility: 'medium',
    recommendation: 'RSI at 35 shows oversold conditions. Consider breakout strategy if price breaks above $0.47 resistance. Risk-reward favorable.',
    strategy: 'Breakout Trading',
    riskLevel: 'medium',
    confidence: 75,
    chartData: [
      { time: '09:00', price: 0.47, volume: 300000 },
      { time: '10:00', price: 0.465, volume: 350000 },
      { time: '11:00', price: 0.46, volume: 400000 },
      { time: '12:00', price: 0.455, volume: 450000 },
      { time: '13:00', price: 0.45, volume: 500000 },
      { time: '14:00', price: 0.445, volume: 550000 },
      { time: '15:00', price: 0.44, volume: 600000 },
      { time: '16:00', price: 0.45, volume: 650000 },
    ]
  },
  'XRP': {
    symbol: 'XRP',
    name: 'Ripple',
    currentPrice: 0.52,
    change24h: 0.03,
    changePercent: 6.1,
    volume: 3000000000,
    marketCap: 28000000000,
    rsi: 70,
    macd: 0.3,
    bollingerUpper: 0.54,
    bollingerLower: 0.50,
    support: 0.51,
    resistance: 0.53,
    trend: 'bullish',
    volatility: 'low',
    recommendation: 'Strong uptrend with RSI at 70. Consider scalping strategy with tight profit targets. Low volatility makes it suitable for frequent trades.',
    strategy: 'Scalping with 1% targets',
    riskLevel: 'low',
    confidence: 82,
    chartData: [
      { time: '09:00', price: 0.49, volume: 400000 },
      { time: '10:00', price: 0.50, volume: 450000 },
      { time: '11:00', price: 0.51, volume: 500000 },
      { time: '12:00', price: 0.52, volume: 550000 },
      { time: '13:00', price: 0.53, volume: 600000 },
      { time: '14:00', price: 0.54, volume: 650000 },
      { time: '15:00', price: 0.53, volume: 700000 },
      { time: '16:00', price: 0.52, volume: 750000 },
    ]
  }
};

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

export default function AISuggestionPanel({ selectedStocks = ['BTC', 'ETH', 'SOL'] }: AISuggestionPanelProps) {
  const [selectedStock, setSelectedStock] = useState<string>('BTC');
  const [analysisMode, setAnalysisMode] = useState<'overview' | 'technical' | 'strategy'>('overview');
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W'>('1D');
  const [stockAnalysis, setStockAnalysis] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analysis from backend
  const fetchAnalysis = async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/ai-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol,
          timeframe: timeframe
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      
      const data = await response.json();
      if (data.analysis) {
        setStockAnalysis(data.analysis);
      } else {
        setError(data.error || 'Analysis not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
      // Fallback to mock data
      setStockAnalysis(mockStockData[symbol] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(selectedStock);
  }, [selectedStock, timeframe]);

  if (loading) {
    return (
      <div className="bg-[#181c23] rounded-xl p-6 border border-[#232837]">
        <div className="flex items-center justify-center h-32">
          <div className="text-cyan-400">Loading analysis...</div>
        </div>
      </div>
    );
  }

  // Use mock data as fallback if no analysis is available
  const currentAnalysis = stockAnalysis || mockStockData[selectedStock] || mockStockData['BTC'];

  if (error && !currentAnalysis) {
    return (
      <div className="bg-[#181c23] rounded-xl p-6 border border-[#232837]">
        <div className="text-red-400 mb-4">Error: {error || 'No analysis available'}</div>
        <button 
          onClick={() => fetchAnalysis(selectedStock)}
          className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#181c23] rounded-xl p-6 border border-[#232837]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-cyan-400">AI Strategy Suggestions</span>
          <InfoTooltip text="AI-powered analysis of daily charts with personalized strategy recommendations for each stock." />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="bg-[#232837] text-white rounded px-3 py-1 text-sm border border-[#232837] focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {selectedStocks.map(stock => (
              <option key={stock} value={stock}>{stock}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock Info */}
        <div className="bg-[#232837] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">{currentAnalysis?.name || 'N/A'} ({currentAnalysis?.symbol || 'N/A'})</h3>
            <span className={`text-sm font-semibold ${currentAnalysis?.changePercent && currentAnalysis.changePercent >= 0 ? 'text-green-400' : currentAnalysis?.changePercent && currentAnalysis.changePercent < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
              {currentAnalysis?.changePercent && currentAnalysis.changePercent >= 0 ? '+' : ''}{currentAnalysis?.changePercent}%
            </span>
          </div>
          <div className="text-2xl font-bold text-cyan-400 mb-2">
            {typeof currentAnalysis?.currentPrice === 'number' ? currentAnalysis.currentPrice.toLocaleString() : 'N/A'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-[#A0A0A0]">Volume:</span>
              <span className="text-white ml-1">${(currentAnalysis?.volume / 1000000).toFixed(1)}M</span>
            </div>
            <div>
              <span className="text-[#A0A0A0]">Market Cap:</span>
              <span className="text-white ml-1">${(currentAnalysis?.marketCap / 1000000000).toFixed(1)}B</span>
            </div>
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="bg-[#232837] rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-3">Technical Indicators</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[#A0A0A0]">RSI:</span>
              <span className={`ml-1 font-semibold ${currentAnalysis?.rsi && currentAnalysis.rsi > 70 ? 'text-yellow-400' : currentAnalysis?.rsi && currentAnalysis.rsi < 30 ? 'text-red-400' : 'text-cyan-400'}`}>
                {currentAnalysis?.rsi}
              </span>
            </div>
            <div>
              <span className="text-[#A0A0A0]">MACD:</span>
              <span className={`ml-1 font-semibold ${currentAnalysis?.macd && currentAnalysis.macd > 0 ? 'text-green-400' : currentAnalysis?.macd && currentAnalysis.macd < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                {currentAnalysis?.macd && currentAnalysis.macd > 0 ? '+' : ''}{currentAnalysis?.macd}
              </span>
            </div>
            <div>
              <span className="text-[#A0A0A0]">Support:</span>
              <span className="text-white ml-1">${currentAnalysis?.support}</span>
            </div>
            <div>
              <span className="text-[#A0A0A0]">Resistance:</span>
              <span className="text-white ml-1">${currentAnalysis?.resistance}</span>
            </div>
          </div>
        </div>

        {/* Market Analysis */}
        <div className="bg-[#232837] rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-3">Market Analysis</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">Trend:</span>
              <span className={`font-semibold ${getTrendColor(currentAnalysis?.trend || '')}`}>
                {currentAnalysis?.trend?.charAt(0).toUpperCase() + (currentAnalysis?.trend?.slice(1) || '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">Volatility:</span>
              <span className={`font-semibold ${getVolatilityColor(currentAnalysis?.volatility || '')}`}>
                {currentAnalysis?.volatility?.charAt(0).toUpperCase() + (currentAnalysis?.volatility?.slice(1) || '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">Risk Level:</span>
              <span className={`font-semibold ${getRiskColor(currentAnalysis?.riskLevel || '')}`}>
                {currentAnalysis?.riskLevel?.charAt(0).toUpperCase() + (currentAnalysis?.riskLevel?.slice(1) || '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">Confidence:</span>
              <span className="text-cyan-400 font-semibold">{currentAnalysis?.confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'technical', label: 'Technical Analysis' },
          { key: 'strategy', label: 'Strategy Recommendations' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              analysisMode === tab.key
                ? 'bg-cyan-400 text-black'
                : 'bg-[#232837] text-[#A0A0A0] hover:bg-cyan-900/40 hover:text-cyan-300'
            }`}
            onClick={() => setAnalysisMode(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on selected mode */}
      {analysisMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Chart */}
          <div className="bg-[#232837] rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Price Action</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentAnalysis?.chartData || []}>
                  <CartesianGrid stroke="#232837" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#A0A0A0" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#A0A0A0" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#232837', border: 'none', color: '#fff' }} />
                  <Line type="monotone" dataKey="price" stroke="#00FFA3" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-[#232837] rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Volume Analysis</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentAnalysis?.chartData || []}>
                  <CartesianGrid stroke="#232837" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#A0A0A0" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#A0A0A0" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#232837', border: 'none', color: '#fff' }} />
                  <Bar dataKey="volume" fill="#FF4C60" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {analysisMode === 'technical' && (
        <div className="bg-[#232837] rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-3">Technical Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-cyan-400 mb-2">RSI Analysis</h4>
              <p className="text-sm text-[#A0A0A0] mb-2">
                RSI at {currentAnalysis?.rsi} indicates {
                  currentAnalysis?.rsi && currentAnalysis.rsi > 70 ? 'overbought conditions' :
                  currentAnalysis?.rsi && currentAnalysis.rsi < 30 ? 'oversold conditions' :
                  'neutral momentum'
                }.
              </p>
              <div className="bg-[#181c23] rounded p-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span>Oversold (30)</span>
                  <span>Overbought (70)</span>
                </div>
                <div className="w-full bg-[#232837] rounded-full h-2">
                  <div 
                    className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(currentAnalysis?.rsi || 0, 0), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-400 mb-2">Bollinger Bands</h4>
              <p className="text-sm text-[#A0A0A0] mb-2">
                Current price is {
                  currentAnalysis?.currentPrice && currentAnalysis.currentPrice > currentAnalysis.bollingerUpper ? 'above upper band (overbought)' :
                  currentAnalysis?.currentPrice && currentAnalysis.currentPrice < currentAnalysis.bollingerLower ? 'below lower band (oversold)' :
                  'within normal range'
                }.
              </p>
              <div className="bg-[#181c23] rounded p-2 text-xs">
                <div className="flex justify-between">
                  <span>Lower: ${currentAnalysis?.bollingerLower}</span>
                  <span>Upper: ${currentAnalysis?.bollingerUpper}</span>
                </div>
                <div className="text-center mt-1">
                  <span className="text-cyan-400">Current: ${currentAnalysis?.currentPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {analysisMode === 'strategy' && (
        <div className="space-y-4">
          {/* Strategy Recommendation */}
          <div className="bg-[#232837] rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Recommended Strategy</h3>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-cyan-400 font-semibold">{currentAnalysis?.strategy}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(currentAnalysis?.riskLevel || '')}`}>
                  {currentAnalysis?.riskLevel?.toUpperCase()} RISK
                </span>
              </div>
              <p className="text-sm text-[#A0A0A0]">{currentAnalysis?.recommendation}</p>
            </div>
            
            {/* Strategy Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#181c23] rounded p-3">
                <h4 className="font-semibold text-cyan-400 mb-2">Entry Points</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Primary:</span>
                    <span className="text-white">${currentAnalysis?.currentPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Support:</span>
                    <span className="text-green-400">${currentAnalysis?.support}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Resistance:</span>
                    <span className="text-red-400">${currentAnalysis?.resistance}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#181c23] rounded p-3">
                <h4 className="font-semibold text-cyan-400 mb-2">Risk Management</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Stop Loss:</span>
                    <span className="text-red-400">-{currentAnalysis?.riskLevel === 'high' ? '5%' : currentAnalysis?.riskLevel === 'medium' ? '3%' : '2%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Take Profit:</span>
                    <span className="text-green-400">+{currentAnalysis?.riskLevel === 'high' ? '8%' : currentAnalysis?.riskLevel === 'medium' ? '5%' : '3%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Position Size:</span>
                    <span className="text-white">{currentAnalysis?.riskLevel === 'high' ? 'Small' : currentAnalysis?.riskLevel === 'medium' ? 'Medium' : 'Large'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#181c23] rounded p-3">
                <h4 className="font-semibold text-cyan-400 mb-2">Confidence Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">AI Confidence:</span>
                    <span className="text-cyan-400">{currentAnalysis?.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Signal Strength:</span>
                    <span className="text-cyan-400">{currentAnalysis?.confidence && currentAnalysis.confidence > 80 ? 'Strong' : currentAnalysis?.confidence && currentAnalysis.confidence > 60 ? 'Moderate' : 'Weak'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Market Sentiment:</span>
                    <span className={`${getTrendColor(currentAnalysis?.trend || '')}`}>
                      {currentAnalysis?.trend?.charAt(0).toUpperCase() + (currentAnalysis?.trend?.slice(1) || '')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Strategies */}
          <div className="bg-[#232837] rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Alternative Strategies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#181c23] rounded p-3">
                <h4 className="font-semibold text-cyan-400 mb-2">Conservative Approach</h4>
                <p className="text-sm text-[#A0A0A0] mb-2">Dollar Cost Averaging with longer timeframes</p>
                <div className="text-xs text-[#A0A0A0]">
                  • Buy small amounts regularly<br/>
                  • Focus on long-term growth<br/>
                  • Lower risk, steady returns
                </div>
              </div>
              <div className="bg-[#181c23] rounded p-3">
                <h4 className="font-semibold text-cyan-400 mb-2">Aggressive Approach</h4>
                <p className="text-sm text-[#A0A0A0] mb-2">Momentum trading with tight stops</p>
                <div className="text-xs text-[#A0A0A0]">
                  • Follow strong trends<br/>
                  • Quick profit taking<br/>
                  • Higher risk, higher potential
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button className="px-6 py-2 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition-colors">
          Apply Strategy
        </button>
        <button className="px-6 py-2 bg-[#232837] text-cyan-400 border border-cyan-400 rounded-lg font-semibold hover:bg-cyan-900/40 transition-colors">
          Save Analysis
        </button>
        <button className="px-6 py-2 bg-[#232837] text-[#A0A0A0] border border-[#232837] rounded-lg font-semibold hover:bg-[#232837] hover:text-white transition-colors">
          Export Report
        </button>
      </div>
    </div>
  );
} 