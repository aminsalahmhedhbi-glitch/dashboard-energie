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
import { apiFetch, saveCollectionItem as saveData } from '../../lib/api';
import { useData } from '../../hooks/useData';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
};

const useLiveEnergy = (siteKey = 'MEGRINE') => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnergy = async () => {
      try {
        const json = await apiFetch(
          `/api/energy?site=${encodeURIComponent(siteKey)}`
        );
        setData(json || null);
        setError(null);
      } catch (error) {
        console.error('Erreur API énergie:', error);
        setError(error.message || 'Mesures indisponibles');
      }
    };

    fetchEnergy();
    const interval = setInterval(fetchEnergy, 2000);
    return () => clearInterval(interval);
  }, [siteKey]);

  return { data, error };
};

const PacMonitoringPanel = ({ title = null, siteKey = 'MEGRINE' }) => {
  const isMobileView = useIsMobile();
  const { data: lastEnergy, error } = useLiveEnergy(siteKey);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!lastEnergy) return;

    setHistory((prev) => [
      ...prev.slice(-19),
      {
        time: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        P: Number(lastEnergy.P_SUM_kW),
        Q: Number(lastEnergy.Q_SUM_kvar),
        S: Number(lastEnergy.S_SUM_kVA),
      },
    ]);
  }, [lastEnergy]);

  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-base font-black text-slate-800">{title}</h4>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Mesures temps réel momentanément indisponibles pour {siteKey}. Le suivi reprendra dès que les données seront accessibles.
        </div>
      ) : null}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Puissance Active</p>
          <p className="text-2xl font-black text-blue-900 break-words">
            {lastEnergy ? lastEnergy.P_SUM_kW : '--'} kW
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Puissance Réactive</p>
          <p className="text-2xl font-black text-red-600 break-words">
            {lastEnergy ? lastEnergy.Q_SUM_kvar : '--'} kvar
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Puissance Apparente</p>
          <p className="text-2xl font-black text-slate-900 break-words">
            {lastEnergy ? lastEnergy.S_SUM_kVA : '--'} kVA
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Facteur de puissance</p>
          <p
            className={`text-2xl font-black ${
              lastEnergy && Number(lastEnergy.PF_SUM) < 0.9
                ? 'text-red-600'
                : 'text-green-600'
            }`}
          >
            {lastEnergy ? lastEnergy.PF_SUM : '--'}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">
          Évolution Temps Réel
        </h4>

        <div className="h-[300px] sm:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: isMobileView ? 10 : 12 }}
                minTickGap={isMobileView ? 24 : 12}
              />
              <YAxis
                width={isMobileView ? 32 : 48}
                tick={{ fontSize: isMobileView ? 10 : 12 }}
              />
              <Tooltip />
              {!isMobileView && <Legend verticalAlign="top" height={36} />}

              <Line
                type="monotone"
                dataKey="P"
                name="Puissance Active"
                stroke="#1e3a8a"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="Q"
                name="Puissance Réactive"
                stroke="#dc2626"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="S"
                name="Puissance Apparente"
                stroke="#000000"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const PrintStyles = () => (
    <style>{`
      @media print {
        @page { size: landscape; margin: 0; }
        body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; background: white; }
        .no-print { display: none !important; }
        /* Force container to fill page */
        .print-container { 
            position: absolute; top: 0; left: 0; 
            width: 100vw; height: 100vh; 
            margin: 0; padding: 0; 
            overflow: hidden; 
            z-index: 9999; 
            background: white;
        }
        /* Ajustements pour que tout tienne */
        .print-scale { transform: scale(0.95); transform-origin: top center; height: 100%; }
      }
    `}</style>
);

