import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Home,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '../../components/branding/BrandLogo';
import HeaderInfoDisplay from '../../components/layout/HeaderInfoDisplay';
import ModuleHeader from '../../components/layout/ModuleHeader';
import { apiFetch } from '../../lib/api';

const INITIAL_AUDITS = [
  { id: 'AUD-2026-01', ref: 'AUD-INT-01', refInterne: 'AFNOR-INT-01', type: 'Interne', champ: 'Air comprimé', site: 'Usine Nord', datePrevue: '2026-04-10', dateReelle: '', objectif: 'Réduire les pertes sur le réseau d’air comprimé.', equipe: ['Sarah Mansour', 'Ahmed Ben Ali'], documents: ['Plan d’audit', 'Checklist air comprimé'], constats: [] },
  { id: 'AUD-2026-02', ref: 'AUD-GLB-01', refInterne: 'AFNOR-01', type: 'Globale', champ: 'Système complet ISO 50001', site: 'Global', datePrevue: '2026-06-15', dateReelle: '', objectif: 'Préparer le renouvellement et valider la maturité globale.', equipe: ['Direction QSE', 'Équipe énergie'], documents: ['Programme d’audit', 'Matrice conformité'], constats: [] },
  { id: 'AUD-2025-12', ref: 'AUD-INT-02', refInterne: 'QSE-002', type: 'Interne', champ: 'Chaufferie', site: 'Usine Sud', datePrevue: '2025-12-01', dateReelle: '2025-12-05', objectif: 'Vérifier la conformité réglementaire.', equipe: ['Ahmed Ben Ali', 'Responsable Production'], documents: ['Rapport final'], constats: [{ id: 'CST-001', objet: 'Historique de maintenance incomplet', gravite: 'Mineure', action: 'Mettre à jour la fiche de suivi', suivi: '70%' }] },
];

const EMPTY_FORM = { ref: '', type: 'Interne', datePrevue: '', site: '', champ: '', objectif: '' };

const statusFor = (audit) => {
  if (audit.dateReelle) return { label: 'Réalisé', className: 'bg-emerald-100 text-emerald-700' };
  if (audit.datePrevue && new Date(audit.datePrevue) < new Date()) return { label: 'Retardé', className: 'bg-red-100 text-red-700' };
  return { label: 'Planifié', className: 'bg-blue-100 text-blue-700' };
};

const typeClass = (type) => type === 'Globale' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700';

