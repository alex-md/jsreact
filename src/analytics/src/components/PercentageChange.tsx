import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface PercentageChangeProps {
  value: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PercentageChange: React.FC<PercentageChangeProps> = ({ 
  value, 
  showIcon = true,
  size = 'md' 
}) => {
  const isPositive = value >= 0;
  const absValue = Math.abs(value);
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return (
    <span className={`
      inline-flex items-center font-medium
      ${isPositive ? 'text-emerald-500' : 'text-rose-500'}
      ${sizeClasses[size]}
    `}>
      {showIcon && (
        isPositive 
          ? <TrendingUp className={`inline mr-1 ${iconSizes[size]}`} />
          : <TrendingDown className={`inline mr-1 ${iconSizes[size]}`} />
      )}
      {isPositive ? '+' : '-'}{absValue.toFixed(1)}%
    </span>
  );
};

export default PercentageChange;