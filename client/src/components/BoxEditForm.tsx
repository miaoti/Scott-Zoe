import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useSurpriseBoxActions } from '../hooks/useSurpriseBoxActions';
import { SurpriseBox } from '../types/surpriseBox';

interface BoxEditFormProps {
  box: SurpriseBox;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BoxEditForm: React.FC<BoxEditFormProps> = ({ box, onClose, onSuccess }) => {
  const { updateBox, isLoading, error } = useSurpriseBoxActions();
  
  const [formData, setFormData] = useState({
    prizeName: box.prizeName || '',
    prizeDescription: box.prizeDescription || '',
    completionType: box.completionType || 'TASK',

    priceAmount: box.priceAmount || 0,
    taskDescription: box.taskDescription || '',
    expirationMinutes: box.expirationMinutes || 60
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBox(box.id, formData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update box:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceAmount' || name === 'expirationMinutes' ? Number(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Surprise Box</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prize Name *
            </label>
            <input
              type="text"
              name="prizeName"
              value={formData.prizeName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="What's the prize?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prize Description
            </label>
            <textarea
              name="prizeDescription"
              value={formData.prizeDescription}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Describe the prize in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Type *
            </label>
            <select
              name="completionType"
              value={formData.completionType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="TASK">Task</option>
              <option value="PHOTO">Photo</option>
              <option value="LOCATION">Location</option>
              <option value="TIME">Time-based</option>
            </select>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Amount ($)
            </label>
            <input
              type="number"
              name="priceAmount"
              value={formData.priceAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Description
            </label>
            <textarea
              name="taskDescription"
              value={formData.taskDescription}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Additional task details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration (minutes)
            </label>
            <input
              type="number"
              name="expirationMinutes"
              value={formData.expirationMinutes}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="60"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Updating...' : 'Update Box'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};