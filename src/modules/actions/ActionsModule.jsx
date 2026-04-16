import React, { useMemo, useState } from 'react';
import {
  Home,
  ListChecks,
  Plus,
  User,
  X,
} from 'lucide-react';
import { BrandLogo } from '../../components/branding/BrandLogo';
import HeaderInfoDisplay from '../../components/layout/HeaderInfoDisplay';
import ModuleHeader from '../../components/layout/ModuleHeader';

const INITIAL_ACTIONS = [
  {
    id: 'ACT-2026-001',
    designation: 'Mise à jour des variateurs',
    source: 'Audit',
    type: 'Amélioration',
    responsable: 'Jean Dupont',
    avancement: 80,
  },
  {
    id: 'ACT-2026-002',
    designation: 'Formation ISO 50001',
    source: 'Réunion',
    type: 'Corrective',
    responsable: 'Marie RH',
    avancement: 100,
  },
  {
    id: 'ACT-2026-003',
    designation: 'Refonte du TdB Énergie',
    source: 'Réunion',
    type: 'Amélioration',
    responsable: 'Admin',
    avancement: 30,
  },
];

const EMPTY_FORM = {
  designation: '',
  type: 'Corrective',
  responsable: '',
};

const typeBadgeClass = (type) =>
  type === 'Corrective'
    ? 'bg-red-50 text-red-600'
    : 'bg-violet-50 text-violet-600';

const ActionsModule = ({ onBack, user }) => {
  const [actions, setActions] = useState(INITIAL_ACTIONS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const sortedActions = useMemo(
    () => [...actions].sort((a, b) => a.id.localeCompare(b.id)),
    [actions]
  );

  const handleCreate = (e) => {
    e.preventDefault();
    const nextNumber = String(actions.length + 1).padStart(3, '0');
    const newAction = {
      id: `ACT-${new Date().getFullYear()}-${nextNumber}`,
      designation: form.designation,
      source: 'Réunion',
      type: form.type,
      responsable: form.responsable,
      avancement: 0,
    };
    setActions((prev) => [...prev, newAction]);
    setForm(EMPTY_FORM);
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <ModuleHeader
          title="Actions"
          subtitle="Pilotage du plan d'actions global et suivi PDCA"
          icon={ListChecks}
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

        <div className="text-[11px] text-slate-400 font-bold mb-4 flex items-center gap-2">
          <button onClick={onBack} className="hover:text-blue-900 flex items-center gap-1">
            <Home size={12} />
            Accueil
          </button>
          <span>/</span>
          <span>Actions</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-black text-blue-900">
            Plan d&apos;Actions Global (MGA)
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-900/20 text-sm font-black"
          >
            <Plus size={18} className="inline mr-2" />
            Nouvelle Action Globale
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-5 font-black">N° Action</th>
                  <th className="px-6 py-5 font-black">Désignation</th>
                  <th className="px-6 py-5 font-black">Source / Type</th>
                  <th className="px-6 py-5 font-black">Responsable</th>
                  <th className="px-6 py-5 font-black">Taux Réalisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedActions.map((action) => (
                  <tr key={action.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-8 font-black text-blue-900">
                      {action.id}
                    </td>
                    <td className="px-6 py-8 font-medium text-slate-700">
                      {action.designation}
                    </td>
                    <td className="px-6 py-8">
                      <div className="text-slate-500 font-medium mb-2">
                        {action.source}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black ${typeBadgeClass(
                          action.type
                        )}`}
                      >
                        {action.type}
                      </span>
                    </td>
                    <td className="px-6 py-8">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <User size={14} className="text-slate-300" />
                        {action.responsable}
                      </div>
                    </td>
                    <td className="px-6 py-8 min-w-[220px]">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2.5 rounded-full"
                            style={{ width: `${action.avancement}%` }}
                          />
                        </div>
                        <span className="font-black text-slate-700 w-12 text-right">
                          {action.avancement}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedActions.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-400 font-semibold"
                    >
                      Aucune action enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 sm:px-7 py-6 border-b border-slate-100">
                <h3 className="text-[18px] sm:text-[20px] font-black text-blue-900">
                  Nouvelle Action
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="px-6 sm:px-7 py-7">
                <div className="mb-5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Désignation
                  </label>
                  <input
                    required
                    value={form.designation}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        designation: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full bg-white border border-blue-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                    >
                      <option value="Corrective">Corrective</option>
                      <option value="Amélioration">Amélioration</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Responsable
                    </label>
                    <input
                      required
                      value={form.responsable}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          responsable: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"
                    />
                  </div>
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
                    Créer l&apos;action
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

export default ActionsModule;
