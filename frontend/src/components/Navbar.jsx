// src/components/Navbar.js
import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-2xl font-bold tracking-wide">
          <div className="animate-pulse flex items-center space-x-2">
            <div className="bg-blue-500 w-2.5 h-2.5 rounded-full"></div>
            <div className="bg-blue-400 w-2.5 h-2.5 rounded-full"></div>
            <div className="bg-blue-300 w-2.5 h-2.5 rounded-full"></div>
            <span>Soc-Share</span>
            <div className="bg-blue-300 w-2.5 h-2.5 rounded-full"></div>
            <div className="bg-blue-400 w-2.5 h-2.5 rounded-full"></div>
            <div className="bg-blue-500 w-2.5 h-2.5 rounded-full"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
