import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, RotateCcw, Palette, DollarSign, Gift, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import WheelPreview from './WheelPreview';

// Custom CSS for slider styling
const sliderStyles = `
  .slider {
    -webkit-appearance: none;
    appearance: none;
    height: 12px;
    border-radius: 6px;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    background: #2563EB;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
  }
  
  .slider::-moz-range-thumb:hover {
    background: #2563EB;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

interface PrizeTemplate {
  id?: number;
  prizeName: string;
  prizeDescription: string;
  prizeType: string;
  prizeValue: number;
  probability: number;
  color: string;
  displayOrder: number;
  locked?: boolean;
}

interface WheelConfigManagerProps {
  targetUserId?: number;
  targetUserName?: string;
  onPrizesChange?: (prizes: PrizeTemplate[]) => void;
}

const WheelConfigManager: React.FC<WheelConfigManagerProps> = ({ targetUserId, targetUserName, onPrizesChange }) => {
  const [prizes, setPrizes] = useState<PrizeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConfiguration, setHasConfiguration] = useState(false);
  const [expandedPrizes, setExpandedPrizes] = useState<Set<number>>(new Set());
  const { showToast } = useToast();

  // Color options for prizes with descriptive names
  const colorOptions = [
    { value: '#F3F4F6', name: 'Light Gray' },
    { value: '#E5E7EB', name: 'Gray' },
    { value: '#D1D5DB', name: 'Medium Gray' },
    { value: '#9CA3AF', name: 'Dark Gray' },
    { value: '#6B7280', name: 'Slate Gray' },
    { value: '#4B5563', name: 'Charcoal' },
    { value: '#374151', name: 'Dark Charcoal' },
    { value: '#1F2937', name: 'Black' },
    { value: '#FEF3C7', name: 'Light Yellow' },
    { value: '#FDE68A', name: 'Pale Yellow' },
    { value: '#FCD34D', name: 'Yellow' },
    { value: '#F59E0B', name: 'Orange Yellow' },
    { value: '#D97706', name: 'Orange' },
    { value: '#92400E', name: 'Dark Orange' },
    { value: '#78350F', name: 'Brown' },
    { value: '#FEE2E2', name: 'Light Pink' },
    { value: '#FECACA', name: 'Pale Pink' },
    { value: '#FCA5A5', name: 'Pink' },
    { value: '#F87171', name: 'Rose' },
    { value: '#EF4444', name: 'Red' },
    { value: '#DC2626', name: 'Dark Red' },
    { value: '#B91C1C', name: 'Crimson' },
    { value: '#991B1B', name: 'Maroon' },
    { value: '#7F1D1D', name: 'Dark Maroon' },
    { value: '#DBEAFE', name: 'Light Blue' },
    { value: '#BFDBFE', name: 'Pale Blue' },
    { value: '#93C5FD', name: 'Sky Blue' },
    { value: '#60A5FA', name: 'Blue' },
    { value: '#3B82F6', name: 'Royal Blue' },
    { value: '#2563EB', name: 'Dark Blue' },
    { value: '#1D4ED8', name: 'Navy Blue' },
    { value: '#1E40AF', name: 'Deep Blue' },
    { value: '#1E3A8A', name: 'Midnight Blue' },
    { value: '#D1FAE5', name: 'Light Green' },
    { value: '#A7F3D0', name: 'Pale Green' },
    { value: '#6EE7B7', name: 'Mint Green' },
    { value: '#34D399', name: 'Green' },
    { value: '#10B981', name: 'Emerald' },
    { value: '#059669', name: 'Dark Green' },
    { value: '#047857', name: 'Forest Green' }
  ];

  useEffect(() => {
    loadWheelConfiguration();
  }, [targetUserId]);

  const loadWheelConfiguration = async () => {
    try {
      setLoading(true);
      const endpoint = targetUserId 
        ? `/api/wheel-config/other-user-wheel/${targetUserId}`
        : '/api/wheel-config/my-wheel';
      
      const response = await api.get(endpoint);
      
      if (response.data.hasConfiguration && response.data.prizes) {
        setPrizes(response.data.prizes.map((prize: any, index: number) => ({
          id: prize.id,
          prizeName: prize.prizeName,
          prizeDescription: prize.prizeDescription,
          prizeType: prize.prizeType,
          prizeValue: prize.prizeValue,
          probability: parseFloat(prize.probability),
          color: prize.color,
          displayOrder: prize.displayOrder || index
        })));
        setHasConfiguration(true);
        if (onPrizesChange) {
          onPrizesChange(response.data.prizes.map((prize: any, index: number) => ({
            id: prize.id,
            prizeName: prize.prizeName,
            prizeDescription: prize.prizeDescription,
            prizeType: prize.prizeType,
            prizeValue: prize.prizeValue,
            probability: parseFloat(prize.probability),
            color: prize.color,
            displayOrder: prize.displayOrder || index
          })));
        }
      } else {
        // Create default configuration
        const defaultPrizes = getDefaultPrizes();
        setPrizes(defaultPrizes);
        setHasConfiguration(false);
        if (onPrizesChange) {
          onPrizesChange(defaultPrizes);
        }
      }
    } catch (error) {
      console.error('Error loading wheel configuration:', error);
      showToast('Failed to load wheel configuration', 'general');
      setPrizes(getDefaultPrizes());
      setHasConfiguration(false);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPrizes = (): PrizeTemplate[] => [
    { prizeName: '$1', prizeDescription: 'Win $1 love points', prizeType: 'MONEY', prizeValue: 1, probability: 45, color: '#F3F4F6', displayOrder: 0 },
    { prizeName: '$5', prizeDescription: 'Win $5 love points', prizeType: 'MONEY', prizeValue: 5, probability: 25, color: '#E5E7EB', displayOrder: 1 },
    { prizeName: '$10', prizeDescription: 'Win $10 love points', prizeType: 'MONEY', prizeValue: 10, probability: 15, color: '#D1D5DB', displayOrder: 2 },
    { prizeName: '$25', prizeDescription: 'Win $25 love points', prizeType: 'MONEY', prizeValue: 25, probability: 10, color: '#9CA3AF', displayOrder: 3 },
    { prizeName: '$77', prizeDescription: 'Win $77 love points', prizeType: 'MONEY', prizeValue: 77, probability: 2.5, color: '#6B7280', displayOrder: 4 },
    { prizeName: '$100', prizeDescription: 'Win $100 love points', prizeType: 'MONEY', prizeValue: 100, probability: 1.5, color: '#4B5563', displayOrder: 5 },
    { prizeName: '$500', prizeDescription: 'Win $500 love points', prizeType: 'MONEY', prizeValue: 500, probability: 0.5, color: '#374151', displayOrder: 6 },
    { prizeName: '$1000', prizeDescription: 'Win $1000 love points', prizeType: 'MONEY', prizeValue: 1000, probability: 0.5, color: '#1F2937', displayOrder: 7 },
  ];

  const togglePrizeExpansion = (index: number) => {
    const newExpanded = new Set(expandedPrizes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPrizes(newExpanded);
  };

  const addPrize = () => {
    const newPrize: PrizeTemplate = {
      prizeName: 'New Prize',
      prizeDescription: 'Description for new prize',
      prizeType: 'MONEY',
      prizeValue: 1,
      probability: 1,
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)].value,
      displayOrder: prizes.length
    };
    const newPrizes = [...prizes, newPrize];
    setPrizes(newPrizes);
    // Auto-expand the new prize
    setExpandedPrizes(prev => new Set([...prev, prizes.length]));
    if (onPrizesChange) {
      onPrizesChange(newPrizes);
    }
  };

  const removePrize = (index: number) => {
    if (prizes.length <= 2) {
      showToast('You must have at least 2 prizes', 'general');
      return;
    }
    const newPrizes = prizes.filter((_, i) => i !== index);
    setPrizes(newPrizes);
    if (onPrizesChange) {
      onPrizesChange(newPrizes);
    }
  };

  const updatePrize = (index: number, field: keyof PrizeTemplate, value: any) => {
    const newPrizes = [...prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setPrizes(newPrizes);
    if (onPrizesChange) {
      onPrizesChange(newPrizes);
    }
  };

  const updateProbability = (index: number, newProbability: number) => {
    const newPrizes = [...prizes];
    newPrizes[index].probability = newProbability;
    setPrizes(newPrizes);
    if (onPrizesChange) {
      onPrizesChange(newPrizes);
    }
  };

  const toggleLock = (index: number) => {
    const newPrizes = [...prizes];
    newPrizes[index].locked = !newPrizes[index].locked;
    setPrizes(newPrizes);
    if (onPrizesChange) {
      onPrizesChange(newPrizes);
    }
  };



  const resetToDefault = () => {
    const defaultPrizes = getDefaultPrizes();
    setPrizes(defaultPrizes);
    showToast('Reset to default configuration', 'general');
    if (onPrizesChange) {
      onPrizesChange(defaultPrizes);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      
      // Validate probabilities sum to 100
      const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
      if (Math.abs(totalProbability - 100) > 0.1) {
        showToast('Total probability must equal 100%', 'general');
        return;
      }
      
      // Validate all fields are filled
      for (const prize of prizes) {
        if (!prize.prizeName.trim() || !prize.prizeDescription.trim() || prize.prizeValue <= 0) {
          showToast('All prize fields must be filled with valid values', 'general');
          return;
        }
      }
      
      const endpoint = targetUserId 
        ? `/api/wheel-config/save-for-user/${targetUserId}`
        : '/api/wheel-config/save';
      
      // Normalize probabilities to ensure exact 100% total
      const normalizedPrizes = [...prizes];
      const currentTotal = normalizedPrizes.reduce((sum, prize) => sum + prize.probability, 0);
      console.log('Original total probability:', currentTotal);
      
      // Always normalize to avoid any floating point issues
      const factor = 100 / currentTotal;
      normalizedPrizes.forEach(prize => {
        prize.probability = prize.probability * factor;
      });
      
      // Round to reasonable precision and ensure exact 100%
      let runningTotal = 0;
      for (let i = 0; i < normalizedPrizes.length - 1; i++) {
        normalizedPrizes[i].probability = Math.round(normalizedPrizes[i].probability * 100000000) / 100000000;
        runningTotal += normalizedPrizes[i].probability;
      }
      // Set the last prize to make total exactly 100
      normalizedPrizes[normalizedPrizes.length - 1].probability = Math.round((100 - runningTotal) * 100000000) / 100000000;
      
      const verifyTotal = normalizedPrizes.reduce((sum, prize) => sum + prize.probability, 0);
      console.log('Normalized total probability:', verifyTotal);
      
      // Wrap prizes in the expected request structure
      const requestData = {
        prizes: normalizedPrizes.map(prize => ({
          prizeName: prize.prizeName,
          prizeDescription: prize.prizeDescription,
          prizeType: prize.prizeType,
          prizeValue: prize.prizeValue,
          probability: prize.probability,
          color: prize.color
        }))
      };
      
      await api.post(endpoint, requestData);
      
      showToast(
        targetUserId 
          ? `Successfully saved wheel configuration for ${targetUserName}`
          : 'Successfully saved wheel configuration',
        'general'
      );
      setHasConfiguration(true);
    } catch (error: any) {
      console.error('Error saving wheel configuration:', error);
      showToast(
        error.response?.data?.message || 'Failed to save wheel configuration',
        'general'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {targetUserId ? `${targetUserName}'s Wheel Configuration` : 'My Wheel Configuration'}
              </h3>
              <p className="text-sm text-gray-600">Configure prizes and probabilities</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              Math.abs(totalProbability - 100) < 0.1 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              Total: {totalProbability.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Live Preview */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Live Preview
          </h4>
          <div className="flex justify-center">
            <WheelPreview prizes={prizes} size={280} />
          </div>
        </div>

        {/* Prize Configuration */}
        <div className="space-y-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Prize Configuration
          </h4>
          {prizes.map((prize, index) => {
            const isExpanded = expandedPrizes.has(index);
            return (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Prize Header - Always Visible */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => togglePrizeExpansion(index)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: prize.color }}
                  ></div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{prize.prizeName}</span>
                    <span className="text-sm text-gray-500">{prize.probability.toFixed(1)}% chance</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePrize(index);
                    }}
                    disabled={prizes.length <= 2}
                    className={`p-2 rounded-lg transition-colors ${
                      prizes.length <= 2 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                    }`}
                    title={prizes.length <= 2 ? 'Minimum 2 prizes required' : 'Remove prize'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Prize Configuration - Collapsible */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="pt-4">
                    {/* Prize Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prize Name
                  </label>
                  <input
                    type="text"
                    value={prize.prizeName}
                    onChange={(e) => updatePrize(index, 'prizeName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="e.g., $10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={prize.prizeDescription}
                    onChange={(e) => updatePrize(index, 'prizeDescription', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Prize description"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={prize.prizeType}
                    onChange={(e) => updatePrize(index, 'prizeType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="MONEY">💰 Money</option>
                    <option value="GIFT">🎁 Gift</option>
                    <option value="EXPERIENCE">✨ Experience</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="number"
                    value={prize.prizeValue}
                    onChange={(e) => updatePrize(index, 'prizeValue', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Value"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="relative">
                    <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 transition-colors"
                         onClick={() => {
                           const colorSelect = document.getElementById(`color-select-${index}`);
                           if (colorSelect) colorSelect.focus();
                         }}>
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: prize.color }}
                      ></div>
                      <span className="text-sm text-gray-700">
                        {colorOptions.find(c => c.value === prize.color)?.name || 'Custom Color'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <select
                      id={`color-select-${index}`}
                      value={prize.color}
                      onChange={(e) => updatePrize(index, 'color', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      {colorOptions.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 grid grid-cols-8 gap-1">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => updatePrize(index, 'color', color.value)}
                        className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                          prize.color === color.value ? 'border-purple-400 ring-2 ring-purple-200' : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Probability Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Probability
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleLock(index)}
                      className={`p-1 rounded transition-colors ${
                        prize.locked 
                          ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                      title={prize.locked ? 'Unlock probability' : 'Lock probability'}
                    >
                      {prize.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <span className="text-sm font-semibold text-purple-500">
                      {prize.probability.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="95"
                  step="0.1"
                  value={prize.probability}
                  onChange={(e) => updateProbability(index, parseFloat(e.target.value))}
                  disabled={prize.locked}
                  className={`w-full h-3 bg-gray-200 rounded-lg appearance-none slider ${
                    prize.locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                  style={{
                    background: `linear-gradient(to right, ${prize.color} 0%, ${prize.color} ${prize.probability}%, #e5e7eb ${prize.probability}%, #e5e7eb 100%)`
                  }}
                />                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={addPrize}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Add Prize</span>
            </button>
            
            <button
              onClick={resetToDefault}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="font-medium">Reset</span>
            </button>
            
            <button
              onClick={() => {
                const newPrizes = [...prizes];
                const lockedPrizes = newPrizes.filter(prize => prize.locked);
                const unlockedPrizes = newPrizes.filter(prize => !prize.locked);
                
                if (unlockedPrizes.length === 0) {
                  showToast('Cannot normalize: all probabilities are locked', 'general');
                  return;
                }
                
                const lockedTotal = lockedPrizes.reduce((sum, prize) => sum + prize.probability, 0);
                const remainingTotal = 100 - lockedTotal;
                
                if (remainingTotal <= 0) {
                  showToast('Cannot normalize: locked probabilities exceed 100%', 'general');
                  return;
                }
                
                const unlockedTotal = unlockedPrizes.reduce((sum, prize) => sum + prize.probability, 0);
                if (unlockedTotal > 0) {
                  const factor = remainingTotal / unlockedTotal;
                  unlockedPrizes.forEach(prize => {
                    prize.probability = prize.probability * factor;
                  });
                }
                
                setPrizes(newPrizes);
                if (onPrizesChange) {
                  onPrizesChange(newPrizes);
                }
                showToast('Probabilities normalized to 100%', 'general');
              }}
              disabled={Math.abs(totalProbability - 100) < 0.1}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md transform text-sm ${
                Math.abs(totalProbability - 100) < 0.1
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-purple-400 to-purple-500 text-white hover:from-purple-500 hover:to-purple-600 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Normalize</span>
            </button>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={saveConfiguration}
              disabled={saving || Math.abs(totalProbability - 100) > 0.1}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md transform ${
                saving || Math.abs(totalProbability - 100) > 0.1
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
        
        {/* Warning Message */}
        {Math.abs(totalProbability - 100) > 0.1 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="text-amber-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-amber-800">
                Total probability must equal 100% to save the configuration. Current total: {totalProbability.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default WheelConfigManager;