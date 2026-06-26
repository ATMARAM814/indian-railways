// dashboardMappers.js

export const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

const getLast3Months = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result = [];
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  return result;
};

const parseMonthYear = (monthStr) => {
  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!monthStr || monthStr === 'N/A') return new Date(0);
  const parts = monthStr.split(' ');
  if (parts.length !== 2) return new Date(0);
  const [mName, yStr] = parts;
  const mIndex = monthOrder.indexOf(mName);
  const year = parseInt(yStr, 10);
  if (mIndex === -1 || isNaN(year)) return new Date(0);
  return new Date(year, mIndex, 1);
};

const padTrendData = (mappedArray, defaultValueGenerator) => {
  const last3Months = getLast3Months();
  const presentMonths = new Set(mappedArray.map(item => item.month));
  const padded = [...mappedArray];
  last3Months.forEach(m => {
    if (!presentMonths.has(m)) {
      padded.push({
        month: m,
        ...defaultValueGenerator(m)
      });
    }
  });
  padded.sort((a, b) => parseMonthYear(a.month) - parseMonthYear(b.month));
  return padded;
};

export const mapPMPerformanceTrend = (data) => {
  return safeArray(data).map((item) => ({
    date: item.assessmentDate || item.month || 'N/A',
    Score: Number(item.percentage || 0),
  }));
};

export const mapPMSectionWisePerformance = (data) => {
  return safeArray(data).map((item) => ({
    section: item.section || 'Unknown',
    Score: Number(item.averageScore || 0),
  }));
};

export const mapPMCategoryHistory = (data) => {
  return safeArray(data).map((item) => ({
    date: item.date || 'N/A',
    category: item.category || 'N/A',
    riskLevel: item.riskLevel || 'NOT_CATEGORIZED',
  }));
};

export const mapRoleDistribution = (data) => {
  const roleNames = {
    PM: 'PM',
    SM: 'SM',
    SS: 'SM Incharge',
    TM: 'TM',
    TI: 'TI',
    AOM: 'AOM',
    SUPER_ADMIN: 'SA',
    SA: 'SA',
    'POINTSMEN': 'PM',
    'STATION MASTERS': 'SM',
    'STATION SUPRINTENDENTS': 'SM Incharge',
    'STATION SUPERINTENDENTS': 'SM Incharge',
    'STATION MASTERS INCHARGE': 'SM Incharge',
    'TRAIN MANAGERS': 'TM',
    'TRAFFIC INSPECTORS': 'TI',
    'ASSITANT OPERATIONS MANAGER': 'AOM',
    'ASSISTANT OPERATIONS MANAGER': 'AOM',
    'SUPER ADMIN': 'SA',
    'STATION MASTER SUPERVISOR': 'SMS',
    'CABIN MASTER': 'CM',
    'SHUNTING MASTER': 'SHM'
  };
  return safeArray(data)
    .map((item) => {
      const rawRole = (item.role || '').trim();
      const cleanRole = roleNames[rawRole] || roleNames[rawRole.toUpperCase()] || rawRole;
      return {
        role: cleanRole || 'Unknown',
        Count: Number(item.count || item.Count || 0),
      };
    })
    .filter((item) => item.Count > 0);
};

export const mapCategoryDistribution = (data) => {
  return safeArray(data).map((item) => ({
    name: `Grade ${item.category || 'N/A'}`,
    value: Number(item.count || 0),
  }));
};

export const mapStationCategoryDistribution = (data) => {
  return safeArray(data).map((item) => ({
    stationName: item.stationName || item.station_name || 'Unknown',
    stationCode: item.stationCode || item.station_code || item.stationName || 'N/A',
    'Category A': Number(item.categoryA || item.category_a || 0),
    'Category B': Number(item.categoryB || item.category_b || 0),
    'Category C': Number(item.categoryC || item.category_c || 0),
    'Category D': Number(item.categoryD || item.category_d || 0),
  }));
};

export const mapMonthlyCompletionTrend = (data) => {
  const mapped = safeArray(data).map((item) => ({
    month: item.month || 'N/A',
    Created: Number(item.createdCount || 0),
    Evaluated: Number(item.completedCount || 0),
    Completed: Number(item.completedCount || 0),
    Approved: Number(item.approvedCount || 0),
  }));
  return padTrendData(mapped, () => ({
    Created: 0,
    Evaluated: 0,
    Completed: 0,
    Approved: 0,
  }));
};

