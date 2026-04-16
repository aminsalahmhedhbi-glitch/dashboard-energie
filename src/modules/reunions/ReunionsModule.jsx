import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Home,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '../../components/branding/BrandLogo';
import HeaderInfoDisplay from '../../components/layout/HeaderInfoDisplay';
import ModuleHeader from '../../components/layout/ModuleHeader';

const INITIAL_REUNIONS = [
  {
    id: 'REU-001',
    type: 'Revue de direction',
    date: '2026-04-20',
    heureDebut: '09:00',
    heureFin: '12:00',
    lieu: 'Salle A',
    site: 'Siège',
    ordreJour: 'Bilan S1, Indicateurs Énergie',
  },
];

const EMPTY_FORM = {
  type: 'Revue de direction',
  date: '',
  heureDebut: '',
  heureFin: '',
  lieu: '',
  site: 'Siège',
  ordreJour: '',
};

const formatTimeRange = (reunion) =>
  `${reunion.heureDebut || '--:--'} - ${reunion.heureFin || '--:--'}`;

const ReunionsModule = ({ onBack, user }) => {
  const [reunions, setReunions] = useState(INITIAL_REUNIONS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const sortedReunions = useMemo(
    () =>
      [...reunions].sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      ),
    [reunions]
  );

  const handleCreate = (e) => {
    e.preventDefault();
    const newReunion = {
      id: `REU-${Date.now()}`,
      type: form.type,
      date: form.date,
      heureDebut: form.heureDebut,
      heureFin: form.heureFin,
      lieu: form.lieu,
      site: form.site || 'Siège',
      ordreJour: form.ordreJour,
    };
    setReunions((prev) => [newReunion, ...prev]);
    setForm(EMPTY_FORM);
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] px-3 py-4 sm:px-4 sm:py-6 lg:px-5">
      <div className="w-full">
        <ModuleHeader
          title="Réunions"
          subtitle="Organisation des revues de direction et comités énergie"
          icon={CalendarDays}
          user={user}
          onHomeClick={onBack}
          className="mb-6"
        />
        {false && (
        <header className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 mb-6 flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <Home size={18} />
            </button>
            <BrandLogo size="h-10" />
            <div>
              <h1 className="text-sm sm:text-base font-black text-blue-900">
                Système de Management de l&apos;Énergie
              </h1>
              <p className="text-[11px] text-slate-400 font-semibold">
                Module QSE • Bonjour, Admin Test
              </p>
            </div>
          </div>
          <HeaderInfoDisplay darkText />
        </header>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-black text-blue-900">Réunions QSE</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-900/20 text-sm font-black"
          >
            <Plus size={18} className="inline mr-2" />
            Planifier une réunion
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-5 font-black">Type</th>
                  <th className="px-6 py-5 font-black">Date &amp; Heure</th>
                  <th className="px-6 py-5 font-black">Lieu / Site</th>
                  <th className="px-6 py-5 font-black">Ordre du jour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedReunions.map((reunion) => (
                  <tr key={reunion.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-8">
                      <div className="font-black text-blue-900 text-[18px]">
                        {reunion.type}
                      </div>
                    </td>
                    <td className="px-6 py-8 text-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays size={15} className="text-slate-400" />
                        <span className="font-semibold">{reunion.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock3 size={15} className="text-slate-400" />
                        <span className="font-semibold">{formatTimeRange(reunion)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-8 font-semibold text-slate-700">
                      {reunion.lieu}{' '}
                      <span className="text-slate-400">({reunion.site})</span>
                    </td>
                    <td className="px-6 py-8 font-medium text-slate-600">
                      {reunion.ordreJour}
                    </td>
                  </tr>
                ))}
                {sortedReunions.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-400 font-semibold"
                    >
                      Aucune réunion planifiée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center text-slate-400 text-xs font-medium uppercase tracking-widest mt-12">
          © 2026 ITALCAR SA • Energy Management System (BETA)
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 sm:px-7 py-6 border-b border-slate-100">
                <h3 className="text-[18px] sm:text-[20px] font-black text-blue-900">
                  Planifier une réunion
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="px-6 sm:px-7 py-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                    >
                      <option value="Revue de direction">Revue de direction</option>
                      <option value="Réunion équipe énergie">
                        Réunion équipe énergie
                      </option>
                      <option value="Réunion de suivi">Réunion de suivi</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Date
                    </label>
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Heure début
                    </label>
                    <input
                      required
                      type="time"
                      value={form.heureDebut}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          heureDebut: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Heure fin
                    </label>
                    <input
                      required
                      type="time"
                      value={form.heureFin}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, heureFin: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Lieu
                  </label>
                  <input
                    required
                    value={form.lieu}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lieu: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Ordre du jour
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.ordreJour}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ordreJour: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-5 py-3 text-slate-500 font-black"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl text-sm font-black"
                  >
                    Planifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReunionsModule;
