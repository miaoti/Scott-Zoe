import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Clock, Camera, Type, MapPin, Timer, AlertCircle, Calendar, Zap } from 'lucide-react';
import { useSurpriseBoxStore } from '../stores/surpriseBoxStore';

interface BoxCreationFormProps {
  onClose: () => void;
}

type CompletionType = 'PHOTO' | 'TASK' | 'LOCATION' | 'TIME' | 'PAYMENT';

const BoxCreationForm: React.FC<BoxCreationFormProps> = ({ onClose }) => {
  const { createBox, isLoading } = useSurpriseBoxStore();
  
  const [formData, setFormData] = useState({
    prizeName: '',
    prizeDescription: '',
    completionType: 'PHOTO' as CompletionType,
    expiresAt: '',
    taskDescription: '',
    priceAmount: 0,
    isInstantDrop: true // Default to instant drop
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const completionTypes = [
    {
      type: 'PHOTO' as CompletionType,
      icon: Camera,
      title: 'Photo Challenge',
      description: 'Recipient must take a specific photo to claim the prize'
    },
    {
      type: 'TASK' as CompletionType,
      icon: Type,
      title: 'Task Completion',
      description: 'Recipient must complete a specific task'
    },
    {
      type: 'LOCATION' as CompletionType,
      icon: MapPin,
      title: 'Location Check-in',
      description: 'Recipient must visit a specific location'
    },
    {
      type: 'TIME' as CompletionType,
      icon: Timer,
      title: 'Time Challenge',
      description: 'Recipient must wait for a specific duration'
    },

  ];

  const validateStep1 = () => {
    const errors: string[] = [];
    if (!formData.prizeName.trim()) errors.push('Prize name is required');
    if (!formData.prizeDescription.trim()) errors.push('Prize description is required');
    if (!formData.taskDescription.trim()) errors.push('Task description is required');
    return errors;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.prizeName.trim()) {
      newErrors.prizeName = 'Prize name is required';
    }
    
    if (!formData.expiresAt) {
      newErrors.expiresAt = 'Expiration time is required';
    } else {
      const expireTime = new Date(formData.expiresAt);
      const now = new Date();
      now.setHours(now.getHours() + 1); // Minimum 1 hour from now
      if (expireTime <= now) {
        newErrors.expiresAt = 'Expiration time must be at least 1 hour from now';
      }
    }
    
    if (formData.priceAmount < 0) {
      newErrors.priceAmount = 'Price cannot be negative';
    } else if (formData.priceAmount === 0) {
      newErrors.priceAmount = 'Prize price is required';
    }
    
    // Drop delay is now always 0 (immediate drop) - no validation needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const submitData = {
        ...formData
      };
      await createBox(submitData);
      onClose();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.prizeName.trim()) {
        setErrors({ prizeName: 'Prize name is required to continue' });
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Create Surprise Box</h2>
              <p className="text-sm text-gray-600">Step {step} of 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4">
          <div className="flex items-center space-x-2">
            {[1, 2].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    stepNum <= step
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 2 && (
                  <div
                    className={`flex-1 h-1 rounded transition-colors ${
                      stepNum < step ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Prize Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Prize Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prize Name *
                        </label>
                        <input
                          type="text"
                          value={formData.prizeName}
                          onChange={(e) => handleInputChange('prizeName', e.target.value)}
                          placeholder="e.g., Dinner at your favorite restaurant"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                            errors.prizeName ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.prizeName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.prizeName}</span>
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prize Description
                        </label>
                        <textarea
                          value={formData.prizeDescription}
                          onChange={(e) => handleInputChange('prizeDescription', e.target.value)}
                          placeholder="Add more details about this surprise..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prize Price *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.priceAmount || ''}
                            onChange={(e) => handleInputChange('priceAmount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                              errors.priceAmount ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {errors.priceAmount && (
                          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.priceAmount}</span>
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Recipients can pay this amount to claim the prize without completing the task
                        </p>
                      </div>



                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Task Description
                        </label>
                        <textarea
                          value={formData.taskDescription}
                          onChange={(e) => handleInputChange('taskDescription', e.target.value)}
                          placeholder="Describe the task to complete"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}



              {/* Step 2: Completion Type & Expiration */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">How should they claim it?</h3>
                    
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                      {completionTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.completionType === type.type;
                        
                        return (
                          <motion.button
                            key={type.type}
                            type="button"
                            onClick={() => handleInputChange('completionType', type.type)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 border-2 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  isSelected
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{type.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Expiration Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                        min={getMinDateTime()}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          errors.expiresAt ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.expiresAt && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.expiresAt}</span>
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        The box will drop randomly and expire if not claimed by this time
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        <Zap className="w-4 h-4 inline mr-1" />
                        Drop Timing *
                      </label>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <motion.button
                          type="button"
                          onClick={() => handleInputChange('isInstantDrop', true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 border-2 rounded-xl text-left transition-all ${
                            formData.isInstantDrop
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-lg ${
                                formData.isInstantDrop
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Zap className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">Instant Drop Enabled</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Box drops immediately and re-appears every 20 seconds until claimed
                              </p>
                            </div>
                          </div>
                        </motion.button>
                        
                        <motion.button
                          type="button"
                          onClick={() => handleInputChange('isInstantDrop', false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 border-2 rounded-xl text-left transition-all ${
                            !formData.isInstantDrop
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-lg ${
                                !formData.isInstantDrop
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">Drop Later</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                System will automatically schedule the drop within 1-7 days for surprise timing
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      </div>
                      
                      {!formData.isInstantDrop && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-green-700">
                            <Calendar className="w-5 h-5" />
                            <h3 className="font-medium">Scheduled Drop</h3>
                          </div>
                          <p className="mt-2 text-sm text-green-600">
                            The system will randomly schedule your surprise box to drop between 1-7 days from now, creating anticipation and surprise for the recipient.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={step === 1 ? onClose : prevStep}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <div className="flex items-center space-x-3">
              {step < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  )}
                  <span>{isLoading ? 'Creating...' : 'Create Box'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BoxCreationForm;