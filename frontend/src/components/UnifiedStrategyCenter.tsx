'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../lib/config';
import { useAuth } from '../contexts/AuthContext';

interface UnifiedStrategyCenterProps {
  onStrategySelect?: (strategy: any) => void;
  onStrategyActivate?: (strategy: any) => void;
  savedStrategies?: Record<string, any>;
  activeStrategy?: any;
}

interface Strategy {
  id: string;
  name: string;
  type: 'RSI' | 'Momentum' | 'Breakout' | 'Custom';
  status: 'active' | 'inactive' | 'testing';
  performance: number;
  lastTrade: string;
  description: string;
  config: any;
}

export default function UnifiedStrategyCenter({ 
  onStrategySelect, 
  onStrategyActivate, 
  savedStrategies = {}, 
  activeStrategy 
}: UnifiedStrategyCenterProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'strategies' | 'performance' | 'settings'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'RSI' | 'Momentum' | 'Breakout' | 'Custom'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'lastTrade'>('name');
  const { token } = useAuth ? useAuth() : { token: null };
  const [currentActiveStrategy, setCurrentActiveStrategy] = useState(activeStrategy || null);

  // Mock data for demonstration
  const strategies: Strategy[] = [
    {
      id: '1',
      name: 'RSI Momentum Trader',
      type: 'RSI',
      status: 'active',
      performance: 12.5,
      lastTrade: '2 min ago',
      description: 'RSI-based momentum strategy with 70/30 thresholds',
      config: { rsi_overbought: 70, rsi_oversold: 30 }
    },
    {
      id: '2',
      name: 'Breakout Hunter',
      type: 'Breakout',
      status: 'testing',
      performance: 8.2,
      lastTrade: '15 min ago',
      description: 'Breakout detection with volume confirmation',
      config: { breakout_period: 20, breakout_multiplier: 2.0 }
    },
    {
      id: '3',
      name: 'Momentum Master',
      type: 'Momentum',
      status: 'inactive',
      performance: 15.7,
      lastTrade: '1 hour ago',
      description: 'High-frequency momentum trading strategy',
      config: { momentum_lookback: 20, momentum_threshold: 0.8 }
    },
    {
      id: '4',
      name: 'Custom Volatility',
      type: 'Custom',
      status: 'active',
      performance: 22.1,
      lastTrade: '5 min ago',
      description: 'Custom volatility-based strategy',
      config: { custom_params: true }
    }
  ];

  const performanceData = [
    { time: '09:00', value: 10000 },
    { time: '10:00', value: 10200 },
    { time: '11:00', value: 10100 },
    { time: '12:00', value: 10400 },
    { time: '13:00', value: 10600 },
    { time: '14:00', value: 10800 },
    { time: '15:00', value: 10700 },
    { time: '16:00', value: 10900 },
  ];

  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || strategy.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return b.performance - a.performance;
      case 'lastTrade':
        return new Date(b.lastTrade).getTime() - new Date(a.lastTrade).getTime();
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#00FFA3] text-black';
      case 'testing': return 'bg-yellow-500 text-black';
      case 'inactive': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RSI': return 'text-[#00FFA3]';
      case 'Momentum': return 'text-[#FF4C60]';
      case 'Breakout': return 'text-[#4F8CFF]';
      case 'Custom': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const handleActivateStrategy = async (strategy: Strategy) => {
    if (onStrategyActivate) {
      onStrategyActivate(strategy);
      setCurrentActiveStrategy(strategy.name);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/strategy-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ active_strategy: strategy.name })
      });
      if (response.ok) {
        setCurrentActiveStrategy(strategy.name);
      } else {
        alert('Failed to activate strategy');
      }
    } catch (err) {
      alert('Error activating strategy');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Active Strategies</div>
          <div className="text-2xl font-bold text-white">
            {strategies.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Total Performance</div>
          <div className="text-2xl font-bold text-[#00FFA3]">
            +{strategies.reduce((sum, s) => sum + s.performance, 0).toFixed(1)}%
          </div>
        </div>
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Today's Trades</div>
          <div className="text-2xl font-bold text-white">24</div>
        </div>
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Win Rate</div>
          <div className="text-2xl font-bold text-[#00FFA3]">68.5%</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1d25', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#FFFFFF'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#00FFA3" 
              strokeWidth={2}
              dot={{ fill: '#00FFA3', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {strategies.slice(0, 3).map(strategy => (
            <div key={strategy.id} className="flex items-center justify-between p-3 bg-[#0f1117] rounded-lg border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(strategy.status).split(' ')[0]}`}></div>
                <div>
                  <div className="text-white font-medium">{strategy.name}</div>
                  <div className="text-gray-400 text-sm">{strategy.lastTrade}</div>
                </div>
              </div>
              <div className={`font-bold ${strategy.performance >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4C60]'}`}>
                {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStrategies = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a1d25] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFA3]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 bg-[#1a1d25] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FFA3]"
        >
          <option value="all">All Types</option>
          <option value="RSI">RSI</option>
          <option value="Momentum">Momentum</option>
          <option value="Breakout">Breakout</option>
          <option value="Custom">Custom</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-[#1a1d25] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FFA3]"
        >
          <option value="name">Sort by Name</option>
          <option value="performance">Sort by Performance</option>
          <option value="lastTrade">Sort by Last Trade</option>
        </select>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedStrategies.map(strategy => (
          <div 
            key={strategy.id}
            className={`bg-[#1a1d25] rounded-lg p-4 border ${currentActiveStrategy === strategy.name ? 'border-[#00FFA3]' : 'border-gray-700'} hover:border-[#00FFA3] transition-colors cursor-pointer`}
            onClick={() => onStrategySelect?.(strategy)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{strategy.name}</h3>
                <span className={`text-sm ${getTypeColor(strategy.type)}`}>{strategy.type}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(strategy.status)}`}>
                {strategy.status}
              </span>
            </div>
            
            <p className="text-gray-400 text-sm mb-3">{strategy.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Last: {strategy.lastTrade}
              </div>
              <div className={`font-bold ${strategy.performance >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4C60]'}`}>
                {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
              </div>
            </div>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (currentActiveStrategy !== strategy.name) handleActivateStrategy(strategy);
                }}
                className={`flex-1 px-3 py-1 ${currentActiveStrategy === strategy.name ? 'bg-gray-400 text-black cursor-not-allowed' : 'bg-[#00FFA3] text-black hover:bg-[#00CC82]'} text-sm font-medium rounded transition-colors`}
                disabled={currentActiveStrategy === strategy.name}
              >
                {currentActiveStrategy === strategy.name ? 'Active' : 'Activate'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle edit
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-500 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Strategy Performance Comparison</h3>
        <div className="space-y-4">
          {strategies.map(strategy => (
            <div key={strategy.id} className="flex items-center justify-between p-4 bg-[#0f1117] rounded-lg border border-gray-700">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(strategy.status).split(' ')[0]}`}></div>
                <div>
                  <div className="text-white font-medium">{strategy.name}</div>
                  <div className="text-gray-400 text-sm">{strategy.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-lg ${strategy.performance >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4C60]'}`}>
                  {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                </div>
                <div className="text-gray-400 text-sm">{strategy.lastTrade}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Strategy Center Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Auto-activate strategies</div>
              <div className="text-gray-400 text-sm">Automatically activate strategies when conditions are met</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FFA3]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Performance alerts</div>
              <div className="text-gray-400 text-sm">Get notified when strategies underperform</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FFA3]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Risk management</div>
              <div className="text-gray-400 text-sm">Automatically stop strategies at loss thresholds</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FFA3]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#0f1117] min-h-screen">
      {/* Header */}
      <div className="bg-[#1a1d25] border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Unified Strategy Center</h1>
            <p className="text-gray-400">Manage and monitor all your trading strategies</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-white font-semibold">Active Strategies</div>
              <div className="text-[#00FFA3] text-lg font-bold">
                {strategies.filter(s => s.status === 'active').length}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-700"></div>
            <div className="text-right">
              <div className="text-white font-semibold">Total Performance</div>
              <div className="text-[#00FFA3] text-lg font-bold">
                +{strategies.reduce((sum, s) => sum + s.performance, 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1a1d25] border-b border-gray-700">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'strategies', label: 'Strategies', icon: '⚡' },
            { id: 'performance', label: 'Performance', icon: '📈' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-[#00FFA3] border-b-2 border-[#00FFA3]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'strategies' && renderStrategies()}
        {selectedTab === 'performance' && renderPerformance()}
        {selectedTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
} 