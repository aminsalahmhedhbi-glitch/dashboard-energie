import React, { useState, useMemo } from 'react';
import { 
  Settings, Calendar, PenTool, Plus, AlertTriangle, 
  CheckCircle, CheckCircle2, Clock, Search, Filter, X, ShieldAlert, 
  Wrench, AlertCircle, FileText, ChevronRight, 
  MoreVertical, CalendarDays, Activity, PlayCircle, PauseCircle,
  ArrowLeft, BookOpen, HelpCircle, Factory, Building2, Zap, Trash2, MapPin, Thermometer
} from 'lucide-react';
import ModuleHeader from '../../components/layout/ModuleHeader';

// ==========================================
// 1. DONNÉES INITIALES & MOCKS
// ==========================================
const INITIAL_GAMMES = [
  {
    id: "gam-1", categorie: "Groupe électrogène", designation: "Groupe Électrogène Principal", marque: "SDMO", type: "J 130", puissance: "130 kVA",
    operations: [
      { id: "op-1", element: "Groupe", operation: "Test fonctionnement vide/charge", moyens: "Visuel", executant: "Utilisateur", intervention: "En marche", qualification: "1 Polyvalent", duree: "00:15", periodicite: "Mensuelle", execution: "Interne", note: "" },
      { id: "op-2", element: "Moteur", operation: "Niveaux huile/eau", moyens: "Visuel", executant: "Utilisateur", intervention: "À l'arrêt", qualification: "1 Polyvalent", duree: "00:05", periodicite: "Toutes les 50h", execution: "Interne", note: "" },
      { id: "op-3", element: "Moteur", operation: "Vidange huile", moyens: "Bac, Clés", executant: "Tech. habilité", intervention: "À l'arrêt", qualification: "1 Mécanicien", duree: "00:45", periodicite: "Toutes les 300h ou 1 an", execution: "Interne", note: "Récupérer huiles" },
      { id: "op-4", element: "Moteur", operation: "Réglage soupapes", moyens: "Cales", executant: "Tech. habilité", intervention: "À l'arrêt", qualification: "1 Mécanicien", duree: "02:00", periodicite: "Toutes les 500h ou 1 an / 2", execution: "Externe", note: "Garantie" }
    ]
  },
  {
    id: "gam-2", categorie: "Compresseur d'air comprimé", designation: "Compresseur Vis Principal", marque: "Atlas Copco", type: "GA 30", puissance: "30 kW",
    operations: [
      { id: "op-21", element: "Réservoir", operation: "Purge condensats", moyens: "Récipient", executant: "Utilisateur", intervention: "En marche", qualification: "1 Polyvalent", duree: "00:05", periodicite: "Mensuelle", execution: "Interne", note: "" },
      { id: "op-22", element: "Bloc", operation: "Remplacement huile/filtre", moyens: "Outils std", executant: "Tech. habilité", intervention: "À l'arrêt", qualification: "1 Mécanicien", duree: "01:30", periodicite: "Toutes les 500h ou 1 an / 2", execution: "Externe", note: "Kit 2000h" }
    ]
  },
  { id: "gam-3", categorie: "Sécheur d'air", designation: "Sécheur Frigo", marque: "-", type: "-", puissance: "-", operations: [] },
  { id: "gam-4", categorie: "Climatisation", designation: "Split / Central", marque: "-", type: "-", puissance: "-", operations: [] },
  { id: "gam-5", categorie: "Pont élevateur", designation: "Pont 2 Colonnes", marque: "-", type: "-", puissance: "-", operations: [] }
];

const INITIAL_TYPES_UTILITES = ["Éclairage", "Climatisation", "Air comprimé", "Extraction d'air", "Cuisine", "Groupe lavage", "Porte industrielle", "Levage & manutention", "Outillage", "Groupe électrogène", "Parc Info"];

const INITIAL_SITES = [
  { id: 1, codeSite: "MEG-001", typeReseau: "MT", nom: "Atelier Central Mégrine", surfaceTotale: 32500, espaceCouvert: 30100, activite: "Maintenance & Magasin", detailsSurface: [] },
  { id: 2, codeSite: "LAC-001", typeReseau: "BT", nom: "Showroom Lac", surfaceTotale: 1200, espaceCouvert: 1200, activite: "Administration & Vente", detailsSurface: [] }
];

const INITIAL_EQUIPEMENTS_UTILITES = [
  { id: 1, siteId: 1, type: "Éclairage", designation: "Spots LED Hall", ref: "LED-50W", quantite: 40, puissanceUnitaire: 50, emplacement: "Hall d'exposition" },
  { id: 2, siteId: 1, type: "Climatisation", designation: "Split Central", ref: "CLIM-10K", quantite: 4, puissanceUnitaire: 2500, emplacement: "Bureaux Admin" }
];

const INITIAL_METROLOGIE = [
  { id: "MET-001", designation: "Distributeur d'huile (compteur)", ref: "Huile N°2", marque: "RAASM", type: "Mécanique", serie: "22042003A465-0095", refCertificat: "CERT-25-089", dernierEtalonnage: "2025-04-01", frequence: 12 },
  { id: "MET-002", designation: "Manomètre pression air", ref: "P-AIR-01", marque: "WIKA", type: "Analogique", serie: "98765432", refCertificat: "CERT-24-112", dernierEtalonnage: "2024-01-10", frequence: 12 }
];

const INITIAL_PLANNING = [
  { id: 1, year: 2026, month: 3, equipement: "Compresseur Atlas Copco", operation: "Vidange 2000h", statut: "Planifié", agent: "Équipe Interne", note: "", dateRealisation: "", rapport: "", causeAnnulation: "" },
  { id: 2, year: 2026, month: 3, equipement: "Pont élévateur Zone B", operation: "Contrôle câbles", statut: "Réalisé", agent: "S. Martin", note: "Tension OK", dateRealisation: "2026-04-10", rapport: "Câbles retendus, graissage effectué. Tout est conforme.", causeAnnulation: "" },
  { id: 3, year: 2026, month: 3, equipement: "Climatisation Showroom", operation: "Nettoyage filtres", statut: "Reporté", agent: "Prestataire", note: "Repoussé au 25/04", dateRealisation: "", rapport: "", causeAnnulation: "" }
];

