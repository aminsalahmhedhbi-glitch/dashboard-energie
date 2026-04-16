import React from 'react';
import { LOGO_URL } from '../../lib/constants';

export const BrandLogo = ({ size = 'h-10' }) => (
  <img
    src={LOGO_URL}
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
