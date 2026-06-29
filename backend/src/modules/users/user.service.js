const bcrypt = require("bcrypt");
const { logAction } = require("../audit/audit.service");

const {
  getRoleByName,
  findUserByHrmsId,
  createProfile,
  createUserCredential,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  updateUserPassword,
  activateUser,
  getCurrentPosting,
  getStationById,
  closeCurrentPosting,
  createNewPosting,
  countUsers,
  getUserProfileDetails,
  createDivisionAssignment,
  assignUserCategory,
  getCategoryByCode,
  getActiveRolesInScope,
} = require("./user.repository");

const CREATE_PERMISSIONS = {
  SM: ["PM", "Shunting Master", "SHUNTING MASTER", "SHM", "TM"],
  SS: ["PM", "Shunting Master", "SHUNTING MASTER", "SHM", "TM"],
  "Cabin Master": ["PM", "Shunting Master", "SHUNTING MASTER", "SHM", "TM"],
  "CABIN MASTER": ["PM", "Shunting Master", "SHUNTING MASTER", "SHM", "TM"],

  TI: [
    "PM",
    "SM",
    "TM",
    "SS",
    "Station Master Supervisor",
    "STATION MASTER SUPERVISOR",
    "SMS",
    "Cabin Master",
    "CABIN MASTER",
    "Shunting Master",
    "SHUNTING MASTER",
    "SHM",
  ],

  "Station Master Supervisor": [
    "PM",
    "SM",
    "TM",
    "SS",
    "Station Master Supervisor",
    "STATION MASTER SUPERVISOR",
    "SMS",
    "Cabin Master",
    "CABIN MASTER",
    "Shunting Master",
    "SHUNTING MASTER",
    "SHM",
  ],

  SMS: [
    "PM",
    "SM",
    "TM",
    "SS",
    "Station Master Supervisor",
    "STATION MASTER SUPERVISOR",
    "SMS",
    "Cabin Master",
    "CABIN MASTER",
    "Shunting Master",
    "SHUNTING MASTER",
    "SHM",
  ],

  "STATION MASTER SUPERVISOR": [
    "PM",
    "SM",
    "TM",
    "SS",
    "Station Master Supervisor",
    "STATION MASTER SUPERVISOR",
    "SMS",
    "Cabin Master",
    "CABIN MASTER",
    "Shunting Master",
    "SHUNTING MASTER",
    "SHM",
  ],

  AOM: [
    "PM",
    "SM",
    "TM",
    "SS",
    "TI",
    "Station Master Supervisor",
    "STATION MASTER SUPERVISOR",
    "SMS",
    "Cabin Master",
    "CABIN MASTER",
    "Shunting Master",
    "SHUNTING MASTER",
    "SHM",
  ],

  SUPER_ADMIN: [
    "PM",
    "SM",
    "TM",
    "SS",
    "TI",
    "AOM",
    "Station Master Supervisor",
    "STATION MASTER SUPERVISOR",
    "SMS",
    "Cabin Master",
    "CABIN MASTER",
    "Shunting Master",
    "SHUNTING MASTER",
    "SHM",
    "SUPER_ADMIN",
  ],
};

const normalizeDesignation = (designation) => {
  if (!designation) return null;
  const d = designation.trim().toLowerCase();
  
  if (d === 'pointsman' || d === 'pm') return 'Pointsman';
  if (d === 'station master' || d === 'sm') return 'Station Master';
  if (['station master incharge', 'station master icharge', 'sm incharge', 'ss', 'station master inchrge'].includes(d)) {
    return 'Station Master Incharge';
  }
  if (['station master supervisor', 'sm supervisor', 'sms'].includes(d)) {
    return 'Station Master Supervisor';
  }
  if (d === 'shunting master' || d === 'shm') return 'Shunting Master';
  if (d === 'cabin master' || d === 'cm') return 'Cabin Master';
  if (d === 'train manager' || d === 'tm') return 'Train Manager';
  if (d === 'traffic inspector' || d === 'ti') return 'Traffic Inspector';
  if (d === 'assistant operations manager' || d === 'aom') return 'AOM';
  if (d === 'super_admin' || d === 'super admin' || d === 'sa') return 'SUPER_ADMIN';
  
  // Default to capitalized words if not matched specifically
  return designation.trim().replace(/\b\w/g, c => c.toUpperCase());
};

function validateCreatePermission(
  creatorRole,
  targetRole
) {
  const allowedRoles =
    CREATE_PERMISSIONS[
      creatorRole
    ] || [];

  if (
    !allowedRoles.includes(
      targetRole
    )
  ) {
    throw new Error(
      `${creatorRole} cannot create ${targetRole}`
    );
  }
}

