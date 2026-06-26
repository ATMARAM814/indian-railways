const db = require("./dashboard.repository");

// ==========================================
// SERVICE LEVEL HELPERS
// ==========================================

function getRiskLevel(categoryCode) {
  if (categoryCode === "A") return "LOW";
  if (categoryCode === "B" || categoryCode === "C") return "MEDIUM";
  if (categoryCode === "D") return "HIGH";
  return "NOT_CATEGORIZED";
}

function formatYyyyMm(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function yyyyMmToMonthName(yyyyMm) {
  if (!yyyyMm) return "";
  const parts = yyyyMm.split("-");
  if (parts.length !== 2) return yyyyMm;
  const [year, month] = parts;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mIndex = parseInt(month, 10) - 1;
  if (mIndex < 0 || mIndex > 11) return yyyyMm;
  return `${months[mIndex]} ${year}`;
}

function fillRoleDistribution(dbRoles) {
  const result = { 
    PM: 0, 
    SM: 0, 
    TM: 0, 
    "STATION MASTER SUPERVISOR": 0, 
    "CABIN MASTER": 0, 
    "SHUNTING MASTER": 0, 
    SS: 0, 
    TI: 0 
  };
  if (Array.isArray(dbRoles)) {
    dbRoles.forEach((r) => {
      let name = (r.role || "").toUpperCase().trim();
      
      // Normalize aliases/casing/typos to canonical keys in result
      if (name === "POINTSMAN" || name === "POINTSMEN") {
        name = "PM";
      } else if (name === "STATION MASTER" || name === "STATION MASTERS") {
        name = "SM";
      } else if (name === "TRAIN MANAGER" || name === "TRAIN MANAGERS") {
        name = "TM";
      } else if (name === "TRAFFIC INSPECTOR" || name === "TRAFFIC INSPECTORS") {
        name = "TI";
      } else if (name === "SMS" || name === "STATION MASTER SUPERVISOR" || name === "STATION MASTER SUPERVISIOR" || name === "STATION MASTER SUPERVISIO") {
        name = "STATION MASTER SUPERVISOR";
      } else if (name === "SHM" || name === "SHUNTING MASTER" || name === "SHUNTING_MASTER") {
        name = "SHUNTING MASTER";
      } else if (name === "CM" || name === "CABIN MASTER" || name === "CABIN_MASTER") {
        name = "CABIN MASTER";
      } else if (name === "SS" || name === "STATION MASTER INCHARGE" || name === "STATION_MASTER_INCHARGE" || name === "SM INCHARGE") {
        name = "SS";
      }
      
      if (name in result) {
        result[name] += r.count || 0;
      }
    });
  }
  return Object.keys(result).map((role) => ({
    role,
    count: result[role],
  }));
}

function fillCategoryDistribution(dbCats) {
  const result = { A: 0, B: 0, C: 0, D: 0 };
  if (Array.isArray(dbCats)) {
    dbCats.forEach((c) => {
      const code = (c.category || "").toUpperCase();
      if (code in result) {
        result[code] = c.count || 0;
      }
    });
  }
  return Object.keys(result).map((category) => ({
    category,
    count: result[category],
  }));
}

function makeSafetyCompliance(completedCount, pendingCount) {
  const total = completedCount + pendingCount;
  const completionRate =
    total > 0 ? Math.round((completedCount / total) * 100) : 0; // fallback to 0 if no assessments yet
  return [
    {
      label: "Overall Safety Compliance",
      percentage: completionRate,
    },
    {
      label: "PME Completion Rate",
      percentage: 0,
    },
    {
      label: "REF Completion Rate",
      percentage: 0,
    },
    {
      label: "Incident Reporting Compliance",
      percentage: 0,
    },
    {
      label: "Disciplinary Clean Record",
      percentage: 0,
    }
  ];
}

function makeMonthlyCompletionTrend(assessments) {
  const monthsMap = {}; // { 'YYYY-MM': { createdCount: 0, completedCount: 0, approvedCount: 0 } }
  assessments.forEach((a) => {
    if (a.created_at) {
      const m = formatYyyyMm(a.created_at);
      if (m) {
        if (!monthsMap[m]) {
          monthsMap[m] = {
            createdCount: 0,
            completedCount: 0,
            approvedCount: 0,
          };
        }
        monthsMap[m].createdCount++;
      }
    }
    if (a.status === "completed" && a.evaluated_at) {
      const m = formatYyyyMm(a.evaluated_at);
      if (m) {
        if (!monthsMap[m]) {
          monthsMap[m] = {
            createdCount: 0,
            completedCount: 0,
            approvedCount: 0,
          };
        }
        monthsMap[m].completedCount++;
      }
    }
    if (a.approval_status === "approved" && a.approved_at) {
      const m = formatYyyyMm(a.approved_at);
      if (m) {
        if (!monthsMap[m]) {
          monthsMap[m] = {
            createdCount: 0,
            completedCount: 0,
            approvedCount: 0,
          };
        }
        monthsMap[m].approvedCount++;
      }
    }
  });

  return Object.keys(monthsMap)
    .sort()
    .map((key) => ({
      month: yyyyMmToMonthName(key),
      createdCount: monthsMap[key].createdCount,
      completedCount: monthsMap[key].completedCount,
      approvedCount: monthsMap[key].approvedCount,
    }));
}

function makeAssessmentPipeline(assessments) {
  let approved = 0;
  let pending = 0;
  let rejected = 0;

  const monthlyMap = {}; // { 'YYYY-MM': { approved: 0, pending: 0, rejected: 0, overdue: 0 } }

  assessments.forEach((a) => {
    if (a.approval_status === "approved") {
      approved++;
      if (a.approved_at) {
        const m = formatYyyyMm(a.approved_at);
        if (m) {
          if (!monthlyMap[m]) {
            monthlyMap[m] = { approved: 0, pending: 0, rejected: 0, overdue: 0 };
          }
          monthlyMap[m].approved++;
        }
      }
    } else if (a.approval_status === "pending_approval") {
      pending++;
      if (a.evaluated_at) {
        const m = formatYyyyMm(a.evaluated_at);
        if (m) {
          if (!monthlyMap[m]) {
            monthlyMap[m] = { approved: 0, pending: 0, rejected: 0, overdue: 0 };
          }
          monthlyMap[m].pending++;
        }
      }
    } else if (a.approval_status === "rejected") {
      rejected++;
      if (a.rejected_at) {
        const m = formatYyyyMm(a.rejected_at);
        if (m) {
          if (!monthlyMap[m]) {
            monthlyMap[m] = { approved: 0, pending: 0, rejected: 0, overdue: 0 };
          }
          monthlyMap[m].rejected++;
        }
      }
    }
  });

  const monthlyList = Object.keys(monthlyMap)
    .sort()
    .map((key) => ({
      month: yyyyMmToMonthName(key),
      approved: monthlyMap[key].approved,
      pending: monthlyMap[key].pending,
      rejected: monthlyMap[key].rejected,
      overdue: 0,
    }));

  return {
    summary: {
      approved,
      pending,
      rejected,
      overdue: 0,
    },
    monthly: monthlyList,
  };
}

function makeApprovalTrend(assessments) {
  const monthsMap = {}; // { 'YYYY-MM': { approvedCount: 0, rejectedCount: 0, modifiedCount: 0 } }
  assessments.forEach((a) => {
    if (a.approval_status === "approved" && a.approved_at) {
      const m = formatYyyyMm(a.approved_at);
      if (m) {
        if (!monthsMap[m]) {
          monthsMap[m] = { approvedCount: 0, rejectedCount: 0, modifiedCount: 0 };
        }
        monthsMap[m].approvedCount++;
      }
    }
    if (a.approval_status === "rejected" && a.rejected_at) {
      const m = formatYyyyMm(a.rejected_at);
      if (m) {
        if (!monthsMap[m]) {
          monthsMap[m] = { approvedCount: 0, rejectedCount: 0, modifiedCount: 0 };
        }
        monthsMap[m].rejectedCount++;
      }
    }
    if (a.modified_at) {
      const m = formatYyyyMm(a.modified_at);
      if (m) {
        if (!monthsMap[m]) {
          monthsMap[m] = { approvedCount: 0, rejectedCount: 0, modifiedCount: 0 };
        }
        monthsMap[m].modifiedCount++;
      }
    }
  });

  return Object.keys(monthsMap)
    .sort()
    .map((key) => ({
      month: yyyyMmToMonthName(key),
      approvedCount: monthsMap[key].approvedCount,
      rejectedCount: monthsMap[key].rejectedCount,
      modifiedCount: monthsMap[key].modifiedCount,
    }));
}

function makePerformanceTrend(assessments) {
  const monthlyMap = {}; // { 'YYYY-MM': { sum: 0, count: 0 } }
  assessments.forEach((a) => {
    if (a.status === "completed" && a.evaluated_at && a.percentage !== null) {
      const m = formatYyyyMm(a.evaluated_at);
      if (m) {
        if (!monthlyMap[m]) {
          monthlyMap[m] = { sum: 0, count: 0 };
        }
        monthlyMap[m].sum += Number(a.percentage);
        monthlyMap[m].count++;
      }
    }
  });

  return Object.keys(monthlyMap)
    .sort()
    .map((key) => ({
      month: yyyyMmToMonthName(key),
      averageScore: Number(
        (monthlyMap[key].sum / monthlyMap[key].count).toFixed(2)
      ),
    }));
}

// ==========================================
// ROLE DASHBOARD SERVICES
// ==========================================

async function getPmDashboardService(profileId) {
  const [summaryData, trendData, sectionsData, historyData] = await Promise.all([
    db.getPmSummary(profileId),
    db.getPmPerformanceTrend(profileId),
    db.getPmSectionWisePerformance(profileId),
    db.getPmCategoryHistory(profileId)
  ]);

  const summary = {
    latestScore: summaryData.latest_score !== null ? Number(summaryData.latest_score) : null,
    currentCategory: summaryData.current_category || null,
    riskLevel: getRiskLevel(summaryData.current_category),
    totalAssessments: summaryData.total_assessments || 0,
    lastAssessmentDate: summaryData.last_assessment_date
      ? new Date(summaryData.last_assessment_date).toISOString().split("T")[0]
      : null,
  };

  const assessmentPerformanceTrend = trendData.map((row) => ({
    assessmentDate: formatYyyyMm(row.assessmentDate),
    percentage: Number(row.percentage || 0),
  }));

  const sectionWisePerformance = [
    {
      section: "Alertness",
      averageScore: Number(sectionsData.alertness || 0),
    },
    {
      section: "Safety Record",
      averageScore: Number(sectionsData.safety_record || 0),
    },
    {
      section: "Leadership",
      averageScore: Number(sectionsData.leadership || 0),
    },
    {
      section: "Discipline",
      averageScore: Number(sectionsData.discipline || 0),
    },
    {
      section: "Appearance",
      averageScore: Number(sectionsData.appearance || 0),
    },
  ];

  const categoryHistory = historyData.map((row) => ({
    date: formatYyyyMm(row.date),
    category: row.category,
    riskLevel: getRiskLevel(row.category),
  }));

  return {
    summary,
    graphs: {
      assessmentPerformanceTrend,
      sectionWisePerformance,
      categoryHistory,
    },
  };
}

async function getTmDashboardService(profileId) {
  const [summaryData, trendData, sectionsData, historyData] = await Promise.all([
    db.getTmSummary(profileId),
    db.getTmPerformanceTrend(profileId),
    db.getTmSectionWisePerformance(profileId),
    db.getTmCategoryHistory(profileId)
  ]);

  const summary = {
    latestScore: summaryData.latest_score !== null ? Number(summaryData.latest_score) : null,
    currentCategory: summaryData.current_category || null,
    riskLevel: getRiskLevel(summaryData.current_category),
    totalAssessments: summaryData.total_assessments || 0,
    lastAssessmentDate: summaryData.last_assessment_date
      ? new Date(summaryData.last_assessment_date).toISOString().split("T")[0]
      : null,
  };

  const assessmentPerformanceTrend = trendData.map((row) => ({
    assessmentDate: formatYyyyMm(row.assessmentDate),
    percentage: Number(row.percentage || 0),
  }));

  const sectionWisePerformance = [
    {
      section: "Alertness",
      averageScore: Number(sectionsData.alertness || 0),
    },
    {
      section: "Safety Record",
      averageScore: Number(sectionsData.safety_record || 0),
    },
    {
      section: "Leadership",
      averageScore: Number(sectionsData.leadership || 0),
    },
    {
      section: "Discipline",
      averageScore: Number(sectionsData.discipline || 0),
    },
    {
      section: "Appearance",
      averageScore: Number(sectionsData.appearance || 0),
    },
  ];

  const categoryHistory = historyData.map((row) => ({
    date: formatYyyyMm(row.date),
    category: row.category,
    riskLevel: getRiskLevel(row.category),
  }));

  return {
    summary,
    graphs: {
      assessmentPerformanceTrend,
      sectionWisePerformance,
      categoryHistory,
    },
  };
}


function makeScoreSafetyTrend(assessments, currentSafetyPercent) {
  const months = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const temp = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const year = temp.getFullYear();
    const month = String(temp.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }

  const monthlyMap = {}; // { 'YYYY-MM': { sum: 0, count: 0 } }
  months.forEach((m) => {
    monthlyMap[m] = { sum: 0, count: 0 };
  });

  assessments.forEach((a) => {
    if (a.status === "completed" && a.evaluated_at && a.percentage !== null) {
      const m = formatYyyyMm(a.evaluated_at);
      if (m && monthlyMap[m] !== undefined) {
        monthlyMap[m].sum += Number(a.percentage);
        monthlyMap[m].count++;
      }
    }
  });

  return months.map((m) => {
    const avg = monthlyMap[m].count > 0
      ? Number((monthlyMap[m].sum / monthlyMap[m].count).toFixed(2))
      : 0;
    return {
      month: yyyyMmToMonthName(m),
      averageScore: avg,
      safetyPercent: currentSafetyPercent,
    };
  });
}

async function getSmDashboardService(profileId) {
  const station = await db.getSmStation(profileId);
  if (!station) {
    return {
      station: null,
      stationMasters: [],
      pointsmen: [],
      summary: {
        totalPM: 0,
        categoryA: 0,
        categoryB: 0,
        categoryC: 0,
        categoryD: 0,
        completedAssessments: 0,
        pendingAssessments: 0,
        highRiskStaff: 0,
      },
      graphs: {
        roleWiseStaffDistribution: [],
        categoryDistribution: [],
        safetyComplianceAnalytics: makeSafetyCompliance(0, 0),
        stationCategoryDistribution: [],
        monthlyAssessmentCompletionTrend: [],
        scoreSafetyTrend: [],
      },
    };
  }

  const stationId = station.station_id;

  const [
    summaryData,
    roleWiseData,
    categoryData,
    stationCategoryDist,
    assessments,
    staff
  ] = await Promise.all([
    db.getSmSummary(stationId),
    db.getSmRoleWiseStaff(stationId),
    db.getSmCategoryDistribution(stationId),
    db.getSmStationCategoryDistribution(stationId),
    db.getSmAssessments(stationId),
    db.getStationStaff(stationId)
  ]);

  const summary = {
    totalPM: summaryData.total_pm || 0,
    categoryA: summaryData.category_a || 0,
    categoryB: summaryData.category_b || 0,
    categoryC: summaryData.category_c || 0,
    categoryD: summaryData.category_d || 0,
    completedAssessments: summaryData.completed_assessments || 0,
    pendingAssessments: summaryData.pending_assessments || 0,
    highRiskStaff: summaryData.high_risk_staff || 0,
    totalEmployees: staff.length,
  };

  const roleWiseStaffDistribution = fillRoleDistribution(roleWiseData);
  const categoryDistribution = fillCategoryDistribution(categoryData);
  const safetyComplianceAnalytics = makeSafetyCompliance(
    summary.completedAssessments,
    summary.pendingAssessments
  );
  
  const stationCategoryDistribution = stationCategoryDist.map((row) => ({
    stationName: row.stationName,
    categoryA: row.categoryA || 0,
    categoryB: row.categoryB || 0,
    categoryC: row.categoryC || 0,
    categoryD: row.categoryD || 0,
  }));

  const monthlyAssessmentCompletionTrend = makeMonthlyCompletionTrend(assessments);

  // Filter staff members
  const stationMasters = staff.filter(
    (s) => s.role === "SM" && s.id !== profileId
  );
  const stationMasterIncharges = staff.filter(
    (s) => s.role === "SS" && s.id !== profileId
  );
  const cabinMasters = staff.filter(
    (s) => (s.role === "Cabin Master" || s.role === "CABIN MASTER" || s.role === "CM") && s.id !== profileId
  );
  const shuntingMasters = staff.filter(
    (s) => (s.role === "Shunting Master" || s.role === "SHUNTING MASTER" || s.role === "SHM") && s.id !== profileId
  );
  const pointsmen = staff.filter((s) => s.role === "PM");

  // Calculate current safety percent (Cat A + B vs total categorized pointsmen)
  const categorizedPointsmen = pointsmen.filter((s) =>
    ["A", "B", "C", "D"].includes(s.category)
  );
  const catAAndBCount = categorizedPointsmen.filter((s) =>
    ["A", "B"].includes(s.category)
  );
  const currentSafetyPercent =
    categorizedPointsmen.length > 0
      ? Math.round((catAAndBCount.length / categorizedPointsmen.length) * 100)
      : 100;

  const scoreSafetyTrend = makeScoreSafetyTrend(assessments, currentSafetyPercent);

  return {
    station: {
      id: station.station_id,
      name: station.station_name,
      code: station.station_code,
    },
    stationMasters,
    stationMasterIncharges,
    cabinMasters,
    shuntingMasters,
    pointsmen,
    summary,
    graphs: {
      roleWiseStaffDistribution,
      categoryDistribution,
      safetyComplianceAnalytics,
      stationCategoryDistribution,
      monthlyAssessmentCompletionTrend,
      scoreSafetyTrend,
    },
  };
}

async function getTiDashboardService(profileId) {
  const stationIds = await db.getTiStations(profileId);
  console.log(`[BACKEND SERVICE getTiDashboardService] Profile ID: ${profileId}`);
  console.log(`[BACKEND SERVICE getTiDashboardService] Resolved Station IDs:`, stationIds);
  if (!stationIds || stationIds.length === 0) {
    return {
      summary: {
        totalStations: 0,
        totalPM: 0,
        totalSM: 0,
        totalTM: 0,
        totalSS: 0,
        pendingApprovals: 0,
        completedApprovals: 0,
        highRiskStaff: 0,
      },
      graphs: {
        stationWiseEvaluationProgress: [],
        stationWiseAverageScore: [],
        roleWiseStaffDistribution: [],
        categoryDistribution: [],
        assessmentPipeline: {
          summary: { approved: 0, pending: 0, rejected: 0, overdue: 0 },
          monthly: [],
        },
        approvalTrend: [],
        safetyComplianceAnalytics: makeSafetyCompliance(0, 0),
        stationCategoryDistribution: [],
        monthlyAssessmentCompletionTrend: [],
        scoreSafetyTrend: [],
      },
    };
  }

  const [
    summaryData,
    stationProgress,
    stationAvgScore,
    roleWiseData,
    categoryData,
    assessments,
    stationCategoryDist
  ] = await Promise.all([
    db.getTiSummary(stationIds, profileId),
    db.getTiStationProgress(stationIds),
    db.getTiStationAvgScore(stationIds),
    db.getTiRoleDistribution(stationIds),
    db.getTiCategoryDistribution(stationIds),
    db.getTiAssessments(stationIds),
    db.getTiStationCategoryDistribution(stationIds)
  ]);

  // Calculate overall average score of assessments in this TI's section
  // Formula: average score per person, divided by total persons who have completed assessments
  const userScoresMap = {};
  assessments.forEach((a) => {
    if (a.status === "completed" && a.percentage !== null && a.assessed_user_id) {
      if (!userScoresMap[a.assessed_user_id]) {
        userScoresMap[a.assessed_user_id] = { sum: 0, count: 0 };
      }
      userScoresMap[a.assessed_user_id].sum += Number(a.percentage);
      userScoresMap[a.assessed_user_id].count++;
    }
  });

  let sumOfUserAverages = 0;
  const uniqueUsersCount = Object.keys(userScoresMap).length;
  Object.keys(userScoresMap).forEach((userId) => {
    const userAvg = userScoresMap[userId].sum / userScoresMap[userId].count;
    sumOfUserAverages += userAvg;
  });

  const averageSectionScore = uniqueUsersCount > 0
    ? Math.round(sumOfUserAverages / uniqueUsersCount)
    : 0;

  const totalEmployees = roleWiseData.reduce((sum, row) => sum + (row.count || 0), 0);

  const summary = {
    totalStations: summaryData.total_stations || 0,
    totalPM: summaryData.total_pm || 0,
    totalSM: summaryData.total_sm || 0,
    totalTM: summaryData.total_tm || 0,
    totalSS: summaryData.total_ss || 0,
    pendingApprovals: summaryData.pending_approvals || 0,
    completedApprovals: summaryData.completed_approvals || 0,
    highRiskStaff: summaryData.high_risk_staff || 0,
    averageSectionScore,
    totalEmployees,
  };

  const stationWiseEvaluationProgress = stationProgress.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    completed: row.completed || 0,
    pending: row.pending || 0,
  }));

  const stationWiseAverageScore = stationAvgScore.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    averageScore: row.averageScore !== null ? Number(row.averageScore) : 0,
  }));

  const roleWiseStaffDistribution = fillRoleDistribution(roleWiseData).filter(
    (item) => ["PM", "SM", "TM", "STATION MASTER SUPERVISOR", "CABIN MASTER", "SHUNTING MASTER"].includes(item.role)
  );
  const categoryDistribution = fillCategoryDistribution(categoryData);
  const assessmentPipeline = makeAssessmentPipeline(assessments);
  const approvalTrend = makeApprovalTrend(assessments);

  // compliance computation
  let completedCount = 0;
  let pendingCount = 0;
  assessments.forEach((a) => {
    if (a.status === "completed") completedCount++;
    else if (a.status === "created" || a.status === "mcq_submitted") pendingCount++;
  });
  const safetyComplianceAnalytics = makeSafetyCompliance(completedCount, pendingCount);

  const stationCategoryDistribution = stationCategoryDist.map((row) => ({
    stationName: row.stationName,
    categoryA: row.categoryA || 0,
    categoryB: row.categoryB || 0,
    categoryC: row.categoryC || 0,
    categoryD: row.categoryD || 0,
  }));

  const monthlyAssessmentCompletionTrend = makeMonthlyCompletionTrend(assessments);

  // Calculate current safety percent for the entire section (Cat A + B vs total categorized pointsmen)
  let totalA = 0;
  let totalB = 0;
  let totalC = 0;
  let totalD = 0;
  stationCategoryDist.forEach((row) => {
    totalA += row.categoryA || 0;
    totalB += row.categoryB || 0;
    totalC += row.categoryC || 0;
    totalD += row.categoryD || 0;
  });
  const totalCategorized = totalA + totalB + totalC + totalD;
  const totalSafe = totalA + totalB;
  const currentSafetyPercent = totalCategorized > 0
    ? Math.round((totalSafe / totalCategorized) * 100)
    : 100;

  const scoreSafetyTrend = makeScoreSafetyTrend(assessments, currentSafetyPercent);

  return {
    summary,
    graphs: {
      stationWiseEvaluationProgress,
      stationWiseAverageScore,
      roleWiseStaffDistribution,
      categoryDistribution,
      assessmentPipeline,
      approvalTrend,
      safetyComplianceAnalytics,
      stationCategoryDistribution,
      monthlyAssessmentCompletionTrend,
      scoreSafetyTrend,
    },
  };
}

