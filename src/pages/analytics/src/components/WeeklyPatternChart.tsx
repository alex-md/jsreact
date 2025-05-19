import React from 'react';

interface WeeklyPatternChartProps {
  data: { day: string; avgViews: number }[];
  title: string;
}

const WeeklyPatternChart: React.FC<WeeklyPatternChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.avgViews));
  const today = new Date().getDay();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-500 border border-gray-100">
      <h3 className="text-gray-700 text-xl font-semibold tracking-tight mb-8">{title}</h3>
      <div className="flex items-end justify-between h-48 gap-3">
        {data.map((item, index) => {
          const percentage = (item.avgViews / maxValue) * 100;
          const isToday = index === today;

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 group"
              title={`${item.day}: ${item.avgViews.toLocaleString()} views`}
            >
              <div className="relative w-full h-full flex items-end overflow-hidden">
                <div
                  className={`
                    relative w-full rounded-xl transition-all duration-700 ease-out-expo
                    ${isToday
                      ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/20'
                      : 'bg-gradient-to-t from-indigo-400/90 to-indigo-300/90 group-hover:from-indigo-500/90 group-hover:to-indigo-400/90'}
                    after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent
                    group-hover:scale-[1.02] origin-bottom
                  `}
                  style={{
                    height: `${percentage}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-gray-900 text-white px-2 py-1 rounded-md text-sm whitespace-nowrap">
                      {item.avgViews.toLocaleString()} views
                    </div>
                  </div>
                </div>
              </div>
              <div className={`
                text-base font-medium mt-4 mb-1 transition-colors duration-300
                ${isToday
                  ? 'text-indigo-600'
                  : 'text-gray-600 group-hover:text-indigo-500'}
              `}>
                {item.day}
              </div>
              <div className={`
                text-sm font-medium transition-colors duration-300
                ${isToday
                  ? 'text-indigo-500/70'
                  : 'text-gray-400'}
              `}>
                {item.avgViews.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPatternChart;