// ==========================================
// COMPOSANT PRINCIPAL (ROOT)
// ==========================================
export default function MaintenanceDashboard({ onBack, user }) {
  const [activeTab, setActiveTab] = useState('planning');

  // États Globaux
  const [tasks, setTasks] = useState(INITIAL_PLANNING);
  const [metroEquipments, setMetroEquipments] = useState(INITIAL_METROLOGIE);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [utilEquipements, setUtilEquipements] = useState(INITIAL_EQUIPEMENTS_UTILITES);
  const [typesEquipement, setTypesEquipement] = useState(INITIAL_TYPES_UTILITES);
  const [gammes, setGammes] = useState(INITIAL_GAMMES);

  const tabs = [
    { id: 'planning', title: 'Planning & Suivi', desc: 'Suivi Annuel', icon: CalendarDays, tag: 'PLN' },
    { id: 'gamme', title: 'Gammes Maintenance', desc: 'Procédures', icon: FileText, tag: 'GAM' },
    { id: 'metrologie', title: 'Métrologie', desc: 'Étalonnage', icon: Activity, tag: 'MET' },
    { id: 'utilites', title: 'Parc Utilités', desc: 'Inventaire technique', icon: Factory, tag: 'UTL' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] font-sans text-slate-800 pb-12">
      <div className="sticky top-0 z-40 px-4 py-3 lg:px-6">
        <ModuleHeader
          title="Gestion des Actifs Énergétiques"
          subtitle="Planning, gammes, métrologie et parc utilités multi-sites"
          icon={Wrench}
          user={user}
          onHomeClick={onBack}
          iconClassName="bg-[#1e3a8a] text-white"
          actions={
            <>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
                <BookOpen className="h-4 w-4 text-slate-400" />
                Guide
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                <HelpCircle className="h-4 w-4" />
                Aide
              </button>
            </>
          }
        />
      </div>
      {false && (
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => onBack?.()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="bg-[#1e3a8a] p-2 rounded-lg text-white"><Wrench className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 uppercase">ITALCAR <span className="font-light text-slate-500">MAINTENANCE</span></h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="bg-[#1e3a8a] text-white px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">MODULE</span>
                <span className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Multi-Sites</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center space-x-6 border-r border-slate-200 pr-6">
            <div className="flex items-center space-x-2 text-right">
              <div className="flex flex-col"><span className="text-2xl font-extrabold text-slate-800 leading-none">14.9°</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Tunis</span></div>
              <Thermometer className="h-6 w-6 text-orange-400" />
            </div>
            <div className="flex items-center space-x-2 text-right">
              <div className="flex flex-col"><span className="text-2xl font-extrabold text-slate-800 leading-none">17:12</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Mar 14 Avr.</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm"><BookOpen className="w-4 h-4 text-slate-400" /> Guide</button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-semibold hover:bg-blue-100"><HelpCircle className="w-4 h-4" /> Aide</button>
          </div>
        </div>
      </header>
      )}

      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* Grille fluide 4 colonnes pour les onglets principaux */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
          {tabs.map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`p-3 lg:p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                activeTab === tab.id ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-lg shadow-blue-900/20 transform scale-[1.02]' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:shadow-md shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2 lg:mb-4">
                <div className={`p-2 rounded-xl ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-slate-50 border border-slate-100 text-slate-600'}`}><tab.icon className="w-5 h-5 stroke-[2]" /></div>
                <span className={`text-[9px] font-extrabold px-2 py-1 rounded-md ${activeTab === tab.id ? 'bg-white text-[#1e3a8a]' : 'bg-blue-50 text-blue-700'}`}>{tab.tag}</span>
              </div>
              <h3 className="font-extrabold text-sm lg:text-base tracking-tight leading-tight">{tab.title}</h3>
              <p className={`text-[10px] lg:text-xs mt-1 font-semibold ${activeTab === tab.id ? 'text-blue-200' : 'text-slate-400'}`}>{tab.desc}</p>
            </button>
          ))}
        </div>

        <div className="animate-in fade-in duration-300">
          {activeTab === 'gamme' && <GammeView gammes={gammes} setGammes={setGammes} />}
          {activeTab === 'planning' && <PlanningView tasks={tasks} setTasks={setTasks} />}
          {activeTab === 'metrologie' && <MetrologyView equipments={metroEquipments} setEquipements={setMetroEquipments} />}
          {activeTab === 'utilites' && <UtilitiesView sites={sites} setSites={setSites} equipements={utilEquipements} setEquipements={setUtilEquipements} typesEquipement={typesEquipement} setTypesEquipement={setTypesEquipement} />}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// VUE 1 : GAMMES DÉTAILLÉES (Optimisée sans scroll horizontal)
// ==========================================
function GammeView({ gammes, setGammes }) {
  const [selectedGammeId, setSelectedGammeId] = useState(gammes[0]?.id || null);
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);

  const currentGamme = gammes.find(g => g.id === selectedGammeId) || gammes[0];

  const handleDeleteEquipment = (id) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement et toute sa gamme ?")) {
      const newGammes = gammes.filter(g => g.id !== id);
      setGammes(newGammes);
      if(selectedGammeId === id) setSelectedGammeId(newGammes[0]?.id);
    }
  };

  const handleDeleteOperation = (opId) => {
    if(window.confirm("Supprimer cette opération de la gamme ?")) {
      setGammes(gammes.map(g => {
        if(g.id === currentGamme.id) return { ...g, operations: g.operations.filter(op => op.id !== opId) };
        return g;
      }));
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-center gap-2 mb-2 w-full">
        {gammes.map(g => (
          <button 
            key={g.id} onClick={() => setSelectedGammeId(g.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedGammeId === g.id ? 'bg-[#1e3a8a] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {g.categorie}
          </button>
        ))}
        <button onClick={() => setIsEquipModalOpen(true)} className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-[#1e3a8a] border border-blue-100 hover:bg-blue-100 transition-colors flex items-center">
          <Plus className="w-3.5 h-3.5 mr-1" /> Équipement
        </button>
      </div>

      {currentGamme && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
          <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl hidden sm:block"><Settings className="w-5 h-5 text-slate-400" /></div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e3a8a] leading-tight">{currentGamme.categorie}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                    <span className="text-xs font-semibold text-slate-600"><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Désignation</span> {currentGamme.designation}</span>
                    <span className="text-xs font-semibold text-slate-600"><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Marque</span> {currentGamme.marque}</span>
                    <span className="text-xs font-semibold text-slate-600"><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Type</span> {currentGamme.type}</span>
                    <span className="text-xs font-semibold text-slate-600"><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Puissance</span> {currentGamme.puissance}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsOpModalOpen(true)} className="bg-[#1e3a8a] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm hover:bg-blue-800 transition-colors"><Plus className="w-3.5 h-3.5 mr-1" /> Opération</button>
                <button onClick={() => handleDeleteEquipment(currentGamme.id)} className="bg-white border border-red-200 text-red-500 p-1.5 rounded-lg flex items-center hover:bg-red-50 transition-colors" title="Supprimer cet équipement"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          
          {/* Tableau fluide sans overflow horizontal */}
          <div className="w-full">
            <table className="w-full text-left text-[10px] whitespace-normal table-fixed">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider w-[10%]">Élément</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider w-[18%]">Opération</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider w-[12%]">Outillage</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider w-[10%]">Exécutant</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider text-center w-[10%]">État</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider w-[10%]">Qualif.</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider text-center w-[6%]">Durée</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider text-[#1e3a8a] w-[12%]">Périodicité</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider text-center w-[7%]">Exéc.</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider text-center w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentGamme.operations.length === 0 ? (
                  <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-400 font-medium italic">Aucune opération définie.</td></tr>
                ) : (
                  currentGamme.operations.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-2 py-2.5 font-extrabold text-slate-700 bg-white group-hover:bg-transparent break-words">{row.element}</td>
                      <td className="px-2 py-2.5 text-slate-900 font-semibold leading-tight break-words">{row.operation}<div className="text-[8px] text-slate-400 font-normal mt-0.5 leading-tight">{row.note}</div></td>
                      <td className="px-2 py-2.5 text-slate-500 font-medium break-words leading-tight">{row.moyens}</td>
                      <td className="px-2 py-2.5 font-semibold text-slate-700 break-words leading-tight">{row.executant}</td>
                      <td className="px-2 py-2.5 text-center">
                        {row.intervention.includes('marche') ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><PlayCircle className="w-2.5 h-2.5 mr-0.5"/> Marche</span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><PauseCircle className="w-2.5 h-2.5 mr-0.5"/> Arrêt</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-slate-600 font-semibold leading-tight break-words">{row.qualification}</td>
                      <td className="px-2 py-2.5 text-center text-slate-500 font-mono font-bold">{row.duree}</td>
                      <td className="px-2 py-2.5 font-extrabold text-[#1e3a8a] bg-white group-hover:bg-transparent leading-tight break-words">{row.periodicite}</td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${row.execution === 'Interne' ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>{row.execution}</span>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => handleDeleteOperation(row.id)} className="text-slate-300 hover:text-red-500 p-1" title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals Ajout Gammes */}
      {isEquipModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-[#1e3a8a] uppercase tracking-wider">Ajouter un Équipement</h3>
              <button onClick={() => setIsEquipModalOpen(false)} className="p-2 bg-white rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault(); const fd = new FormData(e.target);
                const newGamme = { id: `gam-${Date.now()}`, categorie: fd.get('categorie'), designation: fd.get('designation'), marque: fd.get('marque'), type: fd.get('type'), puissance: fd.get('puissance'), operations: [] };
                setGammes([...gammes, newGamme]); setSelectedGammeId(newGamme.id); setIsEquipModalOpen(false);
              }} 
              className="p-6 space-y-4"
            >
              <div><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catégorie / Famille *</label><input required name="categorie" className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#1e3a8a]" /></div>
              <div><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Désignation technique</label><input name="designation" className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#1e3a8a]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Marque</label><input name="marque" className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#1e3a8a]" /></div>
                <div><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label><input name="type" className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#1e3a8a]" /></div>
                <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Puissance</label><input name="puissance" className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#1e3a8a]" /></div>
              </div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsEquipModalOpen(false)} className="flex-1 py-3 bg-slate-50 font-bold text-slate-600 rounded-xl hover:bg-slate-100">Annuler</button><button type="submit" className="flex-[2] py-3 bg-[#1e3a8a] text-white font-bold rounded-xl hover:bg-blue-800">Ajouter</button></div>
            </form>
          </div>
        </div>
      )}

      {isOpModalOpen && currentGamme && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div><h3 className="text-lg font-extrabold text-[#1e3a8a] uppercase tracking-wider">Nouvelle Opération</h3></div>
              <button onClick={() => setIsOpModalOpen(false)} className="p-2 bg-white rounded-lg text-slate-400"><X className="h-5 w-5"/></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault(); const fd = new FormData(e.target);
                const newOp = { id: `op-${Date.now()}`, element: fd.get('element'), operation: fd.get('operation'), moyens: fd.get('moyens'), executant: fd.get('executant'), intervention: fd.get('intervention'), qualification: `${fd.get('qte')} ${fd.get('qualifType')}`, duree: fd.get('duree'), periodicite: fd.get('periodicite'), execution: fd.get('execution'), note: fd.get('note') };
                setGammes(gammes.map(g => g.id === currentGamme.id ? { ...g, operations: [...g.operations, newOp] } : g)); setIsOpModalOpen(false);
              }} 
              className="p-5 overflow-y-auto max-h-[75vh]"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1">Élément *</label><input required name="element" className="w-full border rounded-lg p-2 text-sm" /></div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1">Durée (HH:MM) *</label><input required name="duree" placeholder="00:30" className="w-full border rounded-lg p-2 text-sm" /></div>
                <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-400 mb-1">Opération *</label><input required name="operation" className="w-full border rounded-lg p-2 text-sm" /></div>
                <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-400 mb-1">Moyens / Outillage *</label><input required name="moyens" className="w-full border rounded-lg p-2 text-sm" /></div>
                <div className="col-span-2 bg-slate-50 border p-3 rounded-xl grid grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-bold text-slate-400 mb-1">Exécutant *</label><select name="executant" className="w-full border rounded-lg p-2 text-sm bg-white"><option>Technicien habilité</option><option>Utilisateur</option></select></div>
                  <div><label className="block text-[11px] font-bold text-slate-400 mb-1">Exécution *</label><select name="execution" className="w-full border rounded-lg p-2 text-sm bg-white"><option>Interne</option><option>Externe</option></select></div>
                  <div className="col-span-2 flex gap-2">
                    <div className="flex-1"><label className="block text-[11px] font-bold text-slate-400 mb-1">Qté *</label><input type="number" required defaultValue="1" name="qte" className="w-full border rounded-lg p-2 text-sm" /></div>
                    <div className="flex-[2]"><label className="block text-[11px] font-bold text-slate-400 mb-1">Type Qualif. *</label><select name="qualifType" className="w-full border rounded-lg p-2 text-sm bg-white"><option>Mécanicien(s)</option><option>Électricien(s)</option><option>Polyvalent(s)</option></select></div>
                  </div>
                </div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1">Intervention *</label><select name="intervention" className="w-full border rounded-lg p-2 text-sm bg-white"><option>À l'arrêt</option><option>En marche</option></select></div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1">Périodicité *</label><input required name="periodicite" placeholder="Ex: Mensuelle" className="w-full border rounded-lg p-2 text-sm bg-white" /></div>
                <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-400 mb-1">Note (Optionnel)</label><input name="note" className="w-full border rounded-lg p-2 text-sm" /></div>
              </div>
              <div className="pt-4 mt-2 flex gap-3"><button type="button" onClick={() => setIsOpModalOpen(false)} className="flex-1 py-2 bg-slate-100 font-bold rounded-xl">Annuler</button><button type="submit" className="flex-[2] py-2 bg-[#1e3a8a] text-white font-bold rounded-xl">Ajouter</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// VUE 2 : PLANNING & TRAÇABILITÉ
// ==========================================
function PlanningView({ tasks, setTasks }) {
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const currentMonthIndex = new Date().getMonth(); 
  const currentYear = new Date().getFullYear() || 2026;
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, task: null }); 
  const [newTask, setNewTask] = useState({ equipement: '', operation: '', agent: '', note: '', month: currentMonthIndex, year: currentYear });
  const [actionData, setActionData] = useState({ dateRealisation: '', rapport: '', causeAnnulation: '' });

  const monthTasks = tasks.filter(t => t.month === selectedMonth && t.year === selectedYear);

  const handleStatusChangeRequest = (task, newStatus) => {
    if (newStatus === 'Réalisé') {
      setActionData({ dateRealisation: new Date().toISOString().split('T')[0], rapport: '', causeAnnulation: '' });
      setActionModal({ isOpen: true, type: 'realiser', task });
    } else if (newStatus === 'Annulé') {
      setActionData({ dateRealisation: '', rapport: '', causeAnnulation: '' });
      setActionModal({ isOpen: true, type: 'annuler', task });
    } else {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, statut: newStatus } : t));
    }
  };

  const confirmAction = (e) => {
    e.preventDefault();
    const updatedTask = { ...actionModal.task, statut: actionModal.type === 'realiser' ? 'Réalisé' : 'Annulé', ...actionData };
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setActionModal({ isOpen: false, type: null, task: null });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    setTasks([...tasks, { ...newTask, id: Date.now(), statut: 'Planifié', dateRealisation: '', rapport: '', causeAnnulation: '', month: parseInt(newTask.month), year: parseInt(newTask.year) }]);
    setIsAddOpen(false);
    setNewTask({ equipement: '', operation: '', agent: '', note: '', month: selectedMonth, year: selectedYear });
  };

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'Réalisé': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Reporté': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Annulé': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200'; 
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-[#1e3a8a]"><Calendar className="w-5 h-5" /></div>
          <div><h3 className="text-sm font-bold text-slate-800">Calendrier des Interventions</h3><p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Filtres et planification</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-1">
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-slate-800 text-xs sm:text-sm font-bold px-2 sm:px-3 py-1.5 outline-none cursor-pointer border-r border-slate-200">{[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-[#1e3a8a] text-xs sm:text-sm font-bold px-2 sm:px-3 py-1.5 outline-none cursor-pointer">{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          </div>
          <button onClick={() => { setNewTask({...newTask, month: selectedMonth, year: selectedYear}); setIsAddOpen(true); }} className="bg-[#1e3a8a] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Planifier</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm lg:text-lg font-bold text-slate-800">Interventions pour {months[selectedMonth]} {selectedYear}</h3>
          <span className="bg-white text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">{monthTasks.length} Tâche(s)</span>
        </div>
        {monthTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400"><CheckCircle className="w-12 h-12 mx-auto text-slate-200 mb-3 stroke-[1]" /><p className="font-medium text-sm text-slate-500">Aucune intervention planifiée sur ce mois.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {monthTasks.map(task => (
              <div key={task.id} className="p-4 lg:p-6 hover:bg-slate-50/50 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2.5 rounded-xl border mt-1 ${getStatusColor(task.statut)}`}>
                      {task.statut === 'Réalisé' ? <CheckCircle className="w-5 h-5" /> : task.statut === 'Reporté' ? <Clock className="w-5 h-5" /> : task.statut === 'Annulé' ? <X className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2"><h4 className="text-sm lg:text-base font-bold text-slate-900">{task.operation}</h4><span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getStatusColor(task.statut)}`}>{task.statut}</span></div>
                      <p className="text-xs lg:text-sm text-slate-500 mt-1 font-medium break-words">{task.equipement}</p>
                      {task.note && <p className="text-[10px] lg:text-xs text-slate-400 mt-1.5 font-medium flex items-center gap-1.5"><FileText className="w-3 h-3"/> Note : {task.note}</p>}
                      
                      {task.statut === 'Réalisé' && task.rapport && (
                        <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col md:flex-row gap-4 w-full">
                           <div className="md:w-1/4"><span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 block mb-0.5">Date exacte</span><span className="text-xs font-semibold text-emerald-900">{new Date(task.dateRealisation).toLocaleDateString('fr-FR')}</span></div>
                           <div className="flex-1"><span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 block mb-0.5">Rapport de réalisation</span><span className="text-xs font-medium text-emerald-800 leading-relaxed break-words">{task.rapport}</span></div>
                        </div>
                      )}
                      {task.statut === 'Annulé' && task.causeAnnulation && (
                        <div className="mt-3 bg-red-50/50 border border-red-100 rounded-xl p-3 w-full"><span className="text-[9px] font-bold uppercase tracking-widest text-red-600 block mb-0.5">Justificatif d'annulation</span><span className="text-xs font-medium text-red-800 leading-relaxed break-words">{task.causeAnnulation}</span></div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 w-full md:w-auto md:min-w-[150px] border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Exécutant</p>
                      <p className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-block">{task.agent}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={task.statut} onChange={(e) => handleStatusChangeRequest(task, e.target.value)} className="text-xs font-bold rounded-lg px-2 py-1.5 border border-slate-200 outline-none cursor-pointer bg-white hover:bg-slate-50 transition-colors shadow-sm"><option value="Planifié">Planifier</option><option value="Réalisé">Clôturer (Réalisé)</option><option value="Reporté">Reporter</option><option value="Annulé">Annuler</option></select>
                      {task.statut !== 'Annulé' && <button onClick={() => handleStatusChangeRequest(task, 'Annulé')} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Supprimer / Annuler"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><div><h3 className="text-base font-extrabold text-[#1e3a8a] uppercase tracking-wider">Planification</h3></div><button onClick={() => setIsAddOpen(false)} className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4"/></button></div>
            <form onSubmit={handleAddTask} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Équipement concerné *</label><input type="text" required value={newTask.equipement} onChange={e => setNewTask({...newTask, equipement: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
                <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opération *</label><input type="text" required value={newTask.operation} onChange={e => setNewTask({...newTask, operation: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Période *</label><div className="flex bg-slate-50 rounded-lg border p-1"><select value={newTask.month} onChange={(e) => setNewTask({...newTask, month: e.target.value})} className="w-full bg-transparent text-xs font-bold px-1 py-1 border-r">{months.map((m, i) => <option key={i} value={i}>{m.substring(0,3)}</option>)}</select><select value={newTask.year} onChange={(e) => setNewTask({...newTask, year: e.target.value})} className="w-full bg-transparent text-xs font-bold px-1 py-1">{[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exécutant *</label><input type="text" required value={newTask.agent} onChange={e => setNewTask({...newTask, agent: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
              </div>
              <div className="pt-4 border-t flex gap-2"><button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-2.5 bg-slate-50 border text-slate-600 font-bold rounded-lg text-sm">Annuler</button><button type="submit" className="flex-[2] py-2.5 bg-[#1e3a8a] text-white font-bold rounded-lg text-sm">Planifier</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Actions */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
            <div className={`p-5 border-b flex justify-between items-center ${actionModal.type === 'realiser' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
              <div><h3 className={`text-base font-extrabold uppercase tracking-wider ${actionModal.type === 'realiser' ? 'text-emerald-800' : 'text-red-800'}`}>{actionModal.type === 'realiser' ? 'Clôturer' : 'Annuler'}</h3></div>
              <button onClick={() => setActionModal({isOpen: false, type: null, task: null})} className="p-1.5 bg-white rounded-lg"><X className="h-4 w-4 text-slate-400"/></button>
            </div>
            <form onSubmit={confirmAction} className="p-5 space-y-4">
              {actionModal.type === 'realiser' ? (
                <><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date exécution *</label><input type="date" required value={actionData.dateRealisation} onChange={e => setActionData({...actionData, dateRealisation: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rapport *</label><textarea required rows="3" value={actionData.rapport} onChange={e => setActionData({...actionData, rapport: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm resize-none"></textarea></div></>
              ) : (
                <div><div className="flex gap-2 bg-red-50 p-3 rounded-lg mb-3 border border-red-100"><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-[11px] text-red-800 font-medium">Justificatif obligatoire.</p></div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cause *</label><textarea required rows="3" value={actionData.causeAnnulation} onChange={e => setActionData({...actionData, causeAnnulation: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm resize-none"></textarea></div>
              )}
              <div className="pt-2 flex gap-2"><button type="button" onClick={() => setActionModal({isOpen: false, type: null, task: null})} className="flex-1 py-2.5 bg-slate-50 border text-slate-600 font-bold rounded-lg text-sm">Retour</button><button type="submit" className={`flex-[2] py-2.5 text-white font-bold rounded-lg text-sm flex justify-center items-center gap-2 ${actionModal.type === 'realiser' ? 'bg-emerald-600' : 'bg-red-600'}`}>{actionModal.type === 'realiser' ? 'Valider' : 'Confirmer'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// VUE 3 : MÉTROLOGIE (Tableau fluide sans scroll)
// ==========================================
function MetrologyView({ equipments, setEquipements }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ designation: '', ref: '', marque: '', type: '', serie: '', refCertificat: '', dernierEtalonnage: '', frequence: 12 });
  const [updateData, setUpdateData] = useState({ id: '', refCertificat: '', dernierEtalonnage: '' });

  const calculateMetrologyStatus = (lastDate, freqMonths) => {
    const last = new Date(lastDate);
    const next = new Date(last.setMonth(last.getMonth() + parseInt(freqMonths)));
    const today = new Date(); 
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'danger', text: 'Dépassé', date: next.toLocaleDateString('fr-FR') };
    if (diffDays <= 30) return { status: 'warning', text: `Dans ${diffDays} j`, date: next.toLocaleDateString('fr-FR') };
    return { status: 'success', text: 'Conforme', date: next.toLocaleDateString('fr-FR') };
  };

  const handleAddEquipment = (e) => {
    e.preventDefault();
    const newEq = { ...formData, id: `MET-00${equipments.length + 1}`, frequence: parseInt(formData.frequence) };
    setEquipements([...equipments, newEq]);
    setIsAddModalOpen(false);
    setFormData({ designation: '', ref: '', marque: '', type: '', serie: '', refCertificat: '', dernierEtalonnage: '', frequence: 12 });
  };

  const handleDeleteEquipment = (id) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement de métrologie ?")) {
      setEquipements(equipements.filter(e => e.id !== id));
    }
  };

  const handleUpdateCertificat = (e) => {
    e.preventDefault();
    setEquipements(equipements.map(eq => 
        eq.id === updateData.id 
            ? { ...eq, refCertificat: updateData.refCertificat, dernierEtalonnage: updateData.dernierEtalonnage } 
            : eq
    ));
    setIsUpdateModalOpen(false);
  };

  const stats = useMemo(() => {
    let ok = 0, warn = 0, danger = 0;
    equipments.forEach(eq => {
      const s = calculateMetrologyStatus(eq.dernierEtalonnage, eq.frequence).status;
      if (s === 'success') ok++;
      else if (s === 'warning') warn++;
      else danger++;
    });
    return { ok, warn, danger, total: equipments.length };
  }, [equipments]);

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white p-3 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><p className="text-slate-400 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-1">Parc Total</p><p className="text-xl lg:text-3xl font-black text-slate-800">{stats.total}</p></div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 lg:p-3.5 rounded-xl"><Settings className="text-slate-500 w-5 h-5" /></div>
        </div>
        <div className="bg-white p-3 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
          <div><p className="text-slate-400 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-1">Conformes</p><p className="text-xl lg:text-3xl font-black text-slate-800">{stats.ok}</p></div>
          <div className="bg-emerald-50 border border-emerald-100 p-2.5 lg:p-3.5 rounded-xl"><CheckCircle className="text-emerald-600 w-5 h-5" /></div>
        </div>
        <div className="bg-white p-3 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-400"></div>
          <div><p className="text-slate-400 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-1">Bientôt</p><p className="text-xl lg:text-3xl font-black text-slate-800">{stats.warn}</p></div>
          <div className="bg-orange-50 border border-orange-100 p-2.5 lg:p-3.5 rounded-xl"><AlertTriangle className="text-orange-500 w-5 h-5" /></div>
        </div>
        <div className="bg-white p-3 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
          <div><p className="text-slate-400 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-1">Hors Délai</p><p className="text-xl lg:text-3xl font-black text-slate-800">{stats.danger}</p></div>
          <div className="bg-red-50 border border-red-100 p-2.5 lg:p-3.5 rounded-xl"><ShieldAlert className="text-red-600 w-5 h-5" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
        <div className="p-4 lg:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div><h3 className="text-base lg:text-lg font-bold text-slate-800">Registre Métrologique</h3></div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-[#1e3a8a] hover:bg-blue-900 text-white px-3 py-2 rounded-xl text-xs lg:text-sm font-bold flex items-center gap-1 shadow-sm transition-all">
            <Plus className="w-4 h-4" /> Nouvel équip.
          </button>
        </div>
        
        {/* Tableau fluide, pas de nowrap */}
        <div className="w-full">
          <table className="w-full text-left text-[10px] lg:text-xs whitespace-normal table-fixed break-words">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-2 py-3 font-bold uppercase tracking-wider w-[8%]">N° Id.</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider w-[16%]">Équipement & Marque</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider w-[10%]">Type</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider w-[12%]">N° Série</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider w-[12%]">Réf. Certificat</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider w-[14%]">Dernier Cert. & Freq.</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider w-[10%]">Échéance</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider text-center w-[10%]">Statut</th>
                <th className="px-2 py-3 font-bold uppercase tracking-wider text-center w-[8%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipments.map((eq) => {
                const result = calculateMetrologyStatus(eq.dernierEtalonnage, eq.frequence);
                return (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-2 py-2.5 font-black text-slate-800 break-all">{eq.ref}</td>
                    <td className="px-2 py-2.5 leading-tight"><div className="font-bold text-slate-900">{eq.designation}</div><div className="text-slate-500 text-[9px] mt-0.5">{eq.marque}</div></td>
                    <td className="px-2 py-2.5 text-slate-600 font-medium leading-tight">{eq.type || '-'}</td>
                    <td className="px-2 py-2.5 text-slate-500 font-mono text-[9px] font-semibold break-all">{eq.serie}</td>
                    <td className="px-2 py-2.5 text-[#1e3a8a] font-bold text-[10px] break-all">{eq.refCertificat || '-'}</td>
                    <td className="px-2 py-2.5 text-slate-700 font-medium leading-tight">{new Date(eq.dernierEtalonnage).toLocaleDateString('fr-FR')} <span className="text-slate-400 block text-[9px]">({eq.frequence}m)</span></td>
                    <td className="px-2 py-2.5 font-bold text-[#1e3a8a]">{result.date}</td>
                    <td className="px-2 py-2.5 text-center">
                      {result.status === 'success' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-2.5 h-2.5 mr-0.5" /> {result.text}</span>}
                      {result.status === 'warning' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-100"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> {result.text}</span>}
                      {result.status === 'danger' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700 border border-red-100"><AlertCircle className="w-2.5 h-2.5 mr-0.5" /> {result.text}</span>}
                    </td>
                    <td className="px-2 py-2.5 text-center flex items-center justify-center gap-1 flex-wrap">
                      <button onClick={() => { setUpdateData({ id: eq.id, refCertificat: eq.refCertificat || '', dernierEtalonnage: eq.dernierEtalonnage }); setIsUpdateModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Mettre à jour le certificat"><PenTool className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteEquipment(eq.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer l'équipement"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><div className="bg-blue-100 p-1.5 rounded-lg text-[#1e3a8a]"><Plus className="w-4 h-4"/></div> Nouvel équipement</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Désignation</label><input required type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">N° Id. (Réf.)</label><input required type="text" value={formData.ref} onChange={e => setFormData({...formData, ref: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Marque</label><input required type="text" value={formData.marque} onChange={e => setFormData({...formData, marque: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Type</label><input type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">N° de série</label><input required type="text" value={formData.serie} onChange={e => setFormData({...formData, serie: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm font-mono" /></div>
                <div className="col-span-2 pt-2 pb-1"><h4 className="text-xs font-bold text-[#1e3a8a] uppercase border-b pb-1">Étalonnage Initial</h4></div>
                <div className="col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Réf. Certificat</label><input type="text" value={formData.refCertificat} onChange={e => setFormData({...formData, refCertificat: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label><input required type="date" value={formData.dernierEtalonnage} onChange={e => setFormData({...formData, dernierEtalonnage: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Périodicité</label><select required value={formData.frequence} onChange={e => setFormData({...formData, frequence: e.target.value})} className="w-full border rounded-xl p-2.5 text-sm bg-white"><option value="6">6 Mois</option><option value="12">12 Mois (1 an)</option><option value="24">24 Mois (2 ans)</option></select></div>
              </div>
              <div className="pt-4 mt-2 flex gap-2"><button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-slate-50 font-bold rounded-xl text-sm">Annuler</button><button type="submit" className="flex-[2] py-2.5 bg-[#1e3a8a] text-white font-bold rounded-xl text-sm">Sauvegarder</button></div>
            </form>
          </div>
        </div>
      )}

      {isUpdateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#1e3a8a] flex items-center gap-2"><PenTool className="w-4 h-4"/> MAJ Étalonnage</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 p-1 bg-white rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateCertificat} className="p-5 space-y-4">
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nouvelle Réf. Certificat</label><input required type="text" value={updateData.refCertificat} onChange={e => setUpdateData({...updateData, refCertificat: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date du certificat</label><input required type="date" value={updateData.dernierEtalonnage} onChange={e => setUpdateData({...updateData, dernierEtalonnage: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
              <div className="pt-2 flex gap-2"><button type="button" onClick={() => setIsUpdateModalOpen(false)} className="flex-1 py-2 bg-slate-50 font-bold rounded-lg text-sm">Annuler</button><button type="submit" className="flex-[2] py-2 bg-[#1e3a8a] text-white font-bold rounded-lg text-sm">Valider</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// VUE 4 : PARC UTILITÉS
// ==========================================
function UtilitiesView({ sites, setSites, equipements, setEquipements, typesEquipement, setTypesEquipement }) {
  const [currentView, setCurrentView] = useState('global');
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  const statsSites = useMemo(() => {
    return sites.map(site => {
      const siteEqs = equipements.filter(eq => eq.siteId === site.id);
      const puissanceTotale = siteEqs.reduce((acc, eq) => acc + (eq.quantite * eq.puissanceUnitaire), 0);
      return { ...site, countEquipements: siteEqs.length, puissanceTotale };
    });
  }, [sites, equipements]);

  const goGlobal = () => { setCurrentView('global'); setSelectedSiteId(null); };
  const goDetail = (siteId) => { setSelectedSiteId(siteId); setCurrentView('detail'); };
  
  const selectedSite = sites.find(s => s.id === selectedSiteId);
  const siteEquipements = equipements.filter(e => e.siteId === selectedSiteId);

  const handleAddEquipement = (newEq) => setEquipements([...equipements, { ...newEq, id: Date.now() }]);
  const handleDeleteEquipement = (id) => { if(window.confirm("Supprimer cet équipement ?")) setEquipements(equipements.filter(e => e.id !== id)); };
  
  const handleAddSite = (newSite) => setSites([...sites, { ...newSite, id: Date.now() }]);
  const handleDeleteSite = (id) => {
    if(window.confirm("Attention : Supprimer ce site supprimera aussi TOUS ses équipements. Continuer ?")) {
      setSites(sites.filter(s => s.id !== id));
      setEquipements(equipements.filter(e => e.siteId !== id));
      if(selectedSiteId === id) goGlobal();
    }
  };

  const handleAddType = (newType) => { if (newType.trim() && !typesEquipement.includes(newType.trim())) setTypesEquipement([...typesEquipement, newType.trim()]); };
  const handleDeleteType = (typeToRemove) => {
    if(window.confirm(`Voulez-vous supprimer le type "${typeToRemove}" ?`)) setTypesEquipement(typesEquipement.filter(t => t !== typeToRemove));
  };

  return (
    <div className="animate-in fade-in duration-300 w-full">
      {currentView === 'global' ? (
        <UtilitesGlobalView sites={statsSites} onSelectSite={goDetail} onAdd={handleAddEquipement} typesEquipement={typesEquipement} onOpenSettings={() => setCurrentView('settings')} />
      ) : currentView === 'detail' ? (
        <UtilitesSiteDetailView site={selectedSite} equipements={siteEquipements} onSelectSite={goDetail} onAdd={handleAddEquipement} onDelete={handleDeleteEquipement} allSites={sites} typesEquipement={typesEquipement} onBack={goGlobal}/>
      ) : (
        <UtilitesSettingsView sites={sites} typesEquipement={typesEquipement} onAddSite={handleAddSite} onDeleteSite={handleDeleteSite} onAddType={handleAddType} onDeleteType={handleDeleteType} onBack={goGlobal} />
      )}
    </div>
  );
}

function SiteHorizontalList({ sites, selectedId, onSelect }) {
  return (
    <div className="flex space-x-3 overflow-x-auto pb-3 pt-1 no-scrollbar w-full">
      {sites.map(s => {
        const isActive = s.id === selectedId;
        const isMT = s.typeReseau === "MT";
        return (
          <div 
            key={s.id} onClick={() => onSelect(s.id)}
            className={`min-w-[200px] flex-shrink-0 p-3 rounded-xl cursor-pointer transition-all border ${
              isActive ? 'bg-[#1e3a8a] text-white border-transparent shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                {isMT ? <Activity className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wider ${isActive ? 'bg-white text-[#1e3a8a]' : (isMT ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500')}`}>
                {s.typeReseau}
              </span>
            </div>
            <div className="font-extrabold text-[13px] leading-tight mb-1">{s.nom}</div>
            <div className={`text-[10px] font-semibold ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{s.codeSite}</div>
          </div>
        );
      })}
    </div>
  );
}

function UtilitesGlobalView({ sites, onSelectSite, onAdd, typesEquipement, onOpenSettings }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalPowerGlobal = sites.reduce((acc, s) => acc + s.puissanceTotale, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">
            <Activity className="h-3.5 w-3.5" /> Vue d'ensemble
          </div>
          <h2 className="text-xl lg:text-3xl font-extrabold text-[#1e3a8a]">Tableau de Bord Énergétique</h2>
        </div>
        <div className="flex flex-wrap items-stretch gap-3">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex flex-col justify-center text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Puissance Installée</p>
            <p className="text-xl lg:text-2xl font-extrabold text-slate-800">{(totalPowerGlobal / 1000).toFixed(2)} <span className="text-sm text-slate-400">kW</span></p>
          </div>
          <button onClick={onOpenSettings} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl flex items-center text-xs lg:text-sm font-bold shadow-sm"><Settings className="w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">Paramètres</span></button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-3 py-2 rounded-xl flex items-center text-xs lg:text-sm font-bold shadow-md"><Plus className="w-4 h-4 lg:mr-1" /> <span className="hidden lg:inline">Nouvel Équipement</span></button>
        </div>
      </div>
      <div className="mb-2 flex items-center text-slate-400 font-bold text-[10px] uppercase tracking-wider"><MapPin className="h-3.5 w-3.5 mr-1" /> Sélectionner un site</div>
      <SiteHorizontalList sites={sites} selectedId={null} onSelect={onSelectSite} />
      {isModalOpen && <AddEquipementModal sites={sites} defaultSiteId={sites[0]?.id} typesEquipement={typesEquipement} onClose={() => setIsModalOpen(false)} onSave={(data) => { onAdd(data); setIsModalOpen(false); }} />}
    </div>
  );
}

function UtilitesSiteDetailView({ site, equipements, onSelectSite, onAdd, onDelete, allSites, typesEquipement, onBack }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const totalPower = equipements.reduce((acc, eq) => acc + (eq.quantite * eq.puissanceUnitaire), 0);
  const filteredEqs = equipements.filter(eq => eq.designation.toLowerCase().includes(searchTerm.toLowerCase()) || eq.type.toLowerCase().includes(searchTerm.toLowerCase()) || eq.emplacement.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 w-full">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 shadow-sm"><ArrowLeft className="h-4 w-4"/></button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retour</span>
      </div>
      <SiteHorizontalList sites={allSites} selectedId={site.id} onSelect={onSelectSite} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
            <div className="p-4 lg:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center text-slate-500 font-extrabold tracking-widest text-[10px] lg:text-xs uppercase"><Zap className="h-4 w-4 text-[#1e3a8a] mr-1.5" /> ÉQUIPEMENTS & UTILITÉS</div>
              <div className="flex items-center space-x-2">
                <div className="relative hidden sm:block">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                  <input type="text" placeholder="Rechercher..." className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#1e3a8a] text-white px-3 py-1.5 rounded-lg flex items-center shadow-sm text-xs font-bold"><Plus className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ajouter</span></button>
              </div>
            </div>
            <div className="w-full">
              <table className="w-full text-left text-[10px] lg:text-xs whitespace-normal table-fixed break-words">
                <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-3 font-bold uppercase tracking-wider w-[15%]">Type</th>
                    <th className="px-3 py-3 font-bold uppercase tracking-wider w-[25%]">Désignation</th>
                    <th className="px-3 py-3 font-bold uppercase tracking-wider w-[15%]">Emplacement</th>
                    <th className="px-3 py-3 font-bold uppercase tracking-wider text-center w-[10%]">Qté</th>
                    <th className="px-3 py-3 font-bold uppercase tracking-wider text-right w-[12%]">Unit. (W)</th>
                    <th className="px-3 py-3 font-bold uppercase tracking-wider text-right text-[#1e3a8a] w-[15%]">Total (W)</th>
                    <th className="px-3 py-3 text-center w-[8%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEqs.length > 0 ? filteredEqs.map(eq => (
                    <tr key={eq.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-3 py-2.5"><span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[9px] border">{eq.type}</span></td>
                      <td className="px-3 py-2.5 font-bold text-slate-800 leading-tight">{eq.designation}<div className="text-[9px] font-normal text-slate-400 mt-0.5">Réf: {eq.ref || '-'}</div></td>
                      <td className="px-3 py-2.5 text-slate-500 font-medium leading-tight">{eq.emplacement}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-700 bg-slate-50/50">{eq.quantite}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{eq.puissanceUnitaire.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-[#1e3a8a] bg-blue-50/30">{(eq.quantite * eq.puissanceUnitaire).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-center"><button onClick={() => onDelete(eq.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  )) : (<tr><td colSpan="7" className="px-3 py-8 text-center text-slate-400 italic">Aucun équipement trouvé.</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 p-4 border-t flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Total partiel site</span><span className="text-lg font-extrabold text-[#1e3a8a]">{(totalPower / 1000).toFixed(2)} kW</span></div>
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative overflow-hidden">
            <Building2 className="absolute -right-6 -top-6 h-40 w-40 text-slate-50 opacity-80 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div><div className="text-[#1e3a8a] font-extrabold text-xs tracking-wider uppercase mb-1">FICHE TECHNIQUE</div><div className="text-slate-400 text-[10px] font-semibold">{site.nom}</div></div>
                <div className="text-slate-300 font-light text-xs">{site.codeSite}</div>
              </div>
              <div className="flex justify-between items-baseline mb-4"><span className="text-slate-500 text-xs font-semibold">Surface Totale</span><div className="text-right"><span className="text-xl font-extrabold text-slate-800">{site.surfaceTotale.toLocaleString()}</span><span className="text-[10px] font-bold text-slate-400 ml-1">m²</span></div></div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold text-[#1e3a8a] uppercase">Espace Couvert</span><span className="font-extrabold text-sm text-slate-800">{site.espaceCouvert.toLocaleString()} m²</span></div>
                {site.detailsSurface && site.detailsSurface.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200">{site.detailsSurface.map((zone) => (<div key={zone.id} className="flex justify-between items-center text-[10px] font-semibold text-slate-500"><span>• {zone.nom}</span><span>{zone.surface.toLocaleString()} m²</span></div>))}</div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end"><div className="text-[10px] font-bold text-slate-400 uppercase">Puissance Active</div><div className="text-2xl font-extrabold text-[#1e3a8a]">{(totalPower / 1000).toFixed(2)} <span className="text-[10px] text-[#1e3a8a] font-bold uppercase">kW</span></div></div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && <AddEquipementModal sites={allSites} defaultSiteId={site.id} typesEquipement={typesEquipement} onClose={() => setIsModalOpen(false)} onSave={(data) => { onAdd(data); setIsModalOpen(false); }} />}
    </div>
  );
}

function UtilitesSettingsView({ sites, typesEquipement, onAddSite, onDeleteSite, onAddType, onDeleteType, onBack }) {
  const [newSite, setNewSite] = useState({ nom: '', codeSite: '', typeReseau: 'MT', surfaceTotale: 0, espaceCouvert: 0, activite: '', detailsSurface: [] });
  const [newZone, setNewZone] = useState({ nom: '', surface: 0 });
  const [newType, setNewType] = useState('');

  const handleAddZone = () => { if(newZone.nom && newZone.surface > 0) { setNewSite({ ...newSite, detailsSurface: [...newSite.detailsSurface, { ...newZone, id: Date.now() }] }); setNewZone({ nom: '', surface: 0 }); } };
  const handleRemoveZone = (zoneId) => setNewSite({ ...newSite, detailsSurface: newSite.detailsSurface.filter(z => z.id !== zoneId) });
  const handleSiteSubmit = (e) => { e.preventDefault(); if(newSite.nom && newSite.codeSite) { onAddSite(newSite); setNewSite({ nom: '', codeSite: '', typeReseau: 'MT', surfaceTotale: 0, espaceCouvert: 0, activite: '', detailsSurface: [] }); } };
  const handleTypeSubmit = (e) => { e.preventDefault(); if(newType) { onAddType(newType); setNewType(''); } };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 w-full">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 shadow-sm"><ArrowLeft className="h-4 w-4"/></button>
        <span className="flex items-center space-x-1.5 text-slate-400 font-bold text-xs uppercase tracking-wider"><Settings className="h-4 w-4" /> Configuration Avancée</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50"><h3 className="font-extrabold text-[#1e3a8a] text-sm">Référentiel des Sites</h3></div>
          <div className="p-5">
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {sites.map(s => (
                <div key={s.id} className="p-3 rounded-xl border flex justify-between items-center hover:bg-slate-50">
                  <div><div className="flex items-center gap-2 mb-0.5"><span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${s.typeReseau === 'MT' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>{s.typeReseau}</span><span className="text-[10px] font-bold text-slate-400">{s.codeSite}</span></div><p className="font-bold text-slate-800 text-xs">{s.nom}</p></div>
                  <button onClick={() => onDeleteSite(s.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-md"><Trash2 className="h-3.5 w-3.5"/></button>
                </div>
              ))}
            </div>
            <form onSubmit={handleSiteSubmit} className="bg-slate-50 p-4 rounded-xl border space-y-3">
              <div className="text-slate-500 font-bold text-[10px] uppercase mb-1">Nouveau Site</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><input type="text" placeholder="Nom du site *" required value={newSite.nom} onChange={e => setNewSite({...newSite, nom: e.target.value})} className="w-full border rounded-lg p-2 text-xs font-semibold" /></div>
                <div><select value={newSite.typeReseau} onChange={e => setNewSite({...newSite, typeReseau: e.target.value})} className="w-full border rounded-lg p-2 text-xs font-bold bg-white"><option value="MT">MT</option><option value="BT">BT</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Code *" required value={newSite.codeSite} onChange={e => setNewSite({...newSite, codeSite: e.target.value})} className="w-full border rounded-lg p-2 text-xs font-semibold" />
                <input type="text" placeholder="Activité" value={newSite.activite} onChange={e => setNewSite({...newSite, activite: e.target.value})} className="w-full border rounded-lg p-2 text-xs font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required placeholder="Surf. Totale (m²)" value={newSite.surfaceTotale || ''} onChange={e => setNewSite({...newSite, surfaceTotale: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-xs font-semibold" />
                <input type="number" placeholder="Esp. Couvert (m²)" value={newSite.espaceCouvert || ''} onChange={e => setNewSite({...newSite, espaceCouvert: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-xs font-semibold" />
              </div>
              <button type="submit" className="w-full bg-[#1e3a8a] text-white py-2 rounded-lg text-xs font-bold mt-2">Enregistrer</button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50"><h3 className="font-extrabold text-[#1e3a8a] text-sm">Nomenclature Utilités</h3></div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto">
              {typesEquipement.map(type => (
                <div key={type} className="bg-slate-50 text-slate-700 font-semibold text-[10px] px-2 py-1.5 rounded-lg flex items-center border">
                  <span>{type}</span><button onClick={() => onDeleteType(type)} className="ml-2 text-slate-300 hover:text-red-500"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <form onSubmit={handleTypeSubmit} className="bg-slate-50 p-4 rounded-xl border">
               <div className="text-slate-500 font-bold text-[10px] uppercase mb-2">Nouvelle Famille</div>
              <div className="flex gap-2">
                <input type="text" placeholder="Ex: Pompe à chaleur" required value={newType} onChange={e => setNewType(e.target.value)} className="flex-1 border rounded-lg p-2 text-xs font-semibold" />
                <button type="submit" className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-xs font-bold">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddEquipementModal({ onClose, onSave, sites, defaultSiteId, typesEquipement }) {
  const [formData, setFormData] = useState({ siteId: defaultSiteId || (sites && sites.length > 0 ? sites[0].id : ''), type: typesEquipement[0] || '', designation: '', ref: '', emplacement: '', quantite: 1, puissanceUnitaire: 0 });
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: (name === 'quantite' || name === 'puissanceUnitaire' || name === 'siteId') ? Number(value) : value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div><h3 className="text-sm font-extrabold text-[#1e3a8a] uppercase">Nouvel Équipement</h3></div>
          <button onClick={onClose} className="p-1.5 bg-white rounded-lg"><X className="h-4 w-4"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-[9px] font-bold uppercase mb-1">Site *</label><select name="siteId" required value={formData.siteId} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs bg-slate-50">{sites && sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-[9px] font-bold uppercase mb-1">Famille *</label><select name="type" required value={formData.type} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs bg-slate-50">{typesEquipement.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-[9px] font-bold uppercase mb-1">Désignation *</label><input type="text" name="designation" required value={formData.designation} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs" /></div>
            <div><label className="block text-[9px] font-bold uppercase mb-1">Référence</label><input type="text" name="ref" value={formData.ref} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs" /></div>
            <div><label className="block text-[9px] font-bold uppercase mb-1">Emplacement *</label><input type="text" name="emplacement" required value={formData.emplacement} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs" /></div>
            <div><label className="block text-[9px] font-bold uppercase mb-1">Quantité *</label><input type="number" min="1" name="quantite" required value={formData.quantite} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs" /></div>
            <div><label className="block text-[9px] font-bold uppercase mb-1">P. Unitaire (W) *</label><input type="number" min="0" name="puissanceUnitaire" required value={formData.puissanceUnitaire} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs" /></div>
          </div>
          <div className="pt-3 flex gap-2"><button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-50 font-bold rounded-lg text-xs">Annuler</button><button type="submit" className="flex-[2] py-2 bg-[#1e3a8a] text-white font-bold rounded-lg text-xs">Sauvegarder</button></div>
        </form>
      </div>
    </div>
  );
}
