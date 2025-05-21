import React, { useEffect, useState } from 'react';

interface CounterCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  duration?: number;
}

const CounterCard: React.FC<CounterCardProps> = ({ 
  title, 
  value, 
  icon,
  duration = 2000 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTimestamp: number;
    const startValue = displayValue;
    const endValue = value;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(Math.floor(startValue + (endValue - startValue) * easeOutQuart));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value, duration]);
  
  const formattedValue = new Intl.NumberFormat().format(displayValue);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center mb-3">
        {icon && <div className="text-indigo-500 mr-2">{icon}</div>}
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
      </div>
      <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
        {formattedValue}
      </p>
    </div>
  );
};

export default CounterCard;