export const mapStationProgress = (data) => {
  return safeArray(data).map((item) => ({
    stationName: item.stationName || item.station_name || 'Unknown',
    stationCode: item.stationCode || item.station_code || item.stationName || 'N/A',
    Completed: Number(item.completed || 0),
    Pending: Number(item.pending || 0),
  }));
};

export const mapStationAvgScore = (data) => {
  return safeArray(data).map((item) => ({
    stationName: item.stationName || item.station_name || 'Unknown',
    stationCode: item.stationCode || item.station_code || item.stationName || 'N/A',
    Score: Number(item.averageScore || 0),
  }));
};

export const mapAssessmentPipeline = (data) => {
  const summary = data?.summary || { approved: 0, pending: 0, rejected: 0, overdue: 0 };
  const mappedMonthly = safeArray(data?.monthly).map((item) => ({
    month: item.month || 'N/A',
    Approved: Number(item.approved || 0),
    Pending: Number(item.pending || 0),
    Rejected: Number(item.rejected || 0),
    Overdue: Number(item.overdue || 0),
  }));
  const monthly = padTrendData(mappedMonthly, () => ({
    Approved: 0,
    Pending: 0,
    Rejected: 0,
    Overdue: 0,
  }));
  return { summary, monthly };
};

export const mapApprovalTrend = (data) => {
  const mapped = safeArray(data).map((item) => ({
    month: item.month || 'N/A',
    Approved: Number(item.approvedCount || 0),
    Rejected: Number(item.rejectedCount || 0),
    Modified: Number(item.modifiedCount || 0),
  }));
  return padTrendData(mapped, () => ({
    Approved: 0,
    Rejected: 0,
    Modified: 0,
  }));
};

export const mapSafetyCompliance = (data) => {
  return safeArray(data).filter(item => item.percentage !== null);
};

export const mapTiPerformanceComparison = (data) => {
  return safeArray(data).map((item) => ({
    tiName: item.tiName || item.ti_name || 'Unknown',
    Score: Number(item.averageScore || 0),
  }));
};

export const mapDivisionPerformanceTrend = (data) => {
  const mapped = safeArray(data).map((item) => ({
    month: item.month || 'N/A',
    Score: Number(item.averageScore || 0),
  }));
  return padTrendData(mapped, () => ({ Score: 0 }));
};

export const mapScoreSafetyTrend = (data) => {
  return safeArray(data).map((item) => ({
    month: item.month || 'N/A',
    'Avg Score': Number(item.averageScore || 0),
    'Safety %': Number(item.safetyPercent || 0),
  }));
};

export const cleanDesignationText = (text) => {
  if (!text) return '';
  let cleaned = text;
  
  // Replace plurals of Station Superintendent/Suprintendent/Masters Incharge
  cleaned = cleaned.replace(/Station\s+Superintendents/ig, 'SM Incharges');
  cleaned = cleaned.replace(/Station\s+Suprintendents/ig, 'SM Incharges');
  cleaned = cleaned.replace(/Superintendents/ig, 'SM Incharges');
  cleaned = cleaned.replace(/Station\s+Masters\s+Incharge/ig, 'SM Incharges');
  cleaned = cleaned.replace(/Station\s+Masters\s+Incharges/ig, 'SM Incharges');
  
  // Replace singulars
  cleaned = cleaned.replace(/Station\s+Superintendent/ig, 'SM Incharge');
  cleaned = cleaned.replace(/Station\s+Suprintendent/ig, 'SM Incharge');
  cleaned = cleaned.replace(/Superintendent/ig, 'SM Incharge');
  cleaned = cleaned.replace(/Station\s+Master\s+Incharge/ig, 'SM Incharge');
  
  // Replace SS abbreviation (with boundaries)
  cleaned = cleaned.replace(/\bSS\b/g, 'SM Incharge');
  cleaned = cleaned.replace(/\bss\b/g, 'sm incharge');
  
  return cleaned;
};

