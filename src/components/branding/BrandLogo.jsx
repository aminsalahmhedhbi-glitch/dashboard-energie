import React from 'react';
import italcarLogo from '../../assets/italcar-logo.png';

export const BrandLogo = ({ size = 'h-10' }) => (
  <img
    src={italcarLogo}
    alt="ITALCAR Logo"
    className={`${size} object-contain`}
    onError={(e) => {
      e.target.onerror = null;
      e.target.style.display = 'none';
      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
    }}
  />
);

export const FallbackLogo = () => (
  <div className="hidden items-center justify-center bg-blue-900 text-white font-black p-2 rounded text-xs">
    ITALCAR
  </div>
);

export default BrandLogo;