async function createUserService(
  creatorUserId,
  creatorRole,
  userData
) {
  const {
    fullName,
    hrmsId,
    roleCode,
    email,
    phone,
    employeeId,
    designation,
    stationId,
    divisionId,
    categoryCode,
  } = userData;

  if (!fullName || !hrmsId || !roleCode) {
    throw new Error(
      "fullName, hrmsId and roleCode are required"
    );
  }

  validateCreatePermission(
    creatorRole,
    roleCode
  );

  const role =
    await getRoleByName(roleCode);

  if (!role) {
    throw new Error("Invalid roleCode");
  }

  const existingUser =
    await findUserByHrmsId(hrmsId);

  if (existingUser) {
    throw new Error(
      "HRMS ID already exists"
    );
  }

  const profile =
    await createProfile({
      roleId: role.id,
      fullName,
      email,
      phone,
      hrmsId,
      employeeId,
      designation: normalizeDesignation(designation),
    });

  const passwordHash =
    await bcrypt.hash(hrmsId, 10);

  await createUserCredential(
    profile.id,
    hrmsId,
    passwordHash
  );

  // Link station posting if provided
  if (stationId) {
    await createNewPosting({
      profileId: profile.id,
      stationId,
      transferredBy: creatorUserId,
      reason: "Initial Posting",
    });
  }

  // Link division assignment if provided
  if (divisionId) {
    await createDivisionAssignment({
      profileId: profile.id,
      divisionId,
    });
  }

  // Link category if provided
  if (categoryCode) {
    const cat = await getCategoryByCode(categoryCode);
    if (cat) {
      await assignUserCategory({
        profileId: profile.id,
        categoryId: cat.id,
        assignedBy: creatorUserId,
      });
    }
  }

  await logAction(
    creatorUserId,
    "USER_CREATED",
    "USER",
    profile.id,
    null,
    profile,
    `User ${profile.full_name} created successfully`
  );

  return {
    profile,
    defaultPassword: hrmsId,
  };
}

async function listUsersService(
  creatorUserId,
  creatorRole,
  filters = {}
) {
  const {
    role,
    status,
    search,
    stationId,
    category,
    tiArea,
    riskLevel,
    page = 1,
    limit = 10,
  } = filters;

  if (role) {
    let allowedRoles =
      CREATE_PERMISSIONS[creatorRole] || [];

    if (role === 'TM' && ['SM', 'SS', 'Cabin Master', 'CABIN MASTER'].includes(creatorRole) && creatorUserId !== '439a8db6-2546-4858-abbc-3752f4acb536') {
      allowedRoles = allowedRoles.filter(r => r !== 'TM');
    }

    if (!allowedRoles.includes(role)) {
      throw new Error(
        `${creatorRole} cannot view ${role}`
      );
    }
  }

  const queryFilters = {
    creatorUserId,
    creatorRole,
    roleCode: role,
    status,
    search,
    stationId,
    category,
    tiArea,
    riskLevel,
    page,
    limit,
  };

  const users = await getUsers(queryFilters);
  const total = await countUsers(queryFilters);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getUserDetailsService(
  creatorUserId,
  creatorRole,
  targetUserId
) {
  const user =
    await getUserProfileDetails(targetUserId);

  if (!user) {
    throw new Error("User not found");
  }

  if (creatorUserId === targetUserId) {
    return user;
  }

  const allowedRoles =
    CREATE_PERMISSIONS[creatorRole] || [];

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `${creatorRole} cannot view ${user.role}`
    );
  }

  return user;
}

