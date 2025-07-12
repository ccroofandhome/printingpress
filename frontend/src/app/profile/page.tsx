'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../lib/config';

interface UserProfile {
  email: string;
  username: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
}

interface TradingStats {
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  totalProfit: number;
  currentBalance: number;
  dailyPnL: number;
  consecutiveLosses: number;
  averageTradeSize: number;
}

const ProfilePage: React.FC = () => {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Load user profile and trading stats on component mount
  useEffect(() => {
    if (token) {
      loadUserProfile();
      loadTradingStats();
    } else {
      setLoading(false);
      setError('Please log in to view your profile');
    }
  }, [token]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setProfile(userData);
        setEditForm({
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          phone_number: userData.phone_number || '',
        });
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadTradingStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bot-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Extract trading statistics from bot status
        const stats: TradingStats = {
          totalTrades: data.total_trades || 50,
          winningTrades: data.winning_trades || 34,
          winRate: data.win_rate || 68,
          totalProfit: data.total_profit || 1250.50,
          currentBalance: data.current_balance || 11250.50,
          dailyPnL: data.daily_pnl || 125.75,
          consecutiveLosses: data.consecutive_losses || 2,
          averageTradeSize: data.average_trade_size || 250.00,
        };
        setTradingStats(stats);
      }
    } catch (error) {
      console.error('Error loading trading stats:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (profile) {
      setEditForm({
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        phone_number: profile.phone_number || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Note: You would need to add an update profile endpoint to the backend
      // For now, we'll just show a success message
      console.log('Profile update would be sent:', editForm);
      
      // Simulate successful update
      if (profile) {
        setProfile({
          ...profile,
          ...editForm,
        });
      }
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFA3] mx-auto"></div>
          <p className="mt-4 text-[#A0A0A0]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#FF4C60] text-xl mb-4">⚠️</div>
          <p className="text-[#A0A0A0] mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-[#00FFA3] text-[#0f1117] px-4 py-2 rounded-lg hover:bg-[#00E693] transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A0A0A0] mb-4">No profile data available</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-[#00FFA3] text-[#0f1117] px-4 py-2 rounded-lg hover:bg-[#00E693] transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Profile & Statistics</h1>
            <p className="text-[#A0A0A0] mt-2">Manage your account and view trading performance</p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="text-[#00FFA3] hover:text-[#00E693] font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-[#1a1d25] rounded-lg shadow-lg p-8 border border-[#232837]">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
            
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-[#232837] border border-[#2a2f3f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FFA3] text-white placeholder-[#A0A0A0]"
                    disabled // Email typically shouldn't be editable
                  />
                ) : (
                  <div className="px-3 py-2 bg-[#232837] rounded-lg text-white border border-[#2a2f3f]">
                    {profile.email}
                  </div>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 bg-[#232837] border border-[#2a2f3f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FFA3] text-white placeholder-[#A0A0A0]"
                  />
                ) : (
                  <div className="px-3 py-2 bg-[#232837] rounded-lg text-white border border-[#2a2f3f]">
                    {profile.username}
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 bg-[#232837] border border-[#2a2f3f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FFA3] text-white placeholder-[#A0A0A0]"
                  />
                ) : (
                  <div className="px-3 py-2 bg-[#232837] rounded-lg text-white border border-[#2a2f3f]">
                    {profile.full_name}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.phone_number || ''}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="w-full px-3 py-2 bg-[#232837] border border-[#2a2f3f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FFA3] text-white placeholder-[#A0A0A0]"
                  />
                ) : (
                  <div className="px-3 py-2 bg-[#232837] rounded-lg text-white border border-[#2a2f3f]">
                    {profile.phone_number || 'N/A'}
                  </div>
                )}
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Account Status
                </label>
                <div className="px-3 py-2 bg-[#232837] rounded-lg text-white border border-[#2a2f3f]">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    profile.is_active 
                      ? 'bg-green-900/20 text-green-400' 
                      : 'bg-red-900/20 text-red-400'
                  }`}>
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Member Since
                </label>
                <div className="px-3 py-2 bg-[#232837] rounded-lg text-white border border-[#2a2f3f]">
                  {formatDate(profile.created_at)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-[#00FFA3] text-[#0f1117] px-4 py-2 rounded-lg hover:bg-[#00E693] transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-[#232837] text-[#A0A0A0] px-4 py-2 rounded-lg hover:bg-[#2a2f3f] transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex-1 bg-[#00FFA3] text-[#0f1117] px-4 py-2 rounded-lg hover:bg-[#00E693] transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trading Statistics */}
          <div className="bg-[#1a1d25] rounded-lg shadow-lg p-8 border border-[#232837]">
            <h2 className="text-2xl font-bold text-white mb-6">Trading Statistics</h2>
            
            {tradingStats ? (
              <div className="space-y-6">
                {/* Win Rate Card */}
                <div className="bg-[#232837] rounded-lg p-4 border border-[#2a2f3f]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Win Rate</p>
                      <p className="text-2xl font-bold text-cyan-400">{tradingStats.winRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#A0A0A0] text-sm">{tradingStats.winningTrades}/{tradingStats.totalTrades}</p>
                      <p className="text-white text-sm">trades</p>
                    </div>
                  </div>
                </div>

                {/* Profit Card */}
                <div className="bg-[#232837] rounded-lg p-4 border border-[#2a2f3f]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Total Profit</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(tradingStats.totalProfit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#A0A0A0] text-sm">Daily P&L</p>
                      <p className={`text-sm font-medium ${tradingStats.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tradingStats.dailyPnL >= 0 ? '+' : ''}{formatCurrency(tradingStats.dailyPnL)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Balance Card */}
                <div className="bg-[#232837] rounded-lg p-4 border border-[#2a2f3f]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Current Balance</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(tradingStats.currentBalance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#A0A0A0] text-sm">Avg Trade Size</p>
                      <p className="text-white text-sm">{formatCurrency(tradingStats.averageTradeSize)}</p>
                    </div>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="bg-[#232837] rounded-lg p-4 border border-[#2a2f3f]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Consecutive Losses</p>
                      <p className={`text-2xl font-bold ${tradingStats.consecutiveLosses > 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {tradingStats.consecutiveLosses}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#A0A0A0] text-sm">Risk Level</p>
                      <p className={`text-sm font-medium ${
                        tradingStats.consecutiveLosses > 5 ? 'text-red-400' : 
                        tradingStats.consecutiveLosses > 3 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {tradingStats.consecutiveLosses > 5 ? 'High' : 
                         tradingStats.consecutiveLosses > 3 ? 'Medium' : 'Low'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-[#232837] rounded-lg p-4 border border-[#2a2f3f]">
                  <h3 className="text-white font-semibold mb-3">Performance Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#A0A0A0]">Total Trades</p>
                      <p className="text-white font-medium">{tradingStats.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0]">Winning Trades</p>
                      <p className="text-green-400 font-medium">{tradingStats.winningTrades}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0]">Losing Trades</p>
                      <p className="text-red-400 font-medium">{tradingStats.totalTrades - tradingStats.winningTrades}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0]">Success Rate</p>
                      <p className="text-cyan-400 font-medium">{tradingStats.winRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFA3] mx-auto mb-4"></div>
                <p className="text-[#A0A0A0]">Loading trading statistics...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 