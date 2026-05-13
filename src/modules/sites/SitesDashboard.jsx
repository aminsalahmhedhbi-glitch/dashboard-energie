import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap, Activity, Save, History, TrendingUp, AlertTriangle, Factory, CheckCircle2,
  Settings, Lock, Unlock, Calendar, HelpCircle,
  FileText, Eye, BookOpen, Sun, MousePointerClick,
  Info, Wind, Thermometer, Timer, Wrench, LayoutGrid, ArrowLeft, Edit2,
  PieChart, MapPin, Maximize2, Building2, Leaf, CloudSun, Flag, BarChart3,
  Database, User, Users, LogOut, Key, Shield, X, Trash2, PlusCircle,
  Store, Droplets, Filter, Check, Printer, TrendingDown, Download, Sliders, ChevronDown, ChevronRight,
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
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { BrandLogo, FallbackLogo } from '../../components/branding/BrandLogo';
import HeaderInfoDisplay from '../../components/layout/HeaderInfoDisplay';
import ModuleHeader from '../../components/layout/ModuleHeader';
import { apiFetch, saveCollectionItem as saveData } from '../../lib/api';
import { buildFactureInsights, getFactureMetrics, getFactureMonthKey } from '../../lib/factures';
import { getSiteDisplayName } from '../../lib/sites';
import { useData } from '../../hooks/useData';
import { useFactures } from '../../hooks/useFactures';
import { useModuleState } from '../../hooks/useModuleState';

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
  const { data: lastEnergy, error } = useLiveEnergy(siteKey);
  const lastTimestamp = lastEnergy?.measured_at || lastEnergy?.Timestamp || lastEnergy?.measuredAt || null;
  const maxActivePower = lastEnergy?.P_SUM_kW_MAX;
  const maxActivePowerTimestamp = lastEnergy?.P_SUM_kW_MAX_TIMESTAMP || null;

  const cardClass = 'rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-4';
  const titleClass = 'text-[11px] uppercase tracking-[0.18em] text-slate-300';
  const unitClass = 'ml-1 text-sm font-medium text-slate-300';

  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b border-slate-700/70 pb-3">
          <h4 className="text-base font-black text-white">{title}</h4>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-amber-300/50 bg-amber-100/10 px-4 py-3 text-sm font-medium text-amber-200">
          Mesures temps réel momentanément indisponibles pour {siteKey}. Le suivi reprendra dès que les données seront accessibles.
        </div>
      ) : null}

      {!error && !lastEnergy ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-300">
          Aucune mesure instantanée n'a encore été reçue pour {siteKey}.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={cardClass}>
          <p className={titleClass}>P max enregistrée</p>
          <p className="mt-2 break-words text-[2rem] font-medium leading-none text-yellow-300">
            {maxActivePower ?? '--'}
            <span className={unitClass}>kW</span>
          </p>
          <p className="mt-3 break-words text-sm text-slate-300">
            {maxActivePowerTimestamp ? String(maxActivePowerTimestamp) : 'aucun historique disponible'}
          </p>
        </div>

        <div className={cardClass}>
          <p className={titleClass}>Puissance Active</p>
          <p className="mt-2 break-words text-[2rem] font-medium leading-none text-sky-300">
            {lastEnergy ? lastEnergy.P_SUM_kW : '--'}
            <span className={unitClass}>kW</span>
          </p>
        </div>

        <div className={cardClass}>
          <p className={titleClass}>Puissance R?active</p>
          <p className="mt-2 break-words text-[2rem] font-medium leading-none text-red-400">
            {lastEnergy ? lastEnergy.Q_SUM_kvar : '--'}
            <span className={unitClass}>kvar</span>
          </p>
        </div>

        <div className={cardClass}>
          <p className={titleClass}>Puissance Apparente</p>
          <p className="mt-2 break-words text-[2rem] font-medium leading-none text-white">
            {lastEnergy ? lastEnergy.S_SUM_kVA : '--'}
            <span className={unitClass}>kVA</span>
          </p>
        </div>

        <div className={cardClass}>
          <p className={titleClass}>Facteur de Puissance</p>
          <p className="mt-2 break-words text-[2rem] font-medium leading-none text-orange-300">
            {lastEnergy ? lastEnergy.PF_SUM : '--'}
          </p>
        </div>

        <div className="ml-auto w-full max-w-sm self-end rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3">
          <p className={titleClass}>Dernière lecture</p>
          <p className="mt-2 break-words text-sm font-medium text-slate-200">
            {lastTimestamp ? String(lastTimestamp) : `en attente de mesure pour ${siteKey}`}
          </p>
        </div>
      </div>
    </div>
  );
};

const PrintStyles = () => (
    <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body { width: 297mm; height: 210mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          .print-container { 
              position: static !important;
              inset: auto !important;
              width: auto !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important; 
              overflow: hidden; 
              z-index: auto; 
              background: white;
          }
          .print-scale {
              transform: none !important;
              transform-origin: top left;
              width: 281mm !important;
              height: 194mm !important;
              box-shadow: none !important;
          }
        }
      `}</style>
  );

const mergeHistoryArrays = (base = [], override = []) =>
  Array.from({ length: 12 }, (_, index) => {
    const overrideValue = override?.[index];
    if (overrideValue === undefined || overrideValue === null || String(overrideValue).trim() === '') {
      return base?.[index] ?? '';
    }
    return overrideValue;
  });

const mergeHistoryEntry = (base = {}, override = {}) => ({
  ...base,
  ...override,
  months: mergeHistoryArrays(base?.months, override?.months),
  temperature: mergeHistoryArrays(base?.temperature, override?.temperature),
  grid: mergeHistoryArrays(base?.grid, override?.grid),
  pvProd: mergeHistoryArrays(base?.pvProd, override?.pvProd),
  pvExport: mergeHistoryArrays(base?.pvExport, override?.pvExport),
});

const REVIEW_USAGES_MODULE_KEY = 'pilotage-review-usage-matrix-v1';

const normalizeReviewUsageRows = (usages = []) =>
  (Array.isArray(usages) ? usages : []).map((usage) => {
    const normalizedName = normalizeSearchText(usage?.name || '');
    const isGasUsage = normalizedName.includes('gaz');
    const hasSubUsages = Array.isArray(usage?.subUsages) && usage.subUsages.length > 0;

    return {
      ...usage,
      source: usage?.source || (isGasUsage ? 'gaz' : 'electricite'),
      name: isGasUsage && hasSubUsages ? 'Gaz' : usage?.name,
      subUsages: hasSubUsages
        ? usage.subUsages.map((subUsage) => ({
            ...subUsage,
            source: 'gaz',
          }))
        : Array.isArray(usage?.subUsages)
          ? usage.subUsages
          : [],
    };
  });

const buildReviewUsageModulePayload = (sitesState = {}) =>
  Object.keys(sitesState || {}).reduce((accumulator, siteKey) => {
    accumulator[siteKey] = {
      elecUsage: Array.isArray(sitesState[siteKey]?.elecUsage)
        ? normalizeReviewUsageRows(sitesState[siteKey].elecUsage)
        : [],
    };
    return accumulator;
  }, {});

const mergeReviewUsageModulePayload = (baseState = {}, persistedState = {}) =>
  Object.keys(baseState || {}).reduce((accumulator, siteKey) => {
    const persistedUsage = persistedState?.[siteKey]?.elecUsage;
    accumulator[siteKey] = {
      ...baseState[siteKey],
      elecUsage: Array.isArray(persistedUsage)
        ? normalizeReviewUsageRows(persistedUsage)
        : normalizeReviewUsageRows(baseState[siteKey]?.elecUsage || []),
    };
    return accumulator;
  }, {});

const getHistorySeriesType = (siteKey) => (siteKey === 'LAC' ? 'grid' : 'months');

const createEmptyHistoryEntry = (siteKey) =>
  siteKey === 'LAC'
    ? { grid: Array(12).fill(''), temperature: Array(12).fill('') }
    : { months: Array(12).fill(''), temperature: Array(12).fill('') };

const sanitizeHistoryEntryForSite = (siteKey, entry = {}) => {
  const historyId = entry?.historyId;
  const baseEntry = createEmptyHistoryEntry(siteKey);

  if (siteKey === 'LAC') {
    return {
      ...(historyId ? { historyId } : {}),
      grid: mergeHistoryArrays(baseEntry.grid, entry?.grid),
      temperature: mergeHistoryArrays(baseEntry.temperature, entry?.temperature),
    };
  }

  return {
    ...(historyId ? { historyId } : {}),
    months: mergeHistoryArrays(baseEntry.months, entry?.months),
    temperature: mergeHistoryArrays(baseEntry.temperature, entry?.temperature),
  };
};

const ensureSiteHistoryYears = (siteKey, siteHistory = {}, defaultYears = []) => {
  const targetYears = new Set([
    ...defaultYears.map((year) => String(year)),
    ...Object.keys(siteHistory || {}).map((year) => String(year)),
  ]);

  return Array.from(targetYears).reduce((accumulator, year) => {
    accumulator[year] = sanitizeHistoryEntryForSite(siteKey, siteHistory?.[year] || {});
    return accumulator;
  }, {});
};

const FULL_MONTH_NAMES = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

const SHORT_MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

const SITE_CLIMATE_COORDINATES = {
  MEGRINE: { latitude: 36.7699, longitude: 10.2294 },
  ELKHADHRA: { latitude: 36.8399, longitude: 10.1947 },
  NAASSEN: { latitude: 36.6466, longitude: 10.1012 },
  LAC: { latitude: 36.8421, longitude: 10.2723 },
  AZUR: { latitude: 36.8664, longitude: 10.3321 },
  CARTHAGE: { latitude: 36.8531, longitude: 10.3235 },
  CHARGUEYAA: { latitude: 36.8531, longitude: 10.3235 },
};

const buildMonthlyClimateArchiveUrl = ({ latitude, longitude, startDate, endDate }) =>
  `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FTunis`;

const toNumberOrZero = (value) => {
  const normalizedValue =
    typeof value === 'string' ? value.replace(',', '.').trim() : value;
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeDivide = (numerator, denominator) =>
  denominator > 0 ? numerator / denominator : 0;

const formatCompactNumber = (value, digits = 0) =>
  toNumberOrZero(value).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const normalizeSearchText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getAirLogTimestamp = (row = {}) => {
  const rawValue = row.createdAt || row.created_at || row.date || row.timestamp || 0;
  const timestamp = new Date(rawValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getAirWeekSortValue = (weekValue = '') => {
  const match = String(weekValue).match(/^(\d{4})-W(\d{1,2})$/i);
  if (!match) {
    return 0;
  }
  return Number(match[1]) * 100 + Number(match[2]);
};

const getAirWeekLabel = (weekValue = '') => {
  const match = String(weekValue).match(/^(\d{4})-W(\d{1,2})$/i);
  if (!match) {
    return weekValue || 'S--';
  }
  return `S${Number(match[2])} ${String(match[1]).slice(-2)}`;
};

const normalizeAirWeeklyLog = (row = {}) => {
  const type = row.type || row.entry_type || row.entryType || '';
  const compressorId = Number(
    row.compressorId ??
      row.compressor ??
      row.comp ??
      row.compresseurId ??
      0
  );
  const runHours = toNumberOrZero(row.runDelta ?? row.runHours ?? row.heuresMarche);
  const loadHours = toNumberOrZero(row.loadDelta ?? row.loadHours ?? row.heuresCharge);
  const energyConsumedKwh = toNumberOrZero(
    row.energyConsumedKwh ?? row.energie ?? row.energieConsommee
  );
  const volumeProducedM3 = toNumberOrZero(
    row.volumeProducedM3 ?? row.volume ?? row.volumeProduit
  );
  const kpi =
    row.kpi !== undefined && row.kpi !== null
      ? toNumberOrZero(row.kpi)
      : safeDivide(energyConsumedKwh, volumeProducedM3);

  return {
    ...row,
    type,
    week: row.week || row.semaine || row.period || '',
    compressorId,
    runHours,
    loadHours,
    energyConsumedKwh,
    volumeProducedM3,
    kpi,
    timestamp: getAirLogTimestamp(row),
  };
};

const buildAirWeeklyKpiSeries = (airLogs = []) => {
  const weeklyReports = airLogs
    .map(normalizeAirWeeklyLog)
    .filter((row) => row.type === 'WEEKLY_REPORT')
    .filter((row) => row.week);

  const groupedByWeek = weeklyReports.reduce((accumulator, row) => {
    const key = row.week;
    if (!accumulator[key]) {
      accumulator[key] = {};
    }
    const existing = accumulator[key][row.compressorId];
    if (!existing || row.timestamp > existing.timestamp) {
      accumulator[key][row.compressorId] = row;
    }
    return accumulator;
  }, {});

  return Object.entries(groupedByWeek)
    .map(([week, rowsByCompressor]) => {
      const rows = Object.values(rowsByCompressor);
      const totalEnergy = rows.reduce(
        (sum, row) => sum + toNumberOrZero(row.energyConsumedKwh),
        0
      );
      const totalVolume = rows.reduce(
        (sum, row) => sum + toNumberOrZero(row.volumeProducedM3),
        0
      );

      return {
        week,
        label: getAirWeekLabel(week),
        sortValue: getAirWeekSortValue(week),
        value: safeDivide(totalEnergy, totalVolume),
      };
    })
    .filter((row) => row.value > 0)
    .sort((left, right) => right.sortValue - left.sortValue);
};

const getUsageShareByKeywords = (usages = [], keywords = []) => {
  const loweredKeywords = keywords.map((keyword) => normalizeSearchText(keyword));
  const total = usages.reduce((sum, usage) => {
    const name = normalizeSearchText(usage?.name || '');
    return loweredKeywords.some((keyword) => name.includes(keyword))
      ? sum + toNumberOrZero(usage?.value)
      : sum;
  }, 0);

  return total / 100;
};

const getUsageConsoScoreByPart = (partValue) => {
  const value = toNumberOrZero(partValue);
  if (value >= 35) return 5;
  if (value >= 20) return 4;
  if (value >= 10) return 3;
  if (value >= 5) return 2;
  return 1;
};

const getUsageGainScoreFallback = (partValue) => {
  const value = toNumberOrZero(partValue);
  if (value >= 30) return 4;
  if (value >= 15) return 3;
  if (value >= 8) return 2;
  return 1;
};

const getUsageSignificanceSnapshot = (partValue, noteGainValue, forcedSignificant = false) => {
  const consoScore = getUsageConsoScoreByPart(partValue);
  const gainScore = noteGainValue != null && noteGainValue !== ''
    ? Math.max(1, Math.min(5, toNumberOrZero(noteGainValue)))
    : getUsageGainScoreFallback(partValue);
  const finalScore = consoScore * gainScore;

  return {
    consoScore,
    gainScore,
    finalScore,
    significant: Boolean(forcedSignificant) || finalScore >= 12,
  };
};

const ReviewSectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-900/5 p-2.5 text-blue-900">
          <Icon size={18} />
        </div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
      </div>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  </div>
);

const ReviewMetricCard = ({
  title,
  value,
  unit = '',
  accent = 'slate',
  subtitle = null,
  badge = null,
}) => {
  const accents = {
    slate: 'border-slate-200 bg-white text-slate-900',
    blue: 'border-blue-100 bg-blue-50/60 text-blue-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${accents[accent] || accents.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
        {badge ? <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{badge}</span> : null}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-black leading-none">{value}</span>
        {unit ? <span className="pb-1 text-sm font-bold text-slate-400">{unit}</span> : null}
      </div>
      {subtitle ? <p className="mt-2 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
};

const ReviewTrendChart = ({ title, data, color, unit, emptyText }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{title}</h3>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{unit}</span>
    </div>
    {data.length === 0 ? (
      <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        {emptyText}
      </div>
    ) : (
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`${formatCompactNumber(value, 3)} ${unit}`, title]}
              labelFormatter={(label) => `Periode : ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const ReviewUsageDonutCard = ({ title, label, data, emptyText }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">{title}</h3>
    </div>
    {data.length === 0 ? (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        {emptyText}
      </div>
    ) : (
      <div className="flex flex-col items-center">
        <div className="h-[170px] w-full max-w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${formatCompactNumber(value, 1)} %`} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <span className="mt-[-96px] mb-[70px] text-xs font-medium text-slate-400">{label}</span>
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {data.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600" title={item.name}>{item.name}</span>
              </div>
              <span className="font-semibold text-slate-800">{formatCompactNumber(item.value, 1)}%</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const SitesDashboard = ({ onBack, userRole, user }) => {
  const [activeSiteTab, setActiveSiteTab] = useState('MEGRINE');
  const [historyData, setHistoryData] = useState({});
  const [autoTemperatureData, setAutoTemperatureData] = useState({});
  const [showHistoryInput, setShowHistoryInput] = useState(false);
  const [showUsageConfig, setShowUsageConfig] = useState(false);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [collapsedUsageRows, setCollapsedUsageRows] = useState({});
  const [usageActionModal, setUsageActionModal] = useState({
    open: false,
    mode: 'edit',
    usageIndex: null,
    subIndex: null,
  });
  const [usageActionForm, setUsageActionForm] = useState({
    name: '',
    value: '',
    ratio: '',
    noteGain: '',
    significant: false,
  });
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const [reportMonth, setReportMonth] = useState(prevMonth.toISOString().slice(0, 7));
  const [notif, setNotif] = useState(null);
  const HISTORY_DRAFT_KEY = 'italcar_sites_history_draft_v1';
  const TARGETS_DRAFT_KEY = 'italcar_sites_targets_draft_v1';

  // Pour simplifier l'historique sur le serveur simple, on charge tout 'site_history'
  const { data: allHistory } = useData('site_history', { intervalMs: 0 });
  const { data: airLogs } = useData('air_logs', { initialData: [], intervalMs: 0 });
  const { factures: siteFactures, loading: facturesLoading } = useFactures({
      site: activeSiteTab,
      intervalMs: 15000,
      limit: 500,
  });

  const [sitesDataState, setSitesDataState] = useState({
    MEGRINE: { 
        name: getSiteDisplayName('MEGRINE'), 
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
        name: getSiteDisplayName('ELKHADHRA'), area: 9500, covered: 7000, open: 2500, glazed: 40,
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
        name: getSiteDisplayName('LAC'), area: 2050, covered: 850, open: 1200, glazed: 116, 
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
        name: getSiteDisplayName('NAASSEN'), area: 32500, covered: 1850, open: 30680, glazed: 0, 
        coveredBreakdown: [{label:"Réception", value: 920}, {label:"Atelier FIAT", value: 900}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 10, renewable2030: 10 }
    },
    CARTHAGE: { 
        name: getSiteDisplayName('CARTHAGE'), area: 320, covered: 320, open: 0, glazed: 70, 
        coveredBreakdown: [{label:"Showroom", value: 320}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 5, renewable2030: 0 }
    },
    CHARGUEYAA: { 
        name: getSiteDisplayName('CHARGUEYAA'), area: 320, covered: 320, open: 0, glazed: 70, 
        coveredBreakdown: [{label:"Showroom", value: 320}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 5, renewable2030: 0 }
    },
    AZUR: { 
        name: getSiteDisplayName('AZUR'), area: 130, covered: 130, open: 0, glazed: 0, 
        coveredBreakdown: [{label:"Showroom", value: 130}], 
        energyMix: [{ name: "Élec", value: 100, color: "bg-blue-900" }], elecUsage: [],
        targets: { reduction2030: 5, renewable2030: 0 }
    }
  });
  const initialReviewUsageStateRef = React.useRef(
    buildReviewUsageModulePayload(sitesDataState)
  );
  const reviewUsageState = useModuleState(
    REVIEW_USAGES_MODULE_KEY,
    initialReviewUsageStateRef.current,
    { seedOnMissing: true, debounceMs: 700 }
  );
  const reviewUsageHydratedRef = React.useRef(false);
  const reviewUsageSignatureRef = React.useRef('');

  useEffect(() => {
    if (!reviewUsageState.isReady || reviewUsageHydratedRef.current) return;

    setSitesDataState((prev) => {
      const next = mergeReviewUsageModulePayload(prev, reviewUsageState.data || {});
      reviewUsageSignatureRef.current = JSON.stringify(buildReviewUsageModulePayload(next));
      return next;
    });

    reviewUsageHydratedRef.current = true;
  }, [reviewUsageState.data, reviewUsageState.isReady]);

  useEffect(() => {
    if (!reviewUsageHydratedRef.current) return;

    const payload = buildReviewUsageModulePayload(sitesDataState);
    const signature = JSON.stringify(payload);

    if (signature === reviewUsageSignatureRef.current) return;

    reviewUsageSignatureRef.current = signature;
    reviewUsageState.setData(payload);
  }, [reviewUsageState, sitesDataState]);

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
        site.elecUsage = newUsages;
        return newData;
    });
  };

  const handleSubUsageDelete = (usageIndex, subIndex) => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        const newUsages = [...site.elecUsage];
        newUsages[usageIndex].subUsages = newUsages[usageIndex].subUsages.filter((_, i) => i !== subIndex);
        site.elecUsage = newUsages;
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

  const toggleUsageRow = (rowKey) => {
    setCollapsedUsageRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  const closeUsageActionModal = () => {
    setUsageActionModal({
      open: false,
      mode: 'edit',
      usageIndex: null,
      subIndex: null,
    });
    setUsageActionForm({
      name: '',
      value: '',
      ratio: '',
      noteGain: '',
      significant: false,
    });
  };

  const openUsageAddModal = (usageIndex) => {
    setUsageActionModal({
      open: true,
      mode: 'add-sub',
      usageIndex,
      subIndex: null,
    });
    setUsageActionForm({
      name: '',
      value: '',
      ratio: '',
      noteGain: '',
      significant: false,
    });
  };

  const openUsageEditModal = (usageIndex, subIndex = null) => {
    const usage = currentData?.elecUsage?.[usageIndex];
    if (!usage) return;

    if (subIndex == null) {
      setUsageActionModal({
        open: true,
        mode: 'edit-usage',
        usageIndex,
        subIndex: null,
      });
      setUsageActionForm({
        name: usage.name || '',
        value: String(toNumberOrZero(usage.value)),
        ratio: usage.ratio || '',
        noteGain: usage?.noteGain != null ? String(usage.noteGain) : '',
        significant: Boolean(usage.significant),
      });
      return;
    }

    const subUsage = usage?.subUsages?.[subIndex];
    if (!subUsage) return;

    setUsageActionModal({
      open: true,
      mode: 'edit-sub',
      usageIndex,
      subIndex,
    });
    setUsageActionForm({
      name: subUsage.name || '',
      value: String(toNumberOrZero(subUsage.value)),
      ratio: '',
      noteGain: subUsage?.noteGain != null ? String(subUsage.noteGain) : '',
      significant: false,
    });
  };

  const handleUsageActionDelete = (usageIndex, subIndex = null) => {
    if (subIndex == null) {
      handleUsageDelete(usageIndex);
      return;
    }
    handleSubUsageDelete(usageIndex, subIndex);
  };

  const handleSaveUsageActionModal = (event) => {
    event.preventDefault();

    const trimmedName = usageActionForm.name.trim();
    if (!trimmedName) return;

    const numericValue = Math.max(0, toNumberOrZero(usageActionForm.value));
    const noteGainValue = usageActionForm.noteGain === '' ? null : Math.max(1, Math.min(5, toNumberOrZero(usageActionForm.noteGain)));

    setSitesDataState((prev) => {
      const next = { ...prev };
      const site = { ...next[activeSiteTab] };
      const usages = Array.isArray(site.elecUsage) ? [...site.elecUsage] : [];
      const usageIndex = usageActionModal.usageIndex;

      if (usageIndex == null || !usages[usageIndex]) {
        return prev;
      }

      if (usageActionModal.mode === 'edit-usage') {
        usages[usageIndex] = {
          ...usages[usageIndex],
          name: trimmedName,
          value: numericValue,
          ratio: usageActionForm.ratio || '-',
          noteGain: noteGainValue,
          significant: Boolean(usageActionForm.significant),
        };
      } else {
        const subUsages = Array.isArray(usages[usageIndex].subUsages)
          ? [...usages[usageIndex].subUsages]
          : [];

        if (usageActionModal.mode === 'add-sub') {
          subUsages.push({
            name: trimmedName,
            value: numericValue,
            noteGain: noteGainValue,
          });
        } else if (
          usageActionModal.mode === 'edit-sub' &&
          usageActionModal.subIndex != null &&
          subUsages[usageActionModal.subIndex]
        ) {
          subUsages[usageActionModal.subIndex] = {
            ...subUsages[usageActionModal.subIndex],
            name: trimmedName,
            value: numericValue,
            noteGain: noteGainValue,
          };
        }

        usages[usageIndex] = {
          ...usages[usageIndex],
          subUsages,
        };
      }

      site.elecUsage = usages;
      next[activeSiteTab] = site;
      return next;
    });

    closeUsageActionModal();
  };

  const defaultHistoryYears = ['REF', 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  
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
            constructed[siteKey][yearKey] = mergeHistoryEntry(
              constructed[siteKey][yearKey] || {},
              parsedDraft[siteKey][yearKey] || {}
            );
          });
        });
      }
    } catch (error) {
      console.error('Erreur chargement brouillon historique:', error);
    }

    const normalizedHistory = Object.keys(constructed).reduce((accumulator, siteKey) => {
      accumulator[siteKey] = ensureSiteHistoryYears(
        siteKey,
        constructed[siteKey],
        defaultHistoryYears
      );
      return accumulator;
    }, {});

    setHistoryData(normalizedHistory);
  }, [allHistory]);

  const initHistory = (site) => {
      setHistoryData(prev => ({
          ...prev,
          [site]: ensureSiteHistoryYears(site, prev[site], defaultHistoryYears),
      }));
  };

  const getSiteData = (site, year, type = 'months') => {
      const yData = historyData[site]?.[year];
      if (!yData) return Array(12).fill('');
      return yData[type] || Array(12).fill('');
  };

  const getTemperatureValues = (site, year) =>
    mergeHistoryArrays(
      autoTemperatureData[`${site}_${year}`] || Array(12).fill(''),
      getSiteData(site, year, 'temperature')
    );

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

  useEffect(() => {
    const coordinates = SITE_CLIMATE_COORDINATES[activeSiteTab];
    if (!coordinates) return undefined;

    const today = new Date();
    const currentAutoClimateYear = today.getFullYear();
    const yearsToLoad = [currentAutoClimateYear - 1, currentAutoClimateYear];
    let cancelled = false;

    const fetchYearTemperatures = async (year) => {
      const cacheKey = `${activeSiteTab}_${year}`;
      if (autoTemperatureData[cacheKey]) return;

      const isCurrentYear = year === today.getFullYear();
      const endDate = isCurrentYear
        ? today.toISOString().slice(0, 10)
        : `${year}-12-31`;
      const startDate = `${year}-01-01`;

      try {
        const response = await fetch(
          buildMonthlyClimateArchiveUrl({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            startDate,
            endDate,
          })
        );
        if (!response.ok) return;

        const payload = await response.json();
        const daily = payload?.daily;
        if (!daily?.time?.length) return;

        const monthlyBuckets = Array.from({ length: 12 }, () => []);
        const days = Math.min(
          daily.time.length,
          daily.temperature_2m_max?.length || 0,
          daily.temperature_2m_min?.length || 0
        );

        for (let index = 0; index < days; index += 1) {
          const isoDate = daily.time[index];
          const monthIndex = Number(String(isoDate).slice(5, 7)) - 1;
          if (monthIndex < 0 || monthIndex > 11) continue;

          const maxTemp = Number(daily.temperature_2m_max[index]);
          const minTemp = Number(daily.temperature_2m_min[index]);
          if (!Number.isFinite(maxTemp) || !Number.isFinite(minTemp)) continue;

          monthlyBuckets[monthIndex].push((maxTemp + minTemp) / 2);
        }

        const monthlyAverages = monthlyBuckets.map((values) => {
          if (!values.length) return '';
          const average = values.reduce((sum, value) => sum + value, 0) / values.length;
          return average.toFixed(1);
        });

        if (!cancelled) {
          setAutoTemperatureData((prev) => ({
            ...prev,
            [cacheKey]: monthlyAverages,
          }));
        }
      } catch (error) {
        console.error('Erreur chargement temperatures automatiques:', error);
      }
    };

    yearsToLoad.forEach((year) => {
      fetchYearTemperatures(year);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSiteTab, autoTemperatureData]);

  const saveHistory = async () => {
      const site = activeSiteTab;
      if (!historyData[site]) return;
      try {
        for (const year of Object.keys(historyData[site])) {
            const sanitizedEntry = sanitizeHistoryEntryForSite(
              site,
              historyData[site][year]
            );
            const dataToSave = {
                historyId: `${site}_${year}`, 
                ...sanitizedEntry
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
  const factureInsights = useMemo(
    () => buildFactureInsights(siteFactures, { currentDate: new Date() }),
    [siteFactures]
  );
  const factureMonthlyChartData = useMemo(
    () =>
      (factureInsights.monthlyRows || []).map((row) => ({
        month: row.monthLabel,
        consommation: row.consommationKwh,
        cout: row.prixDt,
      })),
    [factureInsights]
  );
  const recentSiteFactures = useMemo(
    () => (factureInsights.recentFactures || []).slice(0, 6),
    [factureInsights]
  );
  useEffect(() => {
    if (!factureInsights.latestMonthKey) return;
    const hasSelectedMonthData = (factureInsights.monthlyRows || []).some((row) => row.monthKey === reportMonth);
    if (!hasSelectedMonthData) {
      setReportMonth(factureInsights.latestMonthKey);
    }
  }, [factureInsights.latestMonthKey, factureInsights.monthlyRows, reportMonth]);

  const factureHistoryByYear = useMemo(() => {
    const createMonthSet = () => ({
      months: Array(12).fill(''),
      grid: Array(12).fill(''),
    });

    const addValue = (bucket, field, monthIndex, rawValue) => {
      const numeric = Number(rawValue);
      if (!Number.isFinite(numeric) || numeric <= 0) return;
      const previous = Number(bucket[field][monthIndex] || 0);
      bucket[field][monthIndex] = String(Number((previous + numeric).toFixed(2)));
    };

    return siteFactures.reduce((acc, facture) => {
      const monthKey = getFactureMonthKey(facture);
      if (!monthKey) return acc;

      const year = monthKey.slice(0, 4);
      const monthIndex = Number(monthKey.slice(5, 7)) - 1;
      if (monthIndex < 0 || monthIndex > 11) return acc;

      const bucket = acc[year] || createMonthSet();
      const metrics = getFactureMetrics(facture);

      if (activeSiteTab === 'LAC') {
        addValue(bucket, 'grid', monthIndex, metrics.consommationKwh);
      } else {
        addValue(bucket, 'months', monthIndex, metrics.consommationKwh);
      }

      acc[year] = bucket;
      return acc;
    }, {});
  }, [activeSiteTab, siteFactures]);

  const getFactureBackedHistoryValues = (year, type = 'months') => {
    if (year === 'REF') {
      return getSiteData(activeSiteTab, year, type);
    }

    return mergeHistoryArrays(
      getSiteData(activeSiteTab, year, type),
      factureHistoryByYear[String(year)]?.[type] || []
    );
  };

  const isFactureBackedYear = (year) => year !== 'REF' && Boolean(factureHistoryByYear[String(year)]);

  const yearsRange = useMemo(() => {
    const availableYears = new Set(defaultHistoryYears.filter((year) => year !== 'REF').map(String));

    Object.keys(historyData[activeSiteTab] || {}).forEach((year) => {
      if (year !== 'REF') availableYears.add(String(year));
    });

    Object.keys(factureHistoryByYear).forEach((year) => {
      if (year !== 'REF') availableYears.add(String(year));
    });

    availableYears.add(String(currentYear));

    const orderedYears = Array.from(availableYears)
      .map((year) => Number(year))
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    return ['REF', ...orderedYears];
  }, [activeSiteTab, currentYear, factureHistoryByYear, historyData]);

  const PerformanceWidget = () => {
      const historySeriesType = getHistorySeriesType(activeSiteTab);
      const refMonths = getSiteData(activeSiteTab, 'REF', historySeriesType);
      const curMonths = getSiteData(activeSiteTab, currentYear, historySeriesType);
      
      let valRefMonth = parseFloat(refMonths[currentMonthIdx]) || 0;
      let valCurMonth = parseFloat(curMonths[currentMonthIdx]) || 0;

      let diffMonth = valRefMonth > 0 ? ((valCurMonth - valRefMonth) / valRefMonth) * 100 : 0;
      let sumRefYTD = 0, sumCurYTD = 0;

      for (let i = 0; i <= currentMonthIdx; i++) {
          let r = parseFloat(refMonths[i]) || 0;
          let c = parseFloat(curMonths[i]) || 0;
          sumRefYTD += r;
          sumCurYTD += c;
      }

      let diffYTD = sumRefYTD > 0 ? ((sumCurYTD - sumRefYTD) / sumRefYTD) * 100 : 0;
      let monthName = new Date(currentYear, currentMonthIdx).toLocaleString('fr-FR', { month: 'long' });

      if (factureInsights.hasData) {
          valRefMonth = factureInsights.referenceMonthValue;
          valCurMonth = factureInsights.currentMonthValue;
          diffMonth = factureInsights.diffMonth;
          sumRefYTD = factureInsights.referenceYtdValue;
          sumCurYTD = factureInsights.currentYtdValue;
          diffYTD = factureInsights.diffYtd;
          monthName = factureInsights.analysisMonthLabel;
      }

      if (!factureInsights.hasData) {
          return (
              <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                  Aucune facture disponible pour {currentData.name}. Les indicateurs mensuels et cumulés apparaîtront dès qu’une facture sera enregistrée dans Dépenses Énergétiques.
              </div>
          );
      }

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
    const tempsCurrent = getTemperatureValues(activeSiteTab, currentYear);
    const tempsPrev = getTemperatureValues(activeSiteTab, currentYear - 1);
    
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
    const total2024 = Number(factureInsights.yearlyTotals?.[2024] || 0);
    
    // Projection 2025 (Basé sur 2024 pour l'instant ou partiel 2025)
    const total2026 = Number(factureInsights.yearlyTotals?.[2026] || 0);
    const total2025 = Number(factureInsights.yearlyTotals?.[2025] || 0);
    const displayCurrentBase = total2025 > 0 ? total2025 : total2024;
    const displayCurrentYear = total2026 > 0 ? total2026 : displayCurrentBase;
    const display2025 = total2025 > 0 ? total2025 : total2024; // Si 2025 vide, on affiche prévision basée sur 2024

    // Cibles
    const reductionTarget = currentData.targets?.reduction2030 || 10;
    const renewableTarget = currentData.targets?.renewable2030 || 20;
    
    // Baseline (Ref)
    const totalRef = factureInsights.referenceYtdValue > 0 ? factureInsights.referenceYtdValue : (total2025 || total2024);
    
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
                        <div className="text-3xl font-black">{displayCurrentYear.toLocaleString()} <span className="text-sm font-normal text-emerald-400">kWh</span></div>
                        <div className="text-[10px] uppercase font-bold text-emerald-300">Conso actuelle</div>
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

  const siteCards = [
    { key: 'MEGRINE', code: 'MEG-001', type: 'MT', icon: Factory },
    { key: 'ELKHADHRA', code: 'ELK-002', type: 'MT', icon: Factory },
    { key: 'NAASSEN', code: 'NAS-003', type: 'MT', icon: Factory },
    { key: 'LAC', code: 'LAC-001', type: 'BT', icon: Store },
    { key: 'AZUR', code: 'AZU-002', type: 'BT', icon: Store },
    { key: 'CARTHAGE', code: 'CAR-003', type: 'BT', icon: Store },
    { key: 'CHARGUEYAA', code: 'CHG-004', type: 'BT', icon: Store },
  ].filter((site) => Boolean(sitesDataState[site.key]));

  const SiteTabs = () => (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-max grid-cols-7 gap-2">
          {siteCards.map((site) => {
            const isActive = activeSiteTab === site.key;
            const isBtSite = site.type === 'BT';
            const SiteIcon = site.icon;

            return (
              <button
                key={site.key}
                onClick={() => setActiveSiteTab(site.key)}
                className={`min-h-[118px] overflow-hidden rounded-2xl border px-2 py-3 text-left transition-all ${
                  isActive
                    ? isBtSite
                      ? 'border-red-600 bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-200/70'
                      : 'border-blue-900 bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-lg shadow-blue-200/70'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`rounded-xl p-2 ${
                      isActive
                        ? 'bg-white/15'
                        : isBtSite
                          ? 'bg-red-50 text-red-600'
                          : 'bg-blue-50 text-blue-900'
                    }`}
                  >
                    <SiteIcon size={16} />
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : isBtSite
                          ? 'bg-red-50 text-red-600'
                          : 'bg-blue-50 text-blue-900'
                    }`}
                  >
                    {site.type}
                  </span>
                </div>

                <div className="mt-3">
                  <div className={`text-[11px] font-black leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {getSiteDisplayName(site.key)}
                  </div>
                  <div className={`mt-1 text-[10px] font-semibold ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                    {site.code}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const currentSiteName = getSiteDisplayName(activeSiteTab) || currentData.name;
  const historySeriesType = getHistorySeriesType(activeSiteTab);
  const referenceHistoryValues = getSiteData(activeSiteTab, 'REF', historySeriesType);
  const currentHistoryValues = getFactureBackedHistoryValues(currentYear, historySeriesType);
  const latestNonZeroHistoryMonthIndex = (() => {
    for (let index = currentHistoryValues.length - 1; index >= 0; index -= 1) {
      if (toNumberOrZero(currentHistoryValues[index]) > 0) {
        return index;
      }
    }
    return Math.max(currentMonthIdx, 0);
  })();
  const hasNonZeroFactureMonth = (factureInsights.monthlyRows || []).some(
    (row) => toNumberOrZero(row.consommationKwh) > 0
  );
  const analysisMonthIndex = factureInsights.hasData
    ? factureInsights.analysisMonthIndex ?? latestNonZeroHistoryMonthIndex
    : latestNonZeroHistoryMonthIndex;
  const analysisYear = factureInsights.hasData && hasNonZeroFactureMonth
    ? factureInsights.analysisYear ?? currentYear
    : currentYear;
  const analysisMonthName = FULL_MONTH_NAMES[analysisMonthIndex] || FULL_MONTH_NAMES[0];
  const analysisMonthShortName = SHORT_MONTH_NAMES[analysisMonthIndex] || SHORT_MONTH_NAMES[0];

  const fallbackCurrentMonthValue = toNumberOrZero(currentHistoryValues[analysisMonthIndex]);
  const fallbackReferenceMonthValue = toNumberOrZero(referenceHistoryValues[analysisMonthIndex]);
  const fallbackCurrentYtdValue = currentHistoryValues
    .slice(0, analysisMonthIndex + 1)
    .reduce((sum, value) => sum + toNumberOrZero(value), 0);
  const fallbackReferenceYtdValue = referenceHistoryValues
    .slice(0, analysisMonthIndex + 1)
    .reduce((sum, value) => sum + toNumberOrZero(value), 0);

  const displayedCurrentMonthValue = factureInsights.hasData
    ? factureInsights.currentMonthValue
    : fallbackCurrentMonthValue;
  const displayedReferenceMonthValue = factureInsights.hasData
    ? factureInsights.referenceMonthValue
    : fallbackReferenceMonthValue;
  const displayedCurrentYtdValue = factureInsights.hasData
    ? factureInsights.currentYtdValue
    : fallbackCurrentYtdValue;
  const displayedReferenceYtdValue = factureInsights.hasData
    ? factureInsights.referenceYtdValue
    : fallbackReferenceYtdValue;

  const diffMonthPercent = displayedReferenceMonthValue > 0
    ? ((displayedCurrentMonthValue - displayedReferenceMonthValue) / displayedReferenceMonthValue) * 100
    : 0;
  const diffYtdPercent = displayedReferenceYtdValue > 0
    ? ((displayedCurrentYtdValue - displayedReferenceYtdValue) / displayedReferenceYtdValue) * 100
    : 0;

  const currentMonthTemp = toNumberOrZero(getTemperatureValues(activeSiteTab, currentYear)[analysisMonthIndex]);
  const previousMonthTemp = toNumberOrZero(getTemperatureValues(activeSiteTab, currentYear - 1)[analysisMonthIndex]);
  const climateDelta = currentMonthTemp - previousMonthTemp;
  const totalSiteArea = toNumberOrZero(currentData.area || currentData.covered);

  const usagePieData = useMemo(() => {
    const palette = ['#1d4ed8', '#0ea5e9', '#8b5cf6', '#f59e0b', '#16a34a', '#ef4444', '#64748b'];
    return (currentData.elecUsage || [])
      .filter((usage) => toNumberOrZero(usage?.value) > 0)
      .map((usage, index) => ({
        name: usage.name,
        value: toNumberOrZero(usage.value),
        noteGain: usage?.noteGain ?? null,
        significant: Boolean(usage.significant),
        subUsages: (usage.subUsages || []).map((subUsage) => ({
          ...subUsage,
          value: toNumberOrZero(subUsage?.value),
          noteGain: subUsage?.noteGain ?? null,
        })),
        color: palette[index % palette.length],
      }));
  }, [currentData.elecUsage]);

  const energySources = useMemo(() => {
    const latestFacture = recentSiteFactures[0] || null;
    if (activeSiteTab === 'LAC' && latestFacture) {
      const consommationReseau = toNumberOrZero(
        latestFacture?.consommationReseau ??
        latestFacture?.consommation_reseau ??
        latestFacture?.consumptionGrid
      );
      const productionPv = toNumberOrZero(
        latestFacture?.productionPV ??
        latestFacture?.productionPv ??
        latestFacture?.production_pv
      );
      const total = consommationReseau + productionPv;
      if (total > 0) {
        return [
          { name: 'STEG', value: (consommationReseau / total) * 100, color: '#1d4ed8' },
          { name: 'Photovoltaique', value: (productionPv / total) * 100, color: '#10b981' },
        ];
      }
    }

    if (Array.isArray(currentData.energyMix) && currentData.energyMix.length > 0) {
      const paletteMap = {
        'bg-blue-900': '#1d4ed8',
        'bg-orange-500': '#f97316',
        'bg-emerald-500': '#10b981',
      };
      return currentData.energyMix.map((entry, index) => ({
        name: entry.name,
        value: toNumberOrZero(entry.value),
        color: paletteMap[entry.color] || ['#1d4ed8', '#10b981', '#f97316'][index % 3],
      }));
    }

    return [{ name: 'Electricite', value: 100, color: '#1d4ed8' }];
  }, [activeSiteTab, currentData.energyMix, recentSiteFactures]);

  const significanceRows = useMemo(() => {
    const rows = [];
    usagePieData.forEach((usage) => {
      const {
        consoScore,
        gainScore,
        finalScore,
        significant,
      } = getUsageSignificanceSnapshot(usage.value, usage.noteGain, usage.significant);

      rows.push({
        type: 'usage',
        usage: usage.name,
        pct: usage.value,
        consoScore,
        gainScore,
        finalScore,
        significant,
      });

      (usage.subUsages || []).forEach((subUsage) => {
        const subSnapshot = getUsageSignificanceSnapshot(subUsage.value, subUsage.noteGain, false);
        rows.push({
          type: 'sub',
          usage: subUsage.name,
          pct: toNumberOrZero(subUsage.value),
          consoScore: subSnapshot.consoScore,
          gainScore: subSnapshot.gainScore,
          finalScore: subSnapshot.finalScore,
          significant: subSnapshot.significant,
        });
      });
    });
    return rows;
  }, [usagePieData]);

  const usageMatrixRows = useMemo(() => {
    const scoreMap = new Map(
      significanceRows
        .filter((row) => row.type === 'usage')
        .map((row) => [normalizeSearchText(row.usage), row])
    );

    return (currentData.elecUsage || []).map((usage) => {
      const scoreRow = scoreMap.get(normalizeSearchText(usage?.name || ''));
      return {
        name: usage?.name || 'Usage',
        pct: toNumberOrZero(usage?.value),
        ratio: usage?.ratio || '',
        consoScore: scoreRow?.consoScore ?? '-',
        gainScore: scoreRow?.gainScore ?? '-',
        finalScore: scoreRow?.finalScore ?? '-',
        significant: scoreRow?.significant ?? Boolean(usage?.significant),
        subUsages: Array.isArray(usage?.subUsages)
          ? usage.subUsages.map((subUsage) => {
              const snapshot = getUsageSignificanceSnapshot(
                subUsage?.value,
                subUsage?.noteGain ?? null,
                false
              );
              return {
                ...subUsage,
                value: toNumberOrZero(subUsage?.value),
                consoScore: snapshot.consoScore,
                gainScore: snapshot.gainScore,
                finalScore: snapshot.finalScore,
                significant: snapshot.significant,
              };
            })
          : [],
      };
    });
  }, [currentData.elecUsage, significanceRows]);

  const usageColorMap = useMemo(
    () => new Map(usagePieData.map((usage) => [normalizeSearchText(usage.name), usage.color])),
    [usagePieData]
  );

  const usageSourceGroups = useMemo(() => {
    const isGazUsage = (row) =>
      String(row?.source || '').toLowerCase() === 'gaz' ||
      normalizeSearchText(row?.name || '').includes('gaz');
    const isGenericGazUsage = (name) => {
      const normalized = normalizeSearchText(name);
      return normalized === 'gaz' || normalized === 'gazprimaire';
    };
    const electricityRows = usageMatrixRows.filter((row) => !isGazUsage(row));
    const gasRows = usageMatrixRows.filter((row) => isGazUsage(row));

    const groups = [];
    if (electricityRows.length > 0) {
      groups.push({
        id: 'electricite',
        name: 'Electricite',
        rows: electricityRows.map((row, index) => ({ ...row, usageIndex: index })),
        pct: electricityRows.reduce((sum, row) => sum + toNumberOrZero(row.pct), 0),
      });
    }
    if (gasRows.length > 0) {
      const gasContainerRow = gasRows.find(
        (row) => isGenericGazUsage(row.name) && Array.isArray(row.subUsages) && row.subUsages.length > 0
      );
      const gasDisplayRows = gasContainerRow
        ? gasContainerRow.subUsages.map((subUsage, subIndex) => ({
            name: subUsage.name,
            pct: toNumberOrZero(subUsage.value),
            ratio: '',
            consoScore: subUsage.consoScore ?? '-',
            gainScore: subUsage.gainScore ?? '-',
            finalScore: subUsage.finalScore ?? '-',
            significant: Boolean(subUsage.significant),
            subUsages: [],
            usageIndex: usageMatrixRows.findIndex((usage) => usage.name === gasContainerRow.name),
            subIndex,
            isGasSubUsageRow: true,
          }))
        : gasRows.map((row) => ({
            ...row,
            usageIndex: usageMatrixRows.findIndex((usage) => usage.name === row.name),
            subIndex: null,
            isGasSubUsageRow: false,
          }));

      groups.push({
        id: 'gaz',
        name: 'Gaz',
        parentUsageIndex: gasContainerRow
          ? usageMatrixRows.findIndex((usage) => usage.name === gasContainerRow.name)
          : null,
        rows: gasDisplayRows,
        pct: gasRows.reduce((sum, row) => sum + toNumberOrZero(row.pct), 0),
      });
    }
    return groups;
  }, [usageMatrixRows]);

  const electricityUsageChartRows = useMemo(
    () =>
      usageSourceGroups
        .find((group) => group.id === 'electricite')
        ?.rows.map((row) => ({
          name: row.name,
          value: row.pct,
          color: usageColorMap.get(normalizeSearchText(row.name)) || '#2563eb',
        })) || [],
    [usageColorMap, usageSourceGroups]
  );

  const gasUsageChartRows = useMemo(
    () => {
      const gasGroup = usageSourceGroups.find((group) => group.id === 'gaz');
      if (!gasGroup) return [];

      const gasSubUsageRows = gasGroup.rows.flatMap((row, rowIndex) =>
        (row.subUsages || [])
          .filter((subUsage) => toNumberOrZero(subUsage.value) > 0)
          .map((subUsage, subIndex) => ({
            name: subUsage.name,
            value: toNumberOrZero(subUsage.value),
            color: ['#ef4444', '#f97316', '#f59e0b', '#fb7185', '#dc2626'][(rowIndex + subIndex) % 5],
          }))
      );

      if (gasSubUsageRows.length > 0) {
        return gasSubUsageRows;
      }

      return gasGroup.rows.map((row) => ({
        name: row.name,
        value: row.pct,
        color: usageColorMap.get(normalizeSearchText(row.name)) || '#ef4444',
      }));
    },
    [usageColorMap, usageSourceGroups]
  );

  const usageShareLighting = getUsageShareByKeywords(currentData.elecUsage, ['eclairage']);
  const usageShareCvc = getUsageShareByKeywords(currentData.elecUsage, ['clim', 'cvc', 'chauffage']);

  const kpiHistorySeries = useMemo(() => {
    const factureSeries = (factureInsights.monthlyRows || []).map((row) => ({
      year: row.year,
      monthIndex: row.monthIndex,
      consommation: toNumberOrZero(row.consommationKwh),
    }));

    const fallbackSeries = yearsRange
      .filter((year) => year !== 'REF')
      .flatMap((year) => {
        const values = getFactureBackedHistoryValues(year, historySeriesType) || [];
        return values.map((value, monthIndex) => ({
          year: Number(year),
          monthIndex,
          consommation: toNumberOrZero(value),
        }));
      })
      .filter((row) => row.consommation > 0);

    const sourceRows = (factureSeries.length ? factureSeries : fallbackSeries)
      .sort((left, right) => {
        const leftKey = `${left.year}-${String(left.monthIndex).padStart(2, '0')}`;
        const rightKey = `${right.year}-${String(right.monthIndex).padStart(2, '0')}`;
        return leftKey.localeCompare(rightKey);
      })
      .slice(-6);

    return sourceRows.map((row) => {
      const totalRatio = totalSiteArea > 0 ? row.consommation / totalSiteArea : 0;
      const lightingRatio = totalSiteArea > 0 ? (row.consommation * usageShareLighting) / totalSiteArea : 0;
      const cvcRatio = totalSiteArea > 0 ? (row.consommation * usageShareCvc) / totalSiteArea : 0;
      return {
        label: `${SHORT_MONTH_NAMES[row.monthIndex]} ${String(row.year).slice(-2)}`,
        total: Number(totalRatio.toFixed(3)),
        lighting: Number(lightingRatio.toFixed(3)),
        cvc: Number(cvcRatio.toFixed(3)),
        air: 0,
      };
    });
  }, [
    totalSiteArea,
    factureInsights.monthlyRows,
    getFactureBackedHistoryValues,
    historySeriesType,
    usageShareCvc,
    usageShareLighting,
    yearsRange,
  ]);

  const visionReductionTarget = toNumberOrZero(currentData.targets?.reduction2030 || 10);
  const visionRenewableTarget = toNumberOrZero(currentData.targets?.renewable2030 || 20);
  const referenceBase = displayedReferenceYtdValue > 0 ? displayedReferenceYtdValue : displayedCurrentYtdValue;
  const targetConso2030 = referenceBase * (1 - visionReductionTarget / 100);
  const hasAirComprime = activeSiteTab === 'MEGRINE';
  const hasPacMonitoring = ['MEGRINE', 'ELKHADHRA', 'NAASSEN'].includes(activeSiteTab);
  const airWeeklyKpiSeries = useMemo(() => {
    if (!hasAirComprime) {
      return [];
    }

    return buildAirWeeklyKpiSeries(Array.isArray(airLogs) ? airLogs : [])
      .slice(0, 4)
      .reverse();
  }, [airLogs, hasAirComprime]);

  const averageAirKpi = airWeeklyKpiSeries.length
    ? airWeeklyKpiSeries.reduce((sum, row) => sum + toNumberOrZero(row.value), 0) / airWeeklyKpiSeries.length
    : 0;

  const latestKpiSnapshot = {
    total: totalSiteArea > 0 ? displayedCurrentMonthValue / totalSiteArea : 0,
    lighting: totalSiteArea > 0 ? (displayedCurrentMonthValue * usageShareLighting) / totalSiteArea : 0,
    cvc: totalSiteArea > 0 ? (displayedCurrentMonthValue * usageShareCvc) / totalSiteArea : 0,
    air: averageAirKpi,
  };

  const reportYear = Number(String(reportMonth || '').slice(0, 4));
  const reportMonthIndex = Number(String(reportMonth || '').slice(5, 7)) - 1;
  const reportMonthlyRow = (factureInsights.monthlyRows || []).find((row) => row.monthKey === reportMonth) || null;
  const reportReferenceCandidates = (factureInsights.monthlyRows || [])
    .filter((row) => row.monthIndex === reportMonthIndex && row.year < reportYear)
    .map((row) => toNumberOrZero(row.consommationKwh))
    .filter((value) => value > 0);
  const reportReferenceValue = reportReferenceCandidates.length
    ? reportReferenceCandidates.reduce((sum, value) => sum + value, 0) / reportReferenceCandidates.length
    : 0;
  const reportConsumption = toNumberOrZero(reportMonthlyRow?.consommationKwh);
  const reportCost = toNumberOrZero(reportMonthlyRow?.prixDt);
  const reportPerformance = totalSiteArea > 0 ? reportConsumption / totalSiteArea : 0;
  const reportDiffPercent = reportReferenceValue > 0
    ? ((reportConsumption - reportReferenceValue) / reportReferenceValue) * 100
    : 0;
  const reportCurrentTemp = reportMonthIndex >= 0 && reportMonthIndex < 12
    ? toNumberOrZero(getTemperatureValues(activeSiteTab, reportYear)[reportMonthIndex])
    : 0;
  const reportPreviousTemp = reportMonthIndex >= 0 && reportMonthIndex < 12
    ? toNumberOrZero(getTemperatureValues(activeSiteTab, reportYear - 1)[reportMonthIndex])
    : 0;
  const reportClimateDelta = reportCurrentTemp - reportPreviousTemp;
  const reportMonthDate = reportMonth ? new Date(`${reportMonth}-01T00:00:00`) : new Date();
  const reportPracticalTips = [
    "Éteindre les climatiseurs et l'éclairage en zone inoccupée.",
    "Maintenir la consigne climatisation à 26°C en été.",
    "Vérifier les fuites du réseau d'air comprimé chaque semaine.",
    "Favoriser l'éclairage naturel dans les zones vitrées.",
  ];

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

            {false && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
                            <BarChart3 className="mr-2 text-blue-900" size={18} />
                            Historique Énergétique
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Historique automatiquement calculé depuis les factures enregistrées dans Dépenses Énergétiques.
                        </p>
                    </div>
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                        Source unique : base de données factures
                    </div>
                </div>

                {facturesLoading && !factureInsights.hasData ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Chargement des factures du site...
                    </div>
                ) : factureMonthlyChartData.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Aucune facture disponible pour générer l’historique de consommation.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
                        <div className="h-[360px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={factureMonthlyChartData} margin={{ top: 10, right: 16, left: 0, bottom: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'Coût') return [`${Number(value).toLocaleString('fr-FR')} DT`, name];
                                            return [`${Number(value).toLocaleString('fr-FR')} kWh`, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="consommation" name="Consommation" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Dernières factures</div>
                            <div className="space-y-2">
                                {recentSiteFactures.length === 0 ? (
                                    <div className="text-sm text-slate-400 italic">Aucune facture récente.</div>
                                ) : (
                                    recentSiteFactures.map((facture) => (
                                        <div key={facture.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                                                <span>{facture.date || facture.recordDate || '-'}</span>
                                                <span className="text-emerald-700">{Number(facture.prixDt ?? facture.netToPay ?? 0).toLocaleString('fr-FR')} DT</span>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Conso <b>{Number(facture.consommationKwh ?? facture.billedKwh ?? facture.consumptionGrid ?? 0).toLocaleString('fr-FR')}</b> kWh
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

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
        {showReport && (
            <div className="print-container fixed inset-0 z-[120] flex items-start justify-center overflow-auto bg-slate-950/70 p-6">
                <div className="print-scale w-full max-w-[1122px] rounded-[28px] bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
                        <div className="flex items-center gap-6">
                            <img src={italcarLogo} alt="Italcar" className="h-14 w-auto object-contain" />
                            <div className="h-12 w-px bg-slate-200" />
                            <div>
                                <h2 className="text-[34px] font-black uppercase tracking-tight text-slate-900">Rapport mensuel</h2>
                                <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-blue-900">
                                    Performance ?nerg?tique & ISO 50001
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-right">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">P?riode concern?e</div>
                            <div className="mt-1 text-3xl font-black text-slate-900">
                                {reportMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                                <MapPin size={12} className="text-slate-400" />
                                {currentSiteName}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-5 px-8 py-6">
                        <div className="col-span-4 flex flex-col gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Indicateurs cl?s</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="mb-1 text-[10px] font-bold uppercase text-slate-500">Consommation totale</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-slate-900">
                                                {reportConsumption > 0 ? formatCompactNumber(reportConsumption, 0) : '--'}
                                            </span>
                                            <span className="text-sm font-bold text-slate-400">kWh</span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-slate-200" />
                                    <div>
                                        <div className="mb-1 text-[10px] font-bold uppercase text-slate-500">Ratio performance</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-blue-900">
                                                {reportConsumption > 0 ? formatCompactNumber(reportPerformance, 3) : '--'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">kWh / m?</span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-slate-200" />
                                    <div>
                                        <div className="mb-1 text-[10px] font-bold uppercase text-slate-500">?volution vs r?f (N-1)</div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-2xl font-black ${reportReferenceValue > 0 && reportDiffPercent <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {reportReferenceValue > 0 ? `${reportDiffPercent > 0 ? '+' : ''}${formatCompactNumber(reportDiffPercent, 1)}%` : '--'}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${reportReferenceValue > 0 && reportDiffPercent <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {reportReferenceValue > 0 && reportDiffPercent <= 0 ? 'Objectif atteint' : 'Suivi mensuel'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl bg-blue-900 p-5 text-white">
                                <div className="relative z-10">
                                    <h3 className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">Co?t ?nerg?tique</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black">
                                            {reportCost > 0 ? formatCompactNumber(reportCost, 3) : '--'}
                                        </span>
                                        <span className="text-sm font-semibold text-blue-100">DT</span>
                                    </div>
                                    <div className="mt-1 text-[10px] text-blue-100">Hors TVA et redevances</div>
                                </div>
                                <div className="absolute -bottom-3 right-0 opacity-10">
                                    <Zap size={82} />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-8 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">R?partition d?taill?e (UES)</h4>
                                    <div className="space-y-2.5">
                                        {currentData.elecUsage.map((u, i) => (
                                            <div key={i} className="text-[10px]">
                                                <div className="mb-0.5 flex justify-between font-bold text-slate-700">
                                                    <span>{u.name}</span>
                                                    <span>{u.value}%</span>
                                                </div>
                                                <div className="mb-0.5 h-1 w-full rounded-full bg-slate-100">
                                                    <div className="h-full rounded-full bg-blue-900" style={{ width: `${u.value}%` }} />
                                                </div>
                                                <div className="flex flex-wrap gap-2 pl-2 text-[8px] text-slate-500">
                                                    {(u.subUsages || []).map((s, idx) => (
                                                        <span key={idx}>? {s.name} ({s.value}%)</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Comparatif temp?rature (N vs N-1)</h4>
                                    <div className="flex h-full flex-col justify-center rounded-xl bg-slate-50 p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <ThermometerSun size={24} className="text-amber-500" />
                                            <div className="text-xs font-bold text-slate-700">
                                                {reportMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="text-2xl font-black text-slate-900">
                                            {reportCurrentTemp > 0 ? `${reportCurrentTemp.toFixed(1)} ?C` : '--'}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            vs N-1 {reportPreviousTemp > 0 ? `${reportPreviousTemp.toFixed(1)} ?C` : '--'}
                                        </div>
                                        <div className="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] text-slate-600">
                                            {Math.abs(reportClimateDelta) < 0.1
                                                ? 'Aucune variation climatique significative.'
                                                : reportClimateDelta > 0
                                                    ? `Mois plus chaud de ${reportClimateDelta.toFixed(1)} ?C, avec impact probable sur les usages CVC.`
                                                    : `Mois plus froid de ${Math.abs(reportClimateDelta).toFixed(1)} ?C, avec influence probable sur le chauffage.`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="grid h-full grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="mb-3 flex items-center text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                                            <Target size={12} className="mr-2 text-emerald-600" />
                                            Vision 2030
                                        </h4>
                                        <div className="space-y-2 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-slate-400">Objectif r?duction</div>
                                                <div className="text-lg font-black text-emerald-800">
                                                    -{currentData.targets?.reduction2030 || 10}% <span className="text-[10px] font-normal text-slate-500">Conso</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-slate-400">Objectif renouvelable</div>
                                                <div className="text-lg font-black text-emerald-800">
                                                    {currentData.targets?.renewable2030 || 20}% <span className="text-[10px] font-normal text-slate-500">Mix</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="mb-3 flex items-center text-xs font-black uppercase tracking-[0.18em] text-blue-900">
                                            <Lightbulb size={12} className="mr-2 text-amber-500" />
                                            Bonnes pratiques
                                        </h4>
                                        <ul className="list-disc space-y-1.5 pl-3 text-[10px] leading-relaxed text-slate-600">
                                            {reportPracticalTips.map((tip) => (
                                                <li key={tip}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t-2 border-slate-100 px-8 pb-6 pt-6">
                        <div className="space-y-1 text-[9px] uppercase tracking-widest text-slate-400">
                            <div>ITALCAR S.A. ? Si?ge Social</div>
                            <div>Syst?me de management de l'?nergie ISO 50001</div>
                        </div>

                        <div className="flex flex-col items-end text-right">
                            <div className="mb-4 text-[10px] font-bold uppercase leading-tight text-slate-800">
                                ITALCAR S.A.<br />
                                Responsable syst?me management int?gr?s
                            </div>
                            <div className="mb-6 text-[10px] italic text-slate-500">
                                Fait ? Tunis, le {new Date().toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex h-20 w-48 items-center justify-center rounded border border-slate-300 bg-slate-50">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Signature & cachet</span>
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



