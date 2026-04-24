import React, { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  ClipboardList,
  Edit2,
  Gauge,
  History,
  Plus,
  Save,
  Timer,
  TrendingUp,
  Trash2,
  Wind,
  Wrench,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ModuleHeader from '../../components/layout/ModuleHeader';
import { apiFetch } from '../../lib/api';
import { saveCollectionItem as saveData } from '../../lib/api';
import { useData } from '../../hooks/useData';

const COMPRESSORS = [
  {
    id: 1,
    title: 'Compresseur 1',
    name: 'Compresseur 1',
    model: 'Ceccato CSB 30',
    serial: 'CAI 827281',
    previousRunHours: 19960,
    previousLoadHours: 10500,
  },
  {
    id: 2,
    title: 'Compresseur 2',
    name: 'Compresseur 2',
    model: 'Ceccato CSB 30',
    serial: 'CAI 808264',
    previousRunHours: 19960,
    previousLoadHours: 10500,
  },
];

const KPI_Y_MIN = 0.05;
const KPI_Y_MAX = 0.3;

const MAINTENANCE_CONFIG = [
  { key: 'nettoyage', label: 'Nettoyage', intervalHours: 500 },
  { key: 'vidange', label: 'Vidange', intervalHours: 2000 },
  { key: 'filtreHuile', label: 'Filtre huile', intervalHours: 200 },
  { key: 'filtreAir', label: 'Filtre air', intervalHours: 2000 },
  { key: 'filtreSeparateur', label: 'Filtre séparateur', intervalHours: 4000 },
];

const EMPTY_SCHEDULE_FORM = {
  compressorId: 1,
  maintKey: 'nettoyage',
  plannedDate: '',
  plannedThresholdHours: '',
  priority: 'Normale',
  comment: '',
};

const getWeekValue = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const formatWeekLabel = (weekValue) => {
  const [year, rawWeek] = String(weekValue || '').split('-W');
  if (!year || !rawWeek) {
    return 'Semaine : Semaine --, ----';
  }

  return `Semaine : Semaine ${Number(rawWeek)}, ${year}`;
};

const getLogTimestamp = (log) => {
  const raw =
    log?._createdAt ||
    log?._updatedAt ||
    log?.createdAt ||
    log?.updatedAt ||
    log?._created ||
    log?.date ||
    0;

  const time = new Date(raw).getTime();
  if (Number.isFinite(time) && time > 0) {
    return time;
  }

  return Number(log?.id || 0);
};

const normalizeCompressorToken = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const resolveCompressorMeta = (row = {}) => {
  const candidates = [
    row.compressorId,
    row.compressor,
    row.compresseur,
    row.comp,
    row.asset_name,
    row.assetName,
    row.compName,
    row.name,
    row.title,
  ];

  for (const candidate of candidates) {
    const token = normalizeCompressorToken(candidate);
    if (!token) continue;

    if (
      token === '1' ||
      token === 'comp1' ||
      token === 'compressor1' ||
      token === 'compresseur1'
    ) {
      return COMPRESSORS[0];
    }

    if (
      token === '2' ||
      token === 'comp2' ||
      token === 'compressor2' ||
      token === 'compresseur2'
    ) {
      return COMPRESSORS[1];
    }

    const matched = COMPRESSORS.find((compressor) => {
      const normalizedName = normalizeCompressorToken(compressor.name);
      const normalizedTitle = normalizeCompressorToken(compressor.title);
      return token === normalizedName || token === normalizedTitle;
    });

    if (matched) {
      return matched;
    }
  }

  return null;
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatHours = (value) =>
  `${toNumber(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} h`;

const formatPercent = (value) =>
  `${toNumber(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const formatKpi = (value) =>
  toNumber(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatLogDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toDateInputValue = (value) => {
  if (!value) return '';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const frMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frMatch) {
      return `${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
};

const getWeekSortValue = (weekValue) => {
  const [year, rawWeek] = String(weekValue || '').split('-W');
  return Number(year || 0) * 100 + Number(rawWeek || 0);
};

const normalizeAirLog = (row = {}) => {
  const compressor = resolveCompressorMeta(row);
  const previousRunHours = toNumber(
    row.previousRunHours ??
      row.prevRunHours ??
      row.previous_marche ??
      row.prev_marche ??
      row.lastRun
  );
  const previousLoadHours = toNumber(
    row.previousLoadHours ??
      row.prevLoadHours ??
      row.previous_charge ??
      row.prev_charge ??
      row.lastLoad
  );
  const newRunHours = toNumber(
    row.newRunHours ??
      row.runHours ??
      row.operatingHours ??
      row.hoursRun ??
      row.heuresMarche ??
      row.marche ??
      row.newRun
  );
  const newLoadHours = toNumber(
    row.newLoadHours ??
      row.loadHours ??
      row.chargeHours ??
      row.loadedHours ??
      row.heuresCharge ??
      row.charge ??
      row.newLoad
  );
  const runDelta = toNumber(
    row.runDelta ?? Math.max(0, newRunHours - previousRunHours)
  );
  const loadDelta = toNumber(
    row.loadDelta ?? Math.max(0, newLoadHours - previousLoadHours)
  );
  const usageRate = toNumber(
    row.loadRate ?? (runDelta > 0 ? (loadDelta / runDelta) * 100 : 0)
  );
  const kpi = toNumber(row.kpi ?? (runDelta > 0 ? loadDelta / runDelta : 0));
  const note =
    row.note ||
    row.observation ||
    row.description ||
    row.notes ||
    row.comment ||
    '';
  const createdAt =
    row.createdAt ||
    row.created_at ||
    row._createdAt ||
    row.timestamp ||
    row.date ||
    new Date().toISOString();

  return {
    ...row,
    id:
      row.id ||
      row._id ||
      row.uuid ||
      `${row.week || row.semaine || 'no-week'}-${compressor?.id || 'comp'}`,
    type: row.type || row.entry_type || row.entryType || '',
    compressorId: compressor?.id || row.compressorId || row.compressor || row.comp || 'comp1',
    compName:
      compressor?.name ||
      row.compName ||
      row.asset_name ||
      row.assetName ||
      row.compresseur ||
      row.compressor ||
      'Compresseur 1',
    week: row.week || row.semaine || row.period || '',
    previousRunHours,
    previousLoadHours,
    newRunHours,
    newLoadHours,
    lastRun: previousRunHours,
    lastLoad: previousLoadHours,
    newRun: newRunHours,
    newLoad: newLoadHours,
    runDelta,
    loadDelta,
    loadRate: usageRate,
    kpi,
    note,
    description: note,
    createdAt,
    date: row.date || createdAt,
    maintType:
      row.maintType || row.maintenanceType || row.operationType || row.typeLabel,
    indexDone: toNumber(
      row.indexDone ?? row.counter ?? row.currentBaseHours ?? row.currentRunHours
    ),
    details: {
      ...(row.details || {}),
      notes: row.details?.notes || note,
    },
  };
};

const getShortWeekLabel = (weekValue) => {
  const rawWeek = String(weekValue || '').split('-W')[1];
  return rawWeek ? `S${Number(rawWeek)}` : 'S--';
};

const buildKpiHistory = (
  reports,
  currentWeek,
  currentKpiComp1,
  currentKpiComp2,
  currentKpiGlobal
) => {
  const groupedByWeek = new Map();

  reports.forEach((report) => {
    const reportWeek = report.week || 'Semaine inconnue';
    const current = groupedByWeek.get(reportWeek) || {
      week: reportWeek,
      comp1RunHours: 0,
      comp1LoadHours: 0,
      comp2RunHours: 0,
      comp2LoadHours: 0,
    };

    if (report.compName === COMPRESSORS[0].name) {
      current.comp1RunHours += toNumber(report.runDelta);
      current.comp1LoadHours += toNumber(report.loadDelta);
    }

    if (report.compName === COMPRESSORS[1].name) {
      current.comp2RunHours += toNumber(report.runDelta);
      current.comp2LoadHours += toNumber(report.loadDelta);
    }

    groupedByWeek.set(reportWeek, current);
  });

  const history = Array.from(groupedByWeek.values())
    .map((row) => ({
      week: getShortWeekLabel(row.week),
      weekSort: getWeekSortValue(row.week),
      kpiComp1:
        row.comp1RunHours > 0 ? row.comp1LoadHours / row.comp1RunHours : 0,
      kpiComp2:
        row.comp2RunHours > 0 ? row.comp2LoadHours / row.comp2RunHours : 0,
      kpiGlobal:
        row.comp1RunHours + row.comp2RunHours > 0
          ? (row.comp1LoadHours + row.comp2LoadHours) /
            (row.comp1RunHours + row.comp2RunHours)
          : 0,
    }))
    .sort((left, right) => left.weekSort - right.weekSort)
    .slice(-8);

  const currentWeekLabel = getShortWeekLabel(currentWeek);
  const currentPoint = {
    week: currentWeekLabel,
    weekSort: getWeekSortValue(currentWeek),
    kpiComp1: currentKpiComp1,
    kpiComp2: currentKpiComp2,
    kpiGlobal: currentKpiGlobal,
  };

  const historyWithoutCurrent = history.filter(
    (item) => item.week !== currentWeekLabel
  );
  const mergedHistory = [...historyWithoutCurrent, currentPoint]
    .sort((left, right) => left.weekSort - right.weekSort)
    .slice(-8);

  if (mergedHistory.length >= 3) {
    return mergedHistory;
  }

  return [
    { week: 'S13', kpiComp1: 0.14, kpiComp2: 0.16, kpiGlobal: 0.15 },
    { week: 'S14', kpiComp1: 0.15, kpiComp2: 0.18, kpiGlobal: 0.165 },
    { week: 'S15', kpiComp1: 0.13, kpiComp2: 0.19, kpiGlobal: 0.16 },
    { week: 'S16', kpiComp1: 0.17, kpiComp2: 0.2, kpiGlobal: 0.185 },
    {
      week: currentWeekLabel,
      kpiComp1: currentKpiComp1,
      kpiComp2: currentKpiComp2,
      kpiGlobal: currentKpiGlobal,
    },
  ];
};

const getMaintenanceStatus = (remainingHours, intervalHours) => {
  if (remainingHours <= 0) {
    return {
      label: 'Urgent',
      className: 'border-red-200 bg-red-50 text-red-700',
      progressClassName: 'bg-red-600',
    };
  }

  if (remainingHours <= intervalHours * 0.1) {
    return {
      label: 'À faire',
      className: 'border-orange-200 bg-orange-50 text-orange-700',
      progressClassName: 'bg-orange-500',
    };
  }

  if (remainingHours <= intervalHours * 0.2) {
    return {
      label: 'Proche',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      progressClassName: 'bg-amber-500',
    };
  }

  return {
    label: 'OK',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    progressClassName: 'bg-emerald-500',
  };
};

const buildMaintenanceItems = (currentRunHours, maintenanceLogs, compressor) =>
  MAINTENANCE_CONFIG.map((operation) => {
    const latestMaintenance = maintenanceLogs.find(
      (log) =>
        log.compName === compressor.name &&
        (log.maintKey === operation.key || log.maintType === operation.label)
    );
    const lastMaintenanceRunHours = toNumber(
      latestMaintenance?.indexDone ?? compressor.previousRunHours
    );
    const usedHours = Math.max(0, currentRunHours - lastMaintenanceRunHours);
    const remainingHours = Math.max(operation.intervalHours - usedHours, 0);
    const progress = Math.max(
      0,
      Math.min(100, (remainingHours / operation.intervalHours) * 100)
    );

    return {
      ...operation,
      lastMaintenanceRunHours,
      usedHours,
      remainingHours,
      progress,
      latestMaintenance,
      status: getMaintenanceStatus(remainingHours, operation.intervalHours),
    };
  });

const createMaintenanceAction = (plannedMaintenance) => ({
  id: `ACT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
  designation: `${plannedMaintenance.maintType} - ${plannedMaintenance.compName}`,
  source: 'Maintenance Air Comprimé',
  type: 'Préventive',
  responsable: plannedMaintenance.details?.owner || 'Maintenance',
  avancement: 0,
  compressor: plannedMaintenance.compName,
  maintenanceType: plannedMaintenance.maintType,
  plannedDate: plannedMaintenance.plannedDate,
  status: 'Planifié',
});

const buildMetrics = (previousValues, currentValues) => {
  const newRunHours = toNumber(currentValues.newRunHours);
  const newLoadHours = toNumber(currentValues.newLoadHours);
  const previousRunHours = toNumber(previousValues.previousRunHours);
  const previousLoadHours = toNumber(previousValues.previousLoadHours);

  const runHours = Math.max(0, newRunHours - previousRunHours);
  const loadHours = Math.max(0, newLoadHours - previousLoadHours);
  const usageRate = runHours > 0 ? (loadHours / runHours) * 100 : 0;
  const kpi = runHours > 0 ? loadHours / runHours : 0;

  return {
    runHours,
    loadHours,
    usageRate,
    kpi,
  };
};

const hasDraftValues = (draft = {}) =>
  String(draft?.newRunHours ?? '').trim() !== '' ||
  String(draft?.newLoadHours ?? '').trim() !== '';

const CompressorField = ({
  label,
  previousValue,
  previousPlaceholder,
  onPreviousChange,
  placeholder,
  value,
  onChange,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-3">
      <label className="pt-1 text-sm font-bold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <div className="min-w-[126px] rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          Précédent :
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={previousValue}
          onChange={(event) => onPreviousChange(event.target.value)}
          placeholder={previousPlaceholder}
          className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none"
        />
      </div>
    </div>

    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-800 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
    />
  </div>
);

const CompressorInputCard = ({
  compressor,
  week,
  values,
  previousValues,
  metrics,
  onWeekChange,
  onChange,
  onPreviousChange,
  onSave,
  saving,
}) => (
  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-6">
      <h2 className="text-3xl font-black tracking-tight text-blue-900">
        {compressor.title}
      </h2>
      <p className="mt-2 text-sm font-medium text-slate-500">
        {compressor.model} • {compressor.serial}
      </p>
    </div>

    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-black text-slate-800">
            <Activity className="h-5 w-5 text-blue-900" />
            Saisie Relevé
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Saisissez les nouveaux index hebdomadaires et vos observations.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            <Calendar className="h-4 w-4 text-blue-900" />
            Semaine
          </div>
          <div className="mt-1 text-sm font-bold text-slate-700">
            {formatWeekLabel(week)}
          </div>
          <input
            type="week"
            value={week}
            onChange={(event) => onWeekChange(event.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CompressorField
          label="Heures Marche"
          previousValue={previousValues.previousRunHours}
          previousPlaceholder={compressor.previousRunHours}
          onPreviousChange={(value) => onPreviousChange('previousRunHours', value)}
          placeholder="Nouveau..."
          value={values.newRunHours}
          onChange={(value) => onChange('newRunHours', value)}
        />
        <CompressorField
          label="Heures Charge"
          previousValue={previousValues.previousLoadHours}
          previousPlaceholder={compressor.previousLoadHours}
          onPreviousChange={(value) => onPreviousChange('previousLoadHours', value)}
          placeholder="Nouveau..."
          value={values.newLoadHours}
          onChange={(value) => onChange('newLoadHours', value)}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-600">
          Note / Observation
        </label>
        <textarea
          rows={4}
          value={values.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          placeholder="Note / Observation sur l’état du compresseur..."
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-500 sm:flex sm:flex-wrap">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-2">
            Fonctionnement : <span className="text-slate-800">{formatHours(metrics.runHours)}</span>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-2">
            Charge : <span className="text-slate-800">{formatHours(metrics.loadHours)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer le relevé'}
        </button>
      </div>
    </div>
  </section>
);

const CompressorPerformanceCard = ({ title, metrics, accentClass }) => (
  <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Lecture calculée à partir du dernier relevé enregistré ou des nouvelles saisies.
        </p>
      </div>
      <div className={`rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-wide ${accentClass}`}>
        KPI live
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Timer className="h-4 w-4 text-blue-900" />
          Heure de fonctionnement
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatHours(metrics.runHours)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Activity className="h-4 w-4 text-emerald-600" />
          Heure de charge
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatHours(metrics.loadHours)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          Taux d’usage
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatPercent(metrics.usageRate)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Gauge className="h-4 w-4 text-violet-600" />
          KPI
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatKpi(metrics.kpi)}
        </div>
      </div>
    </div>
  </article>
);

const GlobalKpiCard = ({ totalRunHours, totalLoadHours, globalKpi }) => (
  <article className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-blue-900 to-blue-800 p-6 text-white shadow-sm">
    <div className="mb-5">
      <h3 className="text-2xl font-black">Totale</h3>
      <p className="mt-1 text-sm text-blue-100">
        Consolidation globale des 2 compresseurs.
      </p>
    </div>

    <div className="space-y-4">
      <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-blue-100">
          Heures fonctionnement totales
        </div>
        <div className="mt-2 text-2xl font-black">{formatHours(totalRunHours)}</div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-blue-100">
          Heures charge totales
        </div>
        <div className="mt-2 text-2xl font-black">{formatHours(totalLoadHours)}</div>
      </div>

      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/15 p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-emerald-100">
          KPI globale
        </div>
        <div className="mt-2 text-4xl font-black">{formatKpi(globalKpi)}</div>
      </div>
    </div>
  </article>
);

const KpiTrendChart = ({ data }) => (
  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-blue-900">
          Courbe de KPi
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Évolution du KPI global par semaine avec seuils de performance.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
          Vert : 0 à 0.15
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
          Jaune : 0.15 à 0.20
        </span>
        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
          Rouge : &gt; 0.20
        </span>
      </div>
    </div>

    <div className="h-[360px] rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 18, right: 26, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="#dbe4f0" strokeDasharray="4 4" />
          <ReferenceArea y1={KPI_Y_MIN} y2={0.15} fill="#dcfce7" fillOpacity={0.85} />
          <ReferenceArea y1={0.15} y2={0.2} fill="#fef3c7" fillOpacity={0.9} />
          <ReferenceArea y1={0.2} y2={KPI_Y_MAX} fill="#fee2e2" fillOpacity={0.9} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            domain={[KPI_Y_MIN, KPI_Y_MAX]}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            tickFormatter={(value) => Number(value).toFixed(2)}
            label={{
              value: 'KPI',
              angle: -90,
              position: 'insideLeft',
              fill: '#1e3a8a',
              fontSize: 12,
              fontWeight: 800,
            }}
          />
          <Tooltip
            cursor={{ stroke: '#1e3a8a', strokeDasharray: '4 4' }}
            formatter={(value) => [formatKpi(value), 'KPI global']}
            labelFormatter={(label) => `Semaine ${label.replace('S', '')}`}
            contentStyle={{
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
              fontWeight: 700,
            }}
          />
          <ReferenceLine
            y={0.15}
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="6 4"
            label={{ value: 'Seuil 0.15', fill: '#92400e', fontSize: 12, fontWeight: 800 }}
          />
          <ReferenceLine
            y={0.2}
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="6 4"
            label={{ value: 'Seuil 0.20', fill: '#991b1b', fontSize: 12, fontWeight: 800 }}
          />
          <Line
            type="monotone"
            dataKey="kpi"
            stroke="#1e3a8a"
            strokeWidth={4}
            dot={{ r: 5, fill: '#1e3a8a', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
);

const CompressorPerformanceSummaryCard = ({ title, metrics, accentClass }) => (
  <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Lecture calculée à partir du dernier relevé enregistré ou des nouvelles saisies.
        </p>
      </div>
      <div className={`rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-wide ${accentClass}`}>
        KPI live
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Timer className="h-4 w-4 text-blue-900" />
          Heures de fonctionnement
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatHours(metrics.runHours)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Activity className="h-4 w-4 text-emerald-600" />
          Heures de charge
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatHours(metrics.loadHours)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          Taux de charge
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatPercent(metrics.usageRate)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Gauge className="h-4 w-4 text-violet-600" />
          KPI
        </div>
        <div className="mt-2 text-2xl font-black text-slate-800">
          {formatKpi(metrics.kpi)}
        </div>
      </div>
    </div>
  </article>
);

const GlobalPerformanceCard = ({ globalKpi, globalLoadRate }) => (
  <article className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-blue-900 to-blue-800 p-6 text-white shadow-sm">
    <div className="mb-5">
      <h3 className="text-2xl font-black">Totale</h3>
      <p className="mt-1 text-sm text-blue-100">
        Consolidation globale des 2 compresseurs.
      </p>
    </div>

    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/15 p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-emerald-100">
          KPI totale
        </div>
        <div className="mt-2 text-4xl font-black">{formatKpi(globalKpi)}</div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-blue-100">
          Taux de charge totale
        </div>
        <div className="mt-2 text-2xl font-black">
          {formatPercent(globalLoadRate)}
        </div>
      </div>
    </div>
  </article>
);

const MultiKpiTrendChart = ({ data }) => (
  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-blue-900">
          Courbe de KPi
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Évolution hebdomadaire du KPI Compresseur 1, Compresseur 2 et KPI global.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
          KPI Compresseur 1
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
          KPI Compresseur 2
        </span>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
          KPI globale
        </span>
      </div>
    </div>

    <div className="h-[360px] rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 18, right: 26, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="#dbe4f0" strokeDasharray="4 4" />
          <ReferenceArea y1={KPI_Y_MIN} y2={0.15} fill="#dcfce7" fillOpacity={0.85} />
          <ReferenceArea y1={0.15} y2={0.2} fill="#fef3c7" fillOpacity={0.9} />
          <ReferenceArea y1={0.2} y2={KPI_Y_MAX} fill="#fee2e2" fillOpacity={0.9} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            domain={[KPI_Y_MIN, KPI_Y_MAX]}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            tickFormatter={(value) => Number(value).toFixed(2)}
            label={{
              value: 'KPI',
              angle: -90,
              position: 'insideLeft',
              fill: '#1e3a8a',
              fontSize: 12,
              fontWeight: 800,
            }}
          />
          <Tooltip
            cursor={{ stroke: '#1e3a8a', strokeDasharray: '4 4' }}
            formatter={(value, name) => [formatKpi(value), name]}
            labelFormatter={(label) => `Semaine ${label.replace('S', '')}`}
            contentStyle={{
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
              fontWeight: 700,
            }}
          />
          <ReferenceLine
            y={0.15}
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="6 4"
            label={{ value: 'Seuil 0.15', fill: '#92400e', fontSize: 12, fontWeight: 800 }}
          />
          <ReferenceLine
            y={0.2}
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="6 4"
            label={{ value: 'Seuil 0.20', fill: '#991b1b', fontSize: 12, fontWeight: 800 }}
          />
          <Line
            type="monotone"
            dataKey="kpiComp1"
            name="KPI Compresseur 1"
            stroke="#1d4ed8"
            strokeWidth={3}
            dot={{ r: 4, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 3 }}
          />
          <Line
            type="monotone"
            dataKey="kpiComp2"
            name="KPI Compresseur 2"
            stroke="#059669"
            strokeWidth={3}
            dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 3 }}
          />
          <Line
            type="monotone"
            dataKey="kpiGlobal"
            name="KPI globale"
            stroke="#7c3aed"
            strokeWidth={4}
            dot={{ r: 5, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
);

const MaintenanceOperationCard = ({ item, compressor, onValidate }) => (
  <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h4 className="text-sm font-black uppercase tracking-wide text-slate-800">
          {item.label}
        </h4>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          Périodicité : {formatHours(item.intervalHours)}
        </p>
      </div>
      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${item.status.className}`}>
        {item.status.label}
      </span>
    </div>

    <div className="mb-3">
      <div className="text-3xl font-black text-emerald-700">
        {formatHours(item.remainingHours)}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-500">
        utilisées : {formatHours(item.usedHours)}
      </div>
    </div>

    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-all ${item.status.progressClassName}`}
        style={{ width: `${item.progress}%` }}
      />
    </div>

    <button
      type="button"
      onClick={() => onValidate(item, compressor)}
      className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900"
    >
      <Wrench className="mr-2 h-4 w-4" />
      Faire maint.
    </button>
  </article>
);

const MaintenanceSection = ({
  compressors,
  maintenanceItemsByCompressor,
  historyRows,
  plannedMaintenances,
  currentRunHoursByCompressor,
  onValidateMaintenance,
  onEditMaintenance,
  onDeleteHistory,
  onOpenSchedule,
}) => {
  return (
    <section className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div>
          <h2 className="flex items-center text-3xl font-black tracking-tight text-blue-900">
            <Wrench className="mr-3 h-7 w-7 text-red-600" />
            Tableau de Maintenance
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Décrément automatique basé sur les heures de fonctionnement du compresseur.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {compressors.map((compressor) => (
          <div
            key={compressor.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  Maintenance {compressor.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {compressor.model} • {compressor.serial}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                Base actuelle {compressor.title} :{' '}
                <span className="text-blue-900">
                  {formatHours(currentRunHoursByCompressor[compressor.id])}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {(maintenanceItemsByCompressor[compressor.id] || []).map((item) => (
                <MaintenanceOperationCard
                  key={`${compressor.id}-${item.key}`}
                  item={item}
                  compressor={compressor}
                  onValidate={onValidateMaintenance}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center text-lg font-black text-slate-800">
              <History className="mr-2 h-5 w-5 text-blue-900" />
              Historique
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Liste unique des relevés et interventions Compresseur 1 et Compresseur 2.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
            {historyRows.length} élément(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Compresseur</th>
                <th className="px-3 py-2">Opération</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Compteur</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-400">
                    Aucun relevé ou historique maintenance enregistré.
                  </td>
                </tr>
              ) : (
                historyRows.map((log) => (
                  <tr key={log.id || log._id || `${log.type}-${log.compName}-${log.createdAt}`}>
                    <td className="rounded-l-2xl border-y border-l border-slate-200 bg-white px-3 py-3 font-bold text-slate-700">
                      {log.compName || '-'}
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          log.type === 'WEEKLY_REPORT'
                            ? 'bg-violet-50 text-violet-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {log.type === 'WEEKLY_REPORT'
                          ? 'Relevé'
                          : log.maintType || 'Maintenance'}
                      </span>
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3 text-slate-600">
                      {formatLogDateTime(log.createdAt || log.date || log.week)}
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3 font-semibold text-slate-600">
                      {log.type === 'WEEKLY_REPORT' ? (
                        <div className="space-y-1 text-xs">
                          <div>
                            Marche : <span className="font-bold text-slate-800">{formatHours(log.newRunHours)}</span>
                          </div>
                          <div>
                            Charge : <span className="font-bold text-slate-800">{formatHours(log.newLoadHours)}</span>
                          </div>
                        </div>
                      ) : (
                        formatHours(log.indexDone)
                      )}
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3 text-slate-600">
                      {log.note || log.details?.notes || log.details?.ref || log.ref || 'Sans note'}
                    </td>
                    <td className="rounded-r-2xl border-y border-r border-slate-200 bg-white px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {log.type === 'MAINTENANCE' ? (
                          <button
                            type="button"
                            onClick={() => onEditMaintenance(log)}
                            className="inline-flex items-center rounded-xl border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                          >
                            <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                            Modifier
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onDeleteHistory(log)}
                          className="inline-flex items-center rounded-xl border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition hover:border-red-200 hover:bg-red-100"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center text-lg font-black text-blue-900">
              <ClipboardList className="mr-2 h-5 w-5" />
              Programmation de maintenance
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Chaque programmation crée aussi une action liée au plan d'actions.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSchedule}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Programmer une maintenance
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {plannedMaintenances.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-4 py-6 text-sm font-semibold text-slate-400 lg:col-span-2">
              Aucune maintenance programmée pour le moment.
            </div>
          ) : (
            plannedMaintenances.map((plan) => (
              <article
                key={plan.id || `${plan.compName}-${plan.plannedDate}`}
                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-800">
                      {plan.maintType} - {plan.compName}
                    </h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Prévue le {plan.plannedDate || '-'} à {formatHours(plan.plannedThresholdHours)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase text-amber-700">
                    {plan.priority || 'Normale'}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {plan.details?.comment || 'Sans commentaire'}
                </p>
                {plan.linkedActionId ? (
                  <p className="mt-3 text-xs font-bold text-blue-700">
                    Action liée : {plan.linkedActionId}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const MaintenanceValidationModal = ({
  draft,
  compressor,
  currentRunHours,
  saving,
  onChange,
  onClose,
  onConfirm,
}) => {
  if (!draft) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={onConfirm}
        className="w-full max-w-2xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
              Validation maintenance
            </p>
            <h3 className="mt-2 text-2xl font-black text-blue-900">
              {draft.item.label} - {compressor.title}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Index actuel : {formatHours(currentRunHours)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black uppercase text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Annuler
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Technicien *
            </span>
            <input
              type="text"
              value={draft.technician}
              onChange={(event) => onChange('technician', event.target.value)}
              placeholder="Nom du technicien"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Cout DT
            </span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={draft.cost}
              onChange={(event) => onChange('cost', event.target.value)}
              placeholder="0"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Reference / Details index
            </span>
            <input
              type="text"
              value={draft.ref}
              onChange={(event) => onChange('ref', event.target.value)}
              placeholder="Ex : filtre change, huile remplacee, inspection OK..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Note / Observation
            </span>
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) => onChange('notes', event.target.value)}
              placeholder="Observation sur l'intervention..."
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
          >
            Fermer
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Validation...' : 'Valider maintenance'}
          </button>
        </div>
      </form>
    </div>
  );
};

const MaintenanceScheduleModal = ({
  open,
  form,
  compressors,
  saving,
  onChange,
  onClose,
  onConfirm,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={onConfirm}
        className="w-full max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
              Action planifiée
            </p>
            <h3 className="mt-2 text-2xl font-black text-blue-900">
              Programmer une maintenance
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Cette programmation sera liée au module Actions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black uppercase text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Annuler
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Compresseur
            </span>
            <select
              value={form.compressorId}
              onChange={(event) => onChange('compressorId', Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {compressors.map((compressor) => (
                <option key={compressor.id} value={compressor.id}>
                  {compressor.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Opération
            </span>
            <select
              value={form.maintKey}
              onChange={(event) => onChange('maintKey', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {MAINTENANCE_CONFIG.map((operation) => (
                <option key={operation.key} value={operation.key}>
                  {operation.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Date prévue
            </span>
            <input
              type="date"
              value={form.plannedDate}
              onChange={(event) => onChange('plannedDate', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Seuil d'heures prévu
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.plannedThresholdHours}
              onChange={(event) => onChange('plannedThresholdHours', event.target.value)}
              placeholder="Ex : 20500"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Priorité
            </span>
            <select
              value={form.priority}
              onChange={(event) => onChange('priority', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="Basse">Basse</option>
              <option value="Normale">Normale</option>
              <option value="Haute">Haute</option>
              <option value="Urgente">Urgente</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Commentaire
            </span>
            <textarea
              rows={3}
              value={form.comment}
              onChange={(event) => onChange('comment', event.target.value)}
              placeholder="Contexte, pièces à prévoir, arrêt machine..."
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
          >
            Fermer
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="mr-2 h-4 w-4" />
            {saving ? 'Programmation...' : 'Créer la programmation'}
          </button>
        </div>
      </form>
    </div>
  );
};

const MaintenanceEditModal = ({
  draft,
  saving,
  onChange,
  onClose,
  onConfirm,
}) => {
  if (!draft) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={onConfirm}
        className="w-full max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
              Modification maintenance
            </p>
            <h3 className="mt-2 text-2xl font-black text-blue-900">
              {draft.maintType} - {draft.compName}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Corriger le compteur ou les détails de l'intervention.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black uppercase text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Annuler
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Date intervention
            </span>
            <input
              type="date"
              value={draft.date}
              onChange={(event) => onChange('date', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Compteur maintenance (h)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.indexDone}
              onChange={(event) => onChange('indexDone', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Technicien
            </span>
            <input
              type="text"
              value={draft.technician}
              onChange={(event) => onChange('technician', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Cout DT
            </span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={draft.cost}
              onChange={(event) => onChange('cost', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Référence
            </span>
            <input
              type="text"
              value={draft.ref}
              onChange={(event) => onChange('ref', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Note
            </span>
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) => onChange('notes', event.target.value)}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
          >
            Fermer
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
};

const AirModule = ({ onBack, user }) => {
  const [week, setWeek] = useState(getWeekValue());
  const [savingId, setSavingId] = useState(null);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [selectedMaintenanceCompressorId, setSelectedMaintenanceCompressorId] =
    useState(1);
  const [maintenanceDraft, setMaintenanceDraft] = useState(null);
  const [editMaintenanceDraft, setEditMaintenanceDraft] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE_FORM);
  const [notification, setNotification] = useState(null);
  const {
    data: airLogs,
    setData: setAirLogs,
    refresh: refreshAirLogs,
  } = useData('air_logs', { initialData: [], intervalMs: 0 });

  const normalizedAirLogs = useMemo(
    () => (Array.isArray(airLogs) ? airLogs : []).map(normalizeAirLog),
    [airLogs]
  );

  const [drafts, setDrafts] = useState(() =>
    COMPRESSORS.reduce((accumulator, compressor) => {
      accumulator[compressor.id] = {
        newRunHours: '',
        newLoadHours: '',
        notes: '',
      };
      return accumulator;
    }, {})
  );

  const [previousOverrides, setPreviousOverrides] = useState(() =>
    COMPRESSORS.reduce((accumulator, compressor) => {
      accumulator[compressor.id] = {
        previousRunHours: '',
        previousLoadHours: '',
      };
      return accumulator;
    }, {})
  );

  const weeklyReports = useMemo(
    () =>
      normalizedAirLogs
        .filter((log) => log?.type === 'WEEKLY_REPORT')
        .sort((left, right) => getLogTimestamp(right) - getLogTimestamp(left)),
    [normalizedAirLogs]
  );

  const previousReadings = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        const latestLog = weeklyReports.find(
          (log) => log.compName === compressor.name
        );

        accumulator[compressor.id] = {
          previousRunHours: toNumber(
            latestLog?.newRun ?? latestLog?.lastRun ?? compressor.previousRunHours
          ),
          previousLoadHours: toNumber(
            latestLog?.newLoad ??
              latestLog?.lastLoad ??
              compressor.previousLoadHours
          ),
        };

        return accumulator;
      }, {}),
    [weeklyReports]
  );

  const latestSavedMetricsByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        const latestLog = weeklyReports.find(
          (log) => log.compName === compressor.name
        );

        accumulator[compressor.id] = {
          runHours: toNumber(latestLog?.runDelta),
          loadHours: toNumber(latestLog?.loadDelta),
          usageRate: toNumber(latestLog?.loadRate),
          kpi: toNumber(latestLog?.kpi),
        };

        return accumulator;
      }, {}),
    [weeklyReports]
  );

  const effectivePreviousReadings = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        const override = previousOverrides[compressor.id] || {};
        accumulator[compressor.id] = {
          previousRunHours:
            override.previousRunHours !== ''
              ? toNumber(override.previousRunHours)
              : previousReadings[compressor.id].previousRunHours,
          previousLoadHours:
            override.previousLoadHours !== ''
              ? toNumber(override.previousLoadHours)
              : previousReadings[compressor.id].previousLoadHours,
        };
        return accumulator;
      }, {}),
    [previousOverrides, previousReadings]
  );

  const metricsByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        accumulator[compressor.id] = buildMetrics(
          effectivePreviousReadings[compressor.id],
          drafts[compressor.id]
        );
        return accumulator;
      }, {}),
    [drafts, effectivePreviousReadings]
  );

  const displayMetricsByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        accumulator[compressor.id] = hasDraftValues(drafts[compressor.id])
          ? metricsByCompressor[compressor.id]
          : latestSavedMetricsByCompressor[compressor.id];
        return accumulator;
      }, {}),
    [drafts, latestSavedMetricsByCompressor, metricsByCompressor]
  );

  const totalMetrics = useMemo(() => {
    const totalRunHours = COMPRESSORS.reduce(
      (sum, compressor) => sum + displayMetricsByCompressor[compressor.id].runHours,
      0
    );
    const totalLoadHours = COMPRESSORS.reduce(
      (sum, compressor) => sum + displayMetricsByCompressor[compressor.id].loadHours,
      0
    );

    return {
      totalRunHours,
      totalLoadHours,
      globalLoadRate: totalRunHours > 0 ? (totalLoadHours / totalRunHours) * 100 : 0,
      globalKpi: totalRunHours > 0 ? totalLoadHours / totalRunHours : 0,
    };
  }, [displayMetricsByCompressor]);

  const currentRunHoursByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        const draftRunHours = toNumber(drafts[compressor.id]?.newRunHours);
        accumulator[compressor.id] =
          draftRunHours > 0
            ? draftRunHours
            : effectivePreviousReadings[compressor.id].previousRunHours;
        return accumulator;
      }, {}),
    [drafts, effectivePreviousReadings]
  );

  const maintenanceLogsByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        accumulator[compressor.id] = normalizedAirLogs
          .filter(
            (log) =>
              log?.type === 'MAINTENANCE' && log.compName === compressor.name
          )
          .sort((left, right) => getLogTimestamp(right) - getLogTimestamp(left));
        return accumulator;
      }, {}),
    [normalizedAirLogs]
  );

  const sharedMaintenanceLogs = useMemo(
    () =>
      normalizedAirLogs
        .filter((log) => log?.type === 'MAINTENANCE')
        .sort((left, right) => getLogTimestamp(right) - getLogTimestamp(left)),
    [normalizedAirLogs]
  );

  const plannedMaintenances = useMemo(
    () =>
      normalizedAirLogs
        .filter((log) => log?.type === 'MAINTENANCE_PLAN')
        .sort((left, right) => getLogTimestamp(right) - getLogTimestamp(left)),
    [normalizedAirLogs]
  );

  const historyRows = useMemo(
    () =>
      [...weeklyReports, ...sharedMaintenanceLogs].sort(
        (left, right) => getLogTimestamp(right) - getLogTimestamp(left)
      ),
    [weeklyReports, sharedMaintenanceLogs]
  );

  const selectedMaintenanceCompressor =
    COMPRESSORS.find(
      (compressor) => compressor.id === selectedMaintenanceCompressorId
    ) || COMPRESSORS[0];

  const selectedMaintenanceCurrentRunHours =
    currentRunHoursByCompressor[selectedMaintenanceCompressor.id] ||
    selectedMaintenanceCompressor.previousRunHours;

  const activeMaintenanceCompressor =
    COMPRESSORS.find(
      (compressor) => compressor.id === maintenanceDraft?.compressorId
    ) || selectedMaintenanceCompressor;

  const activeMaintenanceCurrentRunHours =
    currentRunHoursByCompressor[activeMaintenanceCompressor.id] ||
    activeMaintenanceCompressor.previousRunHours;

  const maintenanceItemsByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        accumulator[compressor.id] = buildMaintenanceItems(
          currentRunHoursByCompressor[compressor.id] ||
            compressor.previousRunHours,
          maintenanceLogsByCompressor[compressor.id] || [],
          compressor
        );
        return accumulator;
      }, {}),
    [currentRunHoursByCompressor, maintenanceLogsByCompressor]
  );

  const kpiHistory = useMemo(
    () =>
      buildKpiHistory(
        weeklyReports,
        week,
        displayMetricsByCompressor[1].kpi,
        displayMetricsByCompressor[2].kpi,
        totalMetrics.globalKpi
      ),
    [weeklyReports, week, displayMetricsByCompressor, totalMetrics.globalKpi]
  );

  const updateDraft = (compressorId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [compressorId]: {
        ...current[compressorId],
        [field]: value,
      },
    }));
  };

  const updatePreviousOverride = (compressorId, field, value) => {
    setPreviousOverrides((current) => ({
      ...current,
      [compressorId]: {
        ...current[compressorId],
        [field]: value,
      },
    }));
  };

  const openMaintenanceValidation = (item, compressor) => {
    if (compressor?.id) {
      setSelectedMaintenanceCompressorId(compressor.id);
    }
    setMaintenanceDraft({
      item,
      compressorId: compressor?.id || selectedMaintenanceCompressorId,
      technician: user?.name || user?.username || '',
      cost: '',
      ref: '',
      notes: '',
    });
  };

  const updateMaintenanceDraft = (field, value) => {
    setMaintenanceDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  };

  const openEditMaintenance = (log) => {
    setEditMaintenanceDraft({
      id: log.id,
      type: log.type,
      week: log.week || week,
      compName: log.compName,
      compressorId: Number(log.compressorId) || resolveCompressorMeta(log)?.id || 1,
      maintKey: log.maintKey || '',
      maintType: log.maintType || 'Maintenance',
      intervalHours: toNumber(log.intervalHours),
      previousIndex: toNumber(log.previousIndex),
      usedHours: toNumber(log.usedHours),
      remainingBeforeValidation: toNumber(log.remainingBeforeValidation),
      date: toDateInputValue(log.date || log.createdAt),
      indexDone: String(toNumber(log.indexDone)),
      technician: log.details?.tech || '',
      cost: String(toNumber(log.cost)),
      ref: log.details?.ref || log.ref || '',
      notes: log.note || log.details?.notes || '',
      createdAt: log.createdAt || new Date().toISOString(),
    });
  };

  const updateEditMaintenanceDraft = (field, value) => {
    setEditMaintenanceDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  };

  const closeEditMaintenance = () => {
    if (!editSaving) {
      setEditMaintenanceDraft(null);
    }
  };

  const closeMaintenanceValidation = () => {
    if (!maintenanceSaving) {
      setMaintenanceDraft(null);
    }
  };

  const updateScheduleForm = (field, value) => {
    setScheduleForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openScheduleModal = () => {
    setScheduleForm((current) => ({
      ...current,
      compressorId: selectedMaintenanceCompressorId,
      plannedThresholdHours:
        current.plannedThresholdHours ||
        Math.round(selectedMaintenanceCurrentRunHours).toString(),
    }));
    setShowScheduleModal(true);
  };

  const closeScheduleModal = () => {
    if (!scheduleSaving) {
      setShowScheduleModal(false);
    }
  };

  const handleConfirmMaintenance = async (event) => {
    event.preventDefault();

    if (!maintenanceDraft?.technician.trim()) {
      setNotification({
        type: 'error',
        message: 'Veuillez renseigner le nom du technicien.',
      });
      return;
    }

    setMaintenanceSaving(true);

    const payload = {
      id: Date.now() + activeMaintenanceCompressor.id,
      type: 'MAINTENANCE',
      week,
      date: new Date().toLocaleDateString('fr-FR'),
      createdAt: new Date().toISOString(),
      compressorId: activeMaintenanceCompressor.id,
      compName: activeMaintenanceCompressor.name,
      maintKey: maintenanceDraft.item.key,
      maintType: maintenanceDraft.item.label,
      intervalHours: maintenanceDraft.item.intervalHours,
      previousIndex: maintenanceDraft.item.lastMaintenanceRunHours,
      indexDone: activeMaintenanceCurrentRunHours,
      usedHours: maintenanceDraft.item.usedHours,
      remainingBeforeValidation: maintenanceDraft.item.remainingHours,
      cost: toNumber(maintenanceDraft.cost),
      note: maintenanceDraft.notes.trim(),
      details: {
        tech: maintenanceDraft.technician.trim(),
        ref: maintenanceDraft.ref.trim(),
        notes: maintenanceDraft.notes.trim(),
      },
    };

    try {
      await saveData('air_logs', payload);
      await refreshAirLogs();
      setMaintenanceDraft(null);
      setNotification({
        type: 'success',
        message: `${maintenanceDraft.item.label} validée pour ${activeMaintenanceCompressor.title}.`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message:
          error?.message || 'Erreur lors de la validation de la maintenance.',
      });
    } finally {
      setMaintenanceSaving(false);
      window.setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteHistory = async (log) => {
    const itemId = log?.id || log?._id;
    if (!itemId) {
      return;
    }

    if (!window.confirm('Supprimer cette ligne de l’historique air comprimé ?')) {
      return;
    }

    try {
      await apiFetch(`/api/data/air_logs/${itemId}`, { method: 'DELETE' });
      await refreshAirLogs();
      setNotification({
        type: 'success',
        message: 'Ligne d’historique supprimée.',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: error?.message || 'Erreur lors de la suppression.',
      });
    } finally {
      window.setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSaveEditedMaintenance = async (event) => {
    event.preventDefault();

    if (!editMaintenanceDraft?.id) {
      return;
    }

    if (!editMaintenanceDraft.date || toNumber(editMaintenanceDraft.indexDone) <= 0) {
      setNotification({
        type: 'error',
        message: 'Veuillez renseigner la date et le compteur de maintenance.',
      });
      return;
    }

    setEditSaving(true);

    const payload = {
      id: editMaintenanceDraft.id,
      type: 'MAINTENANCE',
      week: editMaintenanceDraft.week || week,
      date: editMaintenanceDraft.date,
      createdAt: editMaintenanceDraft.createdAt || new Date().toISOString(),
      compressorId: editMaintenanceDraft.compressorId,
      compName: editMaintenanceDraft.compName,
      maintKey: editMaintenanceDraft.maintKey,
      maintType: editMaintenanceDraft.maintType,
      intervalHours: toNumber(editMaintenanceDraft.intervalHours),
      previousIndex: toNumber(editMaintenanceDraft.previousIndex),
      indexDone: toNumber(editMaintenanceDraft.indexDone),
      usedHours: toNumber(editMaintenanceDraft.usedHours),
      remainingBeforeValidation: toNumber(
        editMaintenanceDraft.remainingBeforeValidation
      ),
      cost: toNumber(editMaintenanceDraft.cost),
      note: editMaintenanceDraft.notes.trim(),
      details: {
        tech: editMaintenanceDraft.technician.trim(),
        ref: editMaintenanceDraft.ref.trim(),
        notes: editMaintenanceDraft.notes.trim(),
      },
    };

    try {
      await saveData('air_logs', payload);
      await refreshAirLogs();
      setEditMaintenanceDraft(null);
      setNotification({
        type: 'success',
        message: 'Maintenance mise à jour avec succès.',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: error?.message || 'Erreur lors de la mise à jour maintenance.',
      });
    } finally {
      setEditSaving(false);
      window.setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleScheduleMaintenance = async (event) => {
    event.preventDefault();

    const compressor =
      COMPRESSORS.find((item) => item.id === Number(scheduleForm.compressorId)) ||
      COMPRESSORS[0];
    const operation =
      MAINTENANCE_CONFIG.find((item) => item.key === scheduleForm.maintKey) ||
      MAINTENANCE_CONFIG[0];

    if (!scheduleForm.plannedDate || !scheduleForm.plannedThresholdHours) {
      setNotification({
        type: 'error',
        message: 'Veuillez renseigner la date prévue et le seuil d’heures.',
      });
      return;
    }

    setScheduleSaving(true);

    const plannedMaintenance = {
      id: Date.now() + compressor.id,
      type: 'MAINTENANCE_PLAN',
      week,
      date: new Date().toLocaleDateString('fr-FR'),
      createdAt: new Date().toISOString(),
      compressorId: compressor.id,
      compName: compressor.name,
      maintKey: operation.key,
      maintType: operation.label,
      plannedDate: scheduleForm.plannedDate,
      plannedThresholdHours: toNumber(scheduleForm.plannedThresholdHours),
      priority: scheduleForm.priority,
      status: 'Planifié',
      source: 'Maintenance Air Comprimé',
      details: {
        comment: scheduleForm.comment.trim(),
        owner: user?.name || user?.username || 'Maintenance',
      },
    };

    const actionPayload = createMaintenanceAction(plannedMaintenance);
    let linkedActionId = actionPayload.id;

    try {
      const savedAction = await apiFetch('/api/actions', {
        method: 'POST',
        body: JSON.stringify(actionPayload),
      });
      linkedActionId = savedAction?.id || linkedActionId;
    } catch (error) {
      console.warn('Action maintenance préparée localement:', error);
    }

    try {
      await saveData('air_logs', {
        ...plannedMaintenance,
        linkedActionId,
      });
      await refreshAirLogs();
      setScheduleForm(EMPTY_SCHEDULE_FORM);
      setShowScheduleModal(false);
      setNotification({
        type: 'success',
        message: 'Maintenance programmée et action liée créée.',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message:
          error?.message || 'Erreur lors de la programmation maintenance.',
      });
    } finally {
      setScheduleSaving(false);
      window.setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSave = async (compressor) => {
    const previousValues = effectivePreviousReadings[compressor.id];
    const currentDraft = drafts[compressor.id];
    const metrics = metricsByCompressor[compressor.id];
    const newRunHours = toNumber(currentDraft.newRunHours);
    const newLoadHours = toNumber(currentDraft.newLoadHours);

    if (!newRunHours || !newLoadHours) {
      setNotification({
        type: 'error',
        message: `Veuillez saisir les nouvelles heures de ${compressor.title}.`,
      });
      return;
    }

    if (newRunHours < previousValues.previousRunHours) {
      setNotification({
        type: 'error',
        message: `${compressor.title} : les heures marche doivent être supérieures ou égales à la valeur précédente.`,
      });
      return;
    }

    if (newLoadHours < previousValues.previousLoadHours) {
      setNotification({
        type: 'error',
        message: `${compressor.title} : les heures charge doivent être supérieures ou égales à la valeur précédente.`,
      });
      return;
    }

    setSavingId(compressor.id);

    const payload = {
      id: Date.now() + compressor.id,
      type: 'WEEKLY_REPORT',
      week,
      createdAt: new Date().toISOString(),
      compressorId: compressor.id,
      compName: compressor.name,
      previousRunHours: previousValues.previousRunHours,
      previousLoadHours: previousValues.previousLoadHours,
      lastRun: previousValues.previousRunHours,
      lastLoad: previousValues.previousLoadHours,
      newRunHours: newRunHours,
      newLoadHours: newLoadHours,
      newRun: newRunHours,
      newLoad: newLoadHours,
      note: currentDraft.notes,
      description: currentDraft.notes,
      runDelta: metrics.runHours,
      loadDelta: metrics.loadHours,
      loadRate: metrics.usageRate,
      kpi: metrics.kpi,
    };

    try {
      await saveData('air_logs', payload);
      await refreshAirLogs();
      setDrafts((current) => ({
        ...current,
        [compressor.id]: {
          newRunHours: '',
          newLoadHours: '',
          notes: '',
        },
      }));
      setPreviousOverrides((current) => ({
        ...current,
        [compressor.id]: {
          previousRunHours: '',
          previousLoadHours: '',
        },
      }));
      setNotification({
        type: 'success',
        message: `${compressor.title} enregistré avec succès.`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message:
          error?.message || `Erreur lors de l'enregistrement de ${compressor.title}.`,
      });
    } finally {
      setSavingId(null);
      window.setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="sticky top-0 z-30 px-3 py-3 sm:px-4 lg:px-5">
        <div className="w-full">
          <ModuleHeader
            title="Performance des Systèmes d'Air Comprimé"
            subtitle="Saisie hebdomadaire des compresseurs et suivi instantané des indicateurs d’usage"
            icon={Wind}
            user={user}
            onHomeClick={onBack}
          />
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-3 py-3 sm:px-4 lg:px-5">
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {COMPRESSORS.map((compressor) => (
            <CompressorInputCard
              key={compressor.id}
              compressor={compressor}
              week={week}
              values={drafts[compressor.id]}
              previousValues={effectivePreviousReadings[compressor.id]}
              metrics={displayMetricsByCompressor[compressor.id]}
              onWeekChange={setWeek}
              onChange={(field, value) => updateDraft(compressor.id, field, value)}
              onPreviousChange={(field, value) =>
                updatePreviousOverride(compressor.id, field, value)
              }
              onSave={() => handleSave(compressor)}
              saving={savingId === compressor.id}
            />
          ))}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-800">
                performance et usage
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Les KPI affichent le dernier relevé enregistré et se recalculent en temps réel dès que vous modifiez les nouvelles valeurs.
              </p>
            </div>

            {notification ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-sm ${
                  notification.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {notification.message}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <CompressorPerformanceSummaryCard
              title="Compresseur 1"
              metrics={displayMetricsByCompressor[1]}
              accentClass="bg-blue-50 text-blue-700"
            />
            <CompressorPerformanceSummaryCard
              title="Compresseur 2"
              metrics={displayMetricsByCompressor[2]}
              accentClass="bg-emerald-50 text-emerald-700"
            />
            <GlobalPerformanceCard
              globalKpi={totalMetrics.globalKpi}
              globalLoadRate={totalMetrics.globalLoadRate}
            />
          </div>
        </section>

        <section className="space-y-6">
          <MultiKpiTrendChart data={kpiHistory} />

          <MaintenanceSection
            compressors={COMPRESSORS}
            maintenanceItemsByCompressor={maintenanceItemsByCompressor}
            historyRows={historyRows}
            plannedMaintenances={plannedMaintenances}
            currentRunHoursByCompressor={currentRunHoursByCompressor}
            onValidateMaintenance={openMaintenanceValidation}
            onEditMaintenance={openEditMaintenance}
            onDeleteHistory={handleDeleteHistory}
            onOpenSchedule={openScheduleModal}
          />
        </section>
      </main>

      <MaintenanceValidationModal
        draft={maintenanceDraft}
        compressor={activeMaintenanceCompressor}
        currentRunHours={activeMaintenanceCurrentRunHours}
        saving={maintenanceSaving}
        onChange={updateMaintenanceDraft}
        onClose={closeMaintenanceValidation}
        onConfirm={handleConfirmMaintenance}
      />
      <MaintenanceScheduleModal
        open={showScheduleModal}
        form={scheduleForm}
        compressors={COMPRESSORS}
        saving={scheduleSaving}
        onChange={updateScheduleForm}
        onClose={closeScheduleModal}
        onConfirm={handleScheduleMaintenance}
      />
      <MaintenanceEditModal
        draft={editMaintenanceDraft}
        saving={editSaving}
        onChange={updateEditMaintenanceDraft}
        onClose={closeEditMaintenance}
        onConfirm={handleSaveEditedMaintenance}
      />
    </div>
  );
};

export default AirModule;
