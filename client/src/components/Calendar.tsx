import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';

interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  creator: {
    name: string;
  };
  createdAt: string;
}

interface CalendarProps {
  onDayClick: (date: string, memories: Memory[]) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchMemoriesForMonth();
  }, [year, month]);

  const fetchMemoriesForMonth = async () => {
    setLoading(true);
    try {
      // For now, let's fetch all memories and filter on frontend
      // since the backend month endpoint might have issues
      const response = await api.get('/api/memories');

      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories:', error);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get memories for current month (including recurring memories from other years)
  const monthMemories = memories.filter(memory => {
    // Backend sends dates as arrays [year, month, day]
    let memoryMonth;
    if (Array.isArray(memory.date)) {
      memoryMonth = memory.date[1]; // Month from array (1-indexed)
    } else {
      // Fallback for string format
      const dateStr = memory.date.toString();
      const [memoryYear, month, memoryDay] = dateStr.split('-').map(Number);
      memoryMonth = month;
    }
    // Backend months are 1-indexed, JavaScript months are 0-indexed
    return (memoryMonth - 1) === month;
  });
  
  // Group memories by day
  const memoriesByDay: { [key: number]: Memory[] } = {};
  monthMemories.forEach(memory => {
    let memoryDay;
    if (Array.isArray(memory.date)) {
      memoryDay = memory.date[2]; // Day from array
    } else {
      // Fallback for string format
      const dateStr = memory.date.toString();
      const [memoryYear, memoryMonth, day] = dateStr.split('-').map(Number);
      memoryDay = day;
    }
    
    if (!memoriesByDay[memoryDay]) {
      memoriesByDay[memoryDay] = [];
    }
    memoriesByDay[memoryDay].push(memory);
  });
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const handleDayClick = (day: number) => {
    // Create date string directly to avoid timezone conversion issues
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayMemories = memoriesByDay[day] || [];
    onDayClick(dateString, dayMemories);
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anniversary':
        return '❤️';
      case 'milestone':
        return '⭐';
      default:
        return '🎁';
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-16"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const dayMemories = memoriesByDay[day] || [];
      const hasMemories = dayMemories.length > 0;
      
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`h-16 flex flex-col items-center justify-start cursor-pointer rounded-lg transition-colors relative p-1 ${
            isToday
              ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white font-bold shadow-lg ring-2 ring-pink-300'
              : hasMemories
              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span className="text-sm font-medium">{day}</span>
          {isToday && (
            <span className="text-xs font-semibold mt-0.5 opacity-90">Today</span>
          )}
          {hasMemories && !isToday && (
            <div className="flex flex-col items-center space-y-0.5 mt-0.5">
              {dayMemories.slice(0, 2).map((memory, index) => (
                <div key={memory.id} className="flex items-center space-x-1">
                  <span className="text-xs">{getTypeIcon(memory.type)}</span>
                  <span className="text-xs truncate max-w-12 text-purple-700">
                    {memory.title}
                  </span>
                </div>
              ))}
              {dayMemories.length > 2 && (
                <span className="text-xs text-purple-500">
                  +{dayMemories.length - 2} more
                </span>
              )}
            </div>
          )}
          {hasMemories && isToday && (
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="text-xs">{getTypeIcon(dayMemories[0].type)}</span>
              {dayMemories.length > 1 && (
                <span className="text-xs text-white opacity-90">
                  +{dayMemories.length - 1}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="glass-effect rounded-xl p-6 love-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {monthNames[month]} {year}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <span>❤️</span>
          <span>Anniversary</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>⭐</span>
          <span>Milestone</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🎁</span>
          <span>Special Moment</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;