import React from 'react';
import { LogOut, Shield, TrendingUp } from 'lucide-react';
import { BrandLogo } from '../branding/BrandLogo';
import HeaderInfoDisplay from '../layout/HeaderInfoDisplay';
import { DASHBOARD_MODULES, canAccessModule } from '../../lib/constants';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bonne après-midi';
  return 'Bonsoir';
};

const MainDashboard = ({ user, onNavigate, onLogout }) => (
  <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="z-10 w-full max-w-6xl flex justify-between items-center mb-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-6">
      <div className="flex items-center gap-6">
        <BrandLogo size="h-12" />
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <h1 className="text-2xl font-black mb-0 tracking-tight text-blue-900">
            Système de Management de l&apos;Énergie
          </h1>
          <p className="text-slate-400 text-sm">
            {getGreeting()},{' '}
            <span className="text-slate-800 font-bold">{user.username}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <HeaderInfoDisplay darkText />
        <div className="bg-emerald-50 text-emerald-800 text-[10px] px-3 py-1 rounded-full font-bold border border-emerald-100 flex items-center">
          <TrendingUp size={12} className="mr-2" />
          Performance Globale en hausse
        </div>
      </div>
    </div>

    <div className="z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl w-full">
      {DASHBOARD_MODULES.map((module) => {
        const allowed = canAccessModule(user.role, module.id);
        const Icon = module.icon;

        return (
          <button
            key={module.id}
            disabled={!allowed}
            onClick={() => onNavigate(module.id)}
            className={`group relative border-2 rounded-3xl p-8 transition-all text-left bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 ${
              allowed
                ? 'border-slate-100 hover:border-blue-900'
                : 'opacity-50 cursor-not-allowed border-slate-100'
            }`}
          >
            <div
              className={`mb-6 p-4 rounded-2xl w-fit ${
                allowed
                  ? 'bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Icon size={32} />
            </div>
            <h2 className="text-xl font-black mb-2 text-slate-800 group-hover:text-blue-900">
              {module.title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {module.description}
            </p>
          </button>
        );
      })}
    </div>

    {user.role === 'ADMIN' && (
      <div className="z-10 mt-8 w-full max-w-6xl flex justify-end">
        <button
          onClick={() => onNavigate('admin')}
          className="text-slate-400 hover:text-blue-900 text-xs font-bold flex items-center transition-colors"
        >
          <Shield size={14} className="mr-1" />
          Administration
        </button>
      </div>
    )}

    <div className="mt-12 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
      © 2025 ITALCAR SA • Energy Management System (BETA)
    </div>
    <div className="absolute top-6 right-6">
      <button
        onClick={onLogout}
        className="bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 p-2 rounded-full shadow-sm transition-colors border border-slate-100"
      >
        <LogOut size={18} />
      </button>
    </div>
  </div>
);

export default MainDashboard;
