import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

function Settings() {
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [daysTogetherCount, setDaysTogetherCount] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (startDate) {
      calculateDaysTogether();
    }
  }, [startDate]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      if (response.data.relationshipStartDate) {
        setStartDate(response.data.relationshipStartDate.split('T')[0]); // Format for date input
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // If no settings exist yet, that's okay
    }
  };

  const calculateDaysTogether = () => {
    if (!startDate) return;
    
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysTogetherCount(diffDays);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/api/settings', {
        relationshipStartDate: startDate
      });
      setMessage('Settings saved successfully! ✨');
      
      // Refresh relationship info in header
      if ((window as any).refreshRelationshipInfo) {
        (window as any).refreshRelationshipInfo();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-apple-secondary-background">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-apple-blue hover:text-apple-blue/80 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-apple-blue/10 p-4 rounded-2xl">
                <Heart className="h-8 w-8 text-apple-blue" fill="currentColor" />
              </div>
            </div>
            <h1 className="font-heading text-4xl font-semibold text-apple-label mb-3">
              Relationship Settings
            </h1>
            <p className="text-apple-secondary-label text-lg">
              Customize your love story timeline
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="apple-card apple-shadow p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-apple-label mb-3">
                <Calendar className="h-5 w-5 inline mr-2 text-apple-blue" />
                When did your love story begin?
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full apple-input text-lg"
                required
              />
              <p className="text-sm text-apple-secondary-label mt-2">
                This date will be used to calculate your relationship milestones and anniversaries.
              </p>
            </div>

            {/* Days Together Preview */}
            {startDate && (
              <div className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-apple-blue mb-2">
                    {daysTogetherCount.toLocaleString()}
                  </div>
                  <div className="text-apple-secondary-label">
                    Beautiful days together ✨
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl text-center font-medium ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading || !startDate}
              className="w-full apple-button flex items-center justify-center py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-apple-tertiary-label">
            Your relationship timeline helps us celebrate your special moments and milestones together.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;