'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface StrategyDiagnosticsProps {
  strategyName?: string;
  onClose?: () => void;
}

interface DiagnosticData {
  performance: Array<{ time: string; value: number }>;
  trades: Array<{ date: string; profit: number; type: 'buy' | 'sell' }>;
  metrics: {
    totalTrades: number;
    winRate: number;
    avgProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export default function StrategyDiagnostics({ strategyName = 'Active Strategy', onClose }: StrategyDiagnosticsProps) {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({
    performance: [
      { time: '09:00', value: 10000 },
      { time: '10:00', value: 10200 },
      { time: '11:00', value: 10100 },
      { time: '12:00', value: 10400 },
      { time: '13:00', value: 10600 },
      { time: '14:00', value: 10800 },
      { time: '15:00', value: 10700 },
      { time: '16:00', value: 10900 },
    ],
    trades: [
      { date: '09:15', profit: 150, type: 'buy' },
      { date: '10:30', profit: -50, type: 'sell' },
      { date: '11:45', profit: 200, type: 'buy' },
      { date: '13:20', profit: 300, type: 'sell' },
      { date: '14:10', profit: -100, type: 'buy' },
      { date: '15:30', profit: 250, type: 'sell' },
    ],
    metrics: {
      totalTrades: 6,
      winRate: 66.7,
      avgProfit: 125,
      maxDrawdown: -100,
      sharpeRatio: 1.85,
    }
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'trades' | 'metrics'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'trades', label: 'Trades', icon: '💼' },
    { id: 'metrics', label: 'Metrics', icon: '📋' },
  ];

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? '#00FFA3' : '#FF4C60';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Total Trades</div>
          <div className="text-2xl font-bold text-white">{diagnosticData.metrics.totalTrades}</div>
        </div>
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Win Rate</div>
          <div className="text-2xl font-bold text-[#00FFA3]">{diagnosticData.metrics.winRate}%</div>
        </div>
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Avg Profit</div>
          <div className="text-2xl font-bold text-[#00FFA3]">${diagnosticData.metrics.avgProfit}</div>
        </div>
        <div className="bg-[#1a1d25] rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Sharpe Ratio</div>
          <div className="text-2xl font-bold text-white">{diagnosticData.metrics.sharpeRatio}</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={diagnosticData.performance}>
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
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Performance Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={diagnosticData.performance}>
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
              strokeWidth={3}
              dot={{ fill: '#00FFA3', strokeWidth: 2, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTrades = () => (
    <div className="space-y-6">
      <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Trade History</h3>
        <div className="space-y-3">
          {diagnosticData.trades.map((trade, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#0f1117] rounded-lg border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${trade.type === 'buy' ? 'bg-[#00FFA3]' : 'bg-[#FF4C60]'}`}></div>
                <div>
                  <div className="text-white font-medium">{trade.type.toUpperCase()}</div>
                  <div className="text-gray-400 text-sm">{trade.date}</div>
                </div>
              </div>
              <div className={`font-bold ${trade.profit >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4C60]'}`}>
                {trade.profit >= 0 ? '+' : ''}${trade.profit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Max Drawdown</span>
              <span className="text-[#FF4C60] font-semibold">${diagnosticData.metrics.maxDrawdown}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sharpe Ratio</span>
              <span className="text-[#00FFA3] font-semibold">{diagnosticData.metrics.sharpeRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-[#00FFA3] font-semibold">{diagnosticData.metrics.winRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d25] rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Profit Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Profitable', value: 4, color: '#00FFA3' },
                  { name: 'Losses', value: 2, color: '#FF4C60' }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {[
                  { name: 'Profitable', value: 4, color: '#00FFA3' },
                  { name: 'Losses', value: 2, color: '#FF4C60' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1d25', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#FFFFFF'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#1a1d25] rounded-xl shadow-2xl w-full max-w-6xl border border-gray-700 mx-auto my-8">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-[#00FFA3]"></div>
          <h2 className="text-xl font-bold text-white">Strategy Diagnostics</h2>
          <span className="text-gray-400">- {strategyName}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#00FFA3] border-b-2 border-[#00FFA3]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'trades' && renderTrades()}
        {activeTab === 'metrics' && renderMetrics()}
      </div>
    </div>
  );
} 