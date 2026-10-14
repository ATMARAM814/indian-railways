// drillDownMappers.js

export const normalizeStationSummaryData = (records = []) => {
  return records.map((record) => {
    const categoryA = Number(record.categoryA || 0);
    const categoryB = Number(record.categoryB || 0);
    const categoryC = Number(record.categoryC || 0);
    const categoryD = Number(record.categoryD || 0);
    const completed = Number(record.completedAssessments || 0);
    const averageScore = record.averageScore !== null && record.averageScore !== undefined
      ? Number(record.averageScore)
      : 0;

    // Determine Station Category based on its Average Score
    // Railway Grading Standard:
    // >= 80%: Category A (Low Risk)
    // 50% - 79.99%: Category B (Medium Risk)
    // 26% - 49.99%: Category C (Medium Risk)
    // < 26%: Category D (High Risk)
    // 0 completed assessments: '—'
    let dominantCategory = '—';
    if (record.stationCategory) {
      dominantCategory = record.stationCategory;
    } else if (completed > 0 || averageScore > 0) {
      if (averageScore >= 80) {
        dominantCategory = 'A';
      } else if (averageScore >= 50) {
        dominantCategory = 'B';
      } else if (averageScore >= 26) {
        dominantCategory = 'C';
      } else {
        dominantCategory = 'D';
      }
    } else {
      dominantCategory = '—';
    }

    // Compute Risk Level:
    // High risk if Category D staff exist or station category is D
    // Medium risk if category is B or C
    // Low risk if category is A or unassessed
    let riskLevel = 'LOW';
    if (categoryD > 0 || dominantCategory === 'D') {
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
      completed,
      pending: Number(record.pendingAssessments || 0),
      averageScore,
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
