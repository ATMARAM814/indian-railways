const {
  createUserService,
  listUsersService,
  getUserDetailsService,
  updateUserService,
  deactivateUserService,
  resetPasswordService,
  activateUserService,
  transferUserService,
  getWorkforcePresenceService,
} = require("./user.service");

async function createUserController(
  req,
  res
) {
  try {
    const user =
      await createUserService(
        req.user.userId,
        req.user.role,
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "User created successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function listUsersController(req, res) {
  try {
    const users =
      await listUsersService(
        req.user.userId,
        req.user.role,
        req.query
      );

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getUserDetailsController(
  req,
  res
) {
  try {
    const { id } = req.params;

    const user =
      await getUserDetailsService(
        req.user.userId,
        req.user.role,
        id
      );

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateUserController(req, res) {
  try {
    const { id } = req.params;

    const user =
      await updateUserService(
        req.user.userId,
        req.user.role,
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function deactivateUserController(req, res) {
  try {
    const { id } = req.params;

    const user = await deactivateUserService(
      req.user.userId,
      req.user.role,
      id
    );

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function resetPasswordController(
  req,
  res
) {
  try {
    const { id } = req.params;

    const result =
      await resetPasswordService(
        req.user.userId,
        req.user.role,
        id
      );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function activateUserController(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const user =
      await activateUserService(
        req.user.userId,
        req.user.role,
        id
      );

    return res.status(200).json({
      success: true,
      message:
        "User activated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
}
async function transferUserController(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const posting =
      await transferUserService(
        req.user.userId,
        req.user.role,
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "User transferred successfully",
      data: posting,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
}

async function getWorkforcePresenceController(req, res) {
  try {
    const presence = await getWorkforcePresenceService(
      req.user.userId,
      req.user.role
    );
    return res.status(200).json({
      success: true,
      data: presence,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createUserController,
  listUsersController,
  getUserDetailsController,
  updateUserController,
  deactivateUserController,
  resetPasswordController,
  activateUserController,
  transferUserController,
  getWorkforcePresenceController,
};