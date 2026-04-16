import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Leaf, 
  Thermometer, 
  Home, 
  Search, 
  Plus,
  BookOpen,
  MapPin,
  Clock,
  Award,
  Settings,
  Trash2,
  Edit2,
  Target
} from 'lucide-react';
import ModuleHeader from '../../components/layout/ModuleHeader';

// --- MOCK DATA ET RÈGLES MÉTIER ---

// Collaborateurs : inclut équipe énergie et hors-équipe (travaillant sur USE)
const collaborateurs = [
  { id: 1, nom: 'Ahmed Ben Ali', role: 'Resp. Maintenance', site: 'Site Nord', equipeEnergie: true, usage: 'Air Comprimé', scoreInteressement: 85, cible: 80 },
  { id: 2, nom: 'Sarah Mansour', role: 'Ingénieur Énergie (Resp. Site)', site: 'Site Nord', equipeEnergie: true, usage: 'Global & Froid', scoreInteressement: 92, cible: 80 },
  { id: 3, nom: 'Karim Trabelsi', role: 'Resp. Achats Locaux', site: 'Siège', equipeEnergie: true, usage: 'Achats Énergivores', scoreInteressement: 75, cible: 80 },
  { id: 4, nom: 'Leila Jendoubi', role: 'Opératrice Production', site: 'Site Sud', equipeEnergie: false, usage: 'Air Comprimé', scoreInteressement: null, cible: null },
  { id: 5, nom: 'Omar Hassen', role: 'Technicien Froid', site: 'Site Sud', equipeEnergie: false, usage: 'Froid Industriel', scoreInteressement: null, cible: null }
];

// Matrice des compétences détaillée par collaborateur
const matriceCompetences = {
  1: { // Ahmed (Maintenance)
    'Air Comprimé (Technique)': { actuel: 4, requis: 4, pertinence: 'Haute' },
    'Électricité (Habilitation)': { actuel: 3, requis: 4, pertinence: 'Critique' },
    'ISO 50001 (Sensibilisation)': { actuel: 5, requis: 3, pertinence: 'Moyenne' },
  },
  2: { // Sarah (Ingénieur)
    'Froid Industriel': { actuel: 5, requis: 5, pertinence: 'Critique' },
    'Audit Énergétique': { actuel: 4, requis: 4, pertinence: 'Haute' },
    'Management Équipe': { actuel: 3, requis: 4, pertinence: 'Haute' },
  },
  3: { // Karim (Achats)
    'Critères Achats (Moteurs, etc.)': { actuel: 2, requis: 4, pertinence: 'Critique' },
    'ISO 50001 (Sensibilisation)': { actuel: 4, requis: 3, pertinence: 'Moyenne' },
  },
  4: { // Leila (Opératrice - Hors Equipe, sur USE)
    'Éco-gestes Air Comprimé': { actuel: 1, requis: 3, pertinence: 'Haute' },
    'Identification Fuites': { actuel: 2, requis: 3, pertinence: 'Moyenne' },
  }
};

const sessionsFormation = [
  { id: 1, type: 'Formation', theme: 'Détection des fuites Air Comprimé', date: '20 Avril 2026', statut: 'Planifiée', participants: 'Ahmed, Leila', formateur: 'Expert Externe', organisme: 'EnergyCert', evaluation: '-' },
  { id: 2, type: 'Sensibilisation', theme: 'Politique Énergétique', date: '25 Avril 2026', statut: 'Planifiée', participants: 'Tous', formateur: 'Sarah Mansour', organisme: 'Interne', evaluation: '-' },
  { id: 3, type: 'Formation', theme: 'Achats de Moteurs Haut Rendement', date: '05 Mai 2026', statut: 'Demandée', participants: 'Karim', formateur: 'Consultant', organisme: 'AchatPro', evaluation: '-' },
  { id: 4, type: 'Sensibilisation', theme: 'Impact Froid sur Conso Globale', date: '12 Fév 2026', statut: 'Réalisée', participants: 'Omar, Sarah', formateur: 'Sarah Mansour', organisme: 'Interne', evaluation: '8.5/10' },
];

