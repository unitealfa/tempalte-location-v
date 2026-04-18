require("./loadEnvironment");

function normalizeBoolean(value) {
  return String(value).trim().toLowerCase() === "true";
}

function resolveMailerConfig() {
  const host = process.env.MAIL_SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.MAIL_SMTP_PORT || 465);
  const secure = normalizeBoolean(process.env.MAIL_SMTP_SECURE || "true");
  const user = process.env.MAIL_SMTP_USER || "";
  const password = (process.env.MAIL_SMTP_PASS || "").replace(/\s+/g, "");
  const from = process.env.MAIL_FROM || user;

  if (!user || !password) {
    throw new Error("Mail configuration is incomplete.");
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass: password
    },
    from
  };
}

module.exports = {
  resolveMailerConfig
};
