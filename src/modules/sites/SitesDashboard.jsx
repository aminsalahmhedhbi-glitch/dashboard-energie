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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
    <div className="grid auto-rows-fr gap-6">
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
            width: 281mm !important;
            height: 194mm !important;
            transform: none !important;
            transform-origin: top left;
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
const VEHICLE_COUNT_MODULE_KEY = 'pilotage-review-vehicle-counts-v1';
const VEHICLE_COUNT_SITE_KEYS = ['MEGRINE', 'ELKHADHRA', 'NAASSEN'];
const VEHICLE_COUNT_ENTRY_LABELS = {
  MEGRINE: ['Atelier FIAT', 'Atelier IVECO'],
  ELKHADHRA: ['Atelier FIAT'],
  NAASSEN: ['Parc'],
};

const getVehicleCountDefaultEntries = (siteKey, siteState = {}) => {
  const preferredLabels = VEHICLE_COUNT_ENTRY_LABELS[siteKey];
  if (Array.isArray(preferredLabels) && preferredLabels.length > 0) {
    return preferredLabels.map((label) => ({ label, count: 0 }));
  }

  return Array.isArray(siteState?.coveredBreakdown)
    ? siteState.coveredBreakdown.map((zone) => ({
        label: zone?.label || 'Zone',
        count: 0,
      }))
    : [];
};

const normalizeVehicleCountEntries = (siteKey, siteState = {}, entries = []) => {
  const defaultEntries = getVehicleCountDefaultEntries(siteKey, siteState);
  const safeEntries = Array.isArray(entries) ? entries : [];
  const persistedMap = new Map(
    safeEntries.map((entry) => [String(entry?.label || '').trim(), Math.max(0, toNumberOrZero(entry?.count))])
  );

  const normalizedDefaults = defaultEntries.map((entry) => ({
    label: entry.label,
    count: persistedMap.has(entry.label) ? persistedMap.get(entry.label) : 0,
  }));

  safeEntries.forEach((entry) => {
    const label = String(entry?.label || '').trim();
    if (!label || normalizedDefaults.some((item) => item.label === label)) return;
    normalizedDefaults.push({
      label,
      count: Math.max(0, toNumberOrZero(entry?.count)),
    });
  });

  return normalizedDefaults;
};

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

const buildVehicleCountModulePayload = (sitesState = {}, persistedState = {}) =>
  VEHICLE_COUNT_SITE_KEYS.reduce((accumulator, siteKey) => {
    const siteState = sitesState?.[siteKey] || {};
    const persistedMonths = persistedState?.[siteKey]?.months || {};

    accumulator[siteKey] = {
      months: Object.keys(persistedMonths).reduce((monthAccumulator, monthKey) => {
        monthAccumulator[monthKey] = normalizeVehicleCountEntries(siteKey, siteState, persistedMonths[monthKey]);
        return monthAccumulator;
      }, {}),
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
  <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
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
  const [vehicleCountMonth, setVehicleCountMonth] = useState(prevMonth.toISOString().slice(0, 7));
  const reportPrintRef = React.useRef(null);
  const [notif, setNotif] = useState(null);
  const HISTORY_DRAFT_KEY = 'italcar_sites_history_draft_v1';
  const TARGETS_DRAFT_KEY = 'italcar_sites_targets_draft_v1';

  // Pour simplifier l'historique sur le serveur simple, on charge tout 'site_history'
  const { data: allHistory } = useData('site_history', { intervalMs: 0 });
  const { data: airLogs } = useData('air_logs', { initialData: [], intervalMs: 0 });
  const { factures: allFactures, loading: facturesLoading } = useFactures({
      site: null,
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
  const initialVehicleCountStateRef = React.useRef(
    buildVehicleCountModulePayload(sitesDataState)
  );
  const vehicleCountState = useModuleState(
    VEHICLE_COUNT_MODULE_KEY,
    initialVehicleCountStateRef.current,
    { seedOnMissing: true, debounceMs: 700 }
  );
  const reviewUsageHydratedRef = React.useRef(false);
  const reviewUsageSignatureRef = React.useRef('');
  const reviewUsageImmediateSaveRef = React.useRef(false);

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
    if (!reviewUsageHydratedRef.current || !reviewUsageImmediateSaveRef.current) return;

    const payload = buildReviewUsageModulePayload(sitesDataState);
    const signature = JSON.stringify(payload);
    reviewUsageSignatureRef.current = signature;
    reviewUsageImmediateSaveRef.current = false;

    let cancelled = false;

    const persistImmediately = async () => {
      try {
        await apiFetch(`/api/module-states/${REVIEW_USAGES_MODULE_KEY}`, {
          method: 'PUT',
          body: JSON.stringify({ data: payload }),
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Erreur sauvegarde immédiate usages revue :', error);
        }
      }
    };

    persistImmediately();

    return () => {
      cancelled = true;
    };
  }, [sitesDataState]);

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
  const requestImmediateReviewUsageSave = () => {
    reviewUsageImmediateSaveRef.current = true;
  };

  const handleUsageAdd = () => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        site.elecUsage = [...site.elecUsage, { name: "Nouvel Usage", value: 0, ratio: "-", significant: false, subUsages: [] }];
        return newData;
    });
    requestImmediateReviewUsageSave();
  };

  const handleUsageDelete = (usageIndex) => {
    setSitesDataState(prev => {
        const newData = { ...prev };
        const site = newData[activeSiteTab];
        site.elecUsage = site.elecUsage.filter((_, i) => i !== usageIndex);
        return newData;
    });
    requestImmediateReviewUsageSave();
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
      requestImmediateReviewUsageSave();
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
    requestImmediateReviewUsageSave();
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
    requestImmediateReviewUsageSave();
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
    requestImmediateReviewUsageSave();
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

    requestImmediateReviewUsageSave();
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
  const siteFactures = useMemo(() => {
    const siteIdMap = {
      MEGRINE: ['1', '1.0'],
      ELKHADHRA: ['2', '2.0'],
      NAASSEN: ['3', '3.0'],
      LAC: ['4', '4.0'],
      AZUR: ['5', '5.0'],
      CARTHAGE: ['6', '6.0'],
      CHARGUEYAA: ['7', '7.0'],
    };
    const targetDisplay = getSiteDisplayName(activeSiteTab);
    const targetIdValues = siteIdMap[activeSiteTab] || [];

    const normalize = (value) =>
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();

    const targetTokens = new Set([
      normalize(activeSiteTab),
      normalize(targetDisplay),
      ...targetIdValues.map((value) => normalize(value)),
    ]);

    return (allFactures || []).filter((facture) => {
      const candidates = [
        facture?.site,
        facture?.siteKey,
        facture?.siteName,
        facture?.siteId,
        getSiteDisplayName(facture?.site),
        getSiteDisplayName(facture?.siteName),
      ]
        .filter(Boolean)
        .map(normalize);

      return candidates.some((candidate) => targetTokens.has(candidate));
    });
  }, [activeSiteTab, allFactures]);
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
  const hasVehicleCountCard = VEHICLE_COUNT_SITE_KEYS.includes(activeSiteTab);
  const currentVehicleCountEntries = useMemo(() => {
    if (!hasVehicleCountCard) return [];
    const persistedMonths = vehicleCountState.data?.[activeSiteTab]?.months || {};
    return normalizeVehicleCountEntries(activeSiteTab, currentData, persistedMonths[vehicleCountMonth] || []);
  }, [activeSiteTab, currentData, hasVehicleCountCard, vehicleCountMonth, vehicleCountState.data]);
  const currentVehicleCountTotal = useMemo(
    () => currentVehicleCountEntries.reduce((sum, entry) => sum + Math.max(0, toNumberOrZero(entry.count)), 0),
    [currentVehicleCountEntries]
  );

  const updateVehicleCountEntry = (entryIndex, nextValue) => {
    if (!hasVehicleCountCard) return;
    vehicleCountState.setData((prev) => {
      const next = { ...(prev || {}) };
      const siteState = { ...(next[activeSiteTab] || { months: {} }) };
      const months = { ...(siteState.months || {}) };
      const entries = normalizeVehicleCountEntries(activeSiteTab, currentData, months[vehicleCountMonth] || []);
      entries[entryIndex] = {
        ...entries[entryIndex],
        count: Math.max(0, toNumberOrZero(nextValue)),
      };
      months[vehicleCountMonth] = entries;
      siteState.months = months;
      next[activeSiteTab] = siteState;
      return next;
    });
  };

  const handleSaveVehicleCountMonth = async () => {
    if (!hasVehicleCountCard) return;

    const payload = buildVehicleCountModulePayload(
      sitesDataState,
      vehicleCountState.data || {}
    );

    try {
      await apiFetch(`/api/module-states/${VEHICLE_COUNT_MODULE_KEY}`, {
        method: 'PUT',
        body: JSON.stringify({ data: payload }),
      });
      setNotif('Nombre de voitures enregistré');
      window.setTimeout(() => setNotif(null), 2500);
    } catch (error) {
      console.error('Erreur sauvegarde nombre de voitures :', error);
      setNotif("Erreur lors de l'enregistrement");
      window.setTimeout(() => setNotif(null), 2500);
    }
  };

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
  const reportReferenceMonthRow = (factureInsights.monthlyRows || [])
    .find((row) => row.monthIndex === reportMonthIndex && row.year === reportYear - 1)
    || null;
  const reportReferenceValue = toNumberOrZero(reportReferenceMonthRow?.consommationKwh);
  const reportConsumption = toNumberOrZero(reportMonthlyRow?.consommationKwh);
  const reportCost = toNumberOrZero(reportMonthlyRow?.prixDt);
  const reportPerformance = totalSiteArea > 0 ? reportConsumption / totalSiteArea : 0;
  const reportDiffPercent = reportReferenceValue > 0
    ? ((reportConsumption - reportReferenceValue) / reportReferenceValue) * 100
    : 0;
  const reportCurrentYtd = (factureInsights.monthlyRows || [])
    .filter((row) => row.year === reportYear && row.monthIndex <= reportMonthIndex)
    .reduce((sum, row) => sum + toNumberOrZero(row.consommationKwh), 0);
  const reportReferenceYtd = (factureInsights.monthlyRows || [])
    .filter((row) => row.year === reportYear - 1 && row.monthIndex <= reportMonthIndex)
    .reduce((sum, row) => sum + toNumberOrZero(row.consommationKwh), 0);
  const reportYtdDiffPercent = reportReferenceYtd > 0
    ? ((reportCurrentYtd - reportReferenceYtd) / reportReferenceYtd) * 100
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
    "Maintenir la consigne clim à 26°C en été.",
    "Vérifier les fuites du réseau air comprimé chaque semaine.",
    "Favoriser l'éclairage naturel dans les zones vitrées.",
  ];
  const handlePrintMonthlyReport = async () => {
    const reportNode = reportPrintRef.current;
    if (!reportNode) return;
    try {
      const canvas = await html2canvas(reportNode, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const fittedHeight = Math.min(imgHeight, usableHeight);
      const fittedWidth = imgHeight > usableHeight ? (canvas.width * fittedHeight) / canvas.height : imgWidth;
      const offsetX = (pageWidth - fittedWidth) / 2;
      const offsetY = (pageHeight - fittedHeight) / 2;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        offsetX,
        offsetY,
        fittedWidth,
        fittedHeight,
        undefined,
        'FAST'
      );

      const safeSiteName = String(currentData.name || 'site').replace(/[^\w\-]+/g, '-');
      pdf.save(`rapport-mensuel-${safeSiteName}-${reportMonth}.pdf`);
    } catch (error) {
      console.error('Erreur generation PDF rapport mensuel:', error);
      setNotif("Erreur lors de la génération du PDF");
      window.setTimeout(() => setNotif(null), 3000);
    }
  };
  const reportKpiSnapshot = {
    total: reportPerformance,
    lighting: totalSiteArea > 0 ? (reportConsumption * usageShareLighting) / totalSiteArea : 0,
    cvc: totalSiteArea > 0 ? (reportConsumption * usageShareCvc) / totalSiteArea : 0,
    air: averageAirKpi,
  };
  const renderMonthlyReportSheet = (sheetRef = null, extraClassName = '') => (
    <div
      ref={sheetRef}
      className={`print-scale relative flex min-h-[21cm] w-full max-w-[29.7cm] flex-col overflow-hidden bg-white ${extraClassName}`.trim()}
    >
      <div className="flex flex-1 flex-col bg-white px-7 py-6">
        <div className="mb-5 flex items-center justify-between border-b-4 border-blue-900 pb-4">
          <div className="flex items-center gap-6">
            <BrandLogo size="h-16" />
            <div className="h-12 w-px bg-slate-200" />
            <div>
              <h1 className="mb-1 text-3xl font-black uppercase leading-none tracking-tight text-slate-900">Rapport Mensuel</h1>
              <div className="text-sm font-bold uppercase tracking-widest text-blue-900">Performance Énergétique & ISO 50001</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-3 text-right">
            <div className="mb-1 text-xs font-bold uppercase text-slate-400">Période concernée</div>
            <div className="text-2xl font-black capitalize text-slate-800">
              {reportMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <div className="mt-1 ml-auto flex w-fit items-center justify-end rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500">
              <MapPin size={10} className="mr-1" /> {currentData.name}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Factory size={16} className="text-slate-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Fiche technique</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900">{formatCompactNumber(currentData.area)}</span>
              <span className="pb-1 text-sm font-bold text-slate-400">m² total</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Dont <span className="font-bold text-blue-900">{formatCompactNumber(currentData.covered)} m²</span> couverts et <span className="font-bold text-slate-700">{formatCompactNumber(currentData.open)} m²</span> ouverts.
            </p>
            <div className="mt-4 flex-1 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              {(currentData.coveredBreakdown || []).map((zone, index) => (
                <div key={index} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">{zone.label}</span>
                  <span className="font-bold text-slate-700">{formatCompactNumber(zone.value)} m²</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Gains consommation</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mois analysé ({reportMonthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })})</div>
                    <div className="mt-1 text-2xl font-black text-slate-900">
                      {reportConsumption > 0 ? formatCompactNumber(reportConsumption, 0) : '--'} <span className="text-xs font-bold text-slate-400">kWh</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">Réf. {reportReferenceValue > 0 ? formatCompactNumber(reportReferenceValue, 0) : '--'} kWh</div>
                  </div>
                  <span className={`rounded-xl px-3 py-2 text-xs font-black ${reportReferenceValue > 0 && reportDiffPercent <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {reportReferenceValue > 0 ? `${reportDiffPercent > 0 ? '+' : ''}${formatCompactNumber(reportDiffPercent, 1)}%` : '--'}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumul YTD</div>
                    <div className="mt-1 text-2xl font-black text-slate-900">
                      {reportCurrentYtd > 0 ? formatCompactNumber(reportCurrentYtd, 0) : '--'} <span className="text-xs font-bold text-slate-400">kWh</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">Réf. {reportReferenceYtd > 0 ? formatCompactNumber(reportReferenceYtd, 0) : '--'} kWh</div>
                  </div>
                  <span className={`rounded-xl px-3 py-2 text-xs font-black ${reportReferenceYtd > 0 && reportYtdDiffPercent <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {reportReferenceYtd > 0 ? `${reportYtdDiffPercent > 0 ? '+' : ''}${formatCompactNumber(reportYtdDiffPercent, 1)}%` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4">
          <ReviewMetricCard title="Performance globale" value={formatCompactNumber(reportKpiSnapshot.total, 3)} unit="kWh/m²" accent="blue" subtitle="kWh consommés par site / surface totale m2" />
          <ReviewMetricCard title="IPE eclairage" value={formatCompactNumber(reportKpiSnapshot.lighting, 3)} unit="kWh/m²" accent="amber" subtitle="kWh consommés × % usage eclairage / surface totale" />
          <ReviewMetricCard title="IPE CVC" value={formatCompactNumber(reportKpiSnapshot.cvc, 3)} unit="kWh/m²" accent="indigo" subtitle="kWh consommés × % usage clim / surface totale" />
          <ReviewMetricCard title={hasAirComprime ? 'IPE air comprime' : 'Air comprime'} value={hasAirComprime ? formatCompactNumber(reportKpiSnapshot.air, 3) : 'N/A'} unit={hasAirComprime ? 'kpi' : ''} accent="slate" subtitle={hasAirComprime ? 'Moyenne des 4 derniers relevés air comprimé' : 'Non applicable pour ce site'} />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-black text-emerald-800 uppercase mb-3 flex items-center">
                <Target size={12} className="mr-2 text-emerald-600" />
                Vision 2030
              </h4>
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm space-y-2">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Objectif réduction</div>
                  <div className="text-lg font-black text-emerald-800">
                    -{currentData.targets?.reduction2030 || 10}% <span className="text-[10px] font-normal text-slate-500">Conso</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Objectif renouvelable</div>
                  <div className="text-lg font-black text-emerald-800">
                    {currentData.targets?.renewable2030 || 20}% <span className="text-[10px] font-normal text-slate-500">Mix</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-900 uppercase mb-3 flex items-center">
                <Lightbulb size={12} className="mr-2 text-amber-500" />
                Bonnes pratiques
              </h4>
              <ul className="text-[10px] text-slate-600 space-y-1.5 list-disc pl-3 leading-relaxed">
                {reportPracticalTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t-2 border-slate-100 pt-6">
          <div className="flex justify-between items-end">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest space-y-1">
              <div>ITALCAR S.A. • Siège Social</div>
              <div>Système de Management de l'Énergie ISO 50001</div>
            </div>
            <div className="flex flex-col items-end text-right">
              <div className="text-[10px] font-bold text-slate-800 uppercase mb-4 leading-tight">
                ITALCAR S.A.<br />
                Responsable Système Management Intégrés
              </div>
              <div className="text-[10px] text-slate-500 mb-3 italic">
                Fait à Tunis, le {new Date().toLocaleDateString('fr-FR')}
              </div>
              <div className="h-24 w-56 rounded border border-slate-300 bg-slate-50 flex items-center justify-center">
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Signature & Cachet</span>
              </div>
            </div>
          </div>
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

        {false && (
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
        )}

        <main className="mx-auto max-w-[1600px] animate-in space-y-10 px-4 pb-20 fade-in duration-500 sm:px-6 lg:px-8">
            <SiteTabs />

            <section className="space-y-6">
                <ReviewSectionHeader
                  icon={LayoutGrid}
                  title="Contexte & Bilan Energetique"
                  subtitle={`Vue consolidee du site ${currentSiteName}, alimentee par les factures, l'historique energetique et les objectifs 2030 deja enregistres.`}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <div className="grid auto-rows-fr gap-6">
                    <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:aspect-square xl:min-h-0">
                      <div className="mb-4 flex items-center gap-2">
                        <Factory size={16} className="text-slate-500" />
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Fiche technique</h3>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">{formatCompactNumber(currentData.area)}</span>
                        <span className="pb-1 text-sm font-bold text-slate-400">m² total</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Dont <span className="font-bold text-blue-900">{formatCompactNumber(currentData.covered)} m²</span> couverts et <span className="font-bold text-slate-700">{formatCompactNumber(currentData.open)} m²</span> ouverts.
                      </p>
                      <div className="mt-4 flex-1 space-y-2 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        {(currentData.coveredBreakdown || []).map((zone, index) => (
                          <div key={index} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-500">{zone.label}</span>
                            <span className="font-bold text-slate-700">{formatCompactNumber(zone.value)} m²</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {hasVehicleCountCard && (
                      <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:aspect-square xl:min-h-0">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <ClipboardList size={16} className="text-slate-500" />
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Nombre de voiture</h3>
                          </div>
                          <input
                            type="month"
                            value={vehicleCountMonth}
                            onChange={(e) => setVehicleCountMonth(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none transition-colors focus:border-blue-900"
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-slate-900">{formatCompactNumber(currentVehicleCountTotal, 0)}</span>
                          <span className="pb-1 text-sm font-bold text-slate-400">véhicules total</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Total des véhicules entrés pour {currentSiteName} sur la période sélectionnée.
                        </p>

                        <div className="mt-4 flex-1 space-y-2 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3">
                          {currentVehicleCountEntries.map((entry, index) => (
                            <div key={`${entry.label}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-slate-500">{entry.label}</span>
                              {userRole === 'ADMIN' ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={entry.count}
                                  onChange={(e) => updateVehicleCountEntry(index, e.target.value)}
                                  className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-700 outline-none transition-colors focus:border-blue-900"
                                />
                              ) : (
                                <span className="font-bold text-slate-700">{formatCompactNumber(entry.count, 0)}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {userRole === 'ADMIN' && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={handleSaveVehicleCountMonth}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-blue-800"
                            >
                              <Save size={14} />
                              Enregistrer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:aspect-square xl:min-h-0">
                    <div className="mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-slate-500" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Gains consommation</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mois analyse ({analysisMonthShortName} {analysisYear})</div>
                            <div className="mt-1 text-2xl font-black text-slate-900">
                              {formatCompactNumber(displayedCurrentMonthValue, 0)} <span className="text-xs font-bold text-slate-400">kWh</span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">Ref. {formatCompactNumber(displayedReferenceMonthValue, 0)} kWh</div>
                          </div>
                          <span className={`rounded-xl px-3 py-2 text-xs font-black ${diffMonthPercent <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {diffMonthPercent > 0 ? '+' : ''}{diffMonthPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumul YTD</div>
                            <div className="mt-1 text-2xl font-black text-slate-900">
                              {formatCompactNumber(displayedCurrentYtdValue, 0)} <span className="text-xs font-bold text-slate-400">kWh</span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">Ref. {formatCompactNumber(displayedReferenceYtdValue, 0)} kWh</div>
                          </div>
                          <span className={`rounded-xl px-3 py-2 text-xs font-black ${diffYtdPercent <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {diffYtdPercent > 0 ? '+' : ''}{diffYtdPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:aspect-square xl:min-h-0">
                    <div className="mb-4 flex items-center gap-2">
                      <ThermometerSun size={16} className="text-slate-500" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Climat & saisonnalite</h3>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Temperature {analysisMonthName}</div>
                      <div className="mt-2 flex items-end gap-3">
                        <span className="text-3xl font-black text-slate-900">{currentMonthTemp > 0 ? currentMonthTemp.toFixed(1) : '--'}</span>
                        <span className="pb-1 text-sm font-bold text-slate-400">°C</span>
                        <span className="pb-1 text-xs text-slate-500">vs N-1 {previousMonthTemp > 0 ? previousMonthTemp.toFixed(1) : '--'} °C</span>
                      </div>
                      <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-600">
                        {Math.abs(climateDelta) < 0.1
                          ? 'Aucune variation climatique significative detectee pour la periode analysee.'
                          : climateDelta > 0
                            ? `Mois plus chaud de ${climateDelta.toFixed(1)} °C, avec impact probable sur les usages CVC.`
                            : `Mois plus froid de ${Math.abs(climateDelta).toFixed(1)} °C, avec influence probable sur le chauffage.`}
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[260px] flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:aspect-square xl:min-h-0">
                    <div className="mb-4 flex items-center gap-2">
                      <Leaf size={16} className="text-slate-500" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Vecteurs energetiques</h3>
                    </div>
                    <div className="space-y-3">
                      {energySources.map((source) => (
                        <div key={source.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-slate-700">{source.name}</span>
                            <span className="font-black text-slate-900">{formatCompactNumber(source.value, 0)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, source.value))}%`, backgroundColor: source.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-slate-500">
                      {activeSiteTab === 'LAC'
                        ? 'La part PV est reconstituee a partir de la derniere facture basse tension du site.'
                        : 'Les vecteurs energetiques affichent la structure energetique du site telle qu’elle est configuree dans le module.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <ReviewMetricCard title="Performance globale" value={formatCompactNumber(latestKpiSnapshot.total, 3)} unit="kWh/m²" accent="blue" subtitle="kWh consommes par site / surface totale m2" />
                  <ReviewMetricCard title="IPE eclairage" value={formatCompactNumber(latestKpiSnapshot.lighting, 3)} unit="kWh/m²" accent="amber" subtitle="kWh consommes x % usage eclairage / surface totale" />
                  <ReviewMetricCard title="IPE CVC" value={formatCompactNumber(latestKpiSnapshot.cvc, 3)} unit="kWh/m²" accent="indigo" subtitle="kWh consommes x % usage clim / surface totale" />
                  <ReviewMetricCard
                    title={hasAirComprime ? 'IPE air comprime' : 'Air comprime'}
                    value={hasAirComprime ? formatCompactNumber(latestKpiSnapshot.air, 3) : 'N/A'}
                    unit={hasAirComprime ? 'kpi' : ''}
                    accent="slate"
                    subtitle={hasAirComprime ? 'Moyenne des 4 derniers releves air comprime' : 'Non applicable pour ce site'}
                  />
                </div>
            </section>

            <section className="space-y-6">
              <ReviewSectionHeader icon={Settings} title="Matrice des Usages Energetiques Significatifs (UES)" subtitle="La repartition et la significativite restent alimentees par la configuration UES deja enregistree." />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-4">
                  <ReviewUsageDonutCard
                    title="Usages - Electricite"
                    label="Elec."
                    data={electricityUsageChartRows}
                    emptyText="Aucun usage electrique defini."
                  />
                  <ReviewUsageDonutCard
                    title="Usages - Gaz"
                    label="Gaz"
                    data={gasUsageChartRows}
                    emptyText="Aucun usage gaz defini."
                  />
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:col-span-8">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60 p-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                      Evaluation des usages - <span className="text-blue-600">{currentSiteName}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowUsageGuide(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <HelpCircle size={14} />
                        Guide UES
                      </button>
                      {userRole === 'ADMIN' ? (
                        <button
                          onClick={() => setShowUsageConfig(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                        >
                          <Settings size={14} />
                          Configurer UES
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-white">
                          <th rowSpan="2" className="w-[34%] border-b border-slate-200 py-4 pl-4 text-xs font-semibold uppercase tracking-wider text-slate-400 align-bottom">
                            Source / Usage
                          </th>
                          <th rowSpan="2" className="border-b border-slate-200 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 align-bottom">
                            Part
                          </th>
                          <th colSpan="3" className="border-b border-slate-200 bg-slate-50/80 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                            Niveau de significativite
                          </th>
                          <th rowSpan="2" className="border-b border-slate-200 py-4 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 align-bottom">
                            Etat
                          </th>
                          <th rowSpan="2" className="border-b border-slate-200 py-4 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 align-bottom">
                            Actions
                          </th>
                        </tr>
                        <tr className="border-b border-slate-200 bg-white">
                          <th className="w-24 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Note conso</th>
                          <th className="w-24 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Note gain</th>
                          <th className="w-24 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Produit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageSourceGroups.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-12 text-center text-sm text-slate-400">
                              Aucun usage configure pour ce site.
                            </td>
                          </tr>
                        ) : (
                          usageSourceGroups.map((group) => (
                            <React.Fragment key={group.id}>
                              <tr className="group border-b border-slate-200 bg-slate-50">
                                <td className="py-4 pl-4 font-semibold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <Zap size={14} className={group.id === 'gaz' ? 'text-red-500' : 'text-amber-500'} />
                                    <span>{group.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 font-medium text-slate-800">{formatCompactNumber(group.pct, 0)}%</td>
                                <td className="py-4 text-center text-slate-400">-</td>
                                <td className="py-4 text-center text-slate-400">-</td>
                                <td className="py-4 text-center font-bold text-slate-400">-</td>
                                <td className="py-4 pr-4 text-right text-slate-300">-</td>
                                <td className="py-4 pr-4 text-right">
                                  {group.parentUsageIndex != null ? (
                                    <button
                                      type="button"
                                      onClick={() => openUsageAddModal(group.parentUsageIndex)}
                                      title="Ajouter un sous-usage gaz"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    >
                                      <PlusCircle size={14} />
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              </tr>

                              {group.rows.map((row, rowIndex) => (
                                <React.Fragment key={`${group.id}-${row.name}-${rowIndex}`}>
                                  {(() => {
                                    const rowKey = `${group.id}-${rowIndex}`;
                                    const isCollapsed = Boolean(collapsedUsageRows[rowKey]);
                                    const isGasSubUsageRow = Boolean(row.isGasSubUsageRow);
                                    return (
                                      <>
                                  <tr className="group border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-4 pl-10">
                                      <div className="flex items-center gap-2">
                                        {!isGasSubUsageRow && row.subUsages.length > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleUsageRow(rowKey)}
                                            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                          >
                                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                          </button>
                                        ) : (
                                          <span className="text-slate-300">•</span>
                                        )}
                                        <span className="font-medium text-slate-700">{row.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 font-medium text-slate-600">{formatCompactNumber(row.pct, 0)}%</td>
                                    <td className="py-4 text-center text-slate-500">{row.consoScore}</td>
                                    <td className="py-4 text-center text-slate-500">{row.gainScore}</td>
                                    <td className="py-4 text-center font-bold text-slate-900">{row.finalScore}</td>
                                    <td className="py-4 pr-4 text-right">
                                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${row.significant ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {row.significant ? 'UES' : 'Suivi'}
                                      </span>
                                    </td>
                                    <td className="py-4 pr-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {!isGasSubUsageRow ? (
                                          <button
                                            type="button"
                                            onClick={() => openUsageAddModal(row.usageIndex)}
                                            title="Ajouter un sous-usage"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                          >
                                            <PlusCircle size={14} />
                                          </button>
                                        ) : null}
                                        <button
                                          type="button"
                                          onClick={() => openUsageEditModal(row.usageIndex, isGasSubUsageRow ? row.subIndex : null)}
                                          title="Modifier l’usage"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUsageActionDelete(row.usageIndex, isGasSubUsageRow ? row.subIndex : null)}
                                          title="Supprimer l’usage"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {!isGasSubUsageRow && !isCollapsed && row.subUsages.map((subUsage, subIndex) => (
                                    <tr key={`${group.id}-${row.name}-${subUsage.name}-${subIndex}`} className="border-b border-slate-100 bg-white">
                                      <td className="py-3 pl-16 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-300">•</span>
                                          <span>{subUsage.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 text-slate-600">{formatCompactNumber(toNumberOrZero(subUsage.value), 1)}%</td>
                                      <td className="py-3 text-center text-slate-500">{subUsage.consoScore ?? '-'}</td>
                                      <td className="py-3 text-center text-slate-500">{subUsage.gainScore ?? '-'}</td>
                                      <td className="py-3 text-center font-bold text-slate-700">{subUsage.finalScore ?? '-'}</td>
                                      <td className="py-3 pr-4 text-right">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${subUsage.significant ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                          {subUsage.significant ? 'UES' : 'Suivi'}
                                        </span>
                                      </td>
                                      <td className="py-3 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => openUsageEditModal(row.usageIndex, subIndex)}
                                            title="Modifier le sous-usage"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleUsageActionDelete(row.usageIndex, subIndex)}
                                            title="Supprimer le sous-usage"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                      </>
                                    );
                                  })()}
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <ReviewSectionHeader icon={BarChart3} title="Suivi des Indicateurs (IPE) - Historique" subtitle="Les historiques ci-dessous sont derives des factures enregistrees et de l'historique de site deja sauvegarde." />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ReviewTrendChart title="Performance globale site" data={kpiHistorySeries.map((item) => ({ label: item.label, value: item.total }))} color="#0f172a" unit="kWh/m²" emptyText="Aucune serie exploitable pour afficher l'historique global." />
                <ReviewTrendChart title="IPE eclairage" data={kpiHistorySeries.map((item) => ({ label: item.label, value: item.lighting }))} color="#f59e0b" unit="kWh/m²" emptyText="Aucun historique eclairage disponible." />
                <ReviewTrendChart title="IPE climatisation / CVC" data={kpiHistorySeries.map((item) => ({ label: item.label, value: item.cvc }))} color="#2563eb" unit="kWh/m²" emptyText="Aucun historique CVC disponible." />
                {hasAirComprime ? (
                  <ReviewTrendChart title="IPE air comprime" data={airWeeklyKpiSeries.map((item) => ({ label: item.label, value: item.value }))} color="#7c3aed" unit="kpi" emptyText="Aucun releve air comprime disponible sur les 4 dernieres semaines." />
                ) : (
                  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-100/70 p-6 text-slate-400">
                    <Wind size={34} className="mb-3 opacity-40" />
                    <span className="text-sm font-semibold">Air comprime non applicable pour ce site</span>
                  </div>
                )}
              </div>
            </section>

            {hasPacMonitoring && (
              <section className="space-y-6">
                <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-[#0f172a] p-6 shadow-lg">
                  <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-2.5 text-blue-400">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">Supervision TGBT Temps Reel</h3>
                        <p className="text-sm text-slate-400">Analyseur reseau PAC2200 - Site {currentSiteName}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                      </span>
                      Suivi en ligne
                    </div>
                  </div>
                  <PacMonitoringPanel siteKey={activeSiteTab} />
                </div>
              </section>
            )}

            <section>
              <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-900 to-emerald-700 p-8 text-white shadow-lg">
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.7fr,1fr]">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">
                      <Shield size={14} /> Vision 2030
                    </div>
                    <h3 className="mt-4 text-3xl font-black tracking-tight">Feuille de route Energie & ISO 50001</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-emerald-100/85">
                      Les objectifs strategiques du site restent pilotes depuis la base de donnees existante. Cette vue reprend les cibles d'efficacite energetique et la part d'energie renouvelable configurees dans l'historique du site.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">Reference YTD</div>
                      <div className="mt-2 text-3xl font-black">{formatCompactNumber(referenceBase, 0)} <span className="text-sm font-bold text-emerald-100/70">kWh</span></div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">Objectif reduction</div>
                      <div className="mt-2 text-3xl font-black text-emerald-100">-{visionReductionTarget}%</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">Cible 2030</div>
                      <div className="mt-2 text-3xl font-black">{formatCompactNumber(targetConso2030, 0)} <span className="text-sm font-bold text-emerald-100/70">kWh</span></div>
                      <div className="mt-2 text-xs text-emerald-100/75">Part renouvelable visee : {visionRenewableTarget}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
        </main>

        {usageActionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {usageActionModal.mode === 'add-sub'
                      ? 'Ajouter un usage'
                      : usageActionModal.mode === 'edit-sub'
                        ? 'Modifier un usage'
                        : 'Modifier un usage'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Cette edition met a jour les donnees du site actif sans changer la structure existante.
                  </p>
                </div>
                <button onClick={closeUsageActionModal} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUsageActionModal} className="space-y-5 p-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nom de l&apos;usage
                  </label>
                  <input
                    type="text"
                    required
                    value={usageActionForm.name}
                    onChange={(event) =>
                      setUsageActionForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Part (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]+([.,][0-9]+)?"
                    value={usageActionForm.value}
                    onChange={(event) =>
                      setUsageActionForm((prev) => ({
                        ...prev,
                        value: event.target.value.replace(/[^0-9,.\s]/g, ''),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Note Conso (1-5) <span className="ml-1 text-xs font-normal text-blue-500">(Calculé)</span>
                    </label>
                    <input
                      type="number"
                      disabled
                      value={getUsageConsoScoreByPart(usageActionForm.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Note Gain (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      placeholder="Optionnel"
                      value={usageActionForm.noteGain}
                      onChange={(event) =>
                        setUsageActionForm((prev) => ({
                          ...prev,
                          noteGain: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeUsageActionModal}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                        <button
                          onClick={() => {
                            requestImmediateReviewUsageSave();
                            setShowUsageConfig(false);
                          }}
                          className="bg-blue-900 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-800"
                        >
                          Enregistrer les modifications
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showUsageGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-blue-50 p-5">
                        <div className="flex items-center gap-2 text-blue-700">
                            <HelpCircle size={18} />
                            <h3 className="text-lg font-bold">Guide UES</h3>
                        </div>
                        <button onClick={() => setShowUsageGuide(false)} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-600">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4 p-6 text-sm text-slate-600">
                        <p>
                            L'equipe energie evalue les usages a partir de la part de consommation et du gain potentiel afin d'identifier les usages energetiques significatifs.
                        </p>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full border-collapse text-center text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                                        <th className="border-r border-slate-200 px-3 py-3 font-bold">% Consommation</th>
                                        <th className="border-r border-slate-200 px-3 py-3 font-bold text-blue-600">Note conso</th>
                                        <th className="border-r border-slate-200 px-3 py-3 font-bold">Gain potentiel</th>
                                        <th className="px-3 py-3 font-bold text-amber-600">Note gain</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="border-r border-slate-200 px-3 py-2">&lt; 5%</td>
                                        <td className="border-r border-slate-200 px-3 py-2 font-bold text-blue-600">1</td>
                                        <td className="border-r border-slate-200 px-3 py-2">&lt; 5%</td>
                                        <td className="px-3 py-2 font-bold text-amber-600">1</td>
                                    </tr>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <td className="border-r border-slate-200 px-3 py-2">[5% - 10%[</td>
                                        <td className="border-r border-slate-200 px-3 py-2 font-bold text-blue-600">2</td>
                                        <td className="border-r border-slate-200 px-3 py-2">[5% - 10%[</td>
                                        <td className="px-3 py-2 font-bold text-amber-600">2</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="border-r border-slate-200 px-3 py-2">[10% - 20%[</td>
                                        <td className="border-r border-slate-200 px-3 py-2 font-bold text-blue-600">3</td>
                                        <td className="border-r border-slate-200 px-3 py-2">[10% - 20%[</td>
                                        <td className="px-3 py-2 font-bold text-amber-600">3</td>
                                    </tr>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <td className="border-r border-slate-200 px-3 py-2">[20% - 30%[</td>
                                        <td className="border-r border-slate-200 px-3 py-2 font-bold text-blue-600">4</td>
                                        <td className="border-r border-slate-200 px-3 py-2">[20% - 30%[</td>
                                        <td className="px-3 py-2 font-bold text-amber-600">4</td>
                                    </tr>
                                    <tr>
                                        <td className="border-r border-slate-200 px-3 py-2">≥ 30%</td>
                                        <td className="border-r border-slate-200 px-3 py-2 font-bold text-blue-600">5</td>
                                        <td className="border-r border-slate-200 px-3 py-2">≥ 30%</td>
                                        <td className="px-3 py-2 font-bold text-amber-600">5</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                                <div className="text-lg font-bold text-amber-700">Produit ≥ 10</div>
                                <p className="mt-2 text-xs text-amber-700">Usage energetique significatif (UES)</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                                <div className="text-lg font-bold text-slate-600">Produit &lt; 10</div>
                                <p className="mt-2 text-xs text-slate-500">Usage suivi sans classement UES</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 p-4">
                        <button onClick={() => setShowUsageGuide(false)} className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800">
                            Fermer
                        </button>
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
                                                    <div className="w-32 text-xs font-bold text-blue-900 uppercase">Consommation</div>
                                                    {getFactureBackedHistoryValues(year, 'grid').map((val, i) => (
                                                        <input key={i} type="number" className={`w-20 p-2 text-center text-xs border rounded outline-none ${isFactureBackedYear(year) ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'focus:border-blue-900'}`} placeholder="-"
                                                            value={val} onChange={e => handleHistoryChange(year, i, e.target.value, 'grid')} readOnly={isFactureBackedYear(year)} title={isFactureBackedYear(year) ? 'Valeur alimentee automatiquement depuis les factures' : 'Valeur modifiable'} />
                                                    ))}
                                                </div>
                                             </>
                                         ) : (
                                             <div className="flex items-center gap-2 mb-2">
                                                 <div className="w-32 text-xs font-bold text-slate-600 uppercase">Consommation</div>
                                                 {getFactureBackedHistoryValues(year).map((val, i) => (
                                                     <input
                                                         key={i}
                                                         type="number"
                                                         className={`w-20 p-2 text-center text-xs border rounded outline-none ${isFactureBackedYear(year) ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'focus:border-blue-900'}`}
                                                         placeholder="-"
                                                         value={val}
                                                         onChange={e => handleHistoryChange(year, i, e.target.value)}
                                                         readOnly={isFactureBackedYear(year)}
                                                         title={isFactureBackedYear(year) ? 'Valeur alimentee automatiquement depuis les factures' : 'Valeur modifiable'}
                                                     />
                                                 ))}
                                             </div>
                                         )}
                                         
                                         {/* LIGNE TEMPÉRATURE AJOUTÉE */}
                                         <div className="flex items-center gap-2 mt-2 border-t border-slate-50 pt-2">
                                             <div className="w-32 text-xs font-bold text-amber-500 uppercase flex items-center"><Thermometer size={12} className="mr-1"/> Temp. Moy (°C)</div>
                                            {getTemperatureValues(activeSiteTab, year).map((val, i) => (
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
            <div className="print-container fixed inset-0 z-[70] flex items-center justify-center overflow-auto bg-slate-900/90 p-4">
                <div className="flex max-h-full w-full flex-col items-center overflow-auto">
                    <div className="no-print sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Mois du rapport</label>
                            <input
                                type="month"
                                value={reportMonth}
                                onChange={(e) => setReportMonth(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-900"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrintMonthlyReport}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-800"
                            >
                                <Printer size={16} />
                                Télécharger PDF
                            </button>
                            <button
                                onClick={() => setShowReport(false)}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                            >
                                <X size={16} />
                                Fermer
                            </button>
                        </div>
                    </div>

                    <div className="pointer-events-none fixed -left-[99999px] top-0 opacity-100">
                        {renderMonthlyReportSheet(reportPrintRef)}
                    </div>

                    <div className="no-print mt-4 origin-top" style={{ zoom: 0.5 }}>
                        {renderMonthlyReportSheet(null, 'shadow-2xl')}
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



