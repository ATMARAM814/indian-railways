const db = require("./station.repository");

async function listStations() {
  return await db.getAllStations();
}

async function listStationStaff(stationId) {
  return await db.getStationStaff(stationId);
}

async function getStaffSummary(stationId) {
  return await db.getStationStaffSummary(stationId);
}

async function listStationStaffGrouped(stationId) {
  return await db.getStationStaffGrouped(stationId);
}

async function listDivisions() {
  return await db.getAllDivisions();
}

// ==========================================
// STATION INTELLIGENCE NEW SERVICES
// ==========================================

async function listScopedStationsService(userId, userRole, filters) {
  return await db.getStationsListDb(userId, userRole, filters);
}

async function getStationIntelligenceService(stationId, userId, userRole) {
  // 1. Role Scope Access Check
  if (userRole === "TI") {
    const tiStations = await db.getTiStations(userId);
    if (!tiStations.includes(stationId)) {
      throw new Error("Access Denied: You do not monitor this station.");
    }
  } else if (userRole === "AOM") {
    const aomDiv = await db.getAomDivision(userId);
    const summary = await db.getStationSummaryDb(stationId);
    if (!summary) {
      throw new Error("Station not found.");
    }
    // Verify division ID match
    const stationRes = await poolQuery(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
    if (stationRes.rows[0]?.division_id !== aomDiv) {
      throw new Error("Access Denied: This station is in another division.");
    }
  } else if (userRole !== "SUPER_ADMIN") {
    throw new Error("Access Denied: Unauthorized role.");
  }

  // 2. Fetch everything in parallel
  const [
    stationSummary,
    assignedTI,
    overview,
    categoryDistribution,
    riskDistribution,
    performanceTrend,
    operationalReadiness,
    workforce,
    highRiskWatchlist,
    recentActivities
  ] = await Promise.all([
    db.getStationSummaryDb(stationId),
    db.getStationAssignedTIDb(stationId),
    db.getStationOverviewStatsDb(stationId),
    db.getStationCategoryDistributionDb(stationId),
    db.getStationRiskDistributionDb(stationId),
    db.getStationPerformanceTrendDb(stationId),
    db.getStationOperationalReadinessDb(stationId),
    db.getStationWorkforceDb(stationId),
    db.getStationHighRiskWatchlistDb(stationId),
    db.getStationRecentActivitiesDb(stationId)
  ]);

  return {
    stationSummary,
    assignedTI,
    overview,
    categoryDistribution,
    riskDistribution,
    performanceTrend,
    operationalReadiness,
    workforce,
    highRiskWatchlist,
    recentActivities
  };
}

async function createStationService(creatorUserId, creatorRole, stationData) {
  const { stationName, stationCode, divisionId, assignedSMId, assignedTIId } = stationData;

  if (!stationName || !stationCode) {
    throw new Error("stationName and stationCode are required");
  }

  let finalDivisionId = divisionId;
  if (creatorRole === 'AOM') {
    const aomDiv = await db.getAomDivision(creatorUserId);
    if (!aomDiv) {
      throw new Error("AOM does not have an assigned division.");
    }
    finalDivisionId = aomDiv;
  } else if (creatorRole === 'TI') {
    const tiDivResult = await poolQuery(
      `SELECT DISTINCT s.division_id 
       FROM stations s 
       JOIN station_assignments sa ON sa.station_id = s.id 
       WHERE sa.profile_id = $1 AND sa.assigned_to IS NULL 
       LIMIT 1`,
      [creatorUserId]
    );
    if (tiDivResult.rows.length > 0) {
      finalDivisionId = tiDivResult.rows[0].division_id;
    }
  }

  if (!finalDivisionId) {
    throw new Error("divisionId is required to create a station");
  }

  const station = await db.createStationDb(
    finalDivisionId,
    stationName.trim(),
    stationCode.trim().toUpperCase()
  );

  // Assign Station Master (any role can assign SM now)
  if (assignedSMId) {
    await db.closeCurrentSmPostingDb(assignedSMId);
    await db.assignSmToStationDb(assignedSMId, station.id);
  }

  // Assign Traffic Inspector
  if (creatorRole === 'TI') {
    // If TI is creating, they are automatically assigned as the TI for this station
    await db.assignTiToStationDb(creatorUserId, station.id);
  } else if (['AOM', 'SUPER_ADMIN'].includes(creatorRole)) {
    // If AOM/Super Admin is creating, they assign the selected TI
    if (assignedTIId) {
      await db.assignTiToStationDb(assignedTIId, station.id);
    }
  }

  return station;
}

// Local helper to query within the service
async function poolQuery(sql, params) {
  const pool = require("../../config/database");
  return await pool.query(sql, params);
}

module.exports = {
  listStations,
  listStationStaff,
  getStaffSummary,
  listStationStaffGrouped,
  listDivisions,
  listScopedStationsService,
  getStationIntelligenceService,
  createStationService
};