// drillDownMappers.js

export const normalizeStationSummaryData = (records = []) => {
  return records.map((record) => {
    const categoryA = Number(record.categoryA || 0);
    const categoryB = Number(record.categoryB || 0);
    const categoryC = Number(record.categoryC || 0);
    const categoryD = Number(record.categoryD || 0);

    // Compute dominant category
    const cats = { A: categoryA, B: categoryB, C: categoryC, D: categoryD };
    let dominant = 'A';
    let maxVal = -1;
    Object.keys(cats).forEach((k) => {
      if (cats[k] > maxVal) {
        maxVal = cats[k];
        dominant = k;
      }
    });
    const dominantCategory = maxVal > 0 ? dominant : '—';

    // Compute Risk Level
    // Rule: Dominant category determines main category, but if Category D > 0, show High.
    let riskLevel;
    if (categoryD > 0) {
      riskLevel = 'HIGH';
    } else if (dominantCategory === 'B' || dominantCategory === 'C') {
      riskLevel = 'MEDIUM';
    } else if (dominantCategory === 'A') {
      riskLevel = 'LOW';
    } else {
      riskLevel = 'LOW';
    }

    return {
      stationId: record.stationId,
      stationName: record.stationName || 'Unknown Station',
      stationCode: record.stationCode || 'N/A',
      completed: Number(record.completedAssessments || 0),
      pending: Number(record.pendingAssessments || 0),
      averageScore: record.averageScore !== null ? Number(record.averageScore) : 0,
      categoryA,
      categoryB,
      categoryC,
      categoryD,
      dominantCategory,
      riskLevel,
      lastUpdated: '—' // Clean fallback as it's not directly in summary record
    };
  });
};
