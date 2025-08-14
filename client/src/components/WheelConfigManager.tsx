import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, RotateCcw, Palette, DollarSign, Gift } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';

interface PrizeTemplate {
  id?: number;
  prizeName: string;
  prizeDescription: string;
  prizeType: string;
  prizeValue: number;
  probability: number;
  color: string;
  displayOrder: number;
}

interface WheelConfigManagerProps {
  targetUserId?: number;
  targetUserName?: string;
}

const WheelConfigManager: React.FC<WheelConfigManagerProps> = ({ targetUserId, targetUserName }) => {
  const [prizes, setPrizes] = useState<PrizeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConfiguration, setHasConfiguration] = useState(false);
  const { showToast } = useToast();

  // Color options for prizes
  const colorOptions = [
    '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280',
    '#4B5563', '#374151', '#1F2937', '#FEF3C7', '#FDE68A',
    '#FCD34D', '#F59E0B', '#D97706', '#92400E', '#78350F',
    '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444',
    '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#DBEAFE',
    '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB',
    '#1D4ED8', '#1E40AF', '#1E3A8A', '#D1FAE5', '#A7F3D0',
    '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'
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
      } else {
        // Create default configuration
        setPrizes(getDefaultPrizes());
        setHasConfiguration(false);
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

  const addPrize = () => {
    const newPrize: PrizeTemplate = {
      prizeName: 'New Prize',
      prizeDescription: 'Description for new prize',
      prizeType: 'MONEY',
      prizeValue: 1,
      probability: 1,
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      displayOrder: prizes.length
    };
    setPrizes([...prizes, newPrize]);
  };

  const removePrize = (index: number) => {
    if (prizes.length <= 2) {
      showToast('You must have at least 2 prizes', 'general');
      return;
    }
    const newPrizes = prizes.filter((_, i) => i !== index);
    // Redistribute probabilities
    redistributeProbabilities(newPrizes);
  };

  const updatePrize = (index: number, field: keyof PrizeTemplate, value: any) => {
    const newPrizes = [...prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setPrizes(newPrizes);
  };

  const updateProbability = (index: number, newProbability: number) => {
    const newPrizes = [...prizes];
    const oldProbability = newPrizes[index].probability;
    const difference = newProbability - oldProbability;
    
    // Update the target prize
    newPrizes[index].probability = newProbability;
    
    // Distribute the difference among other prizes
    const otherPrizes = newPrizes.filter((_, i) => i !== index);
    const totalOtherProbability = otherPrizes.reduce((sum, prize) => sum + prize.probability, 0);
    
    if (totalOtherProbability > 0) {
      otherPrizes.forEach((prize, i) => {
        const prizeIndex = newPrizes.findIndex(p => p === prize);
        const proportionalReduction = (difference * prize.probability) / totalOtherProbability;
        newPrizes[prizeIndex].probability = Math.max(0.1, prize.probability - proportionalReduction);
      });
    }
    
    // Normalize to ensure total is 100
    normalizeProbabilities(newPrizes);
  };

  const redistributeProbabilities = (prizeList: PrizeTemplate[]) => {
    const totalProbability = prizeList.reduce((sum, prize) => sum + prize.probability, 0);
    if (totalProbability > 0) {
      prizeList.forEach(prize => {
        prize.probability = (prize.probability / totalProbability) * 100;
      });
    }
    setPrizes(prizeList);
  };

  const normalizeProbabilities = (prizeList: PrizeTemplate[]) => {
    const total = prizeList.reduce((sum, prize) => sum + prize.probability, 0);
    if (total !== 100) {
      const factor = 100 / total;
      prizeList.forEach(prize => {
        prize.probability = prize.probability * factor;
      });
    }
    setPrizes(prizeList);
  };

  const resetToDefault = () => {
    setPrizes(getDefaultPrizes());
    showToast('Reset to default configuration', 'general');
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
      
      await api.post(endpoint, { prizes });
      
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
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            {targetUserId ? `${targetUserName}'s Wheel Configuration` : 'My Wheel Configuration'}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${
            Math.abs(totalProbability - 100) < 0.1 ? 'text-green-600' : 'text-red-600'
          }`}>
            Total: {totalProbability.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {prizes.map((prize, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize Name
                </label>
                <input
                  type="text"
                  value={prize.prizeName}
                  onChange={(e) => updatePrize(index, 'prizeName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., $10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={prize.prizeDescription}
                  onChange={(e) => updatePrize(index, 'prizeDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Prize description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type & Value
                </label>
                <div className="flex space-x-2">
                  <select
                    value={prize.prizeType}
                    onChange={(e) => updatePrize(index, 'prizeType', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MONEY">Money</option>
                    <option value="GIFT">Gift</option>
                    <option value="EXPERIENCE">Experience</option>
                  </select>
                  <input
                    type="number"
                    value={prize.prizeValue}
                    onChange={(e) => updatePrize(index, 'prizeValue', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Value"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: prize.color }}
                  ></div>
                  <select
                    value={prize.color}
                    onChange={(e) => updatePrize(index, 'color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(color => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Probability: {prize.probability.toFixed(1)}%
                </label>
                <button
                  onClick={() => removePrize(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={prizes.length <= 2}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range"
                min="0.1"
                max="95"
                step="0.1"
                value={prize.probability}
                onChange={(e) => updateProbability(index, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={addPrize}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prize</span>
          </button>
          
          <button
            onClick={resetToDefault}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
        </div>
        
        <button
          onClick={saveConfiguration}
          disabled={saving || Math.abs(totalProbability - 100) > 0.1}
          className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
      
      {Math.abs(totalProbability - 100) > 0.1 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ Total probability must equal 100% to save the configuration.
          </p>
        </div>
      )}
    </div>
  );
};

export default WheelConfigManager;