const SitesDashboard = ({ onBack, userRole, user }) => {
  const [activeSiteTab, setActiveSiteTab] = useState('MEGRINE');
  const [historyData, setHistoryData] = useState({});
  const [showHistoryInput, setShowHistoryInput] = useState(false);
  const [showUsageConfig, setShowUsageConfig] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const [reportMonth, setReportMonth] = useState(prevMonth.toISOString().slice(0, 7));
  const [notif, setNotif] = useState(null);
  const HISTORY_DRAFT_KEY = 'italcar_sites_history_draft_v1';
  const TARGETS_DRAFT_KEY = 'italcar_sites_targets_draft_v1';

  // Pour simplifier l'historique sur le serveur simple, on charge tout 'site_history'
  const { data: allHistory } = useData('site_history');

  const [sitesDataState, setSitesDataState] = useState({
    MEGRINE: { 
        name: "Mégrine", 
        area: 32500, covered: 30100, open: 2400, glazed: 365,
        coveredBreakdown: [
            { label: "Zone A (Atelier FIAT)", value: 10100 },
            { label: "ITALCAR Gros (Magasin)", value: 10000 },
            { label: "Zone B (Atelier IVECO)", value: 9000 },
            { label: "Showroom & Réception", value: 1000 }
        ],
        energyMix: [{ name: "Électricité", value: 97, color: "bg-blue-900" }, { name: "Gaz", value: 3, color: "bg-orange-500" }], 
        elecUsage: [
            { name: "Clim/Chauffage", value: 40, ratio: "35 kWh/m²", significant: true, subUsages: [{name: "CTA", value: 60}, {name: "Split", value: 40}] }, 
            { name: "Éclairage", value: 27, ratio: "12 kWh/m²", significant: true, subUsages: [{name: "Atelier", value: 70}, {name: "Admin", value: 30}] }, 
            { name: "Air Comprimé", value: 17, ratio: "0.12 kWh/Nm³", significant: true, subUsages: [{name: "Comp 1", value: 50}, {name: "Comp 2", value: 50}] }, 
            { name: "Informatique", value: 8, ratio: "-", significant: false, subUsages: [] }, 
            { name: "Services", value: 5, ratio: "-", significant: false, subUsages: [] }, 
            { name: "Gaz (Primaire)", value: 3, ratio: "-", significant: false, subUsages: [] } 
        ],
        targets: { reduction2030: 10, renewable2030: 40 }
    },
    ELKHADHRA: { 
        name: "El Khadhra", area: 9500, covered: 7000, open: 2500, glazed: 40,
        coveredBreakdown: [{ label: "Atelier FIAT", value: 3000 }, { label: "ITALCAR Gros", value: 3000 }, { label: "Réception", value: 1000 }],
        energyMix: [{ name: "Électricité", value: 100, color: "bg-blue-900" }], 
        elecUsage: [
            { name: "Clim/Chauffage", value: 60, ratio: "45 kWh/m²", significant: true, subUsages: [] }, 
            { name: "Éclairage", value: 25, ratio: "15 kWh/m²", significant: true, subUsages: [] }, 
            { name: "Air Comprimé", value: 5, ratio: "-", significant: false, subUsages: [] }, 
            { name: "Divers", value: 10, ratio: "-", significant: false, subUsages: [] }
        ],
        targets: { reduction2030: 15, renewable2030: 20 }
    },
    LAC: { 
        name: "Lac", area: 2050, covered: 850, open: 1200, glazed: 116, 
        coveredBreakdown: [{label:"Showroom", value: 850}], 
        energyMix: [], 
        elecUsage: [
             { name: "Éclairage", value: 45, ratio: "22 kWh/m²", significant: true, subUsages: [] }, 
             { name: "Climatisation", value: 45, ratio: "25 kWh/m²", significant: true, subUsages: [] },
             { name: "Informatique", value: 10, ratio: "-", significant: false, subUsages: [] }
        ],
        targets: { reduction2030: 30, renewable2030: 50 }
    },
    NAASSEN: { 
        name: "Naassen", area: 32500, covered: 1850, open: 30680, glazed: 0, 
        coveredBreakdown: [{label:"Réception", value: 920}, {label:"Atelier FIAT", value: 900}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 10, renewable2030: 10 }
    },
    CARTHAGE: { 
        name: "Rue de Carthage", area: 320, covered: 320, open: 0, glazed: 70, 
        coveredBreakdown: [{label:"Showroom", value: 320}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 5, renewable2030: 0 }
    },
    CHARGUEYAA: { 
        name: "Chargueyaa", area: 320, covered: 320, open: 0, glazed: 70, 
        coveredBreakdown: [{label:"Showroom", value: 320}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 5, renewable2030: 0 }
    },
    AZUR: { 
        name: "Azur City", area: 130, covered: 130, open: 0, glazed: 0, 
        coveredBreakdown: [{label:"Showroom", value: 130}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 5, renewable2030: 0 }
    }
  });

  useEffect(() => {
    try {
      const savedTargets = localStorage.getItem(TARGETS_DRAFT_KEY);
      if (!savedTargets) return;
      const parsedTargets = JSON.parse(savedTargets);

      setSitesDataState(prev => {
        const next = { ...prev };
        Object.keys(parsedTargets || {}).forEach(siteKey => {
          if (next[siteKey]) {
            next[siteKey] = {
              ...next[siteKey],
              targets: {
                ...next[siteKey].targets,
                ...(parsedTargets[siteKey] || {})
              }
            };
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Erreur chargement brouillon objectifs:', error);
    }
  }, []);

  // --- GESTION DES USAGES PRINCIPAUX ---
  const handleUsageAdd = () => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        site.elecUsage = [...site.elecUsage, { name: "Nouvel Usage", value: 0, ratio: "-", significant: false, subUsages: [] }];
        return newData;
    });
  };

  const handleUsageDelete = (usageIndex) => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        site.elecUsage = site.elecUsage.filter((_, i) => i !== usageIndex);
        return newData;
    });
  };

  const handleUsageChange = (index, field, value) => {
      setSitesDataState(prev => {
          const newData = { ...prev };
          const site = newData[activeSiteTab];
          const newUsages = [...site.elecUsage];
          newUsages[index] = { ...newUsages[index], [field]: value };
          site.elecUsage = newUsages;
          return newData;
      });
  };

  // --- GESTION DES SOUS-USAGES ---
  const handleSubUsageAdd = (usageIndex) => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        const newUsages = [...site.elecUsage];
        if(!newUsages[usageIndex].subUsages) newUsages[usageIndex].subUsages = [];
        newUsages[usageIndex].subUsages.push({name: "Nouveau", value: 0});
        return newData;
    });
  };

  const handleSubUsageDelete = (usageIndex, subIndex) => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        const newUsages = [...site.elecUsage];
        newUsages[usageIndex].subUsages = newUsages[usageIndex].subUsages.filter((_, i) => i !== subIndex);
        return newData;
    });
  };

  const handleSubUsageChange = (usageIndex, subIndex, field, value) => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        const newUsages = [...site.elecUsage];
        const subUsages = [...newUsages[usageIndex].subUsages];
        subUsages[subIndex] = { ...subUsages[subIndex], [field]: value };
        newUsages[usageIndex].subUsages = subUsages;
        site.elecUsage = newUsages;
        return newData;
    });
  };

  const yearsRange = ['REF', 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]; 
  
  // Reconstitution de l'historique depuis les données "plates" du serveur + brouillon local
  useEffect(() => {
    const constructed = {};
    allHistory.forEach(item => {
      if (item.historyId) {
        const [site, year] = item.historyId.split('_');
        if (!constructed[site]) constructed[site] = {};
        constructed[site][year] = item;
      }
    });

    try {
      const savedDraft = localStorage.getItem(HISTORY_DRAFT_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        Object.keys(parsedDraft || {}).forEach(siteKey => {
          if (!constructed[siteKey]) constructed[siteKey] = {};
          Object.keys(parsedDraft[siteKey] || {}).forEach(yearKey => {
            constructed[siteKey][yearKey] = {
              ...(constructed[siteKey][yearKey] || {}),
              ...(parsedDraft[siteKey][yearKey] || {})
            };
          });
        });
      }
    } catch (error) {
      console.error('Erreur chargement brouillon historique:', error);
    }

    setHistoryData(constructed);
  }, [allHistory]);

  const initHistory = (site) => {
      if (!historyData[site]) {
          const newData = {};
          yearsRange.forEach(y => { 
              if(site === 'LAC') newData[y] = { grid: Array(12).fill(''), pvProd: Array(12).fill(''), pvExport: Array(12).fill(''), temperature: Array(12).fill('') };
              else newData[y] = { months: Array(12).fill(''), temperature: Array(12).fill('') }; 
          });
          setHistoryData(prev => ({...prev, [site]: newData}));
      }
  };

  const getSiteData = (site, year, type = 'months') => {
      const yData = historyData[site]?.[year];
      if (!yData) return Array(12).fill('');
      return yData[type] || Array(12).fill('');
  };

  const handleHistoryChange = (year, monthIdx, val, type = 'months') => {
      setHistoryData(prev => {
          const siteData = prev[activeSiteTab] || {};
          const yearData = siteData[year] || {};
          const currentArray = yearData[type] ? [...yearData[type]] : Array(12).fill('');
          currentArray[monthIdx] = val;
          return { ...prev, [activeSiteTab]: { ...siteData, [year]: { ...yearData, [type]: currentArray } } }
      });
  };

  useEffect(() => {
      try {
          localStorage.setItem(HISTORY_DRAFT_KEY, JSON.stringify(historyData));
      } catch (error) {
          console.error('Erreur sauvegarde brouillon historique:', error);
      }
  }, [historyData]);

  useEffect(() => {
      try {
          const targetsDraft = {};
          Object.keys(sitesDataState || {}).forEach(siteKey => {
              targetsDraft[siteKey] = {
                  reduction2030: sitesDataState[siteKey]?.targets?.reduction2030 ?? 0,
                  renewable2030: sitesDataState[siteKey]?.targets?.renewable2030 ?? 0
              };
          });
          localStorage.setItem(TARGETS_DRAFT_KEY, JSON.stringify(targetsDraft));
      } catch (error) {
          console.error('Erreur sauvegarde brouillon objectifs:', error);
      }
  }, [sitesDataState]);

  const saveHistory = async () => {
      const site = activeSiteTab;
      if (!historyData[site]) return;
      try {
        for (const year of Object.keys(historyData[site])) {
            const dataToSave = {
                historyId: `${site}_${year}`, 
                ...historyData[site][year]
            };
            await saveData('site_history', dataToSave);
        }
        try {
            localStorage.removeItem(HISTORY_DRAFT_KEY);
        } catch (error) {
            console.error('Erreur nettoyage brouillon historique:', error);
        }
        setNotif("Historique sauvegardé sur le PC");
        setShowHistoryInput(false);
      } catch(e) { console.error(e); setNotif("Erreur"); }
      setTimeout(() => setNotif(null), 3000);
  };

  const currentData = sitesDataState[activeSiteTab];
  const currentYear = new Date().getFullYear(); 
  const currentMonthIdx = new Date().getMonth() - 1; 

  const PerformanceWidget = () => {
      const refMonths = getSiteData(activeSiteTab, 'REF', activeSiteTab === 'LAC' ? 'grid' : 'months');
      const curMonths = getSiteData(activeSiteTab, currentYear, activeSiteTab === 'LAC' ? 'grid' : 'months');
      
      let valRefMonth = parseFloat(refMonths[currentMonthIdx]) || 0;
      let valCurMonth = parseFloat(curMonths[currentMonthIdx]) || 0;

      if (activeSiteTab === 'LAC') {
          const refProd = getSiteData(activeSiteTab, 'REF', 'pvProd')[currentMonthIdx] || 0;
          const refExp = getSiteData(activeSiteTab, 'REF', 'pvExport')[currentMonthIdx] || 0;
          const curProd = getSiteData(activeSiteTab, currentYear, 'pvProd')[currentMonthIdx] || 0;
          const curExp = getSiteData(activeSiteTab, currentYear, 'pvExport')[currentMonthIdx] || 0;
          valRefMonth += Math.max(0, refProd - refExp);
          valCurMonth += Math.max(0, curProd - curExp);
      }

      const diffMonth = valRefMonth > 0 ? ((valCurMonth - valRefMonth) / valRefMonth) * 100 : 0;
      let sumRefYTD = 0, sumCurYTD = 0;

      for (let i = 0; i <= currentMonthIdx; i++) {
          let r = parseFloat(refMonths[i]) || 0;
          let c = parseFloat(curMonths[i]) || 0;
          if (activeSiteTab === 'LAC') {
              const rp = parseFloat(getSiteData(activeSiteTab, 'REF', 'pvProd')[i]) || 0;
              const re = parseFloat(getSiteData(activeSiteTab, 'REF', 'pvExport')[i]) || 0;
              const cp = parseFloat(getSiteData(activeSiteTab, currentYear, 'pvProd')[i]) || 0;
              const ce = parseFloat(getSiteData(activeSiteTab, currentYear, 'pvExport')[i]) || 0;
              r += Math.max(0, rp - re);
              c += Math.max(0, cp - ce);
          }
          sumRefYTD += r;
          sumCurYTD += c;
      }

      const diffYTD = sumRefYTD > 0 ? ((sumCurYTD - sumRefYTD) / sumRefYTD) * 100 : 0;
      const monthName = new Date(currentYear, currentMonthIdx).toLocaleString('fr-FR', { month: 'long' });

      return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Performance Mensuelle</div>
                      <div className="text-xl font-black text-slate-800 capitalize mb-4">{monthName} {currentYear} <span className="text-sm font-normal text-slate-400">vs Réf.</span></div>
                      
                      <div className="flex items-end justify-between">
                          <div>
                              <div className="text-3xl font-black text-blue-900">{valCurMonth.toLocaleString()} <span className="text-sm text-slate-400 font-bold">kWh</span></div>
                              <div className="text-xs text-slate-500 mt-1">Réf: {valRefMonth.toLocaleString()} kWh</div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl font-bold text-lg flex items-center ${diffMonth <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {diffMonth > 0 ? <TrendingUp size={20} className="mr-2"/> : <TrendingDown size={20} className="mr-2"/>}
                              {diffMonth > 0 ? '+' : ''}{diffMonth.toFixed(1)}%
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Performance Cumulée (YTD)</div>
                      <div className="text-xl font-black text-slate-800 capitalize mb-4">Jan - {monthName} <span className="text-sm font-normal text-slate-400">vs Réf.</span></div>
                      
                      <div className="flex items-end justify-between">
                          <div>
                              <div className="text-3xl font-black text-indigo-900">{sumCurYTD.toLocaleString()} <span className="text-sm text-slate-400 font-bold">kWh</span></div>
                              <div className="text-xs text-slate-500 mt-1">Réf: {sumRefYTD.toLocaleString()} kWh</div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl font-bold text-lg flex items-center ${diffYTD <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {diffYTD > 0 ? <TrendingUp size={20} className="mr-2"/> : <TrendingDown size={20} className="mr-2"/>}
                              {diffYTD > 0 ? '+' : ''}{diffYTD.toFixed(1)}%
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const EnergyMixWidget = () => {
      const pvShare = activeSiteTab === 'LAC' ? 35 : 0; 
      const gridShare = 100 - pvShare;
      return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between overflow-hidden relative">
              <div className="flex items-center gap-2 mb-4 relative z-10">
                  <Leaf size={20} className="text-emerald-500"/>
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Origine Énergie</span>
              </div>
              <div className="flex items-center justify-center relative z-10 py-2">
                  <div className="relative w-32 h-32">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                          <path className="text-emerald-500" strokeDasharray={`${pvShare}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
                      </svg>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                          <div className="text-2xl font-black text-slate-800">{pvShare}%</div>
                          <div className="text-[8px] uppercase font-bold text-emerald-600">Renouvelable</div>
                      </div>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center relative z-10">
                  <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Réseau</div>
                      <div className="font-bold text-slate-700">{gridShare}%</div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg">
                      <div className="text-[10px] text-emerald-600 uppercase font-bold">Solaire</div>
                      <div className="font-bold text-emerald-800">{pvShare}%</div>
                  </div>
              </div>
          </div>
      );
  };

  const TechSpecsWidget = () => (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Building2 size={120}/></div>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-2 relative z-10">
              <MapPin size={20} className="text-red-600"/>
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Fiche Technique</span>
          </div>
          <div className="relative z-10">
              <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-black text-slate-800">{currentData.area.toLocaleString()}</span>
                  <span className="ml-2 text-sm font-bold text-slate-400">m² Totaux</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase">Espace Couvert</span>
                      <span className="font-black text-slate-800">{currentData.covered.toLocaleString()} m²</span>
                  </div>
                  <div className="space-y-1 pl-2">
                      {currentData.coveredBreakdown.map((zone, i) => (
                          <div key={i} className="flex justify-between text-[11px]">
                              <span className="text-slate-500">• {zone.label}</span>
                              <span className="font-bold text-slate-600">{zone.value.toLocaleString()} m²</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  // --- WIDGET SAISONNALITÉ MODIFIÉ (Temp N vs N-1) ---
  const ClimateInfoWidget = () => {
    const tempsCurrent = getSiteData(activeSiteTab, currentYear, 'temperature');
    const tempsPrev = getSiteData(activeSiteTab, currentYear - 1, 'temperature');
    
    // Mois actuel pour l'affichage (défaut Janvier si pas de données)
    const displayMonthIdx = currentMonthIdx >= 0 ? currentMonthIdx : 0;
    
    const tCurr = parseFloat(tempsCurrent[displayMonthIdx]) || 0;
    const tPrev = parseFloat(tempsPrev[displayMonthIdx]) || 0;
    const diff = tCurr - tPrev;
    const monthName = new Date(currentYear, displayMonthIdx).toLocaleString('fr-FR', { month: 'long' });

    // Interprétation automatique
    let constat = "Températures similaires à N-1.";
    let impact = "Impact neutre sur CVC.";
    if (diff > 1.5) {
        const isSummer = [5,6,7,8].includes(displayMonthIdx);
        constat = `Mois de ${monthName} plus chaud (+${diff.toFixed(1)}°C)`;
        impact = isSummer ? "Surconsommation Climatisation probable." : "Baisse besoins Chauffage.";
    } else if (diff < -1.5) {
        const isWinter = [0,1,2,10,11].includes(displayMonthIdx);
        constat = `Mois de ${monthName} plus froid (${diff.toFixed(1)}°C)`;
        impact = isWinter ? "Surconsommation Chauffage probable." : "Baisse besoins Climatisation.";
    }

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col relative overflow-hidden">
           <div className="flex items-center gap-2 mb-4">
               <ThermometerSun size={20} className="text-amber-500"/>
               <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Saisonnalité & Impact</span>
           </div>

           <div className="flex items-end gap-4 mb-4">
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Temp. {monthName} {currentYear}</div>
                    <div className="text-3xl font-black text-slate-800">{tCurr > 0 ? tCurr : '--'} <span className="text-sm font-normal text-slate-400">°C</span></div>
                </div>
                <div className="mb-1 text-xs font-bold text-slate-400">vs</div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Temp. REF</div>
                    <div className="text-xl font-bold text-slate-500">{tPrev > 0 ? tPrev : '--'} <span className="text-xs font-normal text-slate-400">°C</span></div>
                </div>
           </div>

           <div className={`mt-auto p-3 rounded-xl border ${diff > 1.5 ? 'bg-orange-50 border-orange-100' : diff < -1.5 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-2">
                    <Info size={16} className={diff > 1.5 ? 'text-orange-500' : diff < -1.5 ? 'text-blue-500' : 'text-slate-400'}/>
                    <div>
                        <div className="text-[10px] font-bold uppercase mb-1 opacity-70">Constat & Interprétation</div>
                        <div className="text-xs font-bold text-slate-700">{constat}</div>
                        <div className="text-xs text-slate-500">{impact}</div>
                    </div>
                </div>
           </div>
      </div>
    );
  };

  // --- WIDGET VISION 2030 (Ex-VisionWidget) ---
  const VisionWidget = () => {
    // Calcul de la conso 2024 (Basé sur l'historique dispo)
    const months2024 = getSiteData(activeSiteTab, 2024, activeSiteTab === 'LAC' ? 'grid' : 'months');
    const total2024 = months2024.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    
    // Projection 2025 (Basé sur 2024 pour l'instant ou partiel 2025)
    const months2025 = getSiteData(activeSiteTab, 2025, activeSiteTab === 'LAC' ? 'grid' : 'months');
    const total2025 = months2025.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const display2025 = total2025 > 0 ? total2025 : total2024; // Si 2025 vide, on affiche prévision basée sur 2024

    // Cibles
    const reductionTarget = currentData.targets?.reduction2030 || 10;
    const renewableTarget = currentData.targets?.renewable2030 || 20;
    
    // Baseline (Ref)
    const monthsRef = getSiteData(activeSiteTab, 'REF', activeSiteTab === 'LAC' ? 'grid' : 'months');
    const totalRef = monthsRef.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    
    const targetConso2030 = totalRef * (1 - (reductionTarget / 100));

    return (
    <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 rounded-2xl shadow-lg mt-8 text-white relative overflow-hidden">
         <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
             <Leaf size={200} />
         </div>
         
         <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-8">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="text-emerald-400" size={24}/>
                    <h3 className="font-black text-xl uppercase tracking-tight">Vision 2030</h3>
                </div>
                <div className="text-emerald-200 text-sm space-y-1 mb-6">
                    <p>🎯 Réduire la consommation énergétique de <strong>{reductionTarget}%</strong> d'ici 2030.</p>
                    <p>☀️ Atteindre <strong>{renewableTarget}%</strong> d'approvisionnement en énergie renouvelable.</p>
                </div>
                
                <div className="flex gap-8">
                    <div>
                        <div className="text-3xl font-black">{total2024 > 0 ? total2024.toLocaleString() : '--'} <span className="text-sm font-normal text-emerald-400">kWh</span></div>
                        <div className="text-[10px] uppercase font-bold text-emerald-300">Conso 2024</div>
                    </div>
                     <div>
                        <div className="text-3xl font-black">{display2025.toLocaleString()} <span className="text-sm font-normal text-emerald-400">kWh</span></div>
                        <div className="text-[10px] uppercase font-bold text-emerald-300">Conso 2025 </div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-emerald-300 border-b-2 border-emerald-400 inline-block">{targetConso2030.toLocaleString()} <span className="text-sm font-normal text-emerald-400">kWh</span></div>
                        <div className="text-[10px] uppercase font-bold text-emerald-300 mt-1">Cible 2030</div>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold uppercase text-emerald-300 mb-1">
                        <span>Trajectoire Efficacité</span>
                        <span>Obj: -{reductionTarget}%</span>
                    </div>
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                        {/* Barre inversée: plus on est proche de la cible, plus c'est rempli */}
                        <div className="bg-emerald-400 h-full rounded-full" style={{width: '45%'}}></div> 
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold uppercase text-emerald-300 mb-1">
                        <span>Part Renouvelable</span>
                        <span>Obj: {renewableTarget}%</span>
                    </div>
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{width: `${activeSiteTab === 'LAC' ? 35 : 0}%`}}></div>
                    </div>
                    <div className="text-[10px] text-emerald-200 mt-1 text-right">Actuel: {activeSiteTab === 'LAC' ? '35%' : '0%'}</div>
                </div>
            </div>
         </div>
    </div>
    );
  };

  const SiteTabs = () => (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Navigation multi-sites
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">
            Changez de site pour suivre ses KPI, son historique et ses mesures PAC2200.
          </div>
        </div>

        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {Object.keys(sitesDataState).map((key) => (
            <button
              key={key}
              onClick={() => setActiveSiteTab(key)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                activeSiteTab === key
                  ? 'border-blue-900 bg-blue-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-2">
                {activeSiteTab === key ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <MapPin size={14} className="text-slate-400" />
                )}
                {sitesDataState[key].name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative font-sans text-slate-600">
        <PrintStyles />
        <div className="sticky top-0 z-40 px-3 py-3 sm:px-4 lg:px-5">
            <div className="w-full">
                <ModuleHeader
                    title="Pilotage et Revues Énergétiques"
                    subtitle="Vision globale, indicateurs de performance et revues multi-sites"
                    icon={LayoutGrid}
                    user={user}
                    onHomeClick={onBack}
                    className="mb-4"
                />
            </div>
        </div>
        {false && (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="font-bold text-xl text-slate-800 tracking-tight">DASHBOARD ÉNERGIE</h1>
                        <p className="text-xs text-slate-400 font-medium">Vision Globale & Performance</p>
                    </div>
                </div>
                <div className="flex bg-white rounded-full shadow-sm border border-slate-200 p-1.5 gap-1 mt-4 md:mt-0 overflow-x-auto max-w-full">
                    {Object.keys(sitesDataState).map(key => (
                        <button key={key} onClick={() => setActiveSiteTab(key)} 
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center whitespace-nowrap ${activeSiteTab === key ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            {activeSiteTab === key && <CheckCircle2 size={12} className="mr-2"/>} {sitesDataState[key].name}
                        </button>
                    ))}
                </div>
            </div>
        </header>
        )}

        <main className="max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
            <SiteTabs />
            <PerformanceWidget />

            {['MEGRINE', 'ELKHADHRA', 'NAASSEN'].includes(activeSiteTab) && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
                                <Activity className="mr-2 text-blue-900" size={18} />
                                Monitoring Temps Réel – PAC2200
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Supervision instantanée des grandeurs électriques du site {currentData.name}
                            </p>
                        </div>
                    </div>

                    <PacMonitoringPanel
                      siteKey={activeSiteTab}
                      title={`Supervision PAC2200 - Site ${currentData.name}`}
                    />
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 relative">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center"><PieChart className="mr-2"/> Répartition des Usages (UES)</h3>
                    {userRole === 'ADMIN' && (
                        <button onClick={() => setShowUsageConfig(true)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-900 transition-colors">
                            <Settings size={16}/>
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentData.elecUsage.length > 0 ? currentData.elecUsage.map((u, i) => (
                        <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm ${u.significant ? 'font-bold text-blue-900' : 'text-slate-500 font-medium'}`}>{u.name}</span>
                                <span className="bg-white border px-2 py-0.5 rounded text-xs font-black shadow-sm">{u.value}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
                                <div className={`h-full ${u.significant ? 'bg-blue-900' : 'bg-slate-400'}`} style={{width: `${u.value}%`}}></div>
                            </div>
                            {/* Affichage des sous-usages */}
                            {u.subUsages && u.subUsages.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
                                    {u.subUsages.map((sub, idx) => (
                                        <div key={idx} className="flex justify-between text-[10px] text-slate-500">
                                            <span>• {sub.name}</span>
                                            <span className="font-mono font-bold text-slate-600">{sub.value}% <span className="text-[8px] text-slate-400">(cat)</span></span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                                <span>Ratio: <b>{u.ratio}</b></span>
                                {u.significant && <span className="text-orange-600 font-bold flex items-center"><AlertTriangle size={10} className="mr-1"/> Significatif</span>}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed">Données de répartition non disponibles pour ce site.</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <TechSpecsWidget />
                 <EnergyMixWidget />
                 <ClimateInfoWidget />
            </div>

            <VisionWidget />
        </main>

        {/* MODAL CONFIGURATION USAGES AVEC SOUS-USAGES */}
        {showUsageConfig && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative flex flex-col h-[85vh]">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Configuration Répartition - {currentData.name}</h3>
                            <p className="text-xs text-slate-400">Gérez les catégories d'usages principaux et secondaires.</p>
                        </div>
                        <button onClick={() => setShowUsageConfig(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        {/* BOUTON AJOUT USAGE PRINCIPAL */}
                        <button onClick={handleUsageAdd} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold flex items-center justify-center hover:bg-blue-50 transition-colors text-sm">
                            <PlusCircle size={18} className="mr-2"/> Ajouter un Usage Principal
                        </button>

                        {currentData.elecUsage.map((u, i) => (
                            <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-200 group relative">
                                {/* BOUTON SUPPRESSION USAGE PRINCIPAL */}
                                <button onClick={() => handleUsageDelete(i)} className="absolute top-4 right-4 text-slate-300 hover:text-red-600 transition-colors">
                                    <Trash2 size={16}/>
                                </button>

                                <div className="grid grid-cols-12 gap-4 items-end mb-6">
                                    <div className="col-span-6">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nom Usage</label>
                                        <input type="text" value={u.name} onChange={e => handleUsageChange(i, 'name', e.target.value)} className="w-full p-2 border rounded font-bold text-sm"/>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Part (%)</label>
                                        <input type="number" value={u.value} onChange={e => handleUsageChange(i, 'value', parseInt(e.target.value))} className="w-full p-2 border rounded font-mono text-sm"/>
                                    </div>
                                    <div className="col-span-3 flex items-center justify-center gap-4">
                                        <button onClick={() => handleUsageChange(i, 'significant', !u.significant)} className={`p-2 rounded-lg ${u.significant ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-300 border'}`} title="Significatif">
                                            <AlertTriangle size={18}/>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* SECTION SOUS-USAGES */}
                                <div className="pl-6 border-l-2 border-blue-100 ml-2 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Sous-Usages</h4>
                                        <button onClick={() => handleSubUsageAdd(i)} className="text-[10px] bg-blue-900 text-white px-2 py-1 rounded font-bold flex items-center">
                                            <PlusCircle size={10} className="mr-1"/> Ajouter
                                        </button>
                                    </div>
                                    
                                    {u.subUsages?.map((sub, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input type="text" value={sub.name} onChange={e => handleSubUsageChange(i, idx, 'name', e.target.value)} className="flex-1 p-1.5 text-xs border rounded bg-white" placeholder="Nom"/>
                                            <input type="number" value={sub.value} onChange={e => handleSubUsageChange(i, idx, 'value', parseInt(e.target.value))} className="w-16 p-1.5 text-xs border rounded bg-white font-mono" placeholder="%"/>
                                            {/* BOUTON SUPPRESSION SOUS-USAGE */}
                                            <button onClick={() => handleSubUsageDelete(i, idx)} className="p-1.5 text-slate-300 hover:text-red-500">
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                    {(!u.subUsages || u.subUsages.length === 0) && <div className="text-[10px] text-slate-400 italic">Aucun sous-usage configuré.</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t flex justify-end">
                        <button onClick={() => setShowUsageConfig(false)} className="bg-blue-900 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-800">Enregistrer les modifications</button>
                    </div>
                </div>
            </div>
        )}

        {showHistoryInput && (
             <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                 <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                     <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                         <div>
                             <h3 className="font-bold text-lg text-slate-800 flex items-center"><Database className="mr-2 text-blue-900"/> Saisie Historique - {currentData.name}</h3>
                             <p className="text-xs text-slate-400 mt-1">Brouillon mémorisé automatiquement pendant la saisie.</p>
                         </div>
                         <button onClick={() => setShowHistoryInput(false)}><X size={20}/></button>
                     </div>
                     
                     <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-slate-50/50">
                         {/* NOUVEAU: Saisie des objectifs Vision 2030 */}
                         <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6">
                             <h4 className="font-bold text-emerald-800 mb-4 flex items-center text-sm uppercase"><Target size={16} className="mr-2"/> Objectifs Vision 2030 (Admin)</h4>
                             <div className="grid grid-cols-2 gap-8 max-w-2xl">
                                 <div>
                                     <label className="block text-xs font-bold text-emerald-700 mb-1">Cible Réduction Consommation (%)</label>
                                     <input type="number" 
                                        value={currentData.targets?.reduction2030 ?? 0}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value || '0', 10);
                                            setSitesDataState(prev => ({
                                                ...prev,
                                                [activeSiteTab]: {
                                                    ...prev[activeSiteTab],
                                                    targets: {
                                                        ...prev[activeSiteTab].targets,
                                                        reduction2030: value
                                                    }
                                                }
                                            }));
                                        }}
                                        className="border border-emerald-200 rounded p-2 w-full font-bold text-emerald-900" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-emerald-700 mb-1">Cible Énergie Renouvelable (%)</label>
                                     <input type="number" 
                                        value={currentData.targets?.renewable2030 ?? 0}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value || '0', 10);
                                            setSitesDataState(prev => ({
                                                ...prev,
                                                [activeSiteTab]: {
                                                    ...prev[activeSiteTab],
                                                    targets: {
                                                        ...prev[activeSiteTab].targets,
                                                        renewable2030: value
                                                    }
                                                }
                                            }));
                                        }}
                                        className="border border-emerald-200 rounded p-2 w-full font-bold text-emerald-900" />
                                 </div>
                             </div>
                         </div>

                         {yearsRange.map(year => (
                             <div key={year} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                 <div className="flex items-center gap-2 mb-4">
                                     <span className={`font-bold text-sm px-3 py-1 rounded-full ${year === 'REF' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                         {year === 'REF' ? 'BASELINE (Réf)' : year}
                                     </span>
                                     <div className="h-px bg-slate-100 flex-1"></div>
                                 </div>
                                 
                                 <div className="overflow-x-auto">
                                     <div className="min-w-max">
                                         <div className="flex gap-2 mb-2 pl-32">
                                             {['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'].map(m => (
                                                 <div key={m} className="w-20 text-center text-[10px] font-bold text-slate-400">{m}</div>
                                             ))}
                                         </div>

                                         {activeSiteTab === 'LAC' ? (
                                             <>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-32 text-xs font-bold text-blue-900 uppercase">Réseau STEG</div>
                                                    {getSiteData('LAC', year, 'grid').map((val, i) => (
                                                        <input key={i} type="number" className="w-20 p-2 text-center text-xs border rounded focus:border-blue-900 outline-none" placeholder="-"
                                                            value={val} onChange={e => handleHistoryChange(year, i, e.target.value, 'grid')} />
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-32 text-xs font-bold text-orange-600 uppercase">Prod. PV</div>
                                                    {getSiteData('LAC', year, 'pvProd').map((val, i) => (
                                                        <input key={i} type="number" className="w-20 p-2 text-center text-xs border border-orange-200 rounded focus:border-orange-600 outline-none bg-orange-50" placeholder="-"
                                                            value={val} onChange={e => handleHistoryChange(year, i, e.target.value, 'pvProd')} />
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-32 text-xs font-bold text-green-600 uppercase">Export STEG</div>
                                                    {getSiteData('LAC', year, 'pvExport').map((val, i) => (
                                                        <input key={i} type="number" className="w-20 p-2 text-center text-xs border border-green-200 rounded focus:border-green-600 outline-none bg-green-50" placeholder="-"
                                                            value={val} onChange={e => handleHistoryChange(year, i, e.target.value, 'pvExport')} />
                                                    ))}
                                                </div>
                                             </>
                                         ) : (
                                             <div className="flex items-center gap-2 mb-2">
                                                 <div className="w-32 text-xs font-bold text-slate-600 uppercase">Consommation</div>
                                                 {getSiteData(activeSiteTab, year).map((val, i) => (
                                                     <input key={i} type="number" className="w-20 p-2 text-center text-xs border rounded focus:border-blue-900 outline-none" placeholder="-"
                                                         value={val} onChange={e => handleHistoryChange(year, i, e.target.value)} />
                                                 ))}
                                             </div>
                                         )}
                                         
                                         {/* LIGNE TEMPÉRATURE AJOUTÉE */}
                                         <div className="flex items-center gap-2 mt-2 border-t border-slate-50 pt-2">
                                             <div className="w-32 text-xs font-bold text-amber-500 uppercase flex items-center"><Thermometer size={12} className="mr-1"/> Temp. Moy (°C)</div>
                                             {getSiteData(activeSiteTab, year, 'temperature').map((val, i) => (
                                                 <input key={i} type="number" className="w-20 p-2 text-center text-xs border border-amber-100 bg-amber-50/30 rounded focus:border-amber-500 outline-none" placeholder="°C"
                                                     value={val} onChange={e => handleHistoryChange(year, i, e.target.value, 'temperature')} />
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <div className="p-4 border-t bg-white flex justify-end gap-2">
                         <button onClick={saveHistory} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center"><Save size={18} className="mr-2"/> Enregistrer </button>
                     </div>
                 </div>
             </div>
        )}

        {showReport && (
            <div className="fixed inset-0 bg-slate-900/90 z-[70] overflow-auto flex justify-center items-center p-0 print-container">
                <div className="bg-white shadow-2xl relative overflow-hidden flex flex-col print-scale" style={{width: '29.7cm', height: '21cm'}}> 
                    
                    {/* Floating Toolbar - Cachée à l'impression grâce à "no-print" */}
                    <div className="absolute top-1/2 right-[-80px] -translate-y-1/2 no-print flex flex-col gap-3 z-50 bg-white/90 p-2 rounded-l-xl shadow-lg border border-slate-200 backdrop-blur-sm transform hover:translate-x-[-10px] transition-transform">
                        <div className="flex flex-col items-center gap-2">
                            <input type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} className="bg-transparent border border-slate-200 rounded text-xs font-bold p-1 outline-none text-slate-700 w-24"/>
                            <button onClick={() => window.print()} className="bg-blue-900 text-white p-3 rounded-full hover:bg-blue-800 shadow-md transition-all active:scale-95" title="Imprimer"><Printer size={20}/></button>
                            <button onClick={() => setShowReport(false)} className="bg-red-50 text-red-600 p-3 rounded-full hover:bg-red-100 border border-red-100" title="Fermer"><X size={20}/></button>
                        </div>
                    </div>

                    <div className="h-full p-8 flex flex-col bg-white">
                        {/* Header A4 */}
                        <div className="flex justify-between items-center border-b-4 border-blue-900 pb-4 mb-6">
                            <div className="flex items-center gap-6">
                                <BrandLogo size="h-16"/>
                                <div className="h-12 w-px bg-slate-200"></div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Rapport Mensuel</h1>
                                    <div className="text-blue-900 font-bold uppercase tracking-widest text-sm">Performance Énergétique & ISO 50001</div>
                                </div>
                            </div>
                            <div className="text-right bg-slate-50 px-6 py-3 rounded-xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Période concernée</div>
                                <div className="text-2xl font-black text-slate-800 capitalize">
                                    {new Date(reportMonth).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}
                                </div>
                                <div className="text-xs font-bold text-slate-500 mt-1 flex items-center justify-end bg-white px-2 py-1 rounded border border-slate-200 w-fit ml-auto">
                                    <MapPin size={10} className="mr-1"/> {currentData.name}
                                </div>
                            </div>
                        </div>

                        {/* Body Grid Layout */}
                        <div className="flex-1 grid grid-cols-12 gap-6">
                            
                            {/* KPI Column */}
                            <div className="col-span-4 space-y-4">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center tracking-widest"><TrendingUp size={14} className="mr-2"/> Indicateurs Clés</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Consommation Totale</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-slate-900">--</span>
                                                <span className="text-sm font-bold text-slate-400">kWh</span>
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-200 w-full"></div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ratio Performance</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-blue-900">--</span>
                                                <span className="text-xs font-bold text-slate-400">kWh / m²</span>
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-200 w-full"></div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Évolution vs Réf (N-1)</div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-black text-emerald-600">--%</span>
                                                <div className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Objectif atteint</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-900 p-5 rounded-2xl text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h3 className="text-xs font-black text-blue-300 uppercase mb-2">Coût Énergétique</h3>
                                        <div className="text-3xl font-black mb-1">-- <span className="text-sm">DT</span></div>
                                        <div className="text-[10px] text-blue-200">Hors TVA et Redevances</div>
                                    </div>
                                    <div className="absolute right-0 bottom-0 opacity-10"><Zap size={80}/></div>
                                </div>
                            </div>

                            {/* Main Content Column */}
                            <div className="col-span-8 flex flex-col gap-4">
                                {/* Charts Section */}
                                <div className="grid grid-cols-2 gap-4 h-auto">
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Répartition Détaillée (UES)</h4>
                                        <div className="flex-1 space-y-2">
                                            {currentData.elecUsage.map((u, i) => (
                                                <div key={i} className="text-[10px]">
                                                    <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                                                        <span>{u.name}</span>
                                                        <span>{u.value}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-1 rounded-full mb-0.5">
                                                        <div className="bg-blue-900 h-full rounded-full" style={{width: `${u.value}%`}}></div>
                                                    </div>
                                                    {/* Sous usages dans le rapport */}
                                                    <div className="pl-2 flex gap-2 flex-wrap text-[8px] text-slate-500">
                                                        {u.subUsages && u.subUsages.map((s, idx) => (
                                                            <span key={idx}>• {s.name} ({s.value}%)</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Comparatif Température (N vs N-1)</h4>
                                        <div className="flex-1 flex flex-col justify-center items-center text-center p-4 bg-slate-50 rounded-lg">
                                            <ThermometerSun size={32} className="text-amber-500 mb-2"/>
                                            <div className="font-bold text-slate-700 text-xs">Analyse Saisonnière</div>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Comparaison des degrés-jours et impact thermique sur la consommation CVC.
                                                <br/>
                                                <span className="italic">(Voir détail widget dashboard)</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vision 2030 & Bonnes Pratiques */}
                                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4">
                                    <div className="grid grid-cols-2 gap-6 h-full">
                                        <div>
                                            <h4 className="text-xs font-black text-emerald-800 uppercase mb-3 flex items-center"><Target size={12} className="mr-2 text-emerald-600"/> Vision 2030</h4>
                                            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm space-y-2">
                                                <div>
                                                    <div className="text-[9px] uppercase font-bold text-slate-400">Objectif Réduction</div>
                                                    <div className="text-lg font-black text-emerald-800">-{currentData.targets?.reduction2030 || 10}% <span className="text-[10px] font-normal text-slate-500">Conso</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] uppercase font-bold text-slate-400">Objectif Renouvelable</div>
                                                    <div className="text-lg font-black text-emerald-800">{currentData.targets?.renewable2030 || 20}% <span className="text-[10px] font-normal text-slate-500">Mix</span></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-blue-900 uppercase mb-3 flex items-center"><Lightbulb size={12} className="mr-2 text-amber-500"/> Bonnes Pratiques</h4>
                                            <ul className="text-[10px] text-slate-600 space-y-1.5 list-disc pl-3 leading-relaxed">
                                                <li>Éteindre les climatiseur et l'éclairage en zone inoccupée (Bureaux vides).</li>
                                                <li>Maintenir la consigne clim à 26°C en été.</li>
                                                <li>Vérifier les fuites du réseau air comprimé chaque semaine.</li>
                                                <li>Favoriser l'éclairage naturel dans les zones vitrées.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer A4 - Validation et Signature */}
                        <div className="mt-auto pt-6 border-t-2 border-slate-100 flex justify-between items-end">
                            <div className="text-[9px] text-slate-400 uppercase tracking-widest space-y-1">
                                <div>ITALCAR S.A. • Siège Social</div>
                                <div>Système de Management de l'Énergie ISO 50001</div>
                            </div>
                            
                            <div className="flex flex-col items-end text-right">
                                <div className="text-[10px] font-bold text-slate-800 uppercase mb-4 leading-tight">
                                    ITALCAR S.A.<br/>
                                    Responsable Système Management Intégrés
                                </div>
                                <div className="text-[10px] text-slate-500 mb-6 italic">
                                    Fait à Tunis, le {new Date().toLocaleDateString('fr-FR')}
                                </div>
                                <div className="h-20 w-48 border border-slate-300 rounded bg-slate-50 flex items-center justify-center">
                                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Signature & Cachet</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 no-print">
            {userRole === 'ADMIN' && (
                <button onClick={() => { initHistory(activeSiteTab); setShowHistoryInput(true); }} className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 group relative">
                    <Database size={20} />
                </button>
            )}
            <button onClick={() => setShowReport(true)} className="bg-blue-900 hover:bg-blue-800 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110 group relative">
                <Printer size={24} />
            </button>
        </div>

        {notif && <div className="fixed bottom-6 left-6 px-6 py-4 bg-emerald-600 text-white rounded-xl shadow-xl z-50 font-bold flex items-center animate-in slide-in-from-bottom-4"><CheckCircle2 className="mr-2"/> {notif}</div>}
    </div>
  );
};


// ==================================================================================
// 8. NOUVEAUX MODULES : MAINTENANCE PRÉVENTIVE + QSE
// ==================================================================================

export default SitesDashboard;

