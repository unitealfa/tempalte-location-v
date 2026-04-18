const { getRuntimeState } = require("../services/runtimeStateService");
const { ensureDatabaseBootstrap } = require("../services/databaseBootstrapService");

async function requireDatabaseReady(request, response, next) {
  let runtimeState = getRuntimeState();

  if (!runtimeState.database.ready) {
    try {
      await ensureDatabaseBootstrap();
      runtimeState = getRuntimeState();
    } catch (error) {
      runtimeState = getRuntimeState();
    }
  }

  if (runtimeState.database.ready) {
    return next();
  }

  return response.status(503).json({
    message: "Le service admin est temporairement indisponible.",
    databaseStatus: runtimeState.database.status,
    retryDelayMs: runtimeState.database.retryDelayMs
  });
}

module.exports = {
  requireDatabaseReady
};
