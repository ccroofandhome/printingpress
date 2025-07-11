'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { login, register, loading, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isLogin) {
      const success = await login(email, password);
      if (success) {
        router.push('/');
      }
    } else {
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      const success = await register(email, username, password, fullName);
      if (success) {
        router.push('/');
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Money Machine</h1>
          <p className="text-[#A0A0A0]">AI-Powered Trading Bot</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#181c23] rounded-xl p-8 border border-[#232837] shadow-2xl">
          {/* Toggle Buttons */}
          <div className="flex mb-6 bg-[#232837] rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                isLogin 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                !isLogin 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#232837] border border-[#2d3748] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-[#232837] border border-[#2d3748] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#232837] border border-[#2d3748] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-cyan-400 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#232837] border border-[#2d3748] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-cyan-400 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#232837] border border-[#2d3748] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold rounded-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span className="ml-2">Loading...</span>
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#A0A0A0]">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={toggleMode}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-[#666]">
            By using this service, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 