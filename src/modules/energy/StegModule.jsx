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
import { getSiteDisplayName } from '../../lib/sites';
import { useData } from '../../hooks/useData';
import { emitFacturesChanged } from '../../hooks/useFactures';
import EstimationClimatique from './EstimationClimatique';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
};

const useLiveEnergy = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchEnergy = async () => {
      try {
        const json = await apiFetch('/api/energy');
        console.log("LIVE DATA:", json); // باش نتأكد يخدم
        setData(json);
      } catch (err) {
        console.error("Erreur API:", err);
      }
    };

    fetchEnergy();
    const interval = setInterval(fetchEnergy, 2000);

    return () => clearInterval(interval);
  }, []);

  return data;
};


const PacMonitoringPanel = ({ title = null }) => {
  const isMobileView = useIsMobile();
  const lastEnergy = useLiveEnergy();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!lastEnergy) return;

    setHistory((prev) => [
      ...prev.slice(-19),
      {
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        P: Number(lastEnergy.P_SUM_kW),
        Q: Number(lastEnergy.Q_SUM_kvar),
        S: Number(lastEnergy.S_SUM_kVA),
      }
    ]);
  }, [lastEnergy]);

  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-base font-black text-slate-800">{title}</h4>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Puissance Active</p>
          <p className="text-2xl font-black text-blue-900 break-words">
            {lastEnergy ? lastEnergy.P_SUM_kW : "--"} kW
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Puissance Réactive</p>
          <p className="text-2xl font-black text-red-600 break-words">
            {lastEnergy ? lastEnergy.Q_SUM_kvar : "--"} kvar
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Puissance Apparente</p>
          <p className="text-2xl font-black text-slate-900 break-words">
            {lastEnergy ? lastEnergy.S_SUM_kVA : "--"} kVA
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase">Facteur de puissance</p>
          <p className={`text-2xl font-black ${
            lastEnergy && Number(lastEnergy.PF_SUM) < 0.9 ? "text-red-600" : "text-green-600"
          }`}>
            {lastEnergy ? lastEnergy.PF_SUM : "--"}
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

const normalizeHistorySeries = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : Array(12).fill('');
    } catch (e) {
      return Array(12).fill('');
    }
  }
  return Array(12).fill('');
};



// ==================================================================================
// 2. MODULE ÉNERGIE & FACTURATION (STEG)
// ==================================================================================
const StegModule = ({ onBack, userRole, user }) => {
  const isMobileView = useIsMobile();
  const [currentSite, setCurrentSite] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingPrev, setEditingPrev] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // CHARGEMENT DONNÉES DEPUIS PC
  const [logs, setLogs] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const { data: siteHistoryRecords } = useData('site_history', { intervalMs: 0 });
  const SITE_KEYS_BY_ID = {
    1: 'MEGRINE',
    2: 'ELKHADHRA',
    3: 'NAASSEN',
    4: 'LAC',
    5: 'AZUR',
    6: 'CARTHAGE',
    7: 'CHARGUEYAA'
  };
  
  const SITES = [
    { id: 1, name: "MT 1 - Mégrine", code: "MEG-001", type: "MT", icon: Factory },
    { id: 2, name: "MT 2 - El Khadhra", code: "ELK-002", type: "MT", icon: Factory },
    { id: 3, name: "MT 3 - Naassen", code: "NAS-003", type: "MT", icon: Factory },
    { id: 4, name: getSiteDisplayName('LAC'), code: "LAC-001", type: "BT_PV", icon: Store }, 
    { id: 5, name: "BT 2 - Azur City", code: "AZU-002", type: "BT", icon: Store },
    { id: 6, name: "BT 3 - Avenue de Carthage", code: "CAR-003", type: "BT", icon: Store },
    { id: 7, name: getSiteDisplayName('CHARGUEYAA'), code: "CHG-004", type: "BT", icon: Store }
  ];

  const [siteAdvancedConfigs, setSiteAdvancedConfigs] = useState({
    1: {
      unitPriceKwh: 0.291, powerUnitPrice: 5.000,
      unitPriceKwhBT: 0.391, fixedFeesBT: 115.500, servicesBT: 0.000, fteGazBT: 0.000,
      vatRate: 19, rtt: 3.500, municipalTaxRate: 0.010,
      taxCLRate: 0.005, taxFTERate: 0.005, powerOverrunPenalty: 25.000,
      subscribedPower: 250, emptyLosses: 1300
    },
    2: {
      unitPriceKwh: 0.291, powerUnitPrice: 5.000,
      unitPriceKwhBT: 0.391, fixedFeesBT: 115.500, servicesBT: 0.000, fteGazBT: 0.000,
      vatRate: 19, rtt: 3.500, municipalTaxRate: 0.010,
      taxCLRate: 0.005, taxFTERate: 0.005, powerOverrunPenalty: 25.000,
      subscribedPower: 70, emptyLosses: 670
    },
    3: {
      unitPriceKwh: 0.291, powerUnitPrice: 5.000,
      unitPriceKwhBT: 0.391, fixedFeesBT: 115.500, servicesBT: 0.000, fteGazBT: 0.000,
      vatRate: 19, rtt: 3.500, municipalTaxRate: 0.010,
      taxCLRate: 0.005, taxFTERate: 0.005, powerOverrunPenalty: 25.000,
      subscribedPower: 30, emptyLosses: 160
    },
    4: {
      unitPriceKwh: 0.291, powerUnitPrice: 5.000,
      unitPriceKwhBT: 0.391, fixedFeesBT: 115.500, servicesBT: 0.000, fteGazBT: 0.000,
      vatRate: 19, rtt: 3.500, municipalTaxRate: 0.010,
      taxCLRate: 0.005, taxFTERate: 0.005, powerOverrunPenalty: 25.000,
      subscribedPower: 30, emptyLosses: 0
    },
    5: {
      unitPriceKwh: 0.291, powerUnitPrice: 5.000,
      unitPriceKwhBT: 0.391, fixedFeesBT: 115.500, servicesBT: 0.000, fteGazBT: 0.000,
      vatRate: 19, rtt: 3.500, municipalTaxRate: 0.010,
      taxCLRate: 0.005, taxFTERate: 0.005, powerOverrunPenalty: 25.000,
      subscribedPower: 20, emptyLosses: 0
    },
    6: {
      unitPriceKwh: 0.291, powerUnitPrice: 5.000,
      unitPriceKwhBT: 0.391, fixedFeesBT: 115.500, servicesBT: 0.000, fteGazBT: 0.000,
      vatRate: 19, rtt: 3.500, municipalTaxRate: 0.010,
      taxCLRate: 0.005, taxFTERate: 0.005, powerOverrunPenalty: 25.000,
      subscribedPower: 15, emptyLosses: 0
    },
    7: {
      unitPriceKwh: 0.291, powerUnitPrice: 5.000,
      unitPriceKwhBT: 0.391, fixedFeesBT: 115.500, servicesBT: 0.000, fteGazBT: 0.000,
      vatRate: 19, rtt: 3.500, municipalTaxRate: 0.010,
      taxCLRate: 0.005, taxFTERate: 0.005, powerOverrunPenalty: 25.000,
      subscribedPower: 15, emptyLosses: 0
    }
  });

  const [isConfigUnlocked, setIsConfigUnlocked] = useState(false);
    
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 7),
    lastIndex: '', newIndex: '', 
    lastIndexPv: '', newIndexPv: '', 
    previousBalance: '',
    productionPv: '',
    cosPhi: '', reactiveCons: '', maxPower: '', 
    lateFees: '', relanceFees: '', adjustment: '',
  });

  const formatMoney = (amount) => amount?.toLocaleString('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 3 });
  const formatNumber = (num) => num?.toLocaleString('fr-TN', { maximumFractionDigits: 2 });
  const formatInputDisplay = (val) => { if (val === '' || val === undefined || val === null) return ''; const cleanVal = val.toString().replace(/[^0-9.-]/g, ''); return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
  const parseInputValue = (val) => val.replace(/\s/g, ''); 

 useEffect(() => {
  const siteLogs = billingHistory
    .filter((l) => String(l.siteId) === String(currentSite))
    .sort((a, b) => {
      const dateA = new Date(a._createdAt || a.recordDate || a.date || 0).getTime();
      const dateB = new Date(b._createdAt || b.recordDate || b.date || 0).getTime();
      return dateB - dateA;
    });

  if (siteLogs.length > 0) {
    const lastLog = siteLogs[0];
    const currentSiteType = SITES.find(s => s.id === currentSite)?.type;

    setFormData(prev => ({
      ...prev,
      lastIndex: lastLog?.newIndex ?? '',
      ...(currentSiteType === 'BT_PV'
        ? {
            lastIndexPv: lastLog?.newIndexPv ?? '',
            previousBalance: lastLog?.newCarryOver ?? '',
            productionPv: currentSite === 4 ? lastLog?.productionPv ?? '' : prev.productionPv
          }
        : {})
    }));
  }
}, [currentSite, billingHistory]);

  const handleInputChange = (field, value) => {
    const cleanValue = ['lastIndex', 'newIndex', 'lastIndexPv', 'newIndexPv', 'previousBalance', 'productionPv', 'maxPower', 'reactiveCons'].includes(field) ? parseInputValue(value) : value;
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
  };

  const currentAdvancedConfig = siteAdvancedConfigs[currentSite] || {};

  const handleAdvancedConfigChange = (field, value) =>
    setSiteAdvancedConfigs(prev => ({
      ...prev,
      [currentSite]: {
        ...prev[currentSite],
        [field]: value
      }
    }));
// Maitre à jour l'historique lors de présence d'une nouvelle valeur 
  const calculateMetrics = () => {
    const site = SITES.find(s => s.id === currentSite);
    const cfg = siteAdvancedConfigs[currentSite] || {};
    
    const newIdx = parseFloat(formData.newIndex) || 0;
    const oldIdx = parseFloat(formData.lastIndex) || 0;
    const consumptionGrid = Math.max(0, newIdx - oldIdx);

    const lateFees = parseFloat(formData.lateFees) || 0;
    const relanceFees = parseFloat(formData.relanceFees) || 0;
    const adjustment = parseFloat(formData.adjustment) || 0;
    const rtt = parseFloat(cfg.rtt) || 0;
    const vat = (parseFloat(cfg.vatRate) || 0) / 100;

    if (site.type.startsWith('BT')) {
        let billedKwh = consumptionGrid;
        let newCarryOver = 0;
        let productionPv = 0;
        let productionPvInjectee = 0;
        let prevBalance = 0;
        let currentMonthBalance = 0;
        let totalBalance = 0;
        let consommationTotale = 0;
        let coutBrut = 0;
        let gainPv = 0;
        let unitPriceBT = parseFloat(cfg.unitPriceKwhBT) || 0.391;

        if (site.type === 'BT_PV') {
            const newIdxPv = parseFloat(formData.newIndexPv) || 0;
            const oldIdxPv = parseFloat(formData.lastIndexPv) || 0;
            prevBalance = parseFloat(formData.previousBalance) || 0;
            productionPvInjectee = Math.max(0, newIdxPv - oldIdxPv);
            productionPv = site.id === 4 ? Math.max(0, parseFloat(formData.productionPv) || 0) : productionPvInjectee;
            currentMonthBalance = consumptionGrid - productionPvInjectee;
            totalBalance = currentMonthBalance + prevBalance;
            if (totalBalance > 0) { billedKwh = totalBalance; newCarryOver = 0; } 
            else { billedKwh = 0; newCarryOver = totalBalance; }

            if (site.id === 4) {
                consommationTotale = consumptionGrid + (productionPv - productionPvInjectee);
                coutBrut = consommationTotale * unitPriceBT;
            }
        }

        const fixedFees = parseFloat(cfg.fixedFeesBT) || 115.5;
        const services = parseFloat(cfg.servicesBT) || 0;
        
        const consoAmountHT = billedKwh * unitPriceBT;
        const fixedAmountHT = fixedFees + services;
        const totalHT = consoAmountHT + fixedAmountHT;
        const totalTTC = totalHT * (1 + vat);
        
        const contributionCL = billedKwh * (parseFloat(cfg.taxCLRate)||0.005);
        const fteElec = billedKwh * (parseFloat(cfg.taxFTERate)||0.005);
        const fteGaz = parseFloat(cfg.fteGazBT) || 0;
        
        const totalFinalTTC = totalTTC + contributionCL + rtt + fteElec + fteGaz;
        const netToPay = totalFinalTTC + adjustment + lateFees + relanceFees;
        if (site.id === 4) {
            gainPv = coutBrut - netToPay;
        }
        
        return { 
            type: site.type, consumptionGrid, productionPv, productionPvInjectee, currentMonthBalance, prevBalance, totalBalance, 
            billedKwh, newCarryOver, consoAmountHT, fixedAmountHT, totalTTC, contributionCL, fteElec, fteGaz, netToPay, totalFinalTTC, totalHT,
            consommationTotale, coutBrut, gainPv, unitPriceKwh: unitPriceBT
        };
    }
    else {
        const cosPhi = parseFloat(formData.cosPhi) || 1;
        const maxPower = parseFloat(formData.maxPower) || 0;
        const reactiveCons = parseFloat(formData.reactiveCons) || 0;
        
        const unitPrice = parseFloat(cfg.unitPriceKwh) || 0.291;
        const subPower = parseFloat(cfg.subscribedPower) || 0;
        const powerPrice = parseFloat(cfg.powerUnitPrice) || 5.000;
        const muniTaxRate = parseFloat(cfg.municipalTaxRate) || 0.010;
        const emptyLosses = parseFloat(cfg.emptyLosses) || 0;
        const powerOverrunPrice = parseFloat(cfg.powerOverrunPenalty) || 25.000;

        const loadLosses = consumptionGrid * 0.02; 
        const billedKwh = consumptionGrid + emptyLosses + loadLosses;
        const baseEnergyAmountHT = billedKwh * unitPrice;

        let adjustmentRate = 0;
        let adjustmentType = 'none';
        if (cosPhi >= 0.91 && cosPhi <= 1) { 
            adjustmentRate = -(Math.round((cosPhi - 0.90) * 100) * 0.005); adjustmentType = 'bonus'; 
        } else if (cosPhi >= 0.80 && cosPhi <= 0.90) { 
            adjustmentRate = 0; adjustmentType = 'neutral'; 
        } else { 
            adjustmentType = 'penalty'; 
            let p = 0; 
            if(cosPhi<0.8) p+=Math.round((0.8-Math.max(cosPhi,0.75))*100)*0.005; 
            if(cosPhi<0.75) p+=Math.round((0.75-Math.max(cosPhi,0.7))*100)*0.01; 
            if(cosPhi<0.7) p+=Math.round((0.7-Math.max(cosPhi,0.6))*100)*0.015; 
            if(cosPhi<0.6) p+=Math.round((0.6-cosPhi)*100)*0.02; 
            adjustmentRate = p; 
        }
        const cosPhiAdjustmentAmount = baseEnergyAmountHT * adjustmentRate;

        const powerOverrun = Math.max(0, maxPower - subPower);
        const powerOverrunAmount = powerOverrun * powerOverrunPrice;

        const total1_HT = baseEnergyAmountHT + cosPhiAdjustmentAmount;
        const total1_TTC = total1_HT * (1 + vat);
        
        const powerPremium = subPower * powerPrice;
        const total2_HT = powerPremium + lateFees + relanceFees + powerOverrunAmount;
        const total2_TTC = total2_HT * (1 + vat);
        
        const municipalTax = billedKwh * muniTaxRate;

        const netToPay = total1_TTC + total2_TTC + rtt + municipalTax + adjustment;

        return { 
            type: 'MT', energyRecorded: consumptionGrid, loadLosses, billedKwh, 
            baseEnergyAmountHT, adjustmentRate, adjustmentType, cosPhiAdjustmentAmount, 
            total1_TTC, total1_HT, powerPremium, total2_HT, total2_TTC, municipalTax, 
            netToPay, powerOverrun, powerOverrunAmount, reactiveCons, subPower
        };
    }
  };
 //history state for billing 
 const fetchBillingHistory = async () => {
    try {
        const data = await apiFetch('/api/factures?limit=500');

        const sortedData = Array.isArray(data)
            ? [...data].sort((a, b) => {
                const dateA = new Date(a._createdAt || a.recordDate || a.date || 0).getTime();
                const dateB = new Date(b._createdAt || b.recordDate || b.date || 0).getTime();
                return dateB - dateA;
              })
            : [];

        setBillingHistory(sortedData);
    } catch (error) {
        console.error('Erreur chargement billingHistory:', error);
        setBillingHistory([]);
    }
 };
 useEffect(() => {
    fetchBillingHistory();
 }, []);

 const handleDeleteBilling = async (billingId) => {
    if (userRole !== 'ADMIN') return;

    const confirmed = window.confirm("Voulez-vous vraiment supprimer cette facture ?");
    if (!confirmed) return;

    try {
        await apiFetch(`/api/factures/${billingId}`, {
            method: 'DELETE'
        });

        setBillingHistory((prev) => prev.filter((item) => String(item._id || item.id) !== String(billingId)));
        setNotification({ msg: "Facture supprimee", type: 'success' });
        await fetchBillingHistory();
        emitFacturesChanged();
    } catch (error) {
        if (error?.status === 404) {
            setBillingHistory((prev) => prev.filter((item) => String(item._id || item.id) !== String(billingId)));
            setNotification({ msg: "Facture deja supprimee, historique actualise", type: 'success' });
            await fetchBillingHistory();
            emitFacturesChanged();
        } else {
            console.error(error);
            setNotification({ msg: "Erreur suppression facture", type: 'error' });
        }
    }

    setTimeout(() => setNotification(null), 3000);
 };

 console.log("billingHistory:", billingHistory);
 console.log("currentSite:", currentSite);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const site = SITES.find(s => s.id === currentSite);
    const metrics = calculateMetrics();

    const newLog = {
        id: `FACT-${Date.now()}`,
        date: formData.date,
        recordDate: formData.date,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        site: SITE_KEYS_BY_ID[currentSite],
        siteId: currentSite,
        siteName: site.name,
        siteType: site.type,
        consommationKwh: Number(metrics.billedKwh ?? metrics.consumptionGrid ?? metrics.energyRecorded ?? 0),
        pmaxKva: parseFloat(formData.maxPower) || 0,
        cosPhi: parseFloat(formData.cosPhi) || 0,
        prixDt: Number(metrics.netToPay ?? metrics.totalFinalTTC ?? 0),
        Pmax: parseFloat(formData.maxPower) || 0,
        ...formData,
        productionPvInjectee:
          Number(
            metrics.productionPvInjectee ??
            formData.pvExport ??
            formData.productionPvInjectee ??
            formData.exportSteg ??
            formData.pvInjected ??
            0
          ),
        consommationTotale: Number(metrics.consommationTotale ?? 0),
        coutBrut: Number(metrics.coutBrut ?? 0),
        gainPv: Number(metrics.gainPv ?? 0),
        ...metrics
    };

    try {
        await apiFetch('/api/factures', {
            method: "POST",
            body: JSON.stringify(newLog)
        });
        
        setNotification({ msg: "Relevé enregistré ", type: 'success' });
        await fetchBillingHistory();
        emitFacturesChanged();

        setFormData(prev => ({
            ...prev,
            lastIndex: formData.newIndex,
            newIndex: '',
            ...(site.type === 'BT_PV'
                ? {
                    lastIndexPv: formData.newIndexPv,
                    newIndexPv: '',
                    previousBalance: metrics.newCarryOver,
                    ...(site.id === 4 ? { productionPv: '' } : {})
                  }
                : {}),
            cosPhi: '',
            reactiveCons: '',
            maxPower: '',
            lateFees: '',
            relanceFees: '',
            adjustment: '',
            manualLastIndex: false
        }));

    } catch (error) {
        setNotification({ msg: "Erreur sauvegarde", type: 'error' });
    }

    setTimeout(() => setNotification(null), 3000);
 };
  console.log("billingHistory:", billingHistory);  
  const liveMetrics = calculateMetrics();
  const monthlyConsumptionData = useMemo(() => {
    const siteHistory = billingHistory.filter(l => l.siteId == currentSite);
    const monthlyMap = new Map();

    siteHistory.forEach((log) => {
      const rawDate = log.recordDate || log.date || log._createdAt || log.timestamp;
      if (!rawDate) return;

      let monthKey = '-';
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}/.test(rawDate)) {
        monthKey = rawDate.slice(0, 7);
      } else {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      if (monthKey === '-') return;

      const consommation = Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + consommation);
    });

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-24)
      .map(([month, consommation]) => ({
        month,
        consommation: Number(consommation.toFixed(2))
      }));
  }, [billingHistory, currentSite]);

  const normalizeSiteLabel = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const filteredBillingHistory = useMemo(() => {
    const targetSite = SITES.find((site) => site.id === currentSite);
    const targetId = String(currentSite);
    const targetName = normalizeSiteLabel(targetSite?.name);
    const targetCode = normalizeSiteLabel(targetSite?.code);

    return billingHistory.filter((log) => {
      const logSiteId = log.siteId != null ? String(log.siteId) : '';
      const logSiteName = normalizeSiteLabel(log.siteName);
      const logSiteCode = normalizeSiteLabel(log.siteCode || log.code);

      return (
        logSiteId === targetId ||
        logSiteName === targetName ||
        (targetCode && logSiteCode === targetCode)
      );
    });
  }, [billingHistory, currentSite]);

  const sortedBillingHistory = useMemo(() => {
    const rows = [...filteredBillingHistory];
    rows.sort((a, b) => {
      if (sortBy === 'amount') {
        const amountA = Number(a.netToPay ?? 0);
        const amountB = Number(b.netToPay ?? 0);
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      }

      const dateA = new Date(a._createdAt || a.recordDate || a.date || 0).getTime();
      const dateB = new Date(b._createdAt || b.recordDate || b.date || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return rows;
  }, [filteredBillingHistory, sortBy, sortOrder]);

  const billingCostChartData = useMemo(() => {
    const monthlyMap = new Map();

    filteredBillingHistory.forEach((log) => {
      const rawDate = log.recordDate || log.date || log._createdAt || log.timestamp;
      if (!rawDate) return;

      let monthKey = '-';
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}/.test(rawDate)) {
        monthKey = rawDate.slice(0, 7);
      } else {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      if (monthKey === '-') return;

      const amount = Number(log.netToPay ?? 0);
      const energy = Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0);
      const current = monthlyMap.get(monthKey) || { month: monthKey, cout: 0, energie: 0 };
      current.cout += amount;
      current.energie += energy;
      monthlyMap.set(monthKey, current);
    });

    return Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-24)
      .map((row) => ({
        ...row,
        cout: Number(row.cout.toFixed(3)),
        energie: Number(row.energie.toFixed(2))
      }));
  }, [filteredBillingHistory]);

  const billingStats = useMemo(() => {
    const totalCost = filteredBillingHistory.reduce((sum, log) => sum + Number(log.netToPay ?? 0), 0);
    const totalEnergy = filteredBillingHistory.reduce((sum, log) => sum + Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0), 0);
    const avgPmax = filteredBillingHistory.length
      ? filteredBillingHistory.reduce((sum, log) => sum + Number(log.Pmax ?? log.maxPower ?? 0), 0) / filteredBillingHistory.length
      : 0;
    const avgCosPhi = filteredBillingHistory.length
      ? filteredBillingHistory.reduce((sum, log) => sum + Number(log.cosPhi ?? log.PF_SUM ?? 0), 0) / filteredBillingHistory.length
      : 0;
    const costPerKwh = totalEnergy > 0 ? totalCost / totalEnergy : 0;
    return { totalCost, totalEnergy, avgPmax, avgCosPhi, costPerKwh };
  }, [filteredBillingHistory]);

  const billingAnomalies = useMemo(() => {
    if (!filteredBillingHistory.length) return [];
    const avgEnergy = billingStats.totalEnergy / filteredBillingHistory.length;

    return filteredBillingHistory.filter((log) => {
      const energy = Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0);
      const cosPhi = Number(log.cosPhi ?? log.PF_SUM ?? 1);
      const pmax = Number(log.Pmax ?? log.maxPower ?? 0);
      return energy > avgEnergy * 1.3 || cosPhi < 0.95 || pmax > billingStats.avgPmax * 1.2;
    }).slice(0, 3);
  }, [filteredBillingHistory, billingStats]);

  const predictionData = useMemo(() => {
    const monthlyMap = new Map();

    filteredBillingHistory.forEach((log) => {
      const rawDate = log.recordDate || log.date || log._createdAt || log.timestamp;
      if (!rawDate) return;

      let monthKey = '-';

      if (typeof rawDate === 'string' && /^\d{4}-\d{2}/.test(rawDate)) {
        monthKey = rawDate.slice(0, 7);
      } else {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      if (monthKey === '-') return;

      const energy = Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0);
      const cost = Number(log.netToPay ?? 0);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, energy: 0, cost: 0 });
      }

      const current = monthlyMap.get(monthKey);
      current.energy += energy;
      current.cost += cost;
    });

    const monthlyRows = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const recent = monthlyRows.slice(-3);

    if (recent.length === 0) {
      return { predictedCost: 0, predictedEnergy: 0, basedOn: 0, trend: 0 };
    }

    if (recent.length === 1) {
      return {
        predictedCost: recent[0].cost,
        predictedEnergy: recent[0].energy,
        basedOn: 1,
        trend: 0
      };
    }

    const avgCostDelta = recent.slice(1).reduce((sum, item, index) => sum + (item.cost - recent[index].cost), 0) / (recent.length - 1);
    const avgEnergyDelta = recent.slice(1).reduce((sum, item, index) => sum + (item.energy - recent[index].energy), 0) / (recent.length - 1);

    const last = recent[recent.length - 1];
    const predictedCost = Math.max(0, last.cost + avgCostDelta);
    const predictedEnergy = Math.max(0, last.energy + avgEnergyDelta);
    const trend = last.cost !== 0 ? ((predictedCost - last.cost) / last.cost) * 100 : 0;

    return {
      predictedCost,
      predictedEnergy,
      basedOn: recent.length,
      trend
    };
  }, [filteredBillingHistory]);



  const SITE_SURFACES = {
    1: 32500, // MEGRINE
    2: 9500,  // ELKHADHRA
    3: 32500, // NAASSEN
    4: 2050,  // LAC
    5: 130,   // AZUR
    6: 320,   // CARTHAGE
    7: 320    // CHARGUEYAA
  };

  const SITE_HISTORY_KEYS = {
    1: 'MEGRINE',
    2: 'ELKHADHRA',
    3: 'NAASSEN',
    4: 'LAC',
    5: 'AZUR',
    6: 'CARTHAGE',
    7: 'CHARGUEYAA'
  };

  const SITE_CLIMATE_CONFIG = {
    1: { latitude: 36.7699, longitude: 10.2294, partCVC: 0.4 },
    2: { latitude: 36.8399, longitude: 10.1947, partCVC: 0.4 },
    3: { latitude: 36.6466, longitude: 10.1012, partCVC: 0.35 },
    4: { latitude: 36.8421, longitude: 10.2723, partCVC: 0.55 },
    5: { latitude: 36.8664, longitude: 10.3321, partCVC: 0.45 },
    6: { latitude: 36.8531, longitude: 10.3235, partCVC: 0.45 },
    7: { latitude: 36.8531, longitude: 10.3235, partCVC: 0.45 }
  };

  const siteHistoryById = useMemo(() => {
    const map = new Map();
    (siteHistoryRecords || []).forEach((item) => {
      if (item?.historyId) {
        map.set(String(item.historyId), item);
      }
    });
    return map;
  }, [siteHistoryRecords]);

  const billingHistoryByMonth = useMemo(() => {
    const map = new Map();

    filteredBillingHistory.forEach((log) => {
      const rawDate = log.recordDate || log.date || log._createdAt || log.timestamp;
      if (!rawDate) return;

      let monthKey = '';
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}/.test(rawDate)) {
        monthKey = rawDate.slice(0, 7);
      } else {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      if (!monthKey) return;

      const energy = Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0);
      if (!Number.isFinite(energy) || energy <= 0) return;

      map.set(monthKey, (map.get(monthKey) || 0) + energy);
    });

    return map;
  }, [filteredBillingHistory]);

  const getSiteHistoryMonthValue = (siteKey, year, monthIdx) => {
    const seriesType = siteKey === 'LAC' ? 'grid' : 'months';
    const historyRow = siteHistoryById.get(`${siteKey}_${year}`);
    const historySeries = normalizeHistorySeries(historyRow?.[seriesType]);
    const historyValue = Number(historySeries[monthIdx] || 0);

    if (historyValue > 0) {
      return historyValue;
    }

    const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    return Number(billingHistoryByMonth.get(monthKey) || 0);
  };

  const performanceSiteData = useMemo(() => {
    const pmaxHistorique = filteredBillingHistory.length
      ? Math.max(...filteredBillingHistory.map((log) => Number(log.Pmax ?? log.maxPower ?? 0)))
      : 0;

    const cosPhiValues = filteredBillingHistory
      .map((log) => Number(log.cosPhi ?? log.PF_SUM ?? 0))
      .filter((value) => value > 0);

    const cosPhiMoyenne = cosPhiValues.length
      ? cosPhiValues.reduce((sum, value) => sum + value, 0) / cosPhiValues.length
      : 0;

    const surfaceTotale = Number(SITE_SURFACES[currentSite] || 0);

    const consoTotaleHistorique = filteredBillingHistory.reduce(
      (sum, log) => sum + Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0),
      0
    );

    const indicateurPerformanceGlobal = surfaceTotale > 0 ? consoTotaleHistorique / surfaceTotale : 0;

    const siteKey = SITE_HISTORY_KEYS[currentSite];
    const currentYearPerf = new Date().getFullYear();
    const currentMonthPerf = new Date().getMonth();

    let tauxOptimisationAnnuel = 0;
    let optimisationAvailable = false;

    if (siteKey) {
      const refRow = siteHistoryById.get(`${siteKey}_REF`);
      const refSeriesType = siteKey === 'LAC' ? 'grid' : 'months';

      if (refRow) {
        const refSeries = normalizeHistorySeries(refRow[refSeriesType]);
        const annualOptimisations = [];

        for (let offset = 1; offset <= 6; offset += 1) {
          const baseDate = new Date(currentYearPerf, currentMonthPerf - offset, 1);
          const histYear = baseDate.getFullYear();
          const histMonthIdx = baseDate.getMonth();
          const currentValue = getSiteHistoryMonthValue(siteKey, histYear, histMonthIdx);
          const refSameMonth = Number(refSeries[histMonthIdx] || 0);

          if (refSameMonth > 0 && currentValue > 0) {
            annualOptimisations.push((currentValue - refSameMonth) / refSameMonth);
          }
        }

        if (annualOptimisations.length === 6) {
          tauxOptimisationAnnuel =
            annualOptimisations.reduce((sum, value) => sum + value, 0) / 6;
          optimisationAvailable = true;
        }
      }
    }

    return {
      pmaxHistorique,
      cosPhiMoyenne,
      indicateurPerformanceGlobal,
      tauxOptimisationAnnuel,
      optimisationAvailable
    };
  }, [filteredBillingHistory, currentSite, siteHistoryById, billingHistoryByMonth]);

  const indexEstimation = useMemo(() => {
    const siteKey = SITE_HISTORY_KEYS[currentSite];
    if (!siteKey) {
      return { available: false, reason: "Site non configuré pour l'estimation." };
    }

    const selectedDate = formData.date || new Date().toISOString().slice(0, 7);
    const [selectedYearStr, selectedMonthStr] = selectedDate.split('-');
    const selectedYear = Number(selectedYearStr);
    const selectedMonthIdx = Math.max(0, Number(selectedMonthStr) - 1);

    const refRow = siteHistoryById.get(`${siteKey}_REF`);
    if (!refRow) {
      return { available: false, reason: "Historique REF introuvable pour ce site." };
    }

    const refSeriesType = siteKey === 'LAC' ? 'grid' : 'months';
    const refSeries = normalizeHistorySeries(refRow[refSeriesType]);
    const refMonthValue = Number(refSeries[selectedMonthIdx] || 0);

    if (!refMonthValue || refMonthValue <= 0) {
      return { available: false, reason: "Historique REF du même mois manquant." };
    }

    const monthlyOptimisations = [];
    for (let offset = 1; offset <= 6; offset += 1) {
      const baseDate = new Date(selectedYear, selectedMonthIdx - offset, 1);
      const histYear = baseDate.getFullYear();
      const histMonthIdx = baseDate.getMonth();

      const currentValue = getSiteHistoryMonthValue(siteKey, histYear, histMonthIdx);
      const refSameMonth = Number(refSeries[histMonthIdx] || 0);

      if (refSameMonth > 0 && currentValue > 0) {
        const optimisationMonth = (currentValue - refSameMonth) / refSameMonth;
        monthlyOptimisations.push(optimisationMonth);
      }
    }

    if (monthlyOptimisations.length < 6) {
      return { available: false, reason: "Pas assez d'historique pour calculer l'optimisation 6 mois." };
    }

    const optimisation6Mois =
      monthlyOptimisations.reduce((sum, value) => sum + value, 0) / 6;

    const tauxOptimisation = Math.max(0, Math.min(1 + optimisation6Mois, 1));
    const facteurClimatique = 1;
    const consommationEstimee = refMonthValue * tauxOptimisation * facteurClimatique;
    const ancienIndex = Number(formData.lastIndex || 0);
    const nouvelIndexEstime = ancienIndex + consommationEstimee;

    return {
      available: true,
      siteKey,
      referenceMonthConsumption: refMonthValue,
      optimisation6Mois,
      tauxOptimisation,
      facteurClimatique,
      consommationEstimee,
      nouvelIndexEstime,
      monthsUsed: monthlyOptimisations.length
    };
  }, [currentSite, formData.date, formData.lastIndex, siteHistoryById, billingHistoryByMonth]);

  const latestBilledMonthForSite = useMemo(() => {
    const monthKeys = filteredBillingHistory
      .map((log) => String(log.recordDate || log.date || '').slice(0, 7))
      .filter((value) => /^\d{4}-\d{2}$/.test(value))
      .sort();

    return monthKeys.length ? monthKeys[monthKeys.length - 1] : '';
  }, [filteredBillingHistory]);

  const climateEstimationContext = useMemo(() => {
    const siteKey = SITE_HISTORY_KEYS[currentSite];
    const climateConfig = SITE_CLIMATE_CONFIG[currentSite] || SITE_CLIMATE_CONFIG[1];
    const selectedMonth = formData.date || latestBilledMonthForSite;

    if (!siteKey || !selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
      return { available: false, reason: "Mois cible indisponible pour l'analyse climatique." };
    }

    const [selectedYearStr, selectedMonthStr] = selectedMonth.split('-');
    const selectedYear = Number(selectedYearStr);
    const selectedMonthIdx = Math.max(0, Number(selectedMonthStr) - 1);
    const previousYearSameMonth = getSiteHistoryMonthValue(siteKey, selectedYear - 1, selectedMonthIdx);
    const refRow = siteHistoryById.get(`${siteKey}_REF`);
    const refSeries = normalizeHistorySeries(refRow?.[siteKey === 'LAC' ? 'grid' : 'months']);
    const fallbackRefValue = Number(refSeries[selectedMonthIdx] || 0);
    const climateReferenceConsumption = previousYearSameMonth > 0 ? previousYearSameMonth : fallbackRefValue;
    const tauxOptimisationBrut =
      typeof indexEstimation.optimisation6Mois === 'number'
        ? indexEstimation.optimisation6Mois
        : performanceSiteData.optimisationAvailable
          ? performanceSiteData.tauxOptimisationAnnuel
          : 0;

    if (!(climateReferenceConsumption > 0)) {
      return { available: false, reason: "Reference N-1 ou REF manquante pour l'estimation climatique." };
    }

    const dernierMoisFacture =
      latestBilledMonthForSite && /^\d{4}-\d{2}$/.test(latestBilledMonthForSite)
        ? latestBilledMonthForSite
        : (() => {
            const targetDate = new Date(`${selectedMonth}-01T00:00:00`);
            targetDate.setMonth(targetDate.getMonth() - 1);
            return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          })();

    return {
      available: true,
      siteKey,
      selectedMonth,
      dernierMoisFacture,
      consoRefN_1: climateReferenceConsumption,
      tauxOpti: tauxOptimisationBrut,
      partCVC: climateConfig.partCVC,
      coordinates: {
        latitude: climateConfig.latitude,
        longitude: climateConfig.longitude
      }
    };
  }, [
    currentSite,
    filteredBillingHistory,
    formData.date,
    indexEstimation.optimisation6Mois,
    latestBilledMonthForSite,
    performanceSiteData.optimisationAvailable,
    performanceSiteData.tauxOptimisationAnnuel,
    siteHistoryById
  ]);

  const currentSiteObj = SITES.find(s => s.id === currentSite) || SITES[0];
  const isBT = currentSiteObj.type.startsWith('BT');
  const isMT = currentSiteObj.type === 'MT';
  const displayMetrics = liveMetrics;
  const CurrentIcon = currentSiteObj.icon;
    
  return (
    <div className="bg-slate-50 min-h-screen pb-10">
        <div className="sticky top-0 z-30 px-3 py-3 sm:px-4 lg:px-5">
            <div className="w-full">
                <ModuleHeader
                    title="Dépenses Énergétiques"
                    subtitle={
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${isBT ? 'bg-red-600 text-white' : 'bg-blue-900 text-white'}`}>
                                {isBT ? 'BASSE TENSION' : 'MOYENNE TENSION'}
                            </span>
                            <span className="font-semibold text-slate-700">Facturation {currentSiteObj.name}</span>
                            <span className="flex items-center"><MapPin size={10} className="mr-1"/> {currentSiteObj.code}</span>
                        </div>
                    }
                    icon={CurrentIcon}
                    user={user}
                    onHomeClick={onBack}
                    iconClassName={isBT ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-900'}
                    actions={
                        <>
                            <button onClick={() => setShowUserGuide(true)} className="flex items-center bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 transition-colors">
                                <BookOpen size={16} className="mr-2" />
                                Guide
                            </button>
                            {isMT && <button onClick={() => setShowHelp(true)} className="flex items-center bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 transition-colors border border-blue-100">
                                <HelpCircle size={16} className="mr-2" />
                                Cos φ
                            </button>}
                        </>
                    }
                />
            </div>
        </div>
        {false && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full mr-2 transition-colors text-slate-500"><ArrowLeft size={20} /></button>
                    <div className={`p-2 rounded-lg ${isBT ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-900'}`}>
                        <CurrentIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-lg font-black text-slate-800 tracking-tight leading-none uppercase break-words">Facturation {currentSiteObj.name}</h1>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${isBT ? 'bg-red-600 text-white' : 'bg-blue-900 text-white'}`}>
                                {isBT ? 'BASSE TENSION' : 'MOYENNE TENSION'}
                            </span>
                            <span className="flex items-center"><MapPin size={10} className="mr-1"/> {currentSiteObj.code}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 w-full lg:w-auto">
                    <HeaderInfoDisplay darkText={true} />
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => setShowUserGuide(true)} className="flex-1 sm:flex-none justify-center flex items-center bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 transition-colors"><BookOpen size={16} className="mr-2" /> Guide</button>
                        {isMT && <button onClick={() => setShowHelp(true)} className="flex-1 sm:flex-none justify-center flex items-center bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 transition-colors border border-blue-100"><HelpCircle size={16} className="mr-2" /> Cos φ</button>}
                    </div>
                </div>
            </div>
        </header>
        )}

        {showUserGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowUserGuide(false)}>
                <div className="bg-white p-8 rounded-2xl max-w-4xl w-full shadow-2xl relative overflow-hidden h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 flex items-center">
                                <BookOpen className="mr-3 text-blue-900" size={28}/> Guide de Collecte
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">Procédures physiques pour les relevés d'index</p>
                        </div>
                        <button onClick={() => setShowUserGuide(false)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full"><X size={20} className="text-slate-600"/></button>
                    </div>

                    <div className="overflow-y-auto flex-1 space-y-8 pr-2">
                        <div className="bg-slate-50 p-3 sm:p-6 rounded-xl border border-slate-200 overflow-hidden">
                            <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center"><Factory className="mr-2"/> Compteurs Moyenne Tension (MT)</h4>
                            <p className="text-sm text-slate-600 mb-4">Concerne : Mégrine, El Khadhra, Naassen.</p>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-900">
                                    <h5 className="font-bold text-slate-800 mb-2">Procédure de Relevé</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed text-justify">
                                        Pour la lecture des données du compteur, Appuyer brièvement sur le bouton poussoir supérieur (Disp.) pour faire apparaître le contrôle display puis Appuyer brièvement une seconde fois, l'indication ST-DATA s'affiche.
                                        <br/><br/>
                                        Ensuite, Appuyer et maintenir la pression, jusqu'à l'apparition du premier affichage (n°compteur).
                                        <br/><br/>
                                        Puis, une brève impulsion sur ce même bouton fait avancer d'un pas le défilement des index. A la fin de la liste, END s'affiche.
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h5 className="font-bold text-slate-800 mb-2">Codes OBIS à Relever</h5>
                                    <ul className="text-xs text-slate-500 space-y-1 font-mono">
                                        <li><strong>1.8.0</strong> : Cumul Énergie Active (kWh) [Puissance]</li>
                                        <li><strong>Réactif</strong> : (Index Energie Réactive)</li>
                                        <li><strong>Cos Phi</strong> : Relever le facteur de puissance affiché</li>
                                        <li className="text-slate-400 italic">(Pas de relevé Soir/Nuit ni Pointe requis)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                            <h4 className="text-lg font-bold text-orange-800 mb-4 flex items-center"><Sun className="mr-2"/> Photovoltaïque & BT</h4>
                            <p className="text-sm text-slate-600 mb-4">Concerne : Showroom Lac (BT+PV).</p>
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-orange-100">
                                    <h5 className="font-bold text-slate-800 mb-1">Compteur STEG Bidirectionnel</h5>
                                    <p className="text-xs text-slate-500 mb-2">Ce compteur affiche deux sens de flux :</p>
                                    <ul className="text-xs text-slate-500 list-disc pl-5">
                                        <li><strong>Code 1.8.0</strong> : Consommation prise du réseau (Import).</li>
                                        <li><strong>Code 2.8.0</strong> : Surplus injecté dans le réseau (Export).</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
                <div className="bg-white p-8 rounded-2xl max-w-3xl w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 flex items-center">
                                <HelpCircle className="mr-3 text-blue-600" size={28}/> Comprendre le Cos φ
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">Impact sur la facturation et l'efficacité énergétique</p>
                        </div>
                        <button onClick={() => setShowHelp(false)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full"><X size={20} className="text-slate-600"/></button>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider px-1">
                            <span className="text-red-600">Pénalité</span>
                            <span className="text-slate-500">Neutre</span>
                            <span className="text-emerald-600">Bonus</span>
                        </div>
                        <div className="h-12 w-full rounded-xl flex overflow-hidden shadow-inner border border-slate-200 relative">
                            <div className="w-[40%] bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs border-r border-white" title="< 0.8">
                                &lt; 0.80
                            </div>
                            <div className="w-[30%] bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border-r border-white" title="0.8 - 0.9">
                                0.8 - 0.90
                            </div>
                            <div className="w-[30%] bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs" title="> 0.9">
                                &gt; 0.90
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                            <span>0.50</span>
                            <span>0.80</span>
                            <span>0.90</span>
                            <span>1.00</span>
                        </div>
                    </div>
                    <div className="text-sm text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p><strong>Note :</strong> Le Cosinus Phi mesure l'efficacité de votre installation. Un mauvais Cos φ (inférieur à 0.8) entraîne une facturation de l'énergie réactive par la STEG. Assurez-vous que vos batteries de condensateurs fonctionnent correctement.</p>
                    </div>
                </div>
            </div>
        )}

         <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6">
            <div className="grid grid-cols-7 gap-2">
                {SITES.map((site) => {
                    const isActive = currentSite === site.id;
                    const isBtSite = site.type.startsWith('BT');

                    return (
                        <button
                            key={site.id}
                            onClick={() => setCurrentSite(site.id)}
                            className={`rounded-2xl border px-2 py-3 text-left transition-all min-h-[118px] overflow-hidden ${
                                isActive
                                    ? (isBtSite
                                        ? 'bg-gradient-to-br from-red-600 to-red-500 text-white border-red-600 shadow-lg shadow-red-200/70'
                                        : 'bg-gradient-to-br from-blue-900 to-blue-700 text-white border-blue-900 shadow-lg shadow-blue-200/70')
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/15' : (isBtSite ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-900')}`}>
                                    <site.icon size={16} />
                                </div>

                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                                    isActive ? 'bg-white/15 text-white' : (isBtSite ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-900')
                                }`}>
                                    {isBtSite ? 'BT' : 'MT'}
                                </span>
                            </div>

                            <div className="mt-3">
                                <div className={`text-[11px] xl:text-xs font-black leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                    {site.name}
                                </div>
                                <div className={`mt-1 text-[10px] font-semibold ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                                    {site.code}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
                <div className="xl:col-span-7">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                            <Calendar className="mr-2 text-slate-400" size={20} /> Période de Facturation
                        </h2>
                        <input type="month" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-blue-900 outline-none" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center"><Zap size={12} className="mr-1"/> Index Actif</h3>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 relative">
                                <div>
                                    <label className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        Ancien Index
                                        {userRole === 'ADMIN' && <Edit2 size={12} className="cursor-pointer text-slate-400 hover:text-blue-900" onClick={() => setEditingPrev(!editingPrev)} />}
                                    </label>
                                    <div className="relative">
                                        <input type="text" value={formatInputDisplay(formData.lastIndex)} 
                                            onChange={(e) => handleInputChange('lastIndex', e.target.value)} 
                                            readOnly={userRole !== 'ADMIN' && !editingPrev}
                                            className={`w-full border rounded p-2 text-sm font-mono ${userRole !== 'ADMIN' && !editingPrev ? 'bg-slate-200 text-slate-500' : 'bg-white border-orange-300'}`} />
                                    {userRole !== 'ADMIN' && !editingPrev && <Lock size={12} className="absolute right-3 top-3 text-slate-400"/>}
                                    </div>
                                    {editingPrev && <p className="text-[10px] text-orange-600 mt-1 flex items-center"><AlertTriangle size={10} className="mr-1"/> Modification manuelle activée</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-blue-900 mb-1 block">Nouvel Index *</label>
                                    <input type="text" required value={formatInputDisplay(formData.newIndex)} onChange={(e) => handleInputChange('newIndex', e.target.value)} className="w-full text-lg border-2 border-blue-200 rounded p-2 font-mono focus:border-blue-900 outline-none" />
                                </div>
                                <div className="text-right text-xs font-bold text-blue-600">Conso: {formatNumber(liveMetrics.consumptionGrid || liveMetrics.energyRecorded)} kWh</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                {isBT ? <Sun size={12} className="mr-1"/> : <Settings size={12} className="mr-1"/>} 
                                {isBT ? 'Photovoltaïque & Solde' : 'Paramètres Techniques'}
                            </h3>
                            
                            {currentSiteObj.type === 'BT_PV' ? (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[10px] font-bold text-orange-800">Ancien PV</label><input type="text" value={formatInputDisplay(formData.lastIndexPv)} onChange={e => handleInputChange('lastIndexPv', e.target.value)} className="w-full text-xs p-1 border rounded" /></div>
                                        <div><label className="text-[10px] font-bold text-orange-800">Nouveau PV</label><input type="text" value={formatInputDisplay(formData.newIndexPv)} onChange={e => handleInputChange('newIndexPv', e.target.value)} className="w-full text-xs p-1 border rounded font-mono" /></div>
                                    </div>
                                    <div><label className="text-xs font-bold text-slate-600">Solde N-1</label><input type="text" value={formatInputDisplay(formData.previousBalance)} onChange={e => handleInputChange('previousBalance', e.target.value)} className="w-full text-sm p-2 border rounded" /></div>
                                    {currentSite === 4 && (
                                        <div>
                                            <label className="text-xs font-bold text-emerald-700">Production PV</label>
                                            <input
                                                type="text"
                                                value={formatInputDisplay(formData.productionPv)}
                                                onChange={e => handleInputChange('productionPv', e.target.value)}
                                                className="w-full text-sm p-2 border rounded border-emerald-200 bg-white font-mono"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : currentSiteObj.type === 'MT' ? (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-bold text-slate-500">Cos φ *</label><input type="number" step="0.01" required value={formData.cosPhi} onChange={e => handleInputChange('cosPhi', e.target.value)} className="w-full border p-2 rounded text-sm" /></div>
                                        <div><label className="text-[10px] font-bold text-slate-500">P. Max (kVA) *</label><input type="number" required value={formData.maxPower} onChange={e => handleInputChange('maxPower', e.target.value)} className="w-full border p-2 rounded text-sm" /></div>
                                    </div>
                                    <div><label className="text-[10px] font-bold text-slate-500">Réactif (kVarh)</label><input type="number" value={formData.reactiveCons} onChange={e => handleInputChange('reactiveCons', e.target.value)} className="w-full border p-2 rounded text-sm" /></div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500 text-center italic">
                                    Site BT Standard - Paramètres fixes appliqués.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Frais & Ajustements</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="relative"><span className="absolute left-2 top-2 text-slate-400 text-xs">DT</span><input type="number" placeholder="Retard" value={formData.lateFees} onChange={e => handleInputChange('lateFees', e.target.value)} className="w-full pl-8 p-2 border rounded text-sm" /></div>
                            <div className="relative"><span className="absolute left-2 top-2 text-slate-400 text-xs">DT</span><input type="number" placeholder="Relance" value={formData.relanceFees} onChange={e => handleInputChange('relanceFees', e.target.value)} className="w-full pl-8 p-2 border rounded text-sm" /></div>
                            <div className="relative"><span className="absolute left-2 top-2 text-slate-400 text-xs">DT</span><input type="number" placeholder="Ajustement" value={formData.adjustment} onChange={e => handleInputChange('adjustment', e.target.value)} className="w-full pl-8 p-2 border rounded text-sm" /></div>
                        </div>
                    </div>

                    <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center ${isBT ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-900 hover:bg-blue-800'}`}>
                        <Save size={18} className="mr-2" /> Valider & Sauvegarder 
                    </button>
                </form>
                </div>

                <div className="xl:col-span-5">
                    <div className={`bg-white p-6 rounded-xl shadow-lg border transition-all duration-300 relative overflow-hidden ${isBT ? 'border-red-200 ring-2 ring-red-50' : 'border-blue-200 ring-2 ring-blue-50'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">{isBT ? <Sun size={100}/> : <Zap size={100}/>}</div>
                    <div className="flex justify-between items-end border-b-2 border-slate-100 pb-4 mb-4">
                         <div>
                            <h3 className={`text-sm font-bold uppercase ${isBT ? 'text-red-600' : 'text-blue-900'}`}>{isBT ? "FACTURE BT" : "FACTURE MT"}</h3>
                            <p className="text-xs text-slate-400">{currentSiteObj.name}</p>
                         </div>
                         <div className="text-right"><p className="text-xs text-slate-400 font-mono">{formData.date}</p></div>
                    </div>

                    <div className="space-y-3 text-sm">
                        {currentSiteObj.type === 'BT_PV' ? (
                             <>
                               <div className="pb-3 border-b border-slate-50 border-dashed space-y-2">
                                  <div className="flex justify-between text-slate-600"><span>Conso Réseau</span><span className="font-mono">{formatNumber(displayMetrics.consumptionGrid)} kWh</span></div>
                                  <div className="flex justify-between text-orange-600"><span>PV injectée</span><span className="font-mono">-{formatNumber(displayMetrics.productionPvInjectee ?? displayMetrics.productionPv)} kWh</span></div>
                                  {currentSite === 4 && (
                                      <>
                                        <div className="flex justify-between text-emerald-700"><span>Production PV</span><span className="font-mono">{formatNumber(displayMetrics.productionPv)} kWh</span></div>
                                        <div className="flex justify-between text-slate-700"><span>Consommation totale</span><span className="font-mono">{formatNumber(displayMetrics.consommationTotale)} kWh</span></div>
                                        <div className="flex justify-between text-slate-700"><span>Coût brut</span><span className="font-mono">{formatMoney(displayMetrics.coutBrut)}</span></div>
                                        <div className={`flex justify-between font-bold ${Number(displayMetrics.gainPv) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}><span>Gain PV</span><span className="font-mono">{formatMoney(displayMetrics.gainPv)}</span></div>
                                      </>
                                  )}
                                  <div className="flex justify-between text-slate-500 text-xs bg-slate-50 p-1 rounded"><span>Solde N-1</span><span className="font-mono">{formatNumber(displayMetrics.prevBalance)} kWh</span></div>
                                  <div className={`flex justify-between font-bold p-2 rounded ${displayMetrics.totalBalance > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}><span>Solde Final</span><span>{formatNumber(displayMetrics.totalBalance)} kWh</span></div>
                                  {displayMetrics.totalBalance <= 0 ? <div className="text-xs text-center text-emerald-600 italic">Crédit reporté au mois prochain</div> : <div className="flex justify-between text-slate-800 font-bold border-t pt-2"><span>Facturé ({formatNumber(displayMetrics.billedKwh)} kWh)</span><span>{formatMoney(displayMetrics.consoAmountHT)}</span></div>}
                               </div>
                               <div className="space-y-1 text-xs text-slate-500 pt-2">
                                  <div className="flex justify-between"><span>Redevances Fixes</span><span>{formatMoney(displayMetrics.fixedAmountHT)}</span></div>
                                  <div className="flex justify-between"><span>Taxes (TVA, CL, FTE)</span><span>{formatMoney(displayMetrics.totalFinalTTC - (displayMetrics.consoAmountHT + displayMetrics.fixedAmountHT))}</span></div>
                               </div>
                             </>
                        ) : !isBT ? (
                             <>
                               <div className="pb-3 border-b border-slate-50 border-dashed">
                                  <div className="flex justify-between text-slate-600"><span>Énergie Enregistrée</span><span className="font-mono">{formatNumber(displayMetrics.energyRecorded)} kWh</span></div>
                                  <div className="flex justify-between text-slate-500 text-xs pl-2"><span>+ Pertes</span><span className="font-mono">{formatNumber(displayMetrics.billedKwh - displayMetrics.energyRecorded)}</span></div>
                                  <div className="flex justify-between font-bold text-slate-700 mt-1 bg-slate-50 px-2 py-1 rounded"><span>Facturé</span><span>{formatMoney(displayMetrics.baseEnergyAmountHT)}</span></div>
                               </div>
                               <div className="pb-3 border-b border-slate-50 border-dashed space-y-1 pt-2">
                                  <div className="flex justify-between text-xs text-slate-600">
                                     <span>Pmax Relevée</span><span>{formatNumber(parseFloat(formData.maxPower) || 0)} kVA</span>
                                  </div>
                                  <div className={`flex justify-between text-xs ${displayMetrics.cosPhiAdjustmentAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                     <span>Ajustement Cos φ</span><span>{formatMoney(displayMetrics.cosPhiAdjustmentAmount)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-slate-600"><span>Prime Fixe ({displayMetrics.subPower}kVA x {formatNumber(currentAdvancedConfig.powerUnitPrice)})</span><span>{formatMoney(displayMetrics.powerPremium)}</span></div>
                                  {displayMetrics.powerOverrunAmount > 0 && <div className="flex justify-between text-xs text-red-600 font-bold bg-red-50 p-1 rounded"><span>Pénalité Puissance ({formatNumber(displayMetrics.powerOverrun)} kVA x {currentAdvancedConfig.powerOverrunPenalty})</span><span>{formatMoney(displayMetrics.powerOverrunAmount)}</span></div>}
                               </div>
                               <div className="text-xs text-slate-500 pt-2 space-y-1 border-t mt-2">
                                  <div className="flex justify-between"><span>Total Énergie TTC</span><span>{formatMoney(displayMetrics.total1_TTC)}</span></div>
                                  <div className="flex justify-between"><span>Total Fixe TTC</span><span>{formatMoney(displayMetrics.total2_TTC)}</span></div>
                                  <div className="flex justify-between"><span>Taxes (RTT+Muni)</span><span>{formatMoney((Number(currentAdvancedConfig.rtt) || 0) + displayMetrics.municipalTax)}</span></div>
                               </div>
                             </>
                        ) : (
                             <>
                                <div className="pb-3 border-b border-slate-50 border-dashed">
                                   <div className="flex justify-between font-bold text-slate-700"><span>Conso ({formatNumber(displayMetrics.consumptionGrid)} kWh)</span><span>{formatMoney(displayMetrics.consoAmountHT)}</span></div>
                                </div>
                                <div className="space-y-1 text-xs text-slate-500 pt-2">
                                    <div className="flex justify-between"><span>Redevances (Fixe + Serv)</span><span>{formatMoney(displayMetrics.fixedAmountHT)}</span></div>
                                    <div className="flex justify-between"><span>Taxes (TVA,CL,FTE)</span><span>{formatMoney(displayMetrics.totalFinalTTC - displayMetrics.totalHT)}</span></div>
                                </div>
                             </>
                        )}

                        {(parseFloat(formData.lateFees) > 0 || parseFloat(formData.relanceFees) > 0 || parseFloat(formData.adjustment) !== 0) && (
                            <div className="pt-2 text-xs text-orange-600 border-t mt-2 flex justify-between font-bold">
                                <span>Frais & Ajustements</span>
                                <span>{formatMoney((parseFloat(formData.lateFees)||0) + (parseFloat(formData.relanceFees)||0) + (parseFloat(formData.adjustment)||0))}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 border-t-2 border-slate-800 pt-4">
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-black text-slate-900 uppercase">Net à Payer</span>
                          <span className={`text-3xl font-black font-mono tracking-tight ${isBT ? 'text-red-700' : 'text-blue-900'}`}>{formatMoney(displayMetrics.netToPay)}</span>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    <button onClick={() => setIsConfigUnlocked(!isConfigUnlocked)} className="w-full px-6 py-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase hover:bg-slate-200">
                        <span><Settings size={14} className="inline mr-2" /> Configuration Avancée </span>
                        {isConfigUnlocked ? <Unlock size={14} className="text-red-500" /> : <Lock size={14} />}
                    </button>
                    {isConfigUnlocked && (
                        <div className="p-4 bg-white border-t border-slate-200 animate-in slide-in-from-top-2">
                             {!isBT ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div className="col-span-full mb-1 text-[10px] font-black text-blue-900 uppercase tracking-widest border-b pb-1">Paramètres Moyenne Tension</div>
                                    <div><label className="block text-slate-400 mb-1">P. Souscrite (kVA)</label><input type="number" value={currentAdvancedConfig.subscribedPower ?? ''} onChange={e => handleAdvancedConfigChange('subscribedPower', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">Prix Énergie (DT/kWh)</label><input type="number" value={currentAdvancedConfig.unitPriceKwh ?? ''} onChange={e => handleAdvancedConfigChange('unitPriceKwh', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">Prix Puissance (DT/kVA)</label><input type="number" value={currentAdvancedConfig.powerUnitPrice ?? ''} onChange={e => handleAdvancedConfigChange('powerUnitPrice', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">TVA (%)</label><input type="number" value={currentAdvancedConfig.vatRate ?? ''} onChange={e => handleAdvancedConfigChange('vatRate', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    
                                    <div><label className="block text-slate-400 mb-1">Pénalité Dépassement</label><input type="number" value={currentAdvancedConfig.powerOverrunPenalty ?? ''} onChange={e => handleAdvancedConfigChange('powerOverrunPenalty', e.target.value)} className="border p-1 w-full rounded font-mono bg-red-50" /></div>
                                    <div><label className="block text-slate-400 mb-1">Pertes à Vide (kWh)</label><input type="number" value={currentAdvancedConfig.emptyLosses ?? ''} onChange={e => handleAdvancedConfigChange('emptyLosses', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">RTT (DT)</label><input type="number" value={currentAdvancedConfig.rtt ?? ''} onChange={e => handleAdvancedConfigChange('rtt', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                </div>
                             ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                    <div className="col-span-full mb-1 text-[10px] font-black text-red-800 uppercase tracking-widest border-b pb-1">Paramètres Basse Tension</div>
                                    <div><label className="block text-slate-400 mb-1">Prix kWh BT</label><input type="number" value={currentAdvancedConfig.unitPriceKwhBT ?? ''} onChange={e => handleAdvancedConfigChange('unitPriceKwhBT', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">Redevance Fixe</label><input type="number" value={currentAdvancedConfig.fixedFeesBT ?? ''} onChange={e => handleAdvancedConfigChange('fixedFeesBT', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">Services</label><input type="number" value={currentAdvancedConfig.servicesBT ?? ''} onChange={e => handleAdvancedConfigChange('servicesBT', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    
                                    <div><label className="block text-slate-400 mb-1">Taxe CL (Taux)</label><input type="number" value={currentAdvancedConfig.taxCLRate ?? ''} onChange={e => handleAdvancedConfigChange('taxCLRate', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">FTE Elec (Taux)</label><input type="number" value={currentAdvancedConfig.taxFTERate ?? ''} onChange={e => handleAdvancedConfigChange('taxFTERate', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                    <div><label className="block text-slate-400 mb-1">FTE Gaz (Montant)</label><input type="number" value={currentAdvancedConfig.fteGazBT ?? ''} onChange={e => handleAdvancedConfigChange('fteGazBT', e.target.value)} className="border p-1 w-full rounded font-mono" /></div>
                                </div>
                             )}
                        </div>
                    )}
                </div>

                    <div className="space-y-3">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-blue-700">Performance site</div>
                                    <div className="text-xs text-slate-600">
                                        Synthèse des indicateurs de performance énergétique du site sélectionné.
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="text-[10px] uppercase font-bold text-slate-500">Pmax historique</div>
                                    <div className="text-xl font-black text-slate-900">{formatNumber(performanceSiteData.pmaxHistorique)} kVA</div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="text-[10px] uppercase font-bold text-slate-500">Cos φ moyenne</div>
                                    <div className="text-xl font-black text-blue-900">{formatNumber(performanceSiteData.cosPhiMoyenne)}</div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="text-[10px] uppercase font-bold text-slate-500">Indicateur performance global</div>
                                    <div className="text-xl font-black text-emerald-700">{formatNumber(performanceSiteData.indicateurPerformanceGlobal)} kWh/m²</div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="text-[10px] uppercase font-bold text-slate-500">Taux d’optimisation moyen 6 mois</div>
                                    <div className={`text-xl font-black ${performanceSiteData.tauxOptimisationAnnuel <= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {performanceSiteData.optimisationAvailable
                                            ? `${performanceSiteData.tauxOptimisationAnnuel > 0 ? '+' : ''}${formatNumber(performanceSiteData.tauxOptimisationAnnuel * 100)} %`
                                            : '--'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-emerald-700">Consommation estim??e</div>
                                    <div className="text-xs text-slate-600">
                                        Estimation pour le mois {formData.date || new Date().toISOString().slice(0, 7)} bas??e sur le mois REF ??quivalent.
                                    </div>
                                </div>
                            </div>

                            {indexEstimation.available ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                                        <div className="text-[10px] uppercase font-bold text-slate-500">Conso REF du m??me mois</div>
                                        <div className="text-xl font-black text-slate-900">{formatNumber(indexEstimation.referenceMonthConsumption)} kWh</div>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                                        <div className="text-[10px] uppercase font-bold text-slate-500">Taux d???optimisation</div>
                                        <div className="text-xl font-black text-blue-900">{formatNumber(indexEstimation.tauxOptimisation)}</div>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                                        <div className="text-[10px] uppercase font-bold text-slate-500">Conso estim??e</div>
                                        <div className="text-xl font-black text-emerald-700">{formatNumber(indexEstimation.consommationEstimee)} kWh</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 italic">
                                    {indexEstimation.reason}
                                </div>
                            )}

                            {climateEstimationContext.available && (
                                <EstimationClimatique
                                    siteId={currentSiteObj.code}
                                    siteLabel={currentSiteObj.name}
                                    dernierMoisFacture={climateEstimationContext.dernierMoisFacture}
                                    moisCibleOverride={climateEstimationContext.selectedMonth}
                                    consoRefN_1={climateEstimationContext.consoRefN_1}
                                    tauxOpti={climateEstimationContext.tauxOpti}
                                    partCVC={climateEstimationContext.partCVC}
                                    coordinates={climateEstimationContext.coordinates}
                                    embedded
                                    onSave={({ estimationFinale }) => {
                                        const ancienIndex = Number(formData.lastIndex || 0);
                                        const nouvelIndexEstime = ancienIndex + Number(estimationFinale || 0);
                                        handleInputChange('newIndex', String(Math.round(nouvelIndexEstime)));
                                        setNotification({ msg: "Estimation climatique appliquee a l'index", type: 'success' });
                                        setTimeout(() => setNotification(null), 3000);
                                    }}
                                />
                            )}
                        </div>


                        {billingAnomalies.length > 0 && (
                            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                                <div className="text-xs font-black text-orange-700 uppercase mb-2 flex items-center">
                                    <AlertTriangle size={14} className="mr-2"/>
                                    Alertes & anomalies
                                </div>
                                <div className="space-y-1">
                                    {billingAnomalies.map((log, idx) => {
                                        const energy = Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0);
                                        const cosPhi = Number(log.cosPhi ?? log.PF_SUM ?? 1);
                                        const pmax = Number(log.Pmax ?? log.maxPower ?? 0);
                                        return (
                                            <div key={log._id || log.id || idx} className="text-xs text-slate-700">
                                                • {log.recordDate || log.date || '-'} :
                                                {energy > (billingStats.totalEnergy / Math.max(1, filteredBillingHistory.length)) * 1.3 && <span className="text-red-600 font-bold"> surconsommation </span>}
                                                {cosPhi < 0.95 && <span className="text-amber-600 font-bold"> cos φ faible </span>}
                                                {pmax > billingStats.avgPmax * 1.2 && <span className="text-red-600 font-bold"> Pmax élevée </span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>


            <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center tracking-wider">
                        <BarChart3 size={14} className="mr-2"/> Consommation mensuelle
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">
                        Analyse mensuelle de la consommation énergétique
                    </span>
                </div>

                {monthlyConsumptionData.length === 0 ? (
                    <div className="h-[420px] flex items-center justify-center text-slate-400 italic">
                        Pas encore assez de factures pour générer l'analyse de la consommation
                    </div>
                ) : (
                    <div className="h-[520px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyConsumptionData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => [`${formatNumber(Number(value))} kWh`, 'Consommation (kWh)']}
                                    labelFormatter={(label) => `Mois: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="consommation" radius={[8, 8, 0, 0]} name="Consommation (kWh)" fill="#1e3a8a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center"><Database size={12} className="mr-1"/> Historique factures - site actuel</h3>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setSortBy('date')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border ${sortBy === 'date' ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                                Trier par date
                            </button>
                            <button
                                type="button"
                                onClick={() => setSortBy('amount')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border ${sortBy === 'amount' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                                Trier par montant
                            </button>
                            <button
                                type="button"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700"
                            >
                                {sortOrder === 'asc' ? 'Ordre croissant ↑' : 'Ordre décroissant ↓'}
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                        {sortedBillingHistory.slice(0, 24).length === 0 ? (
                            <div className="text-center text-slate-400 italic mt-6">
                                Aucune facture enregistrée pour ce site
                            </div>
                        ) : (
                            sortedBillingHistory.slice(0, 24).map((log, i) => {
                                const consommation = Number(log.billedKwh ?? log.consumptionGrid ?? log.energyRecorded ?? 0);
                                const consommationReseau = Number(log.consumptionGrid ?? log.billedKwh ?? log.energyRecorded ?? 0);
                                const consommationTotale = Number(log.consommationTotale ?? 0);
                                const coutBrut = Number(log.coutBrut ?? 0);
                                const gainPv = Number(log.gainPv ?? 0);
                                const productionPv = Number(log.productionPv ?? 0);
                                const productionPvInjectee = Number(
                                    log.productionPvInjectee ??
                                    log.pvExport ??
                                    log.exportSteg ??
                                    log.pvInjected ??
                                    0
                                );
                                const facteurPuissance = log.cosPhi ?? log.PF_SUM ?? null;
                                const prix = Number(log.netToPay ?? 0);
                                const pmax = Number(log.Pmax ?? log.maxPower ?? 0);
                                const dateFacture = log.recordDate || log.date || log._createdAt || '-';
                                const isShowroomLac =
                                    String(log.siteId) === '4' ||
                                    String(log.siteId) === '4.0' ||
                                    String(log.site).toUpperCase() === 'LAC' ||
                                    String(log.siteKey).toUpperCase() === 'LAC' ||
                                    String(log.siteName || '').toLowerCase().includes('showroom lac');

                                return (
                                    <div
                                        key={log._id || log.id || i}
                                        className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between text-[13px] font-semibold text-slate-800">
                                                    <span>{getSiteDisplayName(log.siteName || 'Site inconnu')}</span>
                                                    <span className="text-slate-500">{dateFacture}</span>
                                                </div>

                                                {isShowroomLac ? (
                                                    <>
                                                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-700">
                                                            <span>Consommation reseau: <b>{formatNumber(consommationReseau)} kWh</b></span>
                                                            <span>Production PV: <b>{formatNumber(productionPv)} kWh</b></span>
                                                            <span>PV injectee: <b>{formatNumber(productionPvInjectee)} kWh</b></span>
                                                            <span className="text-emerald-700">Net a payer: <b>{formatMoney(prix)}</b></span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-600">
                                                            <span>Consommation totale: <b>{formatNumber(consommationTotale)} kWh</b></span>
                                                            <span className="text-red-700">Cout brut: <b>{formatMoney(coutBrut)}</b></span>
                                                            <span className={gainPv >= 0 ? 'text-emerald-700' : 'text-red-700'}>Gain PV: <b>{formatMoney(gainPv)}</b></span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-700 mt-1">
                                                        <span>Conso: <b>{formatNumber(consommation)} kWh</b></span>
                                                        <span>Pmax: <b>{pmax > 0 ? `${formatNumber(pmax)} kVA` : '-'}</b></span>
                                                        <span>Cos phi: <b>{facteurPuissance !== null && facteurPuissance !== '' ? formatNumber(Number(facteurPuissance)) : '-'}</b></span>
                                                        <span className="text-emerald-700">Prix: <b>{formatMoney(prix)}</b></span>
                                                    </div>
                                                )}
                                            </div>

                                            {userRole === 'ADMIN' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteBilling(log._id || log.id)}
                                                    className="text-slate-300 hover:text-red-600 transition-colors p-1"
                                                    title="Supprimer la facture"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </main>
        {notification && <div className="fixed bottom-6 right-6 px-6 py-4 bg-emerald-600 text-white rounded-xl shadow-xl">{notification.msg}</div>}
    </div>
  );
};

// ==================================================================================
// 6. MODULE GESTION AIR COMPRIMÉ (Complet & Revisé)
// ==================================================================================

export default StegModule;

