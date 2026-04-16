import React from 'react';
import { Home } from 'lucide-react';
import HeaderInfoDisplay from './HeaderInfoDisplay';

const getUserLabel = (user) => {
  if (!user) return 'Utilisateur';
  if (typeof user === 'string') return user;

  return (
    user.fullName ||
    user.name ||
    user.username ||
    user.login ||
    user.email ||
    'Utilisateur'
  );
};

const ModuleHeader = ({
  title,
  subtitle,
  icon: Icon,
  user,
  onHomeClick,
  actions = null,
  iconClassName = 'bg-blue-50 text-blue-900',
  className = '',
}) => {
  const userLabel = getUserLabel(user);

  return (
    <div
      className={`w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 ${className}`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <button
            onClick={onHomeClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            title="Accueil"
          >
            <Home className="h-5 w-5" />
          </button>

          {Icon ? (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
            >
              <Icon className="h-6 w-6" />
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black tracking-tight text-blue-900 sm:text-xl">
              {title}
            </h1>
            <div className="mt-1 break-words text-sm font-medium text-slate-500">{subtitle}</div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {actions}
            </div>
          ) : null}

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
    </div>
  );
};

export default ModuleHeader;