async function updateUserService(
  creatorUserId,
  creatorRole,
  targetUserId,
  updateData
) {
  const existingUser =
    await getUserById(targetUserId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (creatorUserId === targetUserId) {
    throw new Error("You cannot update your own account from this panel");
  }
  const allowedRoles =
    CREATE_PERMISSIONS[creatorRole] || [];

  if (!allowedRoles.includes(existingUser.role)) {
    throw new Error(
      `${creatorRole} cannot update ${existingUser.role}`
    );
  }

  const updated = await updateUser(
    targetUserId,
    {
      fullName:
        updateData.fullName ??
        existingUser.full_name,

      email:
        updateData.email === ""
          ? null
          : (updateData.email ?? existingUser.email),

      phone:
        updateData.phone === ""
          ? null
          : (updateData.phone ?? existingUser.phone),

      designation: normalizeDesignation(
        updateData.designation ??
        existingUser.designation
      ),

      status:
        updateData.status ??
        existingUser.status,

      hrmsId:
        updateData.hrmsId ??
        existingUser.hrms_id,

      pmeDue:
        updateData.pmeDue === ""
          ? null
          : (updateData.pmeDue ?? existingUser.pme_due),

      pmeDone:
        updateData.pmeDone === ""
          ? null
          : (updateData.pmeDone ?? existingUser.pme_done),

      refDue:
        updateData.refDue === ""
          ? null
          : (updateData.refDue ?? existingUser.ref_due),

      refDone:
        updateData.refDone === ""
          ? null
          : (updateData.refDone ?? existingUser.ref_done),
    }
  );

  // Update station posting if requested and changed
  if (updateData.stationId) {
    const currentPosting = await getCurrentPosting(targetUserId);
    if (!currentPosting || currentPosting.station_id !== updateData.stationId) {
      if (currentPosting) {
        await closeCurrentPosting(currentPosting.id);
      }
      await createNewPosting({
        profileId: targetUserId,
        stationId: updateData.stationId,
        transferredBy: creatorUserId,
        reason: updateData.transferReason || "Station Update via Edit Profile",
      });
    }
  }

  // Update safety category if requested and changed
  if (updateData.categoryCode) {
    const details = await getUserProfileDetails(targetUserId);
    if (!details || details.categoryCode !== updateData.categoryCode) {
      const catObj = await getCategoryByCode(updateData.categoryCode);
      if (catObj) {
        await assignUserCategory({
          profileId: targetUserId,
          categoryId: catObj.id,
          assignedBy: creatorUserId,
        });
      }
    }
  }

  await logAction(
    creatorUserId,
    "USER_UPDATED",
    "USER",
    targetUserId,
    existingUser,
    updated,
    `User ${existingUser.full_name} updated successfully`
  );

  return updated;
}

async function deactivateUserService(
  creatorUserId,
  creatorRole,
  targetUserId
) {
  const existingUser =
    await getUserById(targetUserId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (creatorUserId === targetUserId) {
    throw new Error("You cannot deactivate your own account");
  }

  const allowedRoles =
    CREATE_PERMISSIONS[creatorRole] || [];

  if (!allowedRoles.includes(existingUser.role)) {
    throw new Error(
      `${creatorRole} cannot deactivate ${existingUser.role}`
    );
  }

  const deactivated = await deactivateUser(targetUserId);
  await logAction(
    creatorUserId,
    "USER_DEACTIVATED",
    "USER",
    targetUserId,
    existingUser,
    deactivated,
    `User ${existingUser.full_name} deactivated successfully`
  );
  return deactivated;
}   

async function resetPasswordService(
  creatorUserId,
  creatorRole,
  targetUserId
) {
  const existingUser =
    await getUserById(targetUserId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (creatorUserId === targetUserId) {
    throw new Error("You cannot reset your own password from this panel");
  }

  const allowedRoles =
    CREATE_PERMISSIONS[creatorRole] || [];

  if (!allowedRoles.includes(existingUser.role)) {
    throw new Error(
      `${creatorRole} cannot reset ${existingUser.role} password`
    );
  }

  const passwordHash =
    await bcrypt.hash(
      existingUser.hrms_id,
      10
    );

  await updateUserPassword(
    targetUserId,
    passwordHash
  );

  await logAction(
    creatorUserId,
    "PASSWORD_RESET",
    "USER",
    targetUserId,
    null,
    { hrmsId: existingUser.hrms_id },
    `Password reset for user ${existingUser.full_name}`
  );

  return {
    defaultPassword:
      existingUser.hrms_id,
  };
}

async function activateUserService(
  creatorUserId,
  creatorRole,
  targetUserId
) {
  const existingUser =
    await getUserById(
      targetUserId
    );

  if (!existingUser) {
    throw new Error(
      "User not found"
    );
  }

  if (creatorUserId === targetUserId) {
      throw new Error("You cannot activate your own account");
  }

  const allowedRoles =
    CREATE_PERMISSIONS[
      creatorRole
    ] || [];

  if (
    !allowedRoles.includes(
      existingUser.role
    )
  ) {
    throw new Error(
      `${creatorRole} cannot activate ${existingUser.role}`
    );
  }

  const activated = await activateUser(
    targetUserId
  );

  await logAction(
    creatorUserId,
    "USER_ACTIVATED",
    "USER",
    targetUserId,
    existingUser,
    activated,
    `User ${existingUser.full_name} activated successfully`
  );

  return activated;
}

async function transferUserService(
  creatorUserId,
  creatorRole,
  targetUserId,
  transferData
) {
  const existingUser = await getUserById(targetUserId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (creatorUserId === targetUserId) {
    throw new Error("You cannot transfer yourself");
  }

  const allowedRoles = CREATE_PERMISSIONS[creatorRole] || [];

  if (!allowedRoles.includes(existingUser.role)) {
    throw new Error(`${creatorRole} cannot transfer ${existingUser.role}`);
  }

  const isTargetTi = transferData.newRole === 'TI';
  
  if (!isTargetTi) {
    const station = await getStationById(transferData.newStationId);
    if (!station) {
      throw new Error("Target station not found");
    }
  }

  const designationMap = {
    'PM': 'Pointsman',
    'Shunting Master': 'Shunting Master',
    'Cabin Master': 'Cabin Master',
    'TM': 'Train Manager',
    'SM': 'Station Master',
    'SS': 'Station Master Incharge',
    'SMS': 'Station Master Supervisor',
    'TI': 'Traffic Inspector',
    'AOM': 'AOM',
    'SUPER_ADMIN': 'SUPER_ADMIN'
  };

  const ROLE_HIERARCHY = {
    'PM': 1,
    'Shunting Master': 1,
    'Cabin Master': 1,
    'TM': 2,
    'SM': 3,
    'SS': 4,
    'SMS': 4,
    'TI': 5
  };

  const oldRole = existingUser.role;
  const newRole = transferData.newRole || oldRole;

  const oldRank = ROLE_HIERARCHY[oldRole] || 0;
  const newRank = ROLE_HIERARCHY[newRole] || 0;

  if (newRank < oldRank) {
    throw new Error(`Invalid role change: Demotions are not permitted during transfer.`);
  }

  const pool = require("../../config/database");

  // Update profile role & designation
  let newDesignation = existingUser.designation;
  if (newRole !== oldRole) {
    const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [newRole]);
    if (roleRes.rows.length === 0) {
      throw new Error(`Role ${newRole} not found`);
    }
    const roleId = roleRes.rows[0].id;
    newDesignation = designationMap[newRole] || newRole;

    await pool.query(
      `UPDATE profiles SET role_id = $1, designation = $2, updated_at = now() WHERE id = $3`,
      [roleId, newDesignation, targetUserId]
    );
  }

  let currentPosting = await getCurrentPosting(targetUserId);

  if (isTargetTi) {
    if (currentPosting) {
      await closeCurrentPosting(currentPosting.id);
    }

    await pool.query(
      `UPDATE station_assignments SET assigned_to = CURRENT_DATE WHERE profile_id = $1 AND assignment_type = 'TI_AREA' AND assigned_to IS NULL`,
      [targetUserId]
    );

    const tiAreaStationIds = transferData.tiAreaStationIds || [];
    if (!Array.isArray(tiAreaStationIds) || tiAreaStationIds.length === 0) {
      throw new Error("TI Area monitored stations list must be provided when promoting to TI.");
    }

    for (const stationId of tiAreaStationIds) {
      await pool.query(
        `UPDATE station_assignments SET assigned_to = CURRENT_DATE WHERE station_id = $1 AND assignment_type = 'TI_AREA' AND assigned_to IS NULL`,
        [stationId]
      );
      await pool.query(
        `INSERT INTO station_assignments (profile_id, station_id, assignment_type, is_primary, assigned_from, assigned_to) 
         VALUES ($1, $2, 'TI_AREA', true, CURRENT_DATE, NULL)`,
        [targetUserId, stationId]
      );
    }
  } else {
    if (oldRole === 'TI') {
      await pool.query(
        `UPDATE station_assignments SET assigned_to = CURRENT_DATE WHERE profile_id = $1 AND assignment_type = 'TI_AREA' AND assigned_to IS NULL`,
        [targetUserId]
      );
    }

    if (currentPosting) {
      await closeCurrentPosting(currentPosting.id);
    }

    await createNewPosting({
      profileId: targetUserId,
      stationId: transferData.newStationId,
      transferredBy: creatorUserId,
      reason: transferData.reason || "Transfer",
    });
  }

  await logAction(
    creatorUserId,
    "EMPLOYEE_TRANSFERRED",
    "TRANSFER",
    targetUserId,
    { 
      stationId: currentPosting?.station_id || null, 
      role: oldRole, 
      designation: existingUser.designation 
    },
    { 
      stationId: isTargetTi ? null : transferData.newStationId, 
      role: newRole, 
      designation: newDesignation,
      tiAreaStationIds: isTargetTi ? transferData.tiAreaStationIds : null
    },
    `Employee ${existingUser.full_name} transferred/promoted to ${newDesignation}`
  );

  return { success: true };
}

async function getWorkforcePresenceService(userId, role) {
  return await getActiveRolesInScope(userId, role);
}

module.exports = {
  createUserService,
  listUsersService,
  getUserDetailsService,
  updateUserService,
  deactivateUserService,
  resetPasswordService,
  activateUserService,
  transferUserService,
  getWorkforcePresenceService,
};