import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size] || sizeClasses.md} 
        border-t-2 border-b-2 border-blue-500`}
      ></div>
      <span className="sr-only">Memuat...</span>
    </div>
  );
};

export default LoadingSpinner;