async function getAomDashboardService(profileId) {
  const divisionId = await db.getAomDivision(profileId);
  if (!divisionId) {
    return {
      summary: {
        totalStations: 0,
        totalPM: 0,
        totalSM: 0,
        totalTM: 0,
        totalSS: 0,
        totalTI: 0,
        pendingApprovals: 0,
        completedApprovals: 0,
        averageDivisionScore: 0,
        highRiskStaff: 0,
      },
      graphs: {
        stationWiseEvaluationProgress: [],
        stationWiseAverageScore: [],
        roleWiseStaffDistribution: [],
        categoryDistribution: [],
        assessmentPipeline: {
          summary: { approved: 0, pending: 0, rejected: 0, overdue: 0 },
          monthly: [],
        },
        approvalTrend: [],
        divisionPerformanceTrend: [],
        safetyComplianceAnalytics: makeSafetyCompliance(0, 0),
        tiPerformanceComparison: [],
        stationCategoryDistribution: [],
        monthlyAssessmentCompletionTrend: [],
      },
    };
  }

  const [
    summaryData,
    stationProgress,
    stationAvgScore,
    roleWiseData,
    categoryData,
    tiPerformance,
    stationCategoryDist,
    assessments
  ] = await Promise.all([
    db.getAomSummary(divisionId),
    db.getAomStationProgress(divisionId),
    db.getAomStationAvgScore(divisionId),
    db.getAomRoleDistribution(divisionId),
    db.getAomCategoryDistribution(divisionId),
    db.getAomTiPerformance(divisionId),
    db.getAomStationCategoryDistribution(divisionId),
    db.getAomAssessments(divisionId)
  ]);

  const completedApprovals = assessments.filter(a => a.approval_status === 'approved').length;

  const totalEmployees = roleWiseData.reduce((sum, row) => sum + (row.count || 0), 0);

  const summary = {
    totalStations: summaryData.total_stations || 0,
    totalPM: summaryData.total_pm || 0,
    totalSM: summaryData.total_sm || 0,
    totalTM: summaryData.total_tm || 0,
    totalSMSupervisors: summaryData.total_sm_supervisors || 0,
    totalTNC: summaryData.total_tnc || 0,
    totalShuntingMasters: summaryData.total_shunting_masters || 0,
    totalSS: summaryData.total_ss || 0,
    totalTI: summaryData.total_ti || 0,
    pendingApprovals: summaryData.pending_approvals || 0,
    completedApprovals,
    averageDivisionScore: summaryData.average_division_score
      ? Number(summaryData.average_division_score)
      : 0,
    highRiskStaff: summaryData.high_risk_staff || 0,
    totalEmployees,
  };

  const stationWiseEvaluationProgress = stationProgress.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    completed: row.completed || 0,
    pending: row.pending || 0,
  }));

  const stationWiseAverageScore = stationAvgScore.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    averageScore: row.averageScore !== null ? Number(row.averageScore) : 0,
  }));

  const roleWiseStaffDistribution = fillRoleDistribution(roleWiseData);
  const tiItem = roleWiseStaffDistribution.find(r => r.role === 'TI');
  if (tiItem) {
    tiItem.count = summary.totalTI;
  }
  const categoryDistribution = fillCategoryDistribution(categoryData);
  const assessmentPipeline = makeAssessmentPipeline(assessments);
  const approvalTrend = makeApprovalTrend(assessments);
  const divisionPerformanceTrend = makePerformanceTrend(assessments);

  // compliance computation
  let completedCount = 0;
  let pendingCount = 0;
  assessments.forEach((a) => {
    if (a.status === "completed") completedCount++;
    else if (a.status === "created" || a.status === "mcq_submitted") pendingCount++;
  });
  const safetyComplianceAnalytics = makeSafetyCompliance(completedCount, pendingCount);

  const tiPerformanceComparison = tiPerformance.map((row) => ({
    tiName: row.tiName,
    averageScore: row.averageScore !== null ? Number(row.averageScore) : 0,
  }));

  const stationCategoryDistribution = stationCategoryDist.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    categoryA: row.categoryA || 0,
    categoryB: row.categoryB || 0,
    categoryC: row.categoryC || 0,
    categoryD: row.categoryD || 0,
  }));

  const monthlyAssessmentCompletionTrend = makeMonthlyCompletionTrend(assessments);

  return {
    summary,
    graphs: {
      stationWiseEvaluationProgress,
      stationWiseAverageScore,
      roleWiseStaffDistribution,
      categoryDistribution,
      assessmentPipeline,
      approvalTrend,
      divisionPerformanceTrend,
      safetyComplianceAnalytics,
      tiPerformanceComparison,
      stationCategoryDistribution,
      monthlyAssessmentCompletionTrend,
    },
  };
}

