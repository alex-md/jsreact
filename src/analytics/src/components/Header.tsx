import React from 'react';
import { BarChart, Eye, LineChart, TrendingUp } from 'lucide-react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-indigo-500" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
              <BarChart className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
              <LineChart className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
              <TrendingUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