const AuditsModule = ({ onBack, user }) => {
  const [audits, setAudits] = useState(INITIAL_AUDITS);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState('constats');
  const [draft, setDraft] = useState(null);

  const filteredAudits = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return audits;
    return audits.filter((audit) => [audit.ref, audit.champ, audit.site, audit.type].join(' ').toLowerCase().includes(term));
  }, [audits, search]);

  const selectedAudit = useMemo(() => audits.find((audit) => audit.id === selectedId) || null, [audits, selectedId]);

  useEffect(() => {
    let mounted = true;

    const loadAudits = async () => {
      try {
        const data = await apiFetch('/api/audits');
        if (mounted && Array.isArray(data) && data.length > 0) {
          setAudits(data);
        }
      } catch (error) {
        console.error('Erreur chargement audits:', error);
      }
    };

    loadAudits();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!draft) return { count: 0, actionRate: 0, progressRate: 0 };
    const count = draft.constats.length;
    const actionRate = count ? Math.round((draft.constats.filter((item) => item.action).length / count) * 100) : 0;
    const progressRate = count ? Math.round(draft.constats.reduce((sum, item) => sum + (parseInt(String(item.suivi || '0').replace('%', ''), 10) || 0), 0) / count) : 0;
    return { count, actionRate, progressRate };
  }, [draft]);

  const openAudit = (audit) => {
    setSelectedId(audit.id);
    setDraft(audit);
    setDetailTab('constats');
  };

  const saveDetail = async () => {
    try {
      const saved = await apiFetch(`/api/audits/${draft.id}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      setAudits((prev) => prev.map((audit) => (audit.id === saved.id ? saved : audit)));
      setDraft(saved);
    } catch (error) {
      console.error('Erreur sauvegarde audit:', error);
      setAudits((prev) => prev.map((audit) => (audit.id === draft.id ? draft : audit)));
    }
  };

  const createAudit = async (e) => {
    e.preventDefault();
    const newAudit = {
      id: `AUD-${Date.now()}`,
      ref: form.ref || `AUD-${new Date().getFullYear()}-${audits.length + 1}`,
      refInterne: `INT-${new Date().getFullYear()}-${audits.length + 1}`,
      type: form.type,
      datePrevue: form.datePrevue,
      dateReelle: '',
      site: form.site,
      champ: form.champ,
      objectif: form.objectif || 'Objectif à préciser',
      equipe: [],
      documents: [],
      constats: [],
    };
    try {
      const saved = await apiFetch('/api/audits', {
        method: 'POST',
        body: JSON.stringify(newAudit),
      });
      setAudits((prev) => [saved, ...prev.filter((audit) => audit.id !== saved.id)]);
    } catch (error) {
      console.error('Erreur création audit:', error);
      setAudits((prev) => [newAudit, ...prev]);
    }
    setForm(EMPTY_FORM);
    setShowCreate(false);
  };

  const deleteAudit = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet audit ?')) return;
    try {
      await apiFetch(`/api/audits/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Erreur suppression audit:', error);
    } finally {
      setAudits((prev) => prev.filter((audit) => audit.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDraft(null);
      }
    }
  };

  if (selectedAudit && draft) {
    const status = statusFor(draft);
    return (
      <div className="min-h-screen bg-[#f4f7fb] px-3 py-4 sm:px-4 lg:px-5">
        <div className="w-full">
          <ModuleHeader
            title="Audits et Conformité"
            subtitle="Planification, suivi et conformité du programme d'audit"
            icon={FileText}
            user={user}
            onHomeClick={onBack}
            className="mb-4"
          />
          {false && (
          <header className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 mb-4 flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => { setSelectedId(null); setDraft(null); }} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><ArrowLeft size={20} /></button>
              <BrandLogo size="h-10" />
              <div>
                <h1 className="text-sm sm:text-base font-black text-blue-900">Système de Management de l&apos;Énergie</h1>
                <p className="text-[11px] text-slate-400 font-semibold">Module QSE • Bonjour, Admin Test</p>
              </div>
            </div>
            <HeaderInfoDisplay darkText />
          </header>
          )}

          <div className="text-[11px] text-slate-400 font-bold mb-3 flex items-center gap-2">
            <button onClick={onBack} className="hover:text-blue-900">Accueil</button>
            <span>/</span>
            <button onClick={() => { setSelectedId(null); setDraft(null); }} className="hover:text-blue-900">Audits</button>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-blue-900">{draft.champ}</h2>
              <p className="text-xs text-slate-500 mt-2 font-semibold">Fiche Audit : {draft.ref} | Réf interne : {draft.refInterne} | {draft.site}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${status.className}`}>{status.label}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-5 mb-5">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-black text-blue-900 mb-5">Informations de planification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Type d&apos;audit</label>
                  <select value={draft.type} onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none">
                    <option value="Interne">Interne</option>
                    <option value="Globale">Globale</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Objectif</label>
                  <input value={draft.objectif} onChange={(e) => setDraft((prev) => ({ ...prev, objectif: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Date prévue</label>
                  <input type="date" value={draft.datePrevue} onChange={(e) => setDraft((prev) => ({ ...prev, datePrevue: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Date réelle</label>
                  <input type="date" value={draft.dateReelle} onChange={(e) => setDraft((prev) => ({ ...prev, dateReelle: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none" />
                </div>
              </div>
              <div className="mb-5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Référence / chapitre concerné</label>
                <textarea rows={4} value={draft.champ} onChange={(e) => setDraft((prev) => ({ ...prev, champ: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={saveDetail} className="bg-blue-100 hover:bg-blue-200 text-blue-900 px-5 py-2 rounded-xl text-sm font-black transition-colors">Enregistrer les infos</button>
              </div>
            </div>

            <div className="bg-[#1f3b97] rounded-3xl shadow-sm p-5 text-white">
              <h3 className="text-sm font-black mb-4">Performances de l&apos;Audit</h3>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-2xl p-4"><div className="text-[10px] uppercase tracking-wider text-blue-100 font-bold mb-2">Nombre de constats</div><div className="text-3xl font-black">{metrics.count}</div></div>
                <div className="bg-white/10 rounded-2xl p-4"><div className="text-[10px] uppercase tracking-wider text-blue-100 font-bold mb-2">Couverture actions</div><div className="text-3xl font-black">{metrics.actionRate}%</div></div>
                <div className="bg-white/10 rounded-2xl p-4"><div className="text-[10px] uppercase tracking-wider text-blue-100 font-bold mb-2">Taux réalisation global</div><div className="text-3xl font-black text-emerald-300">{metrics.progressRate}%</div></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 pt-4 border-b border-slate-100 flex flex-wrap gap-5">
              {[['constats', 'Constats et Résultats'], ['equipe', "Équipe d'Audit"], ['documents', 'Documents / PJ']].map(([id, label]) => (
                <button key={id} onClick={() => setDetailTab(id)} className={`pb-4 text-sm font-bold border-b-2 transition-colors ${detailTab === id ? 'text-blue-900 border-blue-900' : 'text-slate-400 border-transparent hover:text-slate-700'}`}>{label}</button>
              ))}
            </div>
            <div className="p-5">
              {detailTab === 'constats' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-black text-blue-900">Détail des constats</h4>
                    <button onClick={() => setDraft((prev) => ({ ...prev, constats: [...prev.constats, { id: `CST-${Date.now()}`, objet: 'Nouveau constat', gravite: 'Mineure', action: '', suivi: '0%' }] }))} className="text-xs font-black text-blue-900 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2"><Plus size={14} className="inline mr-1" />Ajouter un constat</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead><tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100"><th className="py-3 pr-4">N°</th><th className="py-3 pr-4">Objet du constat</th><th className="py-3 pr-4">Type / Gravité</th><th className="py-3 pr-4">Lien action</th><th className="py-3 pr-4">Suivi de l&apos;action</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {draft.constats.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-medium">Aucun constat enregistré pour le moment.</td></tr> : draft.constats.map((constat, index) => (
                          <tr key={constat.id}><td className="py-4 pr-4 font-black text-blue-900">{index + 1}</td><td className="py-4 pr-4 text-slate-700 font-semibold">{constat.objet}</td><td className="py-4 pr-4 text-slate-600 font-semibold">{constat.gravite}</td><td className="py-4 pr-4 text-slate-500 font-semibold">{constat.action || 'Aucune action liée'}</td><td className="py-4 pr-4 text-slate-500 font-semibold">{constat.suivi}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {detailTab === 'equipe' && <div className="space-y-3">{draft.equipe.length === 0 ? <div className="text-sm text-slate-400">Aucun membre renseigné.</div> : draft.equipe.map((member) => <div key={member} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-semibold text-slate-700 flex items-center gap-3"><Users size={16} className="text-blue-900" />{member}</div>)}</div>}
              {detailTab === 'documents' && <div className="space-y-3">{draft.documents.length === 0 ? <div className="text-sm text-slate-400">Aucun document enregistré.</div> : draft.documents.map((document) => <div key={document} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-semibold text-slate-700 flex items-center gap-3"><FileText size={16} className="text-blue-900" />{document}</div>)}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef2f7] px-3 py-4 sm:px-4 sm:py-6 lg:px-5">
      <div className="w-full">
        <ModuleHeader
          title="Audits et Conformité"
          subtitle="Planification, suivi et conformité du programme d'audit"
          icon={FileText}
          user={user}
          onHomeClick={onBack}
          className="mb-5"
        />
        <div className="text-[11px] text-slate-400 font-bold mb-5 flex items-center gap-2">
          <button onClick={onBack} className="hover:text-blue-900 flex items-center gap-1"><Home size={12} />Accueil</button>
          <span>/</span>
          <span>Audits</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-black text-blue-900">Liste des Audits</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full sm:w-[260px] bg-white rounded-2xl border border-slate-100 pl-11 pr-4 py-3 text-slate-700 font-semibold shadow-sm outline-none" />
            </div>
            <button onClick={() => setShowCreate(true)} className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl shadow-lg shadow-blue-900/20 text-sm font-black"><Plus size={18} className="inline mr-2" />Nouvel Audit</button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100"><th className="px-6 py-5 font-black">Réf / Champ</th><th className="px-6 py-5 font-black">Type</th><th className="px-6 py-5 font-black">Dates</th><th className="px-6 py-5 font-black">Site</th><th className="px-6 py-5 font-black">État</th><th className="px-6 py-5 font-black text-center">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudits.map((audit) => {
                  const status = statusFor(audit);
                  return (
                    <tr key={audit.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-6"><div className="font-black text-blue-900 text-[17px]">{audit.ref}</div><div className="text-slate-500 font-medium mt-1">{audit.champ}</div></td>
                      <td className="px-6 py-6"><span className={`px-4 py-2 rounded-full text-xs font-black ${typeClass(audit.type)}`}>{audit.type}</span></td>
                      <td className="px-6 py-6 text-slate-700"><div className="flex items-center gap-2 mb-2"><CalendarDays size={15} className="text-slate-400" /><span className="font-semibold">P: {audit.datePrevue || '-'}</span></div><div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={15} /><span className="font-semibold">R: {audit.dateReelle || '-'}</span></div></td>
                      <td className="px-6 py-6 font-semibold text-slate-700">{audit.site}</td>
                      <td className="px-6 py-6"><span className={`px-4 py-2 rounded-full text-xs font-black ${status.className}`}>{status.label}</span></td>
                      <td className="px-6 py-6"><div className="flex items-center justify-center gap-3"><button onClick={() => openAudit(audit)} className="w-11 h-11 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-700 transition-colors flex items-center justify-center" title="Voir l'audit"><Eye size={18} /></button><button onClick={() => deleteAudit(audit.id)} className="w-11 h-11 rounded-2xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center" title="Supprimer l'audit"><Trash2 size={18} /></button></div></td>
                    </tr>
                  );
                })}
                {filteredAudits.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-semibold">Aucun audit trouvé pour cette recherche.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-8 py-7 border-b border-slate-100">
                <h3 className="text-[20px] font-black text-blue-900">Planifier un Audit</h3>
                <button onClick={() => setShowCreate(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"><X size={18} /></button>
              </div>
              <form onSubmit={createAudit} className="px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div><label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Réf / Nom</label><input required value={form.ref} onChange={(e) => setForm((prev) => ({ ...prev, ref: e.target.value }))} placeholder="Ex: AUD-2027-01" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none" /></div>
                  <div><label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Type</label><select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="w-full bg-white border border-blue-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none"><option value="Interne">Interne</option><option value="Globale">Globale</option></select></div>
                  <div><label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Date prévue</label><input required type="date" value={form.datePrevue} onChange={(e) => setForm((prev) => ({ ...prev, datePrevue: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none" /></div>
                  <div><label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Site</label><input required value={form.site} onChange={(e) => setForm((prev) => ({ ...prev, site: e.target.value }))} placeholder="Ex: Usine Sud" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none" /></div>
                </div>
                <div className="mb-6"><label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Champ d&apos;audit</label><input required value={form.champ} onChange={(e) => setForm((prev) => ({ ...prev, champ: e.target.value }))} placeholder="Processus, Norme, etc." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none" /></div>
                <div className="mb-8"><label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Objectif</label><textarea rows={3} value={form.objectif} onChange={(e) => setForm((prev) => ({ ...prev, objectif: e.target.value }))} placeholder="Certification, maîtrise, amélioration..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 outline-none resize-none" /></div>
                <div className="flex justify-end gap-4"><button type="button" onClick={() => setShowCreate(false)} className="px-5 py-3 text-slate-500 font-black">Annuler</button><button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl text-sm font-black">Créer l&apos;audit</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditsModule;
