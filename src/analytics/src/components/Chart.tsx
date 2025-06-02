import React, { useEffect, useRef } from 'react';

interface ChartProps {
  data: { label: string; value: number }[];
  title: string;
  height?: number;
  barColor?: string;
  highlighted?: number;
}

const Chart: React.FC<ChartProps> = ({
  data,
  title,
  height = 200,
  barColor = 'bg-indigo-500',
  highlighted = -1
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const maxValue = Math.max(...data.map(item => item.value));

  useEffect(() => {
    if (chartRef.current) {
      const bars = chartRef.current.querySelectorAll('.bar-fill');
      bars.forEach((bar, index) => {
        setTimeout(() => {
          (bar as HTMLElement).style.height = `${(data[index].value / maxValue) * 100}%`;
        }, index * 50);
      });
    }
  }, [data, maxValue]);

  return (
    <div className="bg-white  rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-4">{title}</h3>
      <div
        ref={chartRef}
        className="flex items-end justify-between h-36 gap-1"
      >
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 min-w-0">
            <div className="relative w-full h-full flex items-end">
              <div
                className={`bar-fill w-full ${highlighted === index ? 'bg-indigo-600' : barColor
                  } rounded-t transition-all duration-500 ease-out`}
                style={{ height: '0%' }}
              ></div>
            </div>
            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400 truncate">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chart;
