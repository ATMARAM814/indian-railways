const db = require("./station.repository");

async function verifyStationBoundaries(stationId, userId, userRole) {
  if (userRole === "SUPER_ADMIN") {
    return;
  }
  
  if (userRole === "TI") {
    const tiStations = await db.getTiStations(userId);
    if (!tiStations.includes(stationId)) {
      throw new Error("Access Denied: You do not monitor this station.");
    }
    return;
  }
  
  if (userRole === "AOM") {
    const aomDiv = await db.getAomDivision(userId);
    const stationRes = await poolQuery(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
    if (stationRes.rows.length === 0) {
      throw new Error("Station not found.");
    }
    if (stationRes.rows[0].division_id !== aomDiv) {
      throw new Error("Access Denied: This station belongs to another division.");
    }
    return;
  }
  
  // SM, SS, Station Master Supervisor, Cabin Master, etc. posted at the station
  const sharesStation = await poolQuery(`
    SELECT EXISTS (
      SELECT 1 
      FROM staff_station_postings ssp1
      JOIN staff_station_postings ssp2 ON ssp1.station_id = ssp2.station_id
      WHERE ssp1.profile_id = $1 
        AND ssp2.profile_id = $2 
        AND ssp1.is_current = true 
        AND ssp2.is_current = true
    ) as shares_station
  `, [stationId, userId]);
  
  if (!sharesStation.rows[0]?.shares_station) {
    throw new Error("Access Denied: You do not have permission to access staff data from this station.");
  }
}

async function listStations() {
  return await db.getAllStations();
}

async function listStationStaff(stationId, userId, userRole) {
  if (userId && userRole) {
    await verifyStationBoundaries(stationId, userId, userRole);
  }
  return await db.getStationStaff(stationId);
}

async function getStaffSummary(stationId, userId, userRole) {
  if (userId && userRole) {
    await verifyStationBoundaries(stationId, userId, userRole);
  }
  return await db.getStationStaffSummary(stationId);
}

async function listStationStaffGrouped(stationId, userId, userRole) {
  if (userId && userRole) {
    await verifyStationBoundaries(stationId, userId, userRole);
  }
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
    categoryCWatchlist,
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
    db.getStationCategoryCWatchlistDb(stationId),
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
    categoryCWatchlist,
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

async function getCategoryCandidatesService(stationId, categoryCode, userId, userRole) {
  if (userRole === "TI") {
    const tiStations = await db.getTiStations(userId);
    const stationRes = await poolQuery(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
    if (stationRes.rows.length === 0) {
      throw new Error("Station not found.");
    }
    return await db.getTiCategoryCandidatesDb(tiStations, categoryCode);
  } else if (["AOM", "SUPER_ADMIN"].includes(userRole)) {
    if (userRole === "AOM") {
      const aomDiv = await db.getAomDivision(userId);
      const stationRes = await poolQuery(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
      if (stationRes.rows.length === 0) {
        throw new Error("Station not found.");
      }
      if (stationRes.rows[0].division_id !== aomDiv) {
        throw new Error("Access Denied: This station belongs to another division.");
      }
    }
    const stationRes = await poolQuery(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
    if (stationRes.rows.length === 0) {
      throw new Error("Station not found.");
    }
    const divisionId = stationRes.rows[0].division_id;
    return await db.getDivisionCategoryCandidatesDb(divisionId, categoryCode);
  } else {
    throw new Error("Access Denied: Unauthorized role.");
  }
}

module.exports = {
  listStations,
  listStationStaff,
  getStaffSummary,
  listStationStaffGrouped,
  listDivisions,
  listScopedStationsService,
  getStationIntelligenceService,
  getCategoryCandidatesService,
  createStationService,
  updateStationService
};

async function updateStationService(stationId, updaterUserId, updaterRole, stationData) {
  const { stationName, stationCode, divisionId, assignedSMId, assignedTIId } = stationData;

  if (!stationName || !stationCode) {
    throw new Error("stationName and stationCode are required");
  }

  // 1. Role Scope Access Check
  if (updaterRole === "TI") {
    const tiStations = await db.getTiStations(updaterUserId);
    if (!tiStations.includes(stationId)) {
      throw new Error("Access Denied: You do not monitor this station.");
    }
  } else if (updaterRole === "AOM") {
    const aomDiv = await db.getAomDivision(updaterUserId);
    const stationRes = await poolQuery(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
    if (stationRes.rows.length === 0) {
      throw new Error("Station not found.");
    }
    if (stationRes.rows[0].division_id !== aomDiv) {
      throw new Error("Access Denied: This station is in another division.");
    }
  } else if (updaterRole !== "SUPER_ADMIN") {
    throw new Error("Access Denied: Unauthorized role.");
  }

  let finalDivisionId = divisionId;
  if (updaterRole === 'AOM') {
    const aomDiv = await db.getAomDivision(updaterUserId);
    finalDivisionId = aomDiv;
  } else if (updaterRole === 'TI') {
    const stationRes = await poolQuery(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
    finalDivisionId = stationRes.rows[0]?.division_id;
  }

  if (!finalDivisionId) {
    throw new Error("divisionId is required to update a station");
  }

  // 2. Fetch current station info (specifically the currently assigned TI and SM)
  // Get current assigned TI
  const currentTiRes = await poolQuery(
    `SELECT profile_id FROM station_assignments WHERE station_id = $1 AND assignment_type = 'TI_AREA' AND assigned_to IS NULL LIMIT 1`,
    [stationId]
  );
  const currentTiId = currentTiRes.rows[0]?.profile_id;

  // Get current assigned SM
  const currentSmRes = await poolQuery(
    `SELECT p.id FROM staff_station_postings ssp
     JOIN profiles p ON p.id = ssp.profile_id
     JOIN roles r ON r.id = p.role_id
     WHERE ssp.station_id = $1 AND ssp.is_current = true AND r.name = 'SM'
     LIMIT 1`,
    [stationId]
  );
  const currentSmId = currentSmRes.rows[0]?.id;

  // 3. Update core station
  const updatedStation = await db.updateStationDb(
    stationId,
    finalDivisionId,
    stationName.trim(),
    stationCode.trim().toUpperCase()
  );

  // 4. Update SM Assignment if changed
  if (assignedSMId && assignedSMId !== currentSmId) {
    // Deassign previous SM(s) from this station
    await db.deassignSmFromStationDb(stationId);
    // Close the new SM's active posting elsewhere
    await db.closeCurrentSmPostingDb(assignedSMId);
    // Assign new SM to this station
    await db.assignSmToStationDb(assignedSMId, stationId);
  } else if (!assignedSMId && currentSmId) {
    // If explicitly removed
    await db.deassignSmFromStationDb(stationId);
  }

  // 5. Update TI Assignment if changed
  if (updaterRole !== 'TI') {
    // AOM/Super Admin can assign TI
    if (assignedTIId && assignedTIId !== currentTiId) {
      await db.deassignTiFromStationDb(stationId);
      await db.assignTiToStationDb(assignedTIId, stationId);
    } else if (!assignedTIId && currentTiId) {
      await db.deassignTiFromStationDb(stationId);
    }
  }

  return updatedStation;
}