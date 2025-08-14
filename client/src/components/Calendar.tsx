import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMemoriesForMonth } from '../utils/api';

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
      const response = await getMemoriesForMonth(year, month + 1);
      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories for month:', error);
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
  
  // Get memories for current month
  const monthMemories = memories.filter(memory => {
    const memoryDate = new Date(memory.date);
    return memoryDate.getFullYear() === year && memoryDate.getMonth() === month;
  });
  
  // Group memories by day
  const memoriesByDay: { [key: number]: Memory[] } = {};
  monthMemories.forEach(memory => {
    const day = new Date(memory.date).getDate();
    if (!memoriesByDay[day]) {
      memoriesByDay[day] = [];
    }
    memoriesByDay[day].push(memory);
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
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayMemories = memoriesByDay[day] || [];
    onDayClick(dateString, dayMemories);
  };
  
  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const hasMemories = memoriesByDay[day] && memoriesByDay[day].length > 0;
      const memoryCount = memoriesByDay[day]?.length || 0;
      
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`h-12 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-colors relative ${
            isToday
              ? 'bg-pink-500 text-white font-semibold'
              : hasMemories
              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span className="text-sm">{day}</span>
          {hasMemories && (
            <div className={`absolute bottom-1 w-1 h-1 rounded-full ${
              isToday ? 'bg-white' : 'bg-purple-500'
            }`}>
              {memoryCount > 1 && (
                <span className="absolute -top-1 -right-1 text-xs font-bold">
                  {memoryCount}
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
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span>Has memories</span>
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