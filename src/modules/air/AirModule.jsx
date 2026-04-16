import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap, Activity, Save, History, TrendingUp, AlertTriangle, Factory, CheckCircle2,
  BarChart3, Settings, Lock, Unlock, Calendar, HelpCircle,
  FileText, Eye, BookOpen, Sun, MousePointerClick,
  Info, Wind, Thermometer, Timer, Wrench, LayoutGrid, ArrowLeft, Edit2,
  PieChart, MapPin, Maximize2, Building2, Leaf, CloudSun, Flag,
  Database, User, Users, LogOut, Key, Shield, X, Trash2, PlusCircle,
  Store, Droplets, Filter, Check, Printer, TrendingDown, Download, Sliders,
  Target, Flame, Lightbulb, ThermometerSun, ClipboardList, ListChecks
} from 'lucide-react';
import {
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { BrandLogo, FallbackLogo } from '../../components/branding/BrandLogo';
import HeaderInfoDisplay from '../../components/layout/HeaderInfoDisplay';
import ModuleHeader from '../../components/layout/ModuleHeader';
import { API_BASE, apiFetch, saveCollectionItem as saveData } from '../../lib/api';
import { useData } from '../../hooks/useData';

const AirModule = ({ onBack, userRole, user }) => {
  const [activeCompressor, setActiveCompressor] = useState(1);
  const [showMaintPopup, setShowMaintPopup] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [notif, setNotif] = useState(null);
  const [week, setWeek] = useState(getWeekNumber(new Date()));
  const [editingPrev, setEditingPrev] = useState(false);
  const [config, setConfig] = useState({ elecPrice: 0.291, offLoadFactor: 0.4 });
    
  // Chargement logs PC
  const { data: logs } = useData('air_logs');
  const formatNumber = (num) => Number(num || 0).toLocaleString('fr-TN', { maximumFractionDigits: 2 });

  const weeklyAirChartData = useMemo(() => {
    const weeklyReports = logs.filter(log => log.type === 'WEEKLY_REPORT');
    const grouped = {};

    weeklyReports.forEach(log => {
      const weekKey = log.week || 'Semaine inconnue';

      if (!grouped[weekKey]) {
        grouped[weekKey] = {
          week: weekKey,
          energyKwh: 0,
          runDelta: 0,
          loadDelta: 0
        };
      }

      grouped[weekKey].energyKwh += Number(log.energyKwh || 0);
      grouped[weekKey].runDelta += Number(log.runDelta || 0);
      grouped[weekKey].loadDelta += Number(log.loadDelta || 0);
    });

    return Object.values(grouped)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);
  }, [logs]);

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
  }

  const COMPRESSORS = [
    { id: 1, name: "Compresseur 1", serial: "CAI 827281", model: "Ceccato CSB 30", power: 22 },
    { id: 2, name: "Compresseur 2", serial: "CAI 808264", model: "Ceccato CSB 30", power: 22 }
  ];

  const MAINT_INTERVALS = { oilFilter: 2000, airFilter: 2000, separator: 2000, oil: 2000, general: 500 };
  const MAINT_LABELS = { oilFilter: "Filtre à Huile", airFilter: "Filtre à Air", separator: "Séparateur", oil: "Huile", general: "Inspection" };
  const MAINT_ICONS = { oilFilter: Filter, airFilter: Wind, separator: Droplets, oil: Droplets, general: Eye };

  const [formData, setFormData] = useState({
    1: { lastRun: 19960, newRun: '', lastLoad: 10500, newLoad: '', description: '', lastMaint: { oilFilter: 19960, airFilter: 19960, separator: 19960, oil: 19960, general: 19960 } },
    2: { lastRun: 18500, newRun: '', lastLoad: 9200, newLoad: '', description: '', lastMaint: { oilFilter: 18500, airFilter: 18500, separator: 18500, oil: 18500, general: 18500 } }
  });
    
  useEffect(() => {
      const compLogs = logs.filter(l => l.compName === COMPRESSORS.find(c => c.id === activeCompressor).name);
      
      if(compLogs.length > 0) {
          const latestRunLog = compLogs.find(l => l.type === 'WEEKLY_REPORT');
          const currentRun = latestRunLog ? latestRunLog.newRun : formData[activeCompressor].lastRun;
          const currentLoad = latestRunLog ? latestRunLog.newLoad : formData[activeCompressor].lastLoad;

          const maintenanceStatus = { ...formData[activeCompressor].lastMaint };
          Object.keys(MAINT_INTERVALS).forEach(type => {
              const lastMaintLog = compLogs.find(l => l.type === 'MAINTENANCE' && l.maintType === MAINT_LABELS[type]);
              if (lastMaintLog) {
                  maintenanceStatus[type] = lastMaintLog.indexDone;
              }
          });

          setFormData(prev => ({
              ...prev,
              [activeCompressor]: {
                  ...prev[activeCompressor],
                  lastRun: currentRun,
                  lastLoad: currentLoad,
                  lastMaint: maintenanceStatus
              }
          }));
      }
  }, [activeCompressor, logs]);

  const handleInput = (field, value) => setFormData(prev => ({...prev, [activeCompressor]: {...prev[activeCompressor], [field]: value}}));
    
  const calculateKPIs = () => {
      const data = formData[activeCompressor];
      const comp = COMPRESSORS.find(c => c.id === activeCompressor);
      const runDelta = Math.max(0, (parseFloat(data.newRun)||0) - (parseFloat(data.lastRun)||0));
      const loadDelta = Math.max(0, (parseFloat(data.newLoad)||0) - (parseFloat(data.lastLoad)||0));
      const loadRate = runDelta > 0 ? (loadDelta / runDelta) * 100 : 0;
      const utilRate = (runDelta / 47.5) * 100;
      const energyKwh = (loadDelta * comp.power) + ((runDelta - loadDelta) * comp.power * config.offLoadFactor);
      
      const currentTotal = parseFloat(data.newRun) || parseFloat(data.lastRun) || 0;
      const maintStatus = {};
      Object.keys(MAINT_INTERVALS).forEach(key => {
        const lastDone = data.lastMaint[key] || 0;
        const remaining = (lastDone + MAINT_INTERVALS[key]) - currentTotal;
        maintStatus[key] = { remaining };
      });

      return { runDelta, loadDelta, loadRate, utilRate, energyKwh, costHT: energyKwh * config.elecPrice, maintStatus };
  };

  const handleSubmit = async () => {
      const kpis = calculateKPIs();
      const data = formData[activeCompressor];
      if(!data.newRun) { setNotif("Index manquant"); return; }
      
      const newLog = {
          id: Date.now(),
          type: 'WEEKLY_REPORT',
          week: week,
          compName: COMPRESSORS.find(c => c.id === activeCompressor).name,
          ...data, ...kpis
      };
      
      await saveData('air_logs', newLog);
      
      setFormData(prev => ({
          ...prev,
          [activeCompressor]: { ...prev[activeCompressor], lastRun: data.newRun, newRun: '', lastLoad: data.newLoad, newLoad: '', description: '' }
      }));
      setNotif("Enregistré");
      setTimeout(() => setNotif(null), 3000);
  };

  const handleMaintenanceDone = async (type, details) => {
      const currentRun = parseFloat(formData[activeCompressor].newRun) || parseFloat(formData[activeCompressor].lastRun);
      const newMaint = { ...formData[activeCompressor].lastMaint, [type]: currentRun };
      setFormData(prev => ({
          ...prev,
          [activeCompressor]: { ...prev[activeCompressor], lastMaint: newMaint }
      }));
      
      const newLog = {
          id: Date.now(),
          type: 'MAINTENANCE',
          date: new Date().toLocaleDateString(),
          compName: COMPRESSORS.find(c => c.id === activeCompressor).name,
          maintType: MAINT_LABELS[type],
          indexDone: currentRun,
          details: details
      };
      await saveData('air_logs', newLog);
      
      setShowMaintPopup(null);
      setNotif("Maintenance validée");
  };

  const handleDeleteAirLog = async (logId) => {
      if (userRole !== 'ADMIN') return;

      const confirmed = window.confirm("Voulez-vous vraiment supprimer cet enregistrement ?");
      if (!confirmed) return;

      try {
          await apiFetch(`/api/data/air_logs/${logId}`, {
              method: 'DELETE'
          });
          setNotif("Enregistrement supprimé");
      } catch (error) {
          console.error(error);
          setNotif("Erreur suppression");
      }

      setTimeout(() => setNotif(null), 3000);
  };

  const kpis = calculateKPIs();
  const getStatusColor = (rem, total) => {
      if (rem <= 0) return 'text-red-600 font-bold';
      if (rem < (total * 0.2)) return 'text-amber-500 font-bold'; 
      return 'text-emerald-600';
  };
  const getProgressColor = (rem, total) => {
      if (rem <= 0) return 'bg-red-600';
      if (rem < (total * 0.2)) return 'bg-amber-500';
      return 'bg-emerald-500';
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
        <div className="sticky top-0 z-30 px-4 py-3">
            <div className="max-w-7xl mx-auto">
                <ModuleHeader
                    title="Performance des Systèmes d'Air Comprimé"
                    subtitle={
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center"><MapPin size={10} className="mr-1"/> Site Mégrine</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center"><Calendar size={10} className="mr-1"/> Semaine {week.split('-W')[1]} {week.split('-W')[0]}</span>
                        </div>
                    }
                    icon={Wind}
                    user={user}
                    onHomeClick={onBack}
                    actions={
                        <button onClick={() => setShowGuide(true)} className="flex items-center bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 transition-colors">
                            <BookOpen size={16} className="mr-2" />
                            Guide & Consignes
                        </button>
                    }
                />
            </div>
        </div>
        {false && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center gap-4 mb-2 md:mb-0">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full mr-2 transition-colors text-slate-500"><ArrowLeft size={20} /></button>
                    <BrandLogo size="h-8"/>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div>
                        <h1 className="text-lg font-black text-blue-900 flex items-center"><Wind className="mr-2" size={20}/> Air Comprimé</h1>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                            <MapPin size={10} className="mr-1"/> Site Mégrine
                            <span className="mx-2">•</span>
                            <Calendar size={10} className="mr-1"/> Semaine {week.split('-W')[1]} {week.split('-W')[0]}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowGuide(true)} className="flex items-center bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 transition-colors"><BookOpen size={16} className="mr-2" /> Guide & Consignes</button>
                </div>
            </div>
        </header>
        )}

        {showGuide && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowGuide(false)}>
                <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
                    <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center text-lg"><BookOpen className="mr-2 text-blue-900" /> Instructions ES3000</h3>
                    
                    <div className="space-y-6 overflow-y-auto max-h-[60vh]">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-blue-900 mb-3 flex items-center"><Activity size={16} className="mr-2"/> Navigation Contrôleur</h4>
                            <ol className="text-sm text-slate-600 space-y-3 list-decimal pl-5">
                                <li>L'écran affiche par défaut la <strong>Pression de sortie</strong>.</li>
                                <li>Appuyez sur la flèche <strong>DROITE</strong> (Tab) pour faire défiler le menu principal.</li>
                                <li>
                                    <strong>Heures Totales :</strong> Cherchez le symbole 🕒 (Horloge pleine). Notez la valeur.
                                </li>
                                <li>
                                    <strong>Heures en Charge :</strong> Continuez de défiler jusqu'au symbole ⚡ (Piston/Éclair). C'est le temps de travail effectif.
                                </li>
                                <li>Pour revenir, appuyez sur <strong>C (Cancel)</strong> ou attendez 30s.</li>
                            </ol>
                        </div>
                        
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                            <h4 className="font-bold text-orange-900 mb-3 flex items-center"><AlertTriangle size={16} className="mr-2"/> Bonnes Pratiques & Sécurité</h4>
                            <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
                                <li>Vérifier le niveau d'huile visuel avant chaque démarrage ou relevé (hublot latéral).</li>
                                <li>Écouter s'il y a des bruits anormaux ou des fuites d'air audibles lors de la mise en charge.</li>
                                <li>Purger le réservoir d'air quotidiennement si la purge auto est défaillante.</li>
                                <li>Ne jamais ouvrir le capot machine en marche.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <main className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="flex gap-2">
                    {COMPRESSORS.map(c => (
                        <button key={c.id} onClick={() => setActiveCompressor(c.id)} className={`flex-1 p-4 rounded-xl border text-left transition-all ${activeCompressor === c.id ? 'bg-white border-blue-900 shadow-md ring-1 ring-blue-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <div className="font-bold text-slate-700">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.model} - {c.serial}</div>
                        </button>
                    ))}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <h2 className="font-bold flex items-center text-slate-800"><Timer className="mr-2 text-blue-900"/> Saisie Relevé</h2>
                        <div className="flex items-center text-sm bg-slate-100 px-3 py-1 rounded-lg">
                            <span className="font-bold text-slate-500 mr-2">Semaine :</span>
                            <input type="week" value={week} onChange={(e) => setWeek(e.target.value)} className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Heures Marche</label>
                                {userRole === 'ADMIN' && <button onClick={() => setEditingPrev(!editingPrev)} className="text-[10px] text-blue-900 hover:underline">Modifier Précédent</button>}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-slate-400">Préc:</span>
                                <input type="number" readOnly={!editingPrev} className={`w-full text-xs bg-transparent font-mono ${editingPrev ? 'border rounded bg-white p-1' : ''}`} value={formData[activeCompressor].lastRun || ''} onChange={e => handleInput('lastRun', e.target.value)} />
                            </div>
                            <input type="number" className="w-full border-2 border-slate-200 p-2 rounded-lg text-lg font-mono font-bold focus:border-blue-900 outline-none transition-colors" placeholder="Nouveau..." value={formData[activeCompressor].newRun || ''} onChange={e => handleInput('newRun', e.target.value)} />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Heures Charge</label>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-slate-400">Préc:</span>
                                <input type="number" readOnly={!editingPrev} className={`w-full text-xs bg-transparent font-mono ${editingPrev ? 'border rounded bg-white p-1' : ''}`} value={formData[activeCompressor].lastLoad || ''} onChange={e => handleInput('lastLoad', e.target.value)} />
                            </div>
                            <input type="number" className="w-full border-2 border-slate-200 p-2 rounded-lg text-lg font-mono font-bold focus:border-blue-900 outline-none transition-colors" placeholder="Nouveau..." value={formData[activeCompressor].newLoad || ''} onChange={e => handleInput('newLoad', e.target.value)} />
                        </div>
                      </div>
                      <textarea className="w-full border p-3 rounded-lg text-sm mb-2 focus:border-blue-900 outline-none" rows="3" placeholder="Note / Observation sur l'état du compresseur..." value={formData[activeCompressor].description} onChange={e => handleInput('description', e.target.value)}></textarea>
                </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center border-b pb-2"><Activity className="mr-2 text-blue-900"/> Analyse Performance</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Taux Charge</div>
                            <div className="font-black text-2xl text-emerald-800">{kpis.loadRate.toFixed(1)}%</div>
                            <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{width: `${kpis.loadRate}%`}}></div></div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Taux Utilisation</div>
                            <div className="font-black text-2xl text-blue-800">{kpis.utilRate.toFixed(1)}%</div>
                            <div className="text-[10px] text-blue-400 mt-1">Base hebdo 47.5h</div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6">
                        <span className="text-xs font-bold text-slate-500 uppercase">Coût Élec. Estimé</span>
                        <span className="font-mono font-black text-slate-800 text-lg">{kpis.costHT.toFixed(0)} <span className="text-xs">DT</span></span>
                    </div>

                    <button onClick={handleSubmit} className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 shadow-lg transition-all flex items-center justify-center">
                        <CheckCircle2 size={18} className="mr-2"/> Valider Relevé
                    </button>
                </div>
            </div>

            <div className="lg:col-span-12">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-700 flex items-center">
                            <BarChart3 className="mr-2 text-blue-900" size={18} />
                            Consommation Air Comprimé par Semaine
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">12 dernières semaines</span>
                    </div>

                    {weeklyAirChartData.length === 0 ? (
                        <div className="h-72 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed">
                            Aucun relevé hebdomadaire disponible pour générer le graphique
                        </div>
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyAirChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'energyKwh') return [`${formatNumber(value)} kWh`, 'Consommation'];
                                            if (name === 'runDelta') return [`${formatNumber(value)} h`, 'Heures marche'];
                                            if (name === 'loadDelta') return [`${formatNumber(value)} h`, 'Heures charge'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="energyKwh"
                                        name="Consommation"
                                        stroke="#1e3a8a"
                                        strokeWidth={3}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="runDelta"
                                        name="Heures marche"
                                        stroke="#dc2626"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="loadDelta"
                                        name="Heures charge"
                                        stroke="#16a34a"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-12">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center"><Wrench className="mr-2 text-red-600"/> Tableau de Maintenance</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.keys(MAINT_INTERVALS).map(key => {
                            const Icon = MAINT_ICONS[key];
                            const rem = kpis.maintStatus[key].remaining;
                            const total = MAINT_INTERVALS[key];
                            const isWarning = rem < (total * 0.2);
                            
                            return (
                                <div key={key} className={`flex flex-col p-4 border rounded-xl hover:shadow-lg transition-all relative overflow-hidden group ${isWarning ? 'bg-red-50 border-red-200' : 'bg-slate-50'}`}>
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={40}/></div>
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">{MAINT_LABELS[key]}</div>
                                    <div className={`text-xl font-black mb-2 ${getStatusColor(rem, total)}`}>{rem} h</div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                                        <div className={`h-full ${getProgressColor(rem, total)}`} style={{width: `${Math.min(100, (rem/total)*100)}%`}}></div>
                                    </div>
                                    {isWarning && <div className="text-[10px] text-red-600 font-bold mb-2 flex items-center"><AlertTriangle size={10} className="mr-1"/> Planifier</div>}
                                    <button onClick={() => setShowMaintPopup(key)} className="mt-auto w-full py-2 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors">Faire Maint.</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-12">
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center tracking-wider"><History size={16} className="mr-2"/> Historique Détaillé</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 rounded-l-lg">Date / Semaine</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Détails / Index</th>
                                    <th className="p-3">Technicien</th>
                                    <th className="p-3 text-right">Coût / Statut</th>
                                    {userRole === 'ADMIN' && <th className="p-3 text-right rounded-r-lg">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.filter(l => l.compName === COMPRESSORS.find(c => c.id === activeCompressor).name).sort((a,b)=> new Date(b._created || 0) - new Date(a._created || 0)).map(log => (
                                    <tr key={log._id || log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-medium text-slate-700">
                                            {log.type === 'MAINTENANCE' ? log.date : `Semaine ${log.week?.split('-W')[1] || '?'}`}
                                        </td>
                                        <td className="p-3">
                                            {log.type === 'MAINTENANCE' ? 
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold"><Wrench size={10} className="mr-1"/> {log.maintType}</span> : 
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold"><Activity size={10} className="mr-1"/> Relevé</span>
                                            }
                                        </td>
                                        <td className="p-3 text-slate-600 text-xs">
                                            {log.type === 'MAINTENANCE' ? `Effectué à ${log.indexDone} h` : `Marche: ${log.newRun}h | Charge: ${log.newLoad}h`}
                                        </td>
                                        <td className="p-3 text-slate-500 text-xs font-mono">
                                            {log.type === 'MAINTENANCE' ? log.details?.tech : '-'}
                                        </td>
                                        <td className="p-3 text-right font-bold">
                                            {log.type === 'MAINTENANCE' ? <span className="text-emerald-600">OK</span> : <span className="text-slate-700">{log.costHT?.toFixed(0)} DT</span>}
                                        </td>
                                        {userRole === 'ADMIN' && (
                                            <td className="p-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAirLog(log._id || log.id)}
                                                    className="text-slate-300 hover:text-red-600 transition-colors"
                                                    title="Supprimer l'enregistrement"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && <div className="text-center p-8 text-slate-400 italic">Aucun historique disponible sur le PC</div>}
                    </div>
                </div>
            </div>
        </main>
        
        {showMaintPopup && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl transform transition-all scale-100">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 flex items-center"><Wrench className="mr-2 text-red-600" size={20}/> Validation Maint.</h3>
                        <button onClick={() => setShowMaintPopup(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    
                    <div className="mb-4 text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        Vous validez la maintenance : <strong>{MAINT_LABELS[showMaintPopup]}</strong>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        handleMaintenanceDone(showMaintPopup, { date: fd.get('date'), tech: fd.get('tech'), ref: fd.get('ref'), notes: fd.get('notes') });
                    }}>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Date Intervention *</label>
                                <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 p-2 rounded-lg text-sm focus:border-red-600 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Intervenant / Technicien *</label>
                                <input name="tech" placeholder="Nom du technicien" required className="w-full border border-slate-200 p-2 rounded-lg text-sm focus:border-red-600 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Réf. Fiche Intervention *</label>
                                <input name="ref" placeholder="ex: FI-2024-001" required className="w-full border border-slate-200 p-2 rounded-lg text-sm focus:border-red-600 outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Notes / Observations</label>
                                <textarea name="notes" placeholder="Détails supplémentaires..." className="w-full border border-slate-200 p-2 rounded-lg text-sm focus:border-red-600 outline-none" rows="2"></textarea>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setShowMaintPopup(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">Annuler</button>
                            <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-all flex items-center">
                                <Check size={18} className="mr-2"/> Valider
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {notif && <div className="fixed bottom-6 right-6 px-6 py-4 bg-emerald-600 text-white rounded-xl shadow-xl z-50 font-bold flex items-center"><CheckCircle2 className="mr-2"/> {notif}</div>}
    </div>
  );
};

// ==================================================================================
// 7. MODULE ADMINISTRATION
// ==================================================================================

export default AirModule;

