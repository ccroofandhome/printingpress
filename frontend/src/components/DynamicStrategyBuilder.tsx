'use client';

import React, { useState, useEffect } from 'react';

export interface StrategyParameter {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'select' | 'range' | 'string';
  value: any;
  description?: string;
  options?: string[]; // For select type
  min?: number; // For range type
  max?: number; // For range type
  step?: number; // For number/range types
  required?: boolean;
}

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  type: 'RSI' | 'Momentum' | 'Breakout' | 'Custom';
  parameters: StrategyParameter[];
  riskLevel: 'Low' | 'Medium' | 'High';
  createdAt: string;
  updatedAt: string;
}

interface DynamicStrategyBuilderProps {
  onSave: (config: StrategyConfig) => void;
  onCancel: () => void;
  initialConfig?: StrategyConfig;
}

const parameterTypes = [
  { value: 'number', label: 'Number Input' },
  { value: 'boolean', label: 'Toggle Switch' },
  { value: 'select', label: 'Dropdown' },
  { value: 'range', label: 'Range Slider' },
  { value: 'string', label: 'Text Input' },
];

const strategyTypes = [
  { value: 'RSI', label: 'RSI Strategy' },
  { value: 'Momentum', label: 'Momentum Strategy' },
  { value: 'Breakout', label: 'Breakout Strategy' },
  { value: 'Custom', label: 'Custom Strategy' },
];

const riskLevels = [
  { value: 'Low', label: 'Low Risk', color: 'text-green-400' },
  { value: 'Medium', label: 'Medium Risk', color: 'text-yellow-400' },
  { value: 'High', label: 'High Risk', color: 'text-red-400' },
];

