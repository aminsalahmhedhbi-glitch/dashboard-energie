const MONTH_NAMES = ['janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.'];

export const SITE_FACTURE_KEYS = ['MEGRINE', 'ELKHADHRA', 'NAASSEN', 'LAC', 'AZUR', 'CARTHAGE', 'CHARGUEYAA'];

export const getFactureMonthKey = (facture) => {
  const rawDate =
    facture?.date ||
    facture?.recordDate ||
    facture?.billingDate ||
    facture?.timestamp ||
    facture?._createdAt;

  if (!rawDate) return null;

  if (typeof rawDate === 'string' && /^\d{4}-\d{2}/.test(rawDate)) {
    return rawDate.slice(0, 7);
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const getFactureMetrics = (facture) => ({
  consommationKwh: toNumber(
    facture?.consommationKwh ??
      facture?.consommation_kwh ??
      facture?.billedKwh ??
      facture?.consumptionGrid ??
      facture?.energyRecorded
  ),
  pmaxKva: toNumber(facture?.pmaxKva ?? facture?.pmax_kva ?? facture?.Pmax ?? facture?.maxPower),
  cosPhi: toNumber(facture?.cosPhi ?? facture?.cos_phi ?? facture?.PF_SUM),
  prixDt: toNumber(facture?.prixDt ?? facture?.prix_dt ?? facture?.netToPay ?? facture?.totalFinalTTC),
});

export const aggregateFacturesByMonth = (factures = []) => {
  const monthlyMap = new Map();

  factures.forEach((facture) => {
    const monthKey = getFactureMonthKey(facture);
    if (!monthKey) return;

    const year = Number(monthKey.slice(0, 4));
    const monthIndex = Number(monthKey.slice(5, 7)) - 1;
    const metrics = getFactureMetrics(facture);

    const current = monthlyMap.get(monthKey) || {
      monthKey,
      year,
      monthIndex,
      monthLabel: `${MONTH_NAMES[monthIndex]} ${year}`,
      consommationKwh: 0,
      prixDt: 0,
      pmaxValues: [],
      cosPhiValues: [],
      invoices: [],
    };

    current.consommationKwh += metrics.consommationKwh;
    current.prixDt += metrics.prixDt;
    if (metrics.pmaxKva > 0) current.pmaxValues.push(metrics.pmaxKva);
    if (metrics.cosPhi > 0) current.cosPhiValues.push(metrics.cosPhi);
    current.invoices.push(facture);
    monthlyMap.set(monthKey, current);
  });

  return Array.from(monthlyMap.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((row) => ({
      ...row,
      consommationKwh: Number(row.consommationKwh.toFixed(2)),
      prixDt: Number(row.prixDt.toFixed(3)),
      pmaxKva: row.pmaxValues.length ? Math.max(...row.pmaxValues) : 0,
      avgCosPhi: row.cosPhiValues.length
        ? row.cosPhiValues.reduce((sum, value) => sum + value, 0) / row.cosPhiValues.length
        : 0,
    }));
};

const buildYearIndex = (monthlyRows = []) => {
  const yearIndex = new Map();

  monthlyRows.forEach((row) => {
    if (!yearIndex.has(row.year)) {
      yearIndex.set(
        row.year,
        Array.from({ length: 12 }, (_, monthIndex) => ({
          monthIndex,
          consommationKwh: 0,
          prixDt: 0,
        }))
      );
    }

    const current = yearIndex.get(row.year)[row.monthIndex];
    current.consommationKwh += row.consommationKwh;
    current.prixDt += row.prixDt;
  });

  return yearIndex;
};

const average = (values = []) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getReferenceMonthCandidates = (yearIndex, targetYear, monthIndex) =>
  Array.from(yearIndex.entries())
    .filter(([year]) => year < targetYear)
    .map(([, rows]) => toNumber(rows?.[monthIndex]?.consommationKwh))
    .filter((value) => value > 0);

export const buildFactureInsights = (factures = [], { currentDate = new Date() } = {}) => {
  const monthlyRows = aggregateFacturesByMonth(factures);
  const yearIndex = buildYearIndex(monthlyRows);
  const latestRow = monthlyRows[monthlyRows.length - 1] || null;
  const latestDate = latestRow
    ? new Date(latestRow.year, latestRow.monthIndex, 1)
    : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const analysisYear = latestRow ? latestRow.year : latestDate.getFullYear();
  const analysisMonthIndex = latestRow ? latestRow.monthIndex : latestDate.getMonth();
  const historyYears = Array.from(yearIndex.keys()).sort((a, b) => a - b);
  const referenceYears = historyYears.filter((year) => year < analysisYear);

  const currentYearRows = yearIndex.get(analysisYear) || Array.from({ length: 12 }, () => ({ consommationKwh: 0, prixDt: 0 }));
  const currentMonthValue = currentYearRows[analysisMonthIndex]?.consommationKwh || 0;

  const referenceMonthCandidates = getReferenceMonthCandidates(
    yearIndex,
    analysisYear,
    analysisMonthIndex
  );
  const referenceMonthValue = average(referenceMonthCandidates);

  const currentYtdValue = currentYearRows
    .slice(0, analysisMonthIndex + 1)
    .reduce((sum, row) => sum + toNumber(row.consommationKwh), 0);

  const referenceYtdCandidates = referenceYears
    .map((year) =>
      (yearIndex.get(year) || [])
        .slice(0, analysisMonthIndex + 1)
        .reduce((sum, row) => sum + toNumber(row.consommationKwh), 0)
    )
    .filter((value) => value > 0);
  const referenceYtdValue = average(referenceYtdCandidates);

  const diffMonth = referenceMonthValue > 0 ? ((currentMonthValue - referenceMonthValue) / referenceMonthValue) * 100 : 0;
  const diffYtd = referenceYtdValue > 0 ? ((currentYtdValue - referenceYtdValue) / referenceYtdValue) * 100 : 0;

  const monthlyComparisons = monthlyRows.map((row) => {
    const referenceValue = average(
      getReferenceMonthCandidates(yearIndex, row.year, row.monthIndex)
    );
    const optimisationRate =
      referenceValue > 0 && row.consommationKwh > 0
        ? (row.consommationKwh - referenceValue) / referenceValue
        : null;

    return {
      ...row,
      referenceValue,
      optimisationRate,
    };
  });

  const optimisationDuMois =
    referenceMonthValue > 0 && currentMonthValue > 0
      ? (currentMonthValue - referenceMonthValue) / referenceMonthValue
      : 0;

  const optimisationCandidates = monthlyComparisons
    .filter((row) => row.monthKey !== latestRow?.monthKey)
    .filter((row) => row.optimisationRate !== null)
    .slice(-6);

  const hasOptimisation6Months = optimisationCandidates.length === 6;
  const optimisationMoyenne6Mois = hasOptimisation6Months
    ? optimisationCandidates.reduce(
        (sum, row) => sum + toNumber(row.optimisationRate),
        0
      ) / 6
    : 0;
  const facteurClimatique = 1;
  const tauxOptimisation = Math.max(
    0,
    Math.min(1 + optimisationMoyenne6Mois, 1)
  );
  const consommationEstimee =
    hasOptimisation6Months && referenceMonthValue > 0
      ? referenceMonthValue * tauxOptimisation * facteurClimatique
      : 0;

  const factureMetrics = factures.map(getFactureMetrics);
  const pmaxHistorique = factureMetrics.length ? Math.max(...factureMetrics.map((item) => item.pmaxKva)) : 0;
  const cosPhiValues = factureMetrics.map((item) => item.cosPhi).filter((value) => value > 0);
  const cosPhiMoyenne = average(cosPhiValues);

  const rolling12Consumption = monthlyRows.slice(-12).reduce((sum, row) => sum + row.consommationKwh, 0);
  const yearlyTotals = historyYears.reduce((acc, year) => {
    acc[year] = (yearIndex.get(year) || []).reduce((sum, row) => sum + toNumber(row.consommationKwh), 0);
    return acc;
  }, {});

  const totalConsommation = monthlyRows.reduce((sum, row) => sum + row.consommationKwh, 0);
  const latestFacture = [...factures].sort((left, right) => {
    const monthLeft = getFactureMonthKey(left) || '';
    const monthRight = getFactureMonthKey(right) || '';
    return monthRight.localeCompare(monthLeft);
  })[0] || null;
  const latestKnownIndex = toNumber(
    latestFacture?.newIndex ??
      latestFacture?.indexActif ??
      latestFacture?.index ??
      latestFacture?.currentIndex
  );
  const nouvelIndexEstime =
    latestKnownIndex > 0 ? latestKnownIndex + consommationEstimee : 0;

  return {
    hasData: monthlyRows.length > 0,
    latestMonthKey: latestRow?.monthKey || null,
    analysisYear,
    analysisMonthIndex,
    analysisMonthLabel: MONTH_NAMES[analysisMonthIndex],
    currentMonthValue,
    referenceMonthValue,
    currentYtdValue,
    referenceYtdValue,
    diffMonth,
    diffYtd,
    pmaxHistorique,
    cosPhiMoyenne,
    rolling12Consumption,
    optimisationRate: optimisationMoyenne6Mois,
    optimisationDuMois,
    optimisationMonthPercent: optimisationDuMois * 100,
    optimisationMoyenne6Mois,
    optimisationAverage6MonthsPercent: optimisationMoyenne6Mois * 100,
    optimisationMonthsUsed: optimisationCandidates.length,
    hasOptimisation6Months,
    tauxOptimisation,
    facteurClimatique,
    consommationEstimee,
    latestKnownIndex,
    nouvelIndexEstime,
    totalConsommation,
    monthlyComparisons,
    monthlyRows,
    yearlyTotals,
    recentFactures: [...factures].sort((a, b) => {
      const monthA = getFactureMonthKey(a) || '';
      const monthB = getFactureMonthKey(b) || '';
      return monthB.localeCompare(monthA);
    }),
  };
};
