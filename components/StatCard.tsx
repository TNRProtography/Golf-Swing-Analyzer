
import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit }) => {
  return (
    <div className="bg-light-gray p-4 rounded-lg text-center shadow-inner">
      <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tight">
        {value}<span className="text-base font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
};
