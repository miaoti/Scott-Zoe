import { useState, useEffect } from 'react';
import { Gift, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface WheelOpportunitiesProps {
  onUseOpportunity?: () => void;
}

function WheelOpportunities({ onUseOpportunity }: WheelOpportunitiesProps) {
  const { user } = useAuth();
  const [savedOpportunities, setSavedOpportunities] = useState(0);
  const [canUseWheelThisWeek, setCanUseWheelThisWeek] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunityData();
  }, []);

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);
      
      // Fetch saved opportunities
      const opportunitiesResponse = await api.get('/api/opportunities/stats');
      setSavedOpportunities(opportunitiesResponse.data.unused || 0);
      
      // Fetch wheel usage status
      const wheelResponse = await api.get('/api/wheel/stats');
      setCanUseWheelThisWeek(wheelResponse.data.canUseThisWeek);
      
    } catch (error) {
      console.error('Error fetching opportunity data:', error);
      // Fallback to localStorage
      const opportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
      setSavedOpportunities(opportunities);
      
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekKey = startOfWeek.toDateString();
      const lastUsedWeek = localStorage.getItem('wheelLastUsedWeek');
      setCanUseWheelThisWeek(lastUsedWeek !== weekKey);
    } finally {
      setLoading(false);
    }
  };

  const handleUseOpportunity = () => {
    if (onUseOpportunity) {
      onUseOpportunity();
    }
  };

  if (loading) {
    return (
      <div className="apple-card apple-card-hover p-6 text-center apple-shadow transition-all duration-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
        <div className="text-sm text-apple-secondary-label">Loading...</div>
      </div>
    );
  }

  // Don't show the card if there are no saved opportunities
  if (savedOpportunities === 0) {
    return null;
  }

  return (
    <div className="apple-card apple-card-hover p-6 text-center apple-shadow transition-all duration-200 hover:scale-105 cursor-pointer group"
         onClick={canUseWheelThisWeek ? handleUseOpportunity : undefined}>
      <Gift className="h-12 w-12 text-yellow-500 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
      <div className="text-3xl font-semibold text-apple-label mb-2">{savedOpportunities}</div>
      <div className="text-apple-secondary-label group-hover:text-yellow-500 transition-colors duration-200 mb-3">
        {user?.name || user?.username || 'Your'} Saved {savedOpportunities === 1 ? 'Opportunity' : 'Opportunities'}
      </div>
      <div className="text-xs text-apple-tertiary-label mb-3">
        {canUseWheelThisWeek 
          ? 'Ready to use! Click to spin the wheel' 
          : 'Available next week after wheel resets'
        }
      </div>
      
      {canUseWheelThisWeek ? (
        <div className="flex items-center justify-center space-x-1 text-xs text-yellow-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Sparkles className="h-3 w-3" />
          <span>Use Opportunity →</span>
          <Sparkles className="h-3 w-3" />
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-1 text-xs text-orange-500 font-medium">
          <Clock className="h-3 w-3" />
          <span>Available Next Week</span>
        </div>
      )}
    </div>
  );
}

export default WheelOpportunities;