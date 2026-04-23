import React, { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Gauge,
  History,
  Save,
  Timer,
  TrendingUp,
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

const MAINTENANCE_CONFIG = [
  { key: 'nettoyage', label: 'Nettoyage', intervalHours: 500 },
  { key: 'vidange', label: 'Vidange', intervalHours: 2000 },
  { key: 'filtreHuile', label: 'Filtre huile', intervalHours: 200 },
  { key: 'filtreAir', label: 'Filtre air', intervalHours: 2000 },
  { key: 'filtreSeparateur', label: 'Filtre séparateur', intervalHours: 4000 },
];

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

const getWeekSortValue = (weekValue) => {
  const [year, rawWeek] = String(weekValue || '').split('-W');
  return Number(year || 0) * 100 + Number(rawWeek || 0);
};

const getShortWeekLabel = (weekValue) => {
  const rawWeek = String(weekValue || '').split('-W')[1];
  return rawWeek ? `S${Number(rawWeek)}` : 'S--';
};

const getReportKpi = (report) => {
  const explicitKpi = Number.parseFloat(report?.kpi);
  if (Number.isFinite(explicitKpi)) {
    return explicitKpi;
  }

  const runDelta = toNumber(report?.runDelta);
  const loadDelta = toNumber(report?.loadDelta);
  return runDelta > 0 ? loadDelta / runDelta : 0;
};

const buildKpiHistory = (reports, currentWeek, currentGlobalKpi) => {
  const groupedByWeek = new Map();

  reports.forEach((report) => {
    const reportWeek = report.week || 'Semaine inconnue';
    const current = groupedByWeek.get(reportWeek) || {
      week: reportWeek,
      runHours: 0,
      loadHours: 0,
    };

    current.runHours += toNumber(report.runDelta);
    current.loadHours += toNumber(report.loadDelta);
    groupedByWeek.set(reportWeek, current);
  });

  const history = Array.from(groupedByWeek.values())
    .map((row) => ({
      week: getShortWeekLabel(row.week),
      weekSort: getWeekSortValue(row.week),
      kpi: row.runHours > 0 ? row.loadHours / row.runHours : 0,
    }))
    .sort((left, right) => left.weekSort - right.weekSort)
    .slice(-8);

  const currentWeekLabel = getShortWeekLabel(currentWeek);
  const currentPoint = {
    week: currentWeekLabel,
    weekSort: getWeekSortValue(currentWeek),
    kpi: currentGlobalKpi,
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
    { week: 'S13', kpi: 0.14 },
    { week: 'S14', kpi: 0.16 },
    { week: 'S15', kpi: 0.18 },
    { week: 'S16', kpi: 0.13 },
    { week: currentWeekLabel, kpi: currentGlobalKpi },
  ];
};

const getKpiStatus = (kpi) => {
  if (kpi > 0.2) {
    return {
      label: 'Critique',
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }
  if (kpi >= 0.15) {
    return {
      label: 'À surveiller',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }
  return {
    label: 'Normal',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
};

const getMaintenanceStatus = (remainingHours, intervalHours) => {
  if (remainingHours <= 0) {
    return {
      label: 'À faire',
      className: 'border-red-200 bg-red-50 text-red-700',
      progressClassName: 'bg-red-600',
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

const CompressorField = ({
  label,
  previousValue,
  placeholder,
  value,
  onChange,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-3">
      <label className="text-sm font-bold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
        Précédent : {previousValue.toLocaleString('fr-FR')}
      </span>
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
          placeholder="Nouveau..."
          value={values.newRunHours}
          onChange={(value) => onChange('newRunHours', value)}
        />
        <CompressorField
          label="Heures Charge"
          previousValue={previousValues.previousLoadHours}
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
          Lecture instantanée calculée à partir des nouvelles saisies.
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
          <ReferenceArea y1={0} y2={0.15} fill="#dcfce7" fillOpacity={0.85} />
          <ReferenceArea y1={0.15} y2={0.2} fill="#fef3c7" fillOpacity={0.9} />
          <ReferenceArea y1={0.2} y2={0.3} fill="#fee2e2" fillOpacity={0.9} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 0.3]}
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

const MaintenanceOperationCard = ({ item, onValidate }) => (
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
      onClick={() => onValidate(item)}
      className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900"
    >
      <Wrench className="mr-2 h-4 w-4" />
      Faire maint.
    </button>
  </article>
);

const MaintenanceSection = ({
  compressors,
  selectedCompressorId,
  onSelectCompressor,
  maintenanceItems,
  maintenanceLogs,
  currentRunHours,
  onValidateMaintenance,
}) => {
  const selectedCompressor = compressors.find(
    (compressor) => compressor.id === selectedCompressorId
  );

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="flex items-center text-3xl font-black tracking-tight text-blue-900">
            <Wrench className="mr-3 h-7 w-7 text-red-600" />
            Tableau de Maintenance
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Décrément automatique basé sur les heures de fonctionnement du compresseur.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {compressors.map((compressor) => (
            <button
              key={compressor.id}
              type="button"
              onClick={() => onSelectCompressor(compressor.id)}
              className={`rounded-2xl border px-4 py-2 text-sm font-black transition ${
                selectedCompressorId === compressor.id
                  ? 'border-blue-900 bg-blue-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:text-blue-900'
              }`}
            >
              {compressor.title}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
        Base actuelle {selectedCompressor?.title} :{' '}
        <span className="text-blue-900">{formatHours(currentRunHours)}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {maintenanceItems.map((item) => (
          <MaintenanceOperationCard
            key={item.key}
            item={item}
            onValidate={onValidateMaintenance}
          />
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center text-lg font-black text-slate-800">
              <History className="mr-2 h-5 w-5 text-blue-900" />
              Historique détaillé
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Traçabilité des interventions, coûts et techniciens.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
            {maintenanceLogs.length} intervention(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Date / semaine</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Détails / Index</th>
                <th className="px-3 py-2">Technicien</th>
                <th className="px-3 py-2 text-right">Coût / Statut</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-400">
                    Aucun historique maintenance pour ce compresseur.
                  </td>
                </tr>
              ) : (
                maintenanceLogs.map((log) => (
                  <tr key={log.id || log._id || `${log.maintType}-${log.indexDone}`}>
                    <td className="rounded-l-2xl border-y border-l border-slate-200 bg-white px-3 py-3 font-bold text-slate-700">
                      {log.date || log.week || '-'}
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {log.maintType || 'Maintenance'}
                      </span>
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3 text-slate-600">
                      Index {formatHours(log.indexDone)} • {log.details?.ref || log.ref || 'Sans ref.'}
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3 font-semibold text-slate-600">
                      {log.details?.tech || log.tech || '-'}
                    </td>
                    <td className="border-y border-slate-200 bg-white px-3 py-3 text-right font-black text-slate-800">
                      {toNumber(log.cost).toLocaleString('fr-FR', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      DT
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                        OK
                      </span>
                    </td>
                    <td className="rounded-r-2xl border-y border-r border-slate-200 bg-white px-3 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 transition hover:border-blue-200 hover:text-blue-900"
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

const HistoryCard = ({ compressor, latestReport }) => {
  const lastKpi = getReportKpi(latestReport);
  const lastNote = latestReport?.description || 'Aucune observation renseignée.';
  const lastWeek = latestReport?.week
    ? formatWeekLabel(latestReport.week).replace('Semaine : ', '')
    : 'Aucune semaine saisie';

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-blue-900">
            Historique {compressor.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Dernier relevé sauvegardé dans les données air comprimé.
          </p>
        </div>
        <History className="h-6 w-6 text-blue-900" />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Dernière semaine saisie
          </div>
          <div className="mt-1 text-lg font-black text-slate-800">{lastWeek}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Dernier KPI
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800">
            {formatKpi(lastKpi)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Dernière note
          </div>
          <div className="mt-1 max-h-16 overflow-hidden text-sm font-semibold text-slate-700">
            {lastNote}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-900"
      >
        <History className="mr-2 h-4 w-4" />
        Voir historique
      </button>
    </article>
  );
};

const AirModule = ({ onBack, user }) => {
  const [week, setWeek] = useState(getWeekValue());
  const [savingId, setSavingId] = useState(null);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [selectedMaintenanceCompressorId, setSelectedMaintenanceCompressorId] =
    useState(1);
  const [maintenanceDraft, setMaintenanceDraft] = useState(null);
  const [notification, setNotification] = useState(null);
  const {
    data: airLogs,
    setData: setAirLogs,
  } = useData('air_logs', { initialData: [] });

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

  const weeklyReports = useMemo(
    () =>
      (Array.isArray(airLogs) ? airLogs : [])
        .filter((log) => log?.type === 'WEEKLY_REPORT')
        .sort((left, right) => getLogTimestamp(right) - getLogTimestamp(left)),
    [airLogs]
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

  const metricsByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        accumulator[compressor.id] = buildMetrics(
          previousReadings[compressor.id],
          drafts[compressor.id]
        );
        return accumulator;
      }, {}),
    [drafts, previousReadings]
  );

  const totalMetrics = useMemo(() => {
    const totalRunHours = COMPRESSORS.reduce(
      (sum, compressor) => sum + metricsByCompressor[compressor.id].runHours,
      0
    );
    const totalLoadHours = COMPRESSORS.reduce(
      (sum, compressor) => sum + metricsByCompressor[compressor.id].loadHours,
      0
    );

    return {
      totalRunHours,
      totalLoadHours,
      globalKpi: totalRunHours > 0 ? totalLoadHours / totalRunHours : 0,
    };
  }, [metricsByCompressor]);

  const currentRunHoursByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        const draftRunHours = toNumber(drafts[compressor.id]?.newRunHours);
        accumulator[compressor.id] =
          draftRunHours > 0
            ? draftRunHours
            : previousReadings[compressor.id].previousRunHours;
        return accumulator;
      }, {}),
    [drafts, previousReadings]
  );

  const maintenanceLogsByCompressor = useMemo(
    () =>
      COMPRESSORS.reduce((accumulator, compressor) => {
        accumulator[compressor.id] = (Array.isArray(airLogs) ? airLogs : [])
          .filter(
            (log) =>
              log?.type === 'MAINTENANCE' && log.compName === compressor.name
          )
          .sort((left, right) => getLogTimestamp(right) - getLogTimestamp(left));
        return accumulator;
      }, {}),
    [airLogs]
  );

  const selectedMaintenanceCompressor =
    COMPRESSORS.find(
      (compressor) => compressor.id === selectedMaintenanceCompressorId
    ) || COMPRESSORS[0];

  const selectedMaintenanceLogs =
    maintenanceLogsByCompressor[selectedMaintenanceCompressor.id] || [];

  const selectedMaintenanceCurrentRunHours =
    currentRunHoursByCompressor[selectedMaintenanceCompressor.id] ||
    selectedMaintenanceCompressor.previousRunHours;

  const selectedMaintenanceItems = useMemo(
    () =>
      buildMaintenanceItems(
        selectedMaintenanceCurrentRunHours,
        selectedMaintenanceLogs,
        selectedMaintenanceCompressor
      ),
    [
      selectedMaintenanceCurrentRunHours,
      selectedMaintenanceLogs,
      selectedMaintenanceCompressor,
    ]
  );

  const kpiHistory = useMemo(
    () => buildKpiHistory(weeklyReports, week, totalMetrics.globalKpi),
    [weeklyReports, week, totalMetrics.globalKpi]
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

  const openMaintenanceValidation = (item) => {
    setMaintenanceDraft({
      item,
      technician: '',
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

  const closeMaintenanceValidation = () => {
    if (!maintenanceSaving) {
      setMaintenanceDraft(null);
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
      id: Date.now() + selectedMaintenanceCompressor.id,
      type: 'MAINTENANCE',
      week,
      date: new Date().toLocaleDateString('fr-FR'),
      compName: selectedMaintenanceCompressor.name,
      maintKey: maintenanceDraft.item.key,
      maintType: maintenanceDraft.item.label,
      intervalHours: maintenanceDraft.item.intervalHours,
      previousIndex: maintenanceDraft.item.lastMaintenanceRunHours,
      indexDone: selectedMaintenanceCurrentRunHours,
      usedHours: maintenanceDraft.item.usedHours,
      remainingBeforeValidation: maintenanceDraft.item.remainingHours,
      cost: toNumber(maintenanceDraft.cost),
      details: {
        tech: maintenanceDraft.technician.trim(),
        ref: maintenanceDraft.ref.trim(),
        notes: maintenanceDraft.notes.trim(),
      },
    };

    try {
      const savedEntry = await saveData('air_logs', payload);
      setAirLogs((current) => [savedEntry, ...(Array.isArray(current) ? current : [])]);
      setMaintenanceDraft(null);
      setNotification({
        type: 'success',
        message: `${maintenanceDraft.item.label} validée pour ${selectedMaintenanceCompressor.title}.`,
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

  const handleSave = async (compressor) => {
    const previousValues = previousReadings[compressor.id];
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
      compName: compressor.name,
      lastRun: previousValues.previousRunHours,
      lastLoad: previousValues.previousLoadHours,
      newRun: newRunHours,
      newLoad: newLoadHours,
      description: currentDraft.notes,
      runDelta: metrics.runHours,
      loadDelta: metrics.loadHours,
      loadRate: metrics.usageRate,
      kpi: metrics.kpi,
    };

    try {
      const savedEntry = await saveData('air_logs', payload);
      setAirLogs((current) => [savedEntry, ...(Array.isArray(current) ? current : [])]);
      setDrafts((current) => ({
        ...current,
        [compressor.id]: {
          newRunHours: '',
          newLoadHours: '',
          notes: '',
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
              previousValues={previousReadings[compressor.id]}
              metrics={metricsByCompressor[compressor.id]}
              onWeekChange={setWeek}
              onChange={(field, value) => updateDraft(compressor.id, field, value)}
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
                Les KPI sont recalculés en temps réel dès que vous modifiez les nouvelles valeurs.
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
            <CompressorPerformanceCard
              title="Compresseur 1"
              metrics={metricsByCompressor[1]}
              accentClass="bg-blue-50 text-blue-700"
            />
            <CompressorPerformanceCard
              title="Compresseur 2"
              metrics={metricsByCompressor[2]}
              accentClass="bg-emerald-50 text-emerald-700"
            />
            <GlobalKpiCard
              totalRunHours={totalMetrics.totalRunHours}
              totalLoadHours={totalMetrics.totalLoadHours}
              globalKpi={totalMetrics.globalKpi}
            />
          </div>
        </section>

        <section className="space-y-6">
          <KpiTrendChart data={kpiHistory} />

          <MaintenanceSection
            compressors={COMPRESSORS}
            selectedCompressorId={selectedMaintenanceCompressorId}
            onSelectCompressor={setSelectedMaintenanceCompressorId}
            maintenanceItems={selectedMaintenanceItems}
            maintenanceLogs={selectedMaintenanceLogs}
            currentRunHours={selectedMaintenanceCurrentRunHours}
            onValidateMaintenance={openMaintenanceValidation}
          />
        </section>
      </main>

      <MaintenanceValidationModal
        draft={maintenanceDraft}
        compressor={selectedMaintenanceCompressor}
        currentRunHours={selectedMaintenanceCurrentRunHours}
        saving={maintenanceSaving}
        onChange={updateMaintenanceDraft}
        onClose={closeMaintenanceValidation}
        onConfirm={handleConfirmMaintenance}
      />
    </div>
  );
};

export default AirModule;
