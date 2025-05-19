import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  percentChange?: number;
  isPercentage?: boolean;
  isLargeNumber?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  percentChange,
  isPercentage = false,
  isLargeNumber = false
}) => {
  const formatNumber = (num: number): string => {
    if (isPercentage) {
      return `${num.toFixed(1)}%`;
    }

    if (isLargeNumber) {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
    }

    return num.toLocaleString();
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) {
      return 'text-emerald-500';
    } else if (change < 0) {
      return 'text-rose-500';
    }
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-gray-900">
          {formatNumber(value)}
        </p>

        {percentChange !== undefined && (
          <div className={`ml-2 flex items-center ${getChangeColor(percentChange)}`}>
            <span className="ml-1 text-sm font-medium">
              {percentChange > 0 ? (
                <TrendingUp className="inline mr-1 w-4 h-4" />
              ) : (
                <TrendingDown className="inline mr-1 w-4 h-4" />
              )}
              {Math.abs(percentChange).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {previousValue !== undefined && (
        <p className="mt-1 text-sm text-gray-500">
          Previous: {formatNumber(previousValue)}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
