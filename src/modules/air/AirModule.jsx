import React, { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Gauge,
  Save,
  Timer,
  TrendingUp,
  Wind,
} from 'lucide-react';
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

const AirModule = ({ onBack, user }) => {
  const [week, setWeek] = useState(getWeekValue());
  const [savingId, setSavingId] = useState(null);
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

  const updateDraft = (compressorId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [compressorId]: {
        ...current[compressorId],
        [field]: value,
      },
    }));
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
      </main>
    </div>
  );
};

export default AirModule;
