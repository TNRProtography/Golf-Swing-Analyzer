
import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 border-4 border-golf-green-light border-t-transparent rounded-full animate-spin"></div>
      <p className="text-golf-sand font-semibold">{message}</p>
    </div>
  );
};
