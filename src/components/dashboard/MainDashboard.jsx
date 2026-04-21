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

const getUserLabel = (user) => {
  if (!user) return 'Utilisateur';
  return user.fullName || user.name || user.username || 'Utilisateur';
};

const MainDashboard = ({ user, onNavigate, onLogout }) => {
  const userLabel = getUserLabel(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="z-10 w-full max-w-7xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-1.5 sm:h-20 sm:w-20 sm:p-2">
              <BrandLogo size="h-full w-full" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black tracking-tight text-blue-900 sm:text-xl">
                Système de Management de l&apos;Énergie
              </h1>
              <div className="mt-1 break-words text-sm font-medium text-slate-500">
                {getGreeting()},{' '}
                <span className="text-slate-800 font-bold">{userLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Utilisateur
              </div>
              <div className="break-words text-sm font-black text-slate-800 sm:text-base">
                {userLabel}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <HeaderInfoDisplay darkText />
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 mt-4 mb-10 flex w-full max-w-7xl flex-col items-end gap-3 sm:flex-row sm:justify-end">
        <div className="bg-emerald-50 text-emerald-800 text-[10px] px-3 py-1 rounded-full font-bold border border-emerald-100 flex items-center">
          <TrendingUp size={12} className="mr-2" />
          Performance Globale en hausse
        </div>

        {user.role === 'ADMIN' && (
          <button
            onClick={() => onNavigate('admin')}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-900"
          >
            <Shield size={14} className="mr-2" />
            Administration
          </button>
        )}

        <button
          onClick={onLogout}
          className="inline-flex items-center rounded-2xl border border-red-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 shadow-sm transition-colors hover:bg-red-50"
        >
          <LogOut size={16} className="mr-2" />
          Log-out
        </button>
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

      <div className="mt-12 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
        © 2025 ITALCAR SA • Energy Management System (BETA)
      </div>
    </div>
  );
};

export default MainDashboard;