const configurationsInteressement = [
  { id: 1, kpi: 'Atteinte Objectif Site (kWh/Unité)', poids: '40%', impacte: 'Tous les membres' },
  { id: 2, kpi: 'Taux Sensibilisation Ouvriers', poids: '20%', impacte: 'Resp. Site' },
  { id: 3, kpi: 'Taux Respect Planning Maintenance PM', poids: '20%', impacte: 'Resp. Maintenance, Resp. Site' },
  { id: 4, kpi: 'Conformité Nouveaux Achats', poids: '20%', impacte: 'Resp. Achats, Resp. Site' },
];

export default function RHModule({ onBack, userRole, user }) {
  const [activeTab, setActiveTab] = useState('responsables');
  const [searchTerm, setSearchTerm] = useState('');

  // --- UTILES ---
  const calculerTauxGlobalCompetence = (collabId) => {
    const comp = matriceCompetences[collabId];
    if (!comp) return 0;
    const cles = Object.keys(comp);
    let totalScore = 0;
    cles.forEach(k => {
      totalScore += Math.min(comp[k].actuel / comp[k].requis, 1) * 100;
    });
    return Math.round(totalScore / cles.length);
  };

  const getCompetenceStatus = (taux) => {
    if (taux >= 100) return { label: 'Acquise', color: 'bg-green-100 text-green-700' };
    if (taux >= 70) return { label: 'En cours', color: 'bg-orange-100 text-orange-700' };
    return { label: 'Action Requise', color: 'bg-red-100 text-red-700' };
  };

  // --- COMPOSANTS UI REUTILISABLES ---
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
        activeTab === id 
          ? 'bg-[#1e3989] text-white shadow-md' 
          : 'bg-white text-[#1e3989] hover:bg-blue-50 border border-gray-100 shadow-sm'
      }`}
    >
      <Icon size={18} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  const StatusBadge = ({ status, customColor }) => {
    let color = customColor || 'bg-gray-100 text-gray-600';
    if (!customColor) {
      if (status === 'Réalisée' || status === 'Éligible') color = 'bg-green-100 text-green-700';
      if (status === 'Planifiée') color = 'bg-blue-100 text-blue-700';
      if (status === 'Demandée' || status === 'Non Éligible') color = 'bg-red-100 text-red-700';
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 md:p-8 font-sans text-gray-800">
      
      <ModuleHeader
        title="Compétences et Sensibilisation"
        subtitle="Gestion des habilitations, formations et intéressement énergétique"
        icon={GraduationCap}
        user={user}
        onHomeClick={onBack}
        iconClassName="bg-[#1e3989] text-white"
        className="mb-6"
      />
      {false && (
      <header className="bg-white rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 border-[#1e3989]">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e3989] text-white p-3 rounded-xl shadow-md">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1e3989] tracking-tight">
              RH & Formations
            </h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Management des compétences et d'intéressement (ISO 50001)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1 text-[#1e3989] font-bold text-xl">
              16.8° <Thermometer size={16} className="text-orange-500"/>
            </div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tunis</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <button onClick={onBack} className="flex items-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
            <Home size={16} /> Accueil Dashboard
          </button>
        </div>
      </header>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-50">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Users size={28} /></div>
          <div>
            <div className="text-2xl font-bold text-[#1e3989]">5</div>
            <div className="text-xs text-gray-500 font-medium">Membres Équipe Énergie</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-50">
          <div className="bg-green-50 p-3 rounded-xl text-green-600"><CheckCircle size={28} /></div>
          <div>
            <div className="text-2xl font-bold text-[#1e3989]">72%</div>
            <div className="text-xs text-gray-500 font-medium">Taux Compétence Moyen</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-50">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><GraduationCap size={28} /></div>
          <div>
            <div className="text-2xl font-bold text-[#1e3989]">4</div>
            <div className="text-xs text-gray-500 font-medium">Formations / Sensibilisations</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-50">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Award size={28} /></div>
          <div>
            <div className="text-2xl font-bold text-[#1e3989]">2</div>
            <div className="text-xs text-gray-500 font-medium">Collab. Éligibles Prime</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <TabButton id="responsables" label="Usages & Responsabilités" icon={MapPin} />
        <TabButton id="competences" label="Matrice des Compétences" icon={Target} />
        <TabButton id="planification" label="Planification Formations" icon={Calendar} />
        <TabButton id="interessement" label="Système d'Intéressement" icon={Award} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        
        {/* ONGLET 1: RESPONSABLES & USAGES */}
        {activeTab === 'responsables' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1e3989]">Identification des Responsabilités</h2>
                <p className="text-sm text-gray-500 mt-1">Lien entre les collaborateurs, l'équipe énergie et les Usages Significatifs (USE).</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                    <th className="p-4 font-semibold">Collaborateur</th>
                    <th className="p-4 font-semibold">Poste & Site</th>
                    <th className="p-4 font-semibold">Équipe Énergie ?</th>
                    <th className="p-4 font-semibold">Usage Significatif Impacté</th>
                    <th className="p-4 font-semibold">Niveau Global Compétence</th>
                    <th className="p-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collaborateurs.map((c) => {
                    const taux = calculerTauxGlobalCompetence(c.id);
                    const status = getCompetenceStatus(taux);
                    
                    return (
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 font-bold text-[#1e3989]">{c.nom}</td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-800">{c.role}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12}/>{c.site}</div>
                      </td>
                      <td className="p-4">
                        {c.equipeEnergie ? 
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Oui</span> : 
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Non (Opérationnel)</span>
                        }
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-700">{c.usage}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${taux}%` }}></div>
                          </div>
                          <StatusBadge status={status.label} customColor={status.color} />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 size={18}/></button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET 2: MATRICE DES COMPÉTENCES */}
        {activeTab === 'competences' && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1e3989]">Matrice des Compétences Énergie</h2>
                <p className="text-sm text-gray-500 mt-1">Comparaison des niveaux actuels vs requis par la norme. Déclenchement automatique des besoins en formation.</p>
              </div>
              <button className="bg-[#1e3989] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-800">
                <Plus size={16} /> Ajouter Critère
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {collaborateurs.filter(c => matriceCompetences[c.id]).map(collab => (
                <div key={collab.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-[#1e3989]">{collab.nom}</h3>
                      <p className="text-xs text-gray-500">{collab.role} • {collab.equipeEnergie ? 'Membre Équipe Énergie' : 'Collaborateur sur USE'}</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {Object.entries(matriceCompetences[collab.id]).map(([critere, niveaux], idx) => {
                      const gap = niveaux.requis - niveaux.actuel;
                      return (
                        <div key={idx} className="bg-white">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-700">{critere}</span>
                            {gap > 0 ? 
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Besoin Formation (Écart: -{gap})</span> :
                              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Conforme</span>
                            }
                          </div>
                          {/* Jauge visuelle par niveau (sur 5) */}
                          <div className="flex gap-1 h-3 mt-2">
                            {[1, 2, 3, 4, 5].map(lvl => {
                              let bg = 'bg-gray-100';
                              if (lvl <= niveaux.actuel) bg = 'bg-[#1e3989]'; // Niveau acquis
                              else if (lvl <= niveaux.requis) bg = 'bg-red-200 border-dashed border border-red-400'; // Écart à combler
                              
                              return <div key={lvl} className={`flex-1 rounded-sm ${bg}`}></div>
                            })}
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase font-bold">
                            <span>1 - Notions</span>
                            <span>Requis: Lvl {niveaux.requis}</span>
                            <span>5 - Expert</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET 3: PLANIFICATION */}
        {activeTab === 'planification' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1e3989]">Registre des Formations & Sensibilisations</h2>
                <p className="text-sm text-gray-500 mt-1">Planification détaillée, participants, organismes et évaluations à l'entrée/sortie.</p>
              </div>
              <button className="bg-[#1e3989] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-800">
                <Plus size={16} /> Planifier Session
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="p-4 font-semibold">Date Prévue</th>
                    <th className="p-4 font-semibold">Thème</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Participants</th>
                    <th className="p-4 font-semibold">Par Qui / Organisme</th>
                    <th className="p-4 font-semibold">État</th>
                    <th className="p-4 font-semibold text-center">Détails / Éval.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessionsFormation.map((s) => (
                    <tr key={s.id} className="hover:bg-blue-50/30">
                      <td className="p-4 text-gray-700 font-medium whitespace-nowrap"><Clock size={14} className="inline mr-1 text-gray-400"/> {s.date}</td>
                      <td className="p-4 font-bold text-[#1e3989]">{s.theme}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${s.type === 'Formation' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{s.participants}</td>
                      <td className="p-4 text-gray-600">
                        <div>{s.formateur}</div>
                        <div className="text-xs text-gray-400">{s.organisme}</div>
                      </td>
                      <td className="p-4"><StatusBadge status={s.statut} /></td>
                      <td className="p-4 text-center">
                        {s.statut === 'Réalisée' ? 
                          <span className="text-green-600 font-bold">{s.evaluation}</span> : 
                          <button className="text-gray-400 hover:text-blue-600">Saisir</button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET 4: SYSTEME D'INTERESSEMENT */}
        {activeTab === 'interessement' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1e3989]">Système de Scoring & Intéressement</h2>
                <p className="text-sm text-gray-500 mt-1">Primes basées sur l'atteinte des objectifs, la maintenance, les achats et la sensibilisation.</p>
              </div>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-200">
                <Settings size={16} /> Configurer les règles
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Target size={18}/> Règles de calcul actuelles</h3>
                <div className="space-y-2">
                  {configurationsInteressement.map(conf => (
                    <div key={conf.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <div>
                        <div className="font-semibold text-sm text-[#1e3989]">{conf.kpi}</div>
                        <div className="text-xs text-gray-500">Impacte : {conf.impacte}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded text-sm">Poids: {conf.poids}</span>
                        <div className="flex gap-1">
                          <button className="text-gray-400 hover:text-blue-600"><Edit2 size={14}/></button>
                          <button className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#1e3989] to-blue-700 rounded-xl p-5 text-white shadow-md">
                <h3 className="font-bold mb-4 opacity-90 text-lg">Seuil d'Éligibilité</h3>
                <div className="text-5xl font-extrabold mb-2">80<span className="text-2xl font-medium opacity-70">/100</span></div>
                <p className="text-sm opacity-80 leading-relaxed">
                  Score minimum consolidé requis pour débloquer la prime énergie annuelle pour l'équipe énergie locale.
                </p>
                <div className="mt-6 pt-4 border-t border-white/20">
                  <button className="w-full bg-white text-[#1e3989] font-bold py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                    Modifier le seuil
                  </button>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-gray-800 mb-4">Scores actuels de l'équipe énergie</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="p-4 font-semibold">Collaborateur (Équipe Énergie)</th>
                    <th className="p-4 font-semibold">Poste</th>
                    <th className="p-4 font-semibold text-center">Score Consolidé</th>
                    <th className="p-4 font-semibold text-center">Seuil</th>
                    <th className="p-4 font-semibold text-center">Statut Prime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collaborateurs.filter(c => c.equipeEnergie).map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/30">
                      <td className="p-4 font-bold text-[#1e3989]">{c.nom}</td>
                      <td className="p-4 text-gray-700">{c.role}</td>
                      <td className="p-4 text-center">
                        <span className={`text-lg font-bold ${c.scoreInteressement >= c.cible ? 'text-green-600' : 'text-orange-500'}`}>
                          {c.scoreInteressement}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-400 font-medium">{c.cible}</td>
                      <td className="p-4 text-center">
                        <StatusBadge status={c.scoreInteressement >= c.cible ? 'Éligible' : 'Non Éligible'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