async function getSuperAdminDashboardService() {
  const [
    summaryData,
    stationProgress,
    stationAvgScore,
    roleWiseData,
    categoryData,
    tiPerformance,
    stationCategoryDist,
    assessments
  ] = await Promise.all([
    db.getSuperAdminSummary(),
    db.getSuperAdminStationProgress(),
    db.getSuperAdminStationAvgScore(),
    db.getSuperAdminRoleDistribution(),
    db.getSuperAdminCategoryDistribution(),
    db.getSuperAdminTiPerformance(),
    db.getSuperAdminStationCategoryDistribution(),
    db.getSuperAdminAssessments()
  ]);

  const totalEmployees =
    (summaryData.total_aom || 0) +
    (summaryData.total_ti || 0) +
    (summaryData.total_sm || 0) +
    (summaryData.total_tm || 0) +
    (summaryData.total_sm_supervisors || 0) +
    (summaryData.total_tnc || 0) +
    (summaryData.total_shunting_masters || 0) +
    (summaryData.total_ss || 0) +
    (summaryData.total_pm || 0);

  const summary = {
    totalDivisions: summaryData.total_divisions || 0,
    totalStations: summaryData.total_stations || 0,
    totalAOM: summaryData.total_aom || 0,
    totalTI: summaryData.total_ti || 0,
    totalSM: summaryData.total_sm || 0,
    totalTM: summaryData.total_tm || 0,
    totalSMSupervisors: summaryData.total_sm_supervisors || 0,
    totalTNC: summaryData.total_tnc || 0,
    totalShuntingMasters: summaryData.total_shunting_masters || 0,
    totalSS: summaryData.total_ss || 0,
    totalPM: summaryData.total_pm || 0,
    totalAssessments: summaryData.total_assessments || 0,
    pendingApprovals: summaryData.pending_approvals || 0,
    highRiskStaff: summaryData.high_risk_staff || 0,
    totalEmployees,
  };

  const stationWiseEvaluationProgress = stationProgress.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    completed: row.completed || 0,
    pending: row.pending || 0,
  }));

  const stationWiseAverageScore = stationAvgScore.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    averageScore: row.averageScore !== null ? Number(row.averageScore) : 0,
  }));

  const roleWiseStaffDistribution = fillRoleDistribution(roleWiseData).filter(
    (item) => ["PM", "SM", "TM", "STATION MASTER SUPERVISOR", "CABIN MASTER", "SHUNTING MASTER", "SS", "TI"].includes(item.role)
  );
  roleWiseStaffDistribution.push({
    role: "AOM",
    count: summary.totalAOM || 0,
  });
  const categoryDistribution = fillCategoryDistribution(categoryData);
  const assessmentPipeline = makeAssessmentPipeline(assessments);
  const approvalTrend = makeApprovalTrend(assessments);
  const divisionPerformanceTrend = makePerformanceTrend(assessments);

  // compliance computation
  let completedCount = 0;
  let pendingCount = 0;
  assessments.forEach((a) => {
    if (a.status === "completed") completedCount++;
    else if (a.status === "created" || a.status === "mcq_submitted") pendingCount++;
  });
  const safetyComplianceAnalytics = makeSafetyCompliance(completedCount, pendingCount);

  const tiPerformanceComparison = tiPerformance.map((row) => ({
    tiName: row.tiName,
    averageScore: row.averageScore !== null ? Number(row.averageScore) : 0,
  }));

  const stationCategoryDistribution = stationCategoryDist.map((row) => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    categoryA: row.categoryA || 0,
    categoryB: row.categoryB || 0,
    categoryC: row.categoryC || 0,
    categoryD: row.categoryD || 0,
  }));

  const monthlyAssessmentCompletionTrend = makeMonthlyCompletionTrend(assessments);

  return {
    summary,
    graphs: {
      stationWiseEvaluationProgress,
      stationWiseAverageScore,
      roleWiseStaffDistribution,
      categoryDistribution,
      assessmentPipeline,
      approvalTrend,
      divisionPerformanceTrend,
      safetyComplianceAnalytics,
      tiPerformanceComparison,
      stationCategoryDistribution,
      monthlyAssessmentCompletionTrend,
    },
  };
}

async function getSuperAdminWorkforceActivityService(filters) {
  return await db.getSuperAdminWorkforceActivity(filters);
}

async function getSuperAdminHighRiskStaffService(filters) {
  return await db.getSuperAdminHighRiskStaff(filters);
}

async function getSmSupervisorDashboardService(profileId) {
  const station = await db.getSmStation(profileId);
  if (!station) {
    return {
      station: null,
      stationMasters: [],
      trainManagers: [],
      pointsmen: [],
      summary: {
        totalPM: 0,
        totalSM: 0,
        totalTM: 0,
        totalSS: 0,
        totalSHM: 0,
        categoryA: 0,
        categoryB: 0,
        categoryC: 0,
        categoryD: 0,
        completedAssessments: 0,
        pendingAssessments: 0,
        pendingApprovals: 0,
        completedApprovals: 0,
        highRiskStaff: 0,
      },
      graphs: {
        roleWiseStaffDistribution: [],
        categoryDistribution: [],
        safetyComplianceAnalytics: makeSafetyCompliance(0, 0),
        stationCategoryDistribution: [],
        monthlyAssessmentCompletionTrend: [],
        scoreSafetyTrend: [],
      },
    };
  }

  const stationId = station.station_id;

  const [
    summaryData,
    roleWiseData,
    categoryData,
    stationCategoryDist,
    assessments,
    staff
  ] = await Promise.all([
    db.getSmSupervisorSummary(stationId, profileId),
    db.getSmRoleWiseStaff(stationId),
    db.getSmCategoryDistribution(stationId),
    db.getSmStationCategoryDistribution(stationId),
    db.getSmAssessments(stationId),
    db.getStationStaff(stationId)
  ]);

  const summary = {
    totalPM: summaryData.total_pm || 0,
    totalSM: summaryData.total_sm || 0,
    totalTM: summaryData.total_tm || 0,
    totalSS: summaryData.total_ss || 0,
    totalCM: summaryData.total_cm || 0,
    totalSHM: summaryData.total_shm || 0,
    categoryA: summaryData.category_a || 0,
    categoryB: summaryData.category_b || 0,
    categoryC: summaryData.category_c || 0,
    categoryD: summaryData.category_d || 0,
    completedAssessments: summaryData.completed_assessments || 0,
    pendingAssessments: summaryData.pending_assessments || 0,
    pendingApprovals: summaryData.pending_approvals || 0,
    completedApprovals: summaryData.completed_approvals || 0,
    highRiskStaff: summaryData.high_risk_staff || 0,
    totalEmployees: staff.length,
  };

  const roleWiseStaffDistribution = fillRoleDistribution(roleWiseData).filter(
    (item) => ["PM", "SM", "TM", "STATION MASTER SUPERVISOR", "CABIN MASTER", "SHUNTING MASTER", "SS"].includes(item.role)
  );
  const categoryDistribution = fillCategoryDistribution(categoryData);
  const safetyComplianceAnalytics = makeSafetyCompliance(
    summary.completedAssessments,
    summary.pendingAssessments
  );
  
  const stationCategoryDistribution = stationCategoryDist.map((row) => ({
    stationName: row.stationName,
    categoryA: row.categoryA || 0,
    categoryB: row.categoryB || 0,
    categoryC: row.categoryC || 0,
    categoryD: row.categoryD || 0,
  }));

  const monthlyAssessmentCompletionTrend = makeMonthlyCompletionTrend(assessments);

  // Filter staff members
  const stationMasters = staff.filter(
    (s) => s.role === "SM" && s.id !== profileId
  );
  const stationMasterIncharges = staff.filter(
    (s) => s.role === "SS" && s.id !== profileId
  );
  const cabinMasters = staff.filter(
    (s) => (s.role === "Cabin Master" || s.role === "CABIN MASTER" || s.role === "CM") && s.id !== profileId
  );
  const trainManagers = staff.filter((s) => s.role === "TM");
  const pointsmen = staff.filter((s) => s.role === "PM" || s.role === "Shunting Master" || s.role === "SHUNTING MASTER" || s.role === "SHM");

  // Calculate current safety percent (Cat A + B vs total categorized pointsmen)
  const categorizedPointsmen = pointsmen.filter((s) =>
    ["A", "B", "C", "D"].includes(s.category)
  );
  const catAAndBCount = categorizedPointsmen.filter((s) =>
    ["A", "B"].includes(s.category)
  );
  const currentSafetyPercent =
    categorizedPointsmen.length > 0
      ? Math.round((catAAndBCount.length / categorizedPointsmen.length) * 100)
      : 100;

  const scoreSafetyTrend = makeScoreSafetyTrend(assessments, currentSafetyPercent);

  return {
    station: {
      id: station.station_id,
      name: station.station_name,
      code: station.station_code,
    },
    stationMasters,
    stationMasterIncharges,
    cabinMasters,
    trainManagers,
    pointsmen,
    summary,
    graphs: {
      roleWiseStaffDistribution,
      categoryDistribution,
      safetyComplianceAnalytics,
      stationCategoryDistribution,
      monthlyAssessmentCompletionTrend,
      scoreSafetyTrend,
    },
  };
}

module.exports = {
  getPmDashboardService,
  getTmDashboardService,
  getSmDashboardService,
  getTiDashboardService,
  getAomDashboardService,
  getSuperAdminDashboardService,
  getSuperAdminWorkforceActivityService,
  getSuperAdminHighRiskStaffService,
  getSmSupervisorDashboardService,
};
