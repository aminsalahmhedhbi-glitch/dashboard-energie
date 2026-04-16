import React, { useState } from 'react';
import { 
  Home, Thermometer, Calendar, Plus, Search, Filter, 
  Edit, Trash2, Activity, Zap, Wind, Droplets, Sun, Box, Monitor, AlertCircle, CheckCircle2, Info, PlusCircle, X
} from 'lucide-react';
import ModuleHeader from '../../components/layout/ModuleHeader';

// --- DONNÉES DE RÉFÉRENCE (Sans abréviations) ---
const ENERGIE_TYPES = ['Électricité', 'Gaz Naturel', 'Gazole', 'Solaire (Photovoltaïque)', 'Air Comprimé'];

const USAGES = [
  'Éclairage', 
  'Climatisation / Chauffage', 
  "Système d'air comprimé", 
  'Manutention et divers ateliers', 
  'Informatique', 
  "Extracteur d'air (réparation et salle d'exposition)", 
  'Compteur Général (STEG)', 
  'Analyseurs divisionnaires', 
  'Système Solaire Photovoltaïque', 
  'Four de peinture'
];

const FACTEURS_PERTINENTS = [
  'Heures de fonctionnement', 'Longueur du jour', 'Pièces en panne', 
  'Température extérieure', 'Régime de travail', 'Maintenance préventive', 
  'Utilisateur', 'Consigne (réglage)', 'Nombre de pièces en marche', 
  'Nombre de pièces produites', 'Nettoyage', 'Humidité', 'Consommation', 
  'Surface', 'Température intérieure', 'Type d\'équipement', 'Ensoleillement'
];

const METHODES = ['Mesure directe', 'Estimation', 'Calcul'];
const FREQUENCES = ['Continue (Temps réel)', 'Horaire', 'Quotidienne', 'Hebdomadaire', 'Mensuelle', 'Annuelle'];

// --- NOUVELLE STRUCTURE DE DONNÉES (Un usage -> Plusieurs facteurs indépendants) ---
const INITIAL_DATA = [
  {
    id: 1,
    typeEnergie: 'Air Comprimé',
    usage: "Système d'air comprimé",
    responsableUsage: 'Chef de l\'Atelier Production',
    facteurs: [
      {
        idFacteur: 101,
        nom: 'Température extérieure',
        parametre: 'Degrés Celsius (°C)',
        source: 'Site Internet Météorologique National',
        methode: 'Estimation',
        caracteristiques: 'Relevé manuel sur le site web chaque matin',
        frequence: 'Quotidienne',
        responsableCollecte: 'Département Maintenance'
      },
      {
        idFacteur: 102,
        nom: 'Consigne (réglage)',
        parametre: 'Pression du réseau (Bars)',
        source: 'Capteur de pression sur la cuve du compresseur',
        methode: 'Mesure directe',
        caracteristiques: 'Connexion automatique au système de supervision',
        frequence: 'Continue (Temps réel)',
        responsableCollecte: 'Système Automatisé'
      }
    ]
  },
  {
    id: 2,
    typeEnergie: 'Gaz Naturel',
    usage: 'Four de peinture',
    responsableUsage: 'Responsable de Production',
    facteurs: [
      {
        idFacteur: 201,
        nom: 'Nombre de pièces produites',
        parametre: 'Quantité de pièces (Unités)',
        source: 'Logiciel de Gestion de Production (ERP)',
        methode: 'Mesure directe',
        caracteristiques: 'Extraction du rapport de production hebdomadaire',
        frequence: 'Hebdomadaire',
        responsableCollecte: 'Technicien de l\'Énergie'
      }
    ]
  }
];

export default function CollecteDataModule({ onBack, userRole, user }) {
  const [plans, setPlans] = useState(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  
  // Modèle d'un facteur vide
  const emptyFacteur = {
    idFacteur: Date.now(),
    nom: FACTEURS_PERTINENTS[0],
    parametre: '',
    source: '',
    methode: METHODES[0],
    caracteristiques: '',
    frequence: FREQUENCES[2],
    responsableCollecte: ''
  };

  // État du formulaire
  const [formData, setFormData] = useState({
    typeEnergie: 'Électricité',
    usage: USAGES[0],
    responsableUsage: '',
    facteurs: [ { ...emptyFacteur } ]
  });

  // --- ACTIONS SUR LE FORMULAIRE ---
  const openNewPlanModal = () => {
    setFormData({
      typeEnergie: 'Électricité', usage: USAGES[0], responsableUsage: '',
      facteurs: [ { ...emptyFacteur, idFacteur: Date.now() } ]
    });
    setEditingPlanId(null);
    setIsModalOpen(true);
  };

  const openEditPlanModal = (plan) => {
    setFormData(JSON.parse(JSON.stringify(plan))); // Deep copy
    setEditingPlanId(plan.id);
    setIsModalOpen(true);
  };

  const handleFacteurChange = (index, field, value) => {
    const updatedFacteurs = [...formData.facteurs];
    updatedFacteurs[index][field] = value;
    setFormData({ ...formData, facteurs: updatedFacteurs });
  };

  const addFacteurToForm = () => {
    setFormData({ ...formData, facteurs: [...formData.facteurs, { ...emptyFacteur, idFacteur: Date.now() }] });
  };

  const removeFacteurFromForm = (indexToRemove) => {
    if (formData.facteurs.length === 1) {
      alert("Un plan doit contenir au moins un facteur pertinent à surveiller.");
      return;
    }
    const updatedFacteurs = formData.facteurs.filter((_, index) => index !== indexToRemove);
    setFormData({ ...formData, facteurs: updatedFacteurs });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPlanId) {
      // Mise à jour
      setPlans(plans.map(p => p.id === editingPlanId ? { ...formData, id: editingPlanId } : p));
    } else {
      // Création
      setPlans([{ ...formData, id: Date.now() }, ...plans]);
    }
    setIsModalOpen(false);
  };

  const deletePlan = (id) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer ce plan de collecte complet ?")) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  const triggerNotFunctionalAlert = (featureName) => {
    alert(`La fonctionnalité "${featureName}" est connectée au système principal et n'est pas disponible dans cette vue isolée.`);
  };

  // Filtrage intelligent (recherche dans l'usage, l'énergie ou le nom des facteurs)
  const filteredPlans = plans.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchUsage = p.usage.toLowerCase().includes(search);
    const matchEnergie = p.typeEnergie.toLowerCase().includes(search);
    const matchFacteurs = p.facteurs.some(f => f.nom.toLowerCase().includes(search));
    return matchUsage || matchEnergie || matchFacteurs;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      <div className="sticky top-0 z-40 px-3 py-3 sm:px-4 lg:px-5">
        <ModuleHeader
          title="Plan de Comptage et Mesurage"
          subtitle="Cartographie de l'instrumentation et suivi des facteurs pertinents"
          icon={Activity}
          user={user}
          onHomeClick={onBack}
          className="mb-6"
        />
      </div>
      {false && (
      <div className="bg-white px-8 py-6 mb-6 shadow-sm flex items-center justify-between rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 text-white p-3 rounded-xl">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900 tracking-tight">Système de Management de l'Énergie</h1>
            <p className="text-slate-500 text-sm mt-1">
              Module Qualité, Sécurité, Environnement • Bonjour, <span className="font-semibold text-slate-800">Administrateur</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-blue-900">
              <span className="text-3xl font-bold">16.8°</span>
              <Thermometer className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Tunis</span>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-blue-900">10:50</span>
            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase text-center leading-tight">
              MERCREDI<br/>15 AVRIL
            </span>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-semibold text-sm hover:bg-emerald-100 transition-colors"
          >
            <Home className="w-4 h-4" /> Accueil
          </button>
        </div>
      </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        
        {/* ENCART D'EXPLICATION POUR L'AUDITEUR ET LES UTILISATEURS */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-4 items-start">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 text-sm">Exigence A.6.6 - Planification de la collecte de données énergétiques</h3>
            <p className="text-sm text-blue-800 mt-1">
              Ce module permet de définir avec précision <strong>comment</strong> et <strong>à quelle fréquence</strong> les données influençant la performance énergétique sont collectées. 
              Pour chaque usage significatif, vous devez lister les <strong>facteurs pertinents</strong> (variables qui affectent la consommation). <br/>
              <em>Important : Chaque facteur pertinent dispose de sa propre méthode de mesure, de sa propre source et de son propre responsable, car ces éléments diffèrent souvent au sein d'un même usage.</em>
            </p>
          </div>
        </div>

        {/* BARRE D'ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex gap-3 w-full md:w-auto ml-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher par usage, énergie ou facteur..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={openNewPlanModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Créer un plan de collecte
            </button>
          </div>
        </div>

        {/* TABLEAU DES DONNÉES (Structure Imbriquée) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-4 font-semibold w-1/5">Informations Générales (Usage)</th>
                  <th className="px-4 py-4 font-semibold w-1/5">Facteur Pertinent Surveillé</th>
                  <th className="px-4 py-4 font-semibold w-1/5">Paramètre & Source de donnée</th>
                  <th className="px-4 py-4 font-semibold w-1/5">Méthode de Collecte & Fréquence</th>
                  <th className="px-4 py-4 font-semibold">Responsable (Collecte)</th>
                  <th className="px-4 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              
              {filteredPlans.map((plan) => (
                <tbody key={plan.id} className="border-b-4 border-slate-100 divide-y divide-slate-100">
                  {plan.facteurs.map((facteur, index) => (
                    <tr key={facteur.idFacteur} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Colonne 1 : Fusionnée pour tous les facteurs du même plan */}
                      {index === 0 && (
                        <td rowSpan={plan.facteurs.length} className="px-4 py-4 align-top border-r border-slate-100 bg-slate-50/50">
                          <div className="font-bold text-blue-900 text-base mb-2">{plan.usage}</div>
                          
                          <div className="flex items-center gap-1 mb-3 text-slate-700 font-medium text-sm">
                            {plan.typeEnergie === 'Électricité' && <Zap className="w-4 h-4 text-yellow-500" />}
                            {plan.typeEnergie === 'Gaz Naturel' && <Wind className="w-4 h-4 text-orange-500" />}
                            {plan.typeEnergie === 'Air Comprimé' && <Wind className="w-4 h-4 text-blue-400" />}
                            {plan.typeEnergie === 'Solaire (Photovoltaïque)' && <Sun className="w-4 h-4 text-yellow-400" />}
                            {plan.typeEnergie}
                          </div>

                          <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                            <span className="block font-semibold text-slate-400 mb-1 text-[10px] uppercase tracking-wider">Responsable de l'usage</span>
                            {plan.responsableUsage}
                          </div>
                        </td>
                      )}

                      {/* Colonnes 2 à 5 : Spécifiques à chaque facteur */}
                      <td className="px-4 py-4 align-top">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
                          {facteur.nom}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-bold text-slate-800 mb-1">{facteur.parametre}</div>
                        <div className="text-xs text-slate-600 flex items-start gap-1">
                          <Box className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                          <span>{facteur.source}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-semibold text-slate-800 mb-1">{facteur.methode}</div>
                        <div className="text-xs text-slate-500 mb-2 leading-relaxed">
                          {facteur.caracteristiques}
                        </div>
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                          ${facteur.frequence.includes('Continue') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                            facteur.frequence === 'Horaire' || facteur.frequence === 'Quotidienne' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                            'bg-indigo-100 text-indigo-800 border border-indigo-200'}`}>
                          {facteur.frequence}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm text-slate-700">{facteur.responsableCollecte}</div>
                      </td>

                      {/* Colonne Actions : Fusionnée également */}
                      {index === 0 && (
                        <td rowSpan={plan.facteurs.length} className="px-4 py-4 align-middle border-l border-slate-100 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <button 
                              onClick={() => openEditPlanModal(plan)}
                              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                              title="Modifier le plan complet"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => deletePlan(plan.id)} 
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                              title="Supprimer le plan"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              ))}

              {filteredPlans.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan="6" className="px-4 py-16 text-center text-slate-500 text-lg">
                      Aucun plan de collecte ne correspond à votre recherche.
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* MODAL : AJOUT / MODIFICATION DE PLAN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingPlanId ? "Modifier le Plan de Collecte" : "Nouveau Plan de Collecte"}
                </h3>
                <p className="text-xs text-slate-300 mt-1">Conformité ISO 50001 - Chapitre A.6.6</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white text-3xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-8 bg-slate-50">
              
              {/* SECTION 1 : Informations Générales */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-base font-bold text-blue-900 mb-4 border-b border-slate-100 pb-2">1. Informations Générales de l'Usage</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Usage Significatif</label>
                    <select 
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.usage} onChange={e => setFormData({...formData, usage: e.target.value})} required
                    >
                      {USAGES.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type d'énergie / Vecteur</label>
                    <select 
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.typeEnergie} onChange={e => setFormData({...formData, typeEnergie: e.target.value})} required
                    >
                      {ENERGIE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Responsable de l'usage</label>
                    <input 
                      type="text" required placeholder="Exemple : Chef de l'Atelier Production"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.responsableUsage} onChange={e => setFormData({...formData, responsableUsage: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 2 : Facteurs Pertinents (Dynamique) */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-blue-900">2. Définition des Facteurs Pertinents</h4>
                  <button 
                    type="button" onClick={addFacteurToForm}
                    className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Ajouter un facteur
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.facteurs.map((facteur, index) => (
                    <div key={facteur.idFacteur} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative">
                      
                      {/* Bouton supprimer le facteur */}
                      <button 
                        type="button" 
                        onClick={() => removeFacteurFromForm(index)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        title="Retirer ce facteur"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <h5 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="bg-slate-800 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">{index + 1}</span>
                        Paramétrage du facteur
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nom du facteur pertinent</label>
                          <select 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                            value={facteur.nom} onChange={e => handleFacteurChange(index, 'nom', e.target.value)} required
                          >
                            {FACTEURS_PERTINENTS.map(f => <option key={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Paramètre mesuré (Unité)</label>
                          <input 
                            type="text" required placeholder="Exemple : Température en Degrés Celsius (°C)"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={facteur.parametre} onChange={e => handleFacteurChange(index, 'parametre', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Source de la donnée / Point de collecte</label>
                          <input 
                            type="text" required placeholder="Exemple : Capteur X, Site Web Météo, Compteur Y..."
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={facteur.source} onChange={e => handleFacteurChange(index, 'source', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Méthode de collecte</label>
                          <select 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={facteur.methode} onChange={e => handleFacteurChange(index, 'methode', e.target.value)}
                          >
                            {METHODES.map(m => <option key={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Détails techniques (Comment collecter ?)</label>
                          <input 
                            type="text" required placeholder="Exemple : Extraction automatique quotidienne via API..."
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={facteur.caracteristiques} onChange={e => handleFacteurChange(index, 'caracteristiques', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Fréquence</label>
                          <select 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={facteur.frequence} onChange={e => handleFacteurChange(index, 'frequence', e.target.value)}
                          >
                            {FREQUENCES.map(f => <option key={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Responsable de collecte</label>
                          <input 
                            type="text" required placeholder="Ex: Technicien de maintenance"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={facteur.responsableCollecte} onChange={e => handleFacteurChange(index, 'responsableCollecte', e.target.value)}
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </section>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-slate-50 pb-2 z-10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {editingPlanId ? "Enregistrer les modifications" : "Valider le plan de collecte"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Styles personnalisés pour la barre de défilement (Scrollbar) */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

    </div>
  );
}
