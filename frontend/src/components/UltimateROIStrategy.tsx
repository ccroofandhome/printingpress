'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/config';

interface UltimateROIStrategyProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

interface PortfolioAllocation {
  asset: string;
  allocation_percentage: number;
  current_roi: number;
  leverage: number;
  risk_score: number;
  strategy_confidence: number;
  volume: number;
  recommended_position_size: number;
}

interface PortfolioStatus {
  total_value: number;
  daily_pnl: number;
  daily_return: number;
  max_drawdown: number;
  risk_score: number;
  active_positions: number;
  allocations: Array<{
    asset: string;
    allocation: number;
    current_value: number;
    pnl: number;
    leverage: number;
    status: string;
  }>;
  compounding_enabled: boolean;
  last_reallocation: string;
  next_reallocation: string;
}

interface RiskStatus {
  overall_risk_score: number;
  daily_drawdown: number;
  max_drawdown_limit: number;
  consecutive_losses: number;
  max_consecutive_losses: number;
  portfolio_volatility: number;
  risk_alerts: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
  asset_risk_scores: Record<string, { risk_score: number; status: string }>;
  recommendations: string[];
}

export default function UltimateROIStrategy({ isActive, onToggle }: UltimateROIStrategyProps) {
  const [portfolioStatus, setPortfolioStatus] = useState<PortfolioStatus | null>(null);
  const [riskStatus, setRiskStatus] = useState<RiskStatus | null>(null);
  const [allocations, setAllocations] = useState<PortfolioAllocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isActive) {
      fetchPortfolioData();
      const interval = setInterval(fetchPortfolioData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isActive]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const [portfolioRes, riskRes, allocationRes] = await Promise.all([
        fetch(`${API_BASE_URL}/portfolio-status`),
        fetch(`${API_BASE_URL}/risk-status`),
        fetch(`${API_BASE_URL}/allocate-capital`)
      ]);

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setPortfolioStatus(portfolioData);
      }

      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setRiskStatus(riskData);
      }

      if (allocationRes.ok) {
        const allocationData = await allocationRes.json();
        setAllocations(allocationData.allocations || []);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 50) return 'text-green-400';
    if (riskScore < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            🔥 Ultimate ROI Strategy
          </h3>
          <p className="text-gray-400 text-sm">
            Dynamic Compounding + Auto-Reallocation + Leverage
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      {isActive && (
        <div className="space-y-6">
          {/* Portfolio Overview */}
          {portfolioStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Total Value</div>
                <div className="text-white font-bold">${portfolioStatus.total_value.toLocaleString()}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Daily P&L</div>
                <div className={`font-bold ${portfolioStatus.daily_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${portfolioStatus.daily_pnl.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Daily Return</div>
                <div className={`font-bold ${portfolioStatus.daily_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioStatus.daily_return.toFixed(2)}%
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Risk Score</div>
                <div className={`font-bold ${getRiskColor(portfolioStatus.risk_score)}`}>
                  {portfolioStatus.risk_score}
                </div>
              </div>
            </div>
          )}

          {/* Allocations */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-4">Portfolio Allocations</h4>
            <div className="space-y-3">
              {allocations.map((allocation, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div>
                      <div className="text-white font-medium">{allocation.asset}</div>
                      <div className="text-gray-400 text-sm">
                        ROI: {allocation.current_roi.toFixed(2)}% | 
                        Leverage: {allocation.leverage.toFixed(1)}x
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{allocation.allocation_percentage.toFixed(1)}%</div>
                    <div className={`text-sm ${getRiskColor(allocation.risk_score)}`}>
                      Risk: {allocation.risk_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Management */}
          {riskStatus && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-4">Risk Management</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Drawdown</div>
                  <div className={`font-bold ${riskStatus.daily_drawdown < 3 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {riskStatus.daily_drawdown.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Consecutive Losses</div>
                  <div className={`font-bold ${riskStatus.consecutive_losses < 2 ? 'text-green-400' : 'text-red-400'}`}>
                    {riskStatus.consecutive_losses}/{riskStatus.max_consecutive_losses}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Volatility</div>
                  <div className="text-white font-bold">{riskStatus.portfolio_volatility.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Active Positions</div>
                  <div className="text-white font-bold">{portfolioStatus?.active_positions || 0}</div>
                </div>
              </div>
              
              {/* Risk Alerts */}
              {riskStatus.risk_alerts.length > 0 && (
                <div className="space-y-2">
                  {riskStatus.risk_alerts.map((alert, index) => (
                    <div key={index} className={`p-2 rounded text-sm ${
                      alert.level === 'low' ? 'bg-green-900 text-green-300' :
                      alert.level === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compounding Status */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-4">Compounding Engine</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Status</div>
                <div className="text-green-400 font-bold">Active</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Next Reallocation</div>
                <div className="text-white font-bold">
                  {portfolioStatus?.next_reallocation ? 
                    new Date(portfolioStatus.next_reallocation).toLocaleTimeString() : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={fetchPortfolioData}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Refresh Data'}
            </button>
            <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Run Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 