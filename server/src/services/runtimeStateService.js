const runtimeState = {
  adminSeed: "",
  database: {
    ready: false,
    status: "starting",
    lastError: "",
    lastSuccessAt: "",
    retryDelayMs: 15000
  }
};

function getRuntimeState() {
  return JSON.parse(JSON.stringify(runtimeState));
}

function setAdminSeed(username) {
  runtimeState.adminSeed = username;
}

function setDatabaseState(nextState) {
  runtimeState.database = {
    ...runtimeState.database,
    ...nextState
  };
}

module.exports = {
  getRuntimeState,
  setAdminSeed,
  setDatabaseState
};
