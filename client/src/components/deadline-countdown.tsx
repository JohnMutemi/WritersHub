import { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isPast } from 'date-fns';

interface DeadlineCountdownProps {
  deadline: Date | string;
  className?: string;
}

export function DeadlineCountdown({ deadline, className = '' }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    
    // Function to calculate time left
    const calculateTimeLeft = () => {
      const now = new Date();
      
      if (isPast(deadlineDate)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }
      
      // Calculate differences
      const days = differenceInDays(deadlineDate, now);
      const hours = differenceInHours(deadlineDate, now) % 24;
      const minutes = differenceInMinutes(deadlineDate, now) % 60;
      const seconds = differenceInSeconds(deadlineDate, now) % 60;
      
      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };
    
    // Calculate time immediately
    calculateTimeLeft();
    
    // Set up interval to update the countdown
    const intervalId = setInterval(calculateTimeLeft, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [deadline]);
  
  // Generate display text based on time left
  const getDisplayText = () => {
    if (timeLeft.isPast) {
      return 'Deadline passed';
    }
    
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m remaining`;
    }
    
    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s remaining`;
    }
    
    return `${timeLeft.minutes}m ${timeLeft.seconds}s remaining`;
  };
  
  // Determine color based on urgency
  const getColorClass = () => {
    if (timeLeft.isPast) {
      return 'text-destructive';
    }
    
    if (timeLeft.days === 0 && timeLeft.hours < 6) {
      return 'text-destructive font-medium';
    }
    
    if (timeLeft.days === 0) {
      return 'text-amber-500 font-medium';
    }
    
    if (timeLeft.days < 2) {
      return 'text-amber-500';
    }
    
    return 'text-green-600';
  };
  
  return (
    <span className={`${getColorClass()} ${className}`}>
      {getDisplayText()}
    </span>
  );
}