import React, { useEffect, useMemo, useState } from 'react';
import { Check, CloudSun, Database, Snowflake, Sun } from 'lucide-react';

const getLastDayOfMonth = (year, month) => new Date(year, month, 0).getDate();

const buildArchiveUrl = ({ latitude, longitude, year, monthStr, lastDay }) =>
  `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${year}-${monthStr}-01&end_date=${year}-${monthStr}-${String(lastDay).padStart(2, '0')}&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FTunis`;

const monthLabel = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return '-';
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export default function EstimationClimatique({
  siteId = 'Inconnu',
  siteLabel = 'Site',
  dernierMoisFacture = '',
  moisCibleOverride = '',
  consoRefN_1 = 0,
  tauxOpti = 0,
  partCVC = 0.4,
  coordinates = { latitude: 36.8065, longitude: 10.1815 },
  onSave = () => {},
}) {
  const [moisCible, setMoisCible] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [resultats, setResultats] = useState(null);
  const [donneesJournalieres, setDonneesJournalieres] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (moisCibleOverride && /^\d{4}-\d{2}$/.test(moisCibleOverride)) {
      setMoisCible(moisCibleOverride);
      setResultats(null);
      setDonneesJournalieres([]);
      setErrorMessage('');
      setIsSaved(false);
      return;
    }

    if (!dernierMoisFacture || !/^\d{4}-\d{2}$/.test(dernierMoisFacture)) return;

    const dateN = new Date(`${dernierMoisFacture}-01T00:00:00`);
    dateN.setMonth(dateN.getMonth() + 1);
    const annee = dateN.getFullYear();
    const mois = String(dateN.getMonth() + 1).padStart(2, '0');
    setMoisCible(`${annee}-${mois}`);
    setResultats(null);
    setDonneesJournalieres([]);
    setErrorMessage('');
    setIsSaved(false);
  }, [dernierMoisFacture, moisCibleOverride, siteId]);

  const canRun = useMemo(
    () => Boolean(moisCible) && Number(consoRefN_1) > 0,
    [moisCible, consoRefN_1]
  );

  const lancerAnalyseClimatique = async () => {
    if (!canRun) return;

    const [anneeStr, moisStr] = moisCible.split('-');
    const anneeN = Number(anneeStr);
    const mois = Number(moisStr);
    const today = new Date();
    const startTarget = new Date(anneeN, mois - 1, 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    if (startTarget > currentMonthStart) {
      setErrorMessage("Le mois cible est futur. L'analyse climatique attend des donnees meteo disponibles.");
      setResultats(null);
      setDonneesJournalieres([]);
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    setIsSaved(false);

    const anneeN_1 = anneeN - 1;
    const estEte = mois >= 5 && mois <= 10;
    const baseTemp = estEte ? 24 : 18;
    const typeDJ = estEte ? 'DJC' : 'DJH';
    const lastDay = getLastDayOfMonth(anneeN, mois);

    try {
      const { latitude, longitude } = coordinates;
      const urlN = buildArchiveUrl({ latitude, longitude, year: anneeN, monthStr: moisStr, lastDay });
      const urlN_1 = buildArchiveUrl({ latitude, longitude, year: anneeN_1, monthStr: moisStr, lastDay });

      const [resN, resN_1] = await Promise.all([fetch(urlN), fetch(urlN_1)]);
      if (!resN.ok || !resN_1.ok) {
        throw new Error("Impossible de recuperer les donnees Open-Meteo.");
      }

      const dataN = await resN.json();
      const dataN_1 = await resN_1.json();
      const dailyN = dataN?.daily;
      const dailyPrev = dataN_1?.daily;

      if (!dailyN?.time?.length || !dailyPrev?.time?.length) {
        throw new Error('Donnees temperature journalieres manquantes.');
      }

      let totalDjN = 0;
      let totalDjN_1 = 0;
      const details = [];
      const days = Math.min(
        dailyN.time.length,
        dailyPrev.time.length,
        dailyN.temperature_2m_max.length,
        dailyN.temperature_2m_min.length,
        dailyPrev.temperature_2m_max.length,
        dailyPrev.temperature_2m_min.length
      );

      for (let i = 0; i < days; i += 1) {
        const maxN = Number(dailyN.temperature_2m_max[i] ?? baseTemp);
        const minN = Number(dailyN.temperature_2m_min[i] ?? baseTemp);
        const maxN_1 = Number(dailyPrev.temperature_2m_max[i] ?? baseTemp);
        const minN_1 = Number(dailyPrev.temperature_2m_min[i] ?? baseTemp);
        const moyenneN = (maxN + minN) / 2;
        const moyenneN_1 = (maxN_1 + minN_1) / 2;

        const djN = estEte
          ? Math.max(moyenneN - baseTemp, 0)
          : Math.max(baseTemp - moyenneN, 0);
        const djPrev = estEte
          ? Math.max(moyenneN_1 - baseTemp, 0)
          : Math.max(baseTemp - moyenneN_1, 0);

        totalDjN += djN;
        totalDjN_1 += djPrev;

        details.push({
          jour: i + 1,
          dateN: dailyN.time[i],
          tMoyN: moyenneN,
          djN,
          tMoyN_1: moyenneN_1,
          djN_1: djPrev,
        });
      }

      const multiplicateurOpti = 1 + Number(tauxOpti || 0);
      const consoApresOpti = Number(consoRefN_1 || 0) * multiplicateurOpti;
      const variationDJ = totalDjN_1 > 0 ? (totalDjN - totalDjN_1) / totalDjN_1 : 0;
      const influenceGlobale = variationDJ * Number(partCVC || 0);
      const facteurClimatique = 1 + influenceGlobale;
      const estimationFinale = consoApresOpti * facteurClimatique;

      setDonneesJournalieres(details);
      setResultats({
        typeDJ,
        baseTemp,
        totalDjN,
        totalDjN_1,
        multiplicateurOpti,
        variationDJ,
        influenceGlobale,
        facteurClimatique,
        consoApresOpti,
        estimationFinale,
        estEte,
      });
    } catch (error) {
      console.error('Erreur estimation climatique:', error);
      setErrorMessage(error.message || "Analyse climatique indisponible pour le moment.");
      setResultats(null);
      setDonneesJournalieres([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    if (!resultats) return;
    onSave({
      moisCible,
      estimationFinale: resultats.estimationFinale,
      facteurClimatique: resultats.facteurClimatique,
      multiplicateurOpti: resultats.multiplicateurOpti,
      consoRefN_1: Number(consoRefN_1 || 0),
      tauxOpti: Number(tauxOpti || 0),
      partCVC: Number(partCVC || 0),
      donneesJournalieres,
      resultats,
    });
    setIsSaved(true);
  };

  if (!dernierMoisFacture && !moisCibleOverride) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 mt-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
            <CloudSun size={16} />
            Estimation climatique
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Site: <b>{siteLabel}</b> | Dernier mois facture: <b>{dernierMoisFacture || '-'}</b> | Mois cible: <b>{moisCible || '-'}</b>
          </p>
        </div>

        <button
          type="button"
          onClick={lancerAnalyseClimatique}
          disabled={!canRun || isFetching}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            !canRun || isFetching
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
        >
          {isFetching ? 'Analyse en cours...' : 'Lancer analyse Open-Meteo'}
        </button>
      </div>

      {!canRun && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 italic">
          Donnees insuffisantes pour lancer l'analyse climatique.
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {errorMessage}
        </div>
      )}

      {resultats && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-2">
                <Database size={14} />
                Apercu jours ({resultats.typeDJ}) - Base {resultats.baseTemp} degC
              </h4>
              {resultats.estEte ? <Sun size={16} className="text-orange-500" /> : <Snowflake size={16} className="text-blue-500" />}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 text-left font-medium">Jour</th>
                    <th className="py-2 text-right font-medium">T N-1</th>
                    <th className="py-2 text-right font-semibold">{resultats.typeDJ} N-1</th>
                    <th className="py-2 text-right font-medium text-blue-600">T N</th>
                    <th className="py-2 text-right font-semibold text-blue-600">{resultats.typeDJ} N</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donneesJournalieres.slice(0, 4).map((row) => (
                    <tr key={`${row.dateN}-${row.jour}`}>
                      <td className="py-1 text-slate-500">{row.jour}</td>
                      <td className="py-1 text-right">{row.tMoyN_1.toFixed(1)}°</td>
                      <td className="py-1 text-right font-semibold">{row.djN_1.toFixed(1)}</td>
                      <td className="py-1 text-right text-blue-600">{row.tMoyN.toFixed(1)}°</td>
                      <td className="py-1 text-right font-semibold text-blue-700">{row.djN.toFixed(1)}</td>
                    </tr>
                  ))}
                  {donneesJournalieres.length > 4 && (
                    <tr>
                      <td colSpan="5" className="py-1 text-center italic text-slate-400">
                        ... (+ {donneesJournalieres.length - 4} jours)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Conso ref N-1</div>
              <div className="text-xl font-black text-slate-900">
                {Number(consoRefN_1 || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Optimisation</div>
              <div className="text-xl font-black text-blue-900">x {resultats.multiplicateurOpti.toFixed(3)}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {(Number(tauxOpti || 0) >= 0 ? '+' : '')}{(Number(tauxOpti || 0) * 100).toFixed(2)} %
              </div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="text-[10px] uppercase font-bold text-blue-700 mb-1">Facteur climatique</div>
              <div className="text-xl font-black text-blue-900">x {resultats.facteurClimatique.toFixed(4)}</div>
              <div className="text-[10px] text-blue-700 mt-1">
                Influence DJ: {(resultats.influenceGlobale * 100).toFixed(2)} %
              </div>
            </div>
            <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3">
              <div className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Estimation finale</div>
              <div className="text-xl font-black text-emerald-800">
                {resultats.estimationFinale.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved}
              className={`rounded-lg px-5 py-2 text-sm font-bold shadow transition-colors ${
                isSaved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isSaved ? (
                <span className="inline-flex items-center gap-2"><Check size={14} /> Estimation appliquee</span>
              ) : (
                'Valider et utiliser cette estimation'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