export default function DynamicStrategyBuilder({ onSave, onCancel, initialConfig }: DynamicStrategyBuilderProps) {
  const [config, setConfig] = useState<StrategyConfig>(initialConfig || {
    id: '',
    name: '',
    description: '',
    type: 'Custom',
    parameters: [],
    riskLevel: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [showAddParameter, setShowAddParameter] = useState(false);
  const [newParameter, setNewParameter] = useState<Partial<StrategyParameter>>({
    type: 'number',
    required: false,
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addParameter = () => {
    if (!newParameter.name || !newParameter.type) return;

    const parameter: StrategyParameter = {
      id: generateId(),
      name: newParameter.name,
      type: newParameter.type as any,
      value: getDefaultValue(newParameter.type as any),
      description: newParameter.description || '',
      options: newParameter.options || [],
      min: newParameter.min,
      max: newParameter.max,
      step: newParameter.step,
      required: newParameter.required || false,
    };

    setConfig(prev => ({
      ...prev,
      parameters: [...prev.parameters, parameter],
    }));

    setNewParameter({ type: 'number', required: false });
    setShowAddParameter(false);
  };

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'number': return 0;
      case 'boolean': return false;
      case 'select': return '';
      case 'range': return 50;
      case 'string': return '';
      default: return '';
    }
  };

  const updateParameter = (id: string, updates: Partial<StrategyParameter>) => {
    setConfig(prev => ({
      ...prev,
      parameters: prev.parameters.map(param =>
        param.id === id ? { ...param, ...updates } : param
      ),
    }));
  };

  const removeParameter = (id: string) => {
    setConfig(prev => ({
      ...prev,
      parameters: prev.parameters.filter(param => param.id !== id),
    }));
  };

  const renderParameterInput = (parameter: StrategyParameter) => {
    switch (parameter.type) {
      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={parameter.value}
              onChange={(e) => updateParameter(parameter.id, { value: parseFloat(e.target.value) || 0 })}
              className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
              step={parameter.step || 1}
              min={parameter.min}
              max={parameter.max}
            />
            {parameter.step && (
              <span className="text-[#A0A0A0] text-sm">Step: {parameter.step}</span>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <button
              onClick={() => updateParameter(parameter.id, { value: !parameter.value })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                parameter.value ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  parameter.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-2 text-sm text-[#A0A0A0]">
              {parameter.value ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      case 'select':
        return (
          <select
            value={parameter.value}
            onChange={(e) => updateParameter(parameter.id, { value: e.target.value })}
            className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
          >
            <option value="">Select option</option>
            {parameter.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={parameter.min || 0}
              max={parameter.max || 100}
              step={parameter.step || 1}
              value={parameter.value}
              onChange={(e) => updateParameter(parameter.id, { value: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-[#A0A0A0]">
              <span>{parameter.min || 0}</span>
              <span className="font-semibold text-white">{parameter.value}</span>
              <span>{parameter.max || 100}</span>
            </div>
          </div>
        );

      case 'string':
        return (
          <input
            type="text"
            value={parameter.value}
            onChange={(e) => updateParameter(parameter.id, { value: e.target.value })}
            className="flex-1 bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
            placeholder="Enter text..."
          />
        );

      default:
        return null;
    }
  };

  const handleSave = () => {
    if (!config.name.trim()) {
      alert('Please enter a strategy name');
      return;
    }

    const finalConfig: StrategyConfig = {
      ...config,
      id: config.id || generateId(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalConfig);
  };

  return (
    <div className="bg-[#181c23] rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[#232837]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {initialConfig ? 'Edit Strategy' : 'Create New Strategy'}
        </h2>
        <button
          onClick={onCancel}
          className="text-[#A0A0A0] hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Basic Strategy Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Strategy Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
            placeholder="Enter strategy name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Description</label>
          <textarea
            value={config.description}
            onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
            rows={3}
            placeholder="Describe your strategy..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Strategy Type</label>
            <select
              value={config.type}
              onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
            >
              {strategyTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Risk Level</label>
            <select
              value={config.riskLevel}
              onChange={(e) => setConfig(prev => ({ ...prev, riskLevel: e.target.value as any }))}
              className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
            >
              {riskLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Parameters Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Strategy Parameters</h3>
          <button
            onClick={() => setShowAddParameter(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + Add Parameter
          </button>
        </div>

        {/* Existing Parameters */}
        <div className="space-y-4">
          {config.parameters.map((parameter) => (
            <div key={parameter.id} className="bg-[#232837] rounded-lg p-4 border border-[#2d3748]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{parameter.name}</span>
                  {parameter.required && (
                    <span className="text-red-400 text-xs">Required</span>
                  )}
                  <span className="text-[#A0A0A0] text-sm capitalize">({parameter.type})</span>
                </div>
                <button
                  onClick={() => removeParameter(parameter.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              {parameter.description && (
                <p className="text-[#A0A0A0] text-sm mb-3">{parameter.description}</p>
              )}

              {renderParameterInput(parameter)}
            </div>
          ))}

          {config.parameters.length === 0 && (
            <div className="text-center py-8 text-[#A0A0A0]">
              No parameters added yet. Click "Add Parameter" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add Parameter Modal */}
      {showAddParameter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#181c23] rounded-xl p-6 max-w-md w-full mx-4 border border-[#232837]">
            <h3 className="text-lg font-semibold text-white mb-4">Add Parameter</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Parameter Name</label>
                <input
                  type="text"
                  value={newParameter.name || ''}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
                  placeholder="e.g., RSI Threshold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Type</label>
                <select
                  value={newParameter.type}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
                >
                  {parameterTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={newParameter.description || ''}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
                  placeholder="Brief description..."
                />
              </div>

              {/* Type-specific options */}
              {newParameter.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Options (comma-separated)</label>
                  <input
                    type="text"
                    value={newParameter.options?.join(', ') || ''}
                    onChange={(e) => setNewParameter(prev => ({ 
                      ...prev, 
                      options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              {(newParameter.type === 'number' || newParameter.type === 'range') && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Min</label>
                    <input
                      type="number"
                      value={newParameter.min || ''}
                      onChange={(e) => setNewParameter(prev => ({ ...prev, min: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Max</label>
                    <input
                      type="number"
                      value={newParameter.max || ''}
                      onChange={(e) => setNewParameter(prev => ({ ...prev, max: parseFloat(e.target.value) || 100 }))}
                      className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Step</label>
                    <input
                      type="number"
                      value={newParameter.step || ''}
                      onChange={(e) => setNewParameter(prev => ({ ...prev, step: parseFloat(e.target.value) || 1 }))}
                      className="w-full bg-[#1a1d25] border border-[#2d3748] rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newParameter.required || false}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, required: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="required" className="text-sm text-white">Required parameter</label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddParameter(false)}
                className="px-4 py-2 text-[#A0A0A0] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addParameter}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Parameter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-[#A0A0A0] hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          {initialConfig ? 'Update Strategy' : 'Create Strategy'}
        </button>
      </div>
    </div>
  );
} 