import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';

interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
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
  
  // Get memories for current month (including recurring memories from other years and spanning events)
  const monthMemories = memories.filter(memory => {
    // Backend sends dates as arrays [year, month, day]
    let memoryMonth, memoryYear;
    if (Array.isArray(memory.date)) {
      memoryMonth = memory.date[1]; // Month from array (1-indexed)
      memoryYear = memory.date[0];
    } else {
      // Fallback for string format
      const dateStr = memory.date.toString();
      const [memoryYearFromDate, memoryMonthFromDate, memoryDay] = dateStr.split('-').map(Number);
      memoryMonth = memoryMonthFromDate;
      memoryYear = memoryYearFromDate;
    }
    
    // Check if memory starts in current month
    const startsInCurrentMonth = (memoryMonth - 1) === month;
    
    // For events with endDate, also check if they span into current month
    if (memory.type === 'event' && memory.endDate) {
      let endMonth, endYear;
      if (Array.isArray(memory.endDate)) {
        endMonth = memory.endDate[1];
        endYear = memory.endDate[0];
      } else {
        const endDateStr = memory.endDate.toString();
        [endYear, endMonth] = endDateStr.split('-').map(Number);
      }
      
      // Check if event spans into current month
      const currentMonthDate = new Date(year, month, 1);
      const eventStartDate = new Date(memoryYear, memoryMonth - 1, 1);
      const eventEndDate = new Date(endYear, endMonth - 1, 31);
      
      const spansIntoCurrentMonth = eventStartDate <= currentMonthDate && eventEndDate >= currentMonthDate;
      
      return startsInCurrentMonth || spansIntoCurrentMonth;
    }
    
    // Backend months are 1-indexed, JavaScript months are 0-indexed
    return startsInCurrentMonth;
  });
  
  // Group memories by day
  const memoriesByDay: { [key: number]: Memory[] } = {};
  
  // Helper function to add memory to a specific day
  const addMemoryToDay = (day: number, memory: Memory) => {
    if (!memoriesByDay[day]) {
      memoriesByDay[day] = [];
    }
    memoriesByDay[day].push(memory);
  };
  
  monthMemories.forEach(memory => {
    let memoryDay, memoryMonth, memoryYear;
    if (Array.isArray(memory.date)) {
      memoryDay = memory.date[2]; // Day from array
      memoryMonth = memory.date[1];
      memoryYear = memory.date[0];
    } else {
      // Fallback for string format
      const dateStr = memory.date.toString();
      const [memoryYearFromDate, memoryMonthFromDate, memoryDayFromDate] = dateStr.split('-').map(Number);
      memoryDay = memoryDayFromDate;
      memoryMonth = memoryMonthFromDate;
      memoryYear = memoryYearFromDate;
    }
    
    // For EVENT type memories with endDate, add to all days in the range
    if (memory.type === 'event' && memory.endDate) {
      let endDay;
      let endMonth;
      let endYear;
      
      if (Array.isArray(memory.endDate)) {
        endDay = memory.endDate[2];
        endMonth = memory.endDate[1];
        endYear = memory.endDate[0];
      } else {
        const endDateStr = memory.endDate.toString();
        [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      }
      
      // Determine the start and end days within the current month
      let startDay, endDayInMonth;
      
      // If event starts in current month
      if ((memoryMonth - 1) === month && memoryYear === year) {
        startDay = memoryDay;
      } else {
        // Event started in a previous month, start from day 1 of current month
        startDay = 1;
      }
      
      // If event ends in current month
      if ((endMonth - 1) === month && endYear === year) {
        endDayInMonth = endDay;
      } else if (endMonth > (month + 1) || endYear > year) {
        // Event continues beyond current month, show until end of current month
        endDayInMonth = daysInMonth;
      } else {
        // Event ended before current month (shouldn't happen with our filter, but safety check)
        endDayInMonth = startDay;
      }
      
      // Add memory to all days in the range within current month
      for (let day = startDay; day <= endDayInMonth; day++) {
        addMemoryToDay(day, memory);
      }
    } else {
      // For non-event memories or events without endDate, add to single day
      // Only add if the memory actually starts in the current month
      if ((memoryMonth - 1) === month && memoryYear === year) {
        addMemoryToDay(memoryDay, memory);
      }
    }
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
      case 'event':
        return '📅';
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
          className={`h-10 md:h-16 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-all duration-200 relative overflow-hidden ${
            isToday
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-md'
              : hasMemories
              ? 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
              : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200'
          }`}
        >
          <span className={`text-sm md:text-base font-medium ${
            isToday ? 'text-white' : hasMemories ? 'text-blue-900' : 'text-gray-700'
          }`}>{day}</span>
          
          {/* Mobile: Show only dots for memories */}
          {hasMemories && (
            <div className="md:hidden flex items-center justify-center space-x-0.5 mt-1">
              {dayMemories.slice(0, 3).map((memory, index) => (
                <div
                  key={memory.id}
                  className={`w-1.5 h-1.5 rounded-full ${
                    isToday ? 'bg-white' : 'bg-blue-500'
                  }`}
                  title={memory.title}
                />
              ))}
              {dayMemories.length > 3 && (
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isToday ? 'bg-white opacity-60' : 'bg-blue-300'
                }`} />
              )}
            </div>
          )}
          
          {/* Desktop: Show memory details */}
          {hasMemories && (
            <div className="hidden md:flex flex-col items-center space-y-0.5 mt-1 w-full px-1">
              {dayMemories.slice(0, 2).map((memory, index) => (
                <div key={memory.id} className="flex items-center justify-center w-full">
                  <span className="text-xs mr-1">{getTypeIcon(memory.type)}</span>
                  <span className={`text-xs truncate max-w-12 ${
                    isToday ? 'text-white' : 'text-blue-700'
                  }`}>
                    {memory.title}
                  </span>
                </div>
              ))}
              {dayMemories.length > 2 && (
                <span className={`text-xs ${
                  isToday ? 'text-white opacity-90' : 'text-blue-500'
                }`}>
                  +{dayMemories.length - 2}
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
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs md:text-sm font-semibold text-gray-600 bg-gray-50 rounded-md">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {renderCalendarDays()}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-6 text-xs text-gray-500">
        <div className="flex items-center space-x-1.5">
          <span className="text-sm">❤️</span>
          <span className="hidden sm:inline">Anniversary</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-sm">⭐</span>
          <span className="hidden sm:inline">Milestone</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-sm">🎁</span>
          <span className="hidden sm:inline">Special Moment</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-sm">📅</span>
          <span className="hidden sm:inline">Event</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="hidden sm:inline">Today</span>
        </div>
        <div className="flex items-center space-x-1.5 md:hidden">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          <span>Has memories</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;