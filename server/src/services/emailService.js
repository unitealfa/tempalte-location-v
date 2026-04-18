const nodemailer = require("nodemailer");
const { resolveMailerConfig } = require("../config/mailerConfig");

let transporter;

function getTransporter() {
  if (!transporter) {
    const config = resolveMailerConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
  }

  return transporter;
}

async function sendVerificationCodeEmail({ to, code, purpose }) {
  const { from } = resolveMailerConfig();
  const purposeLabel =
    purpose === "password_change"
      ? "modifier votre mot de passe"
      : "modifier votre profil";

  await getTransporter().sendMail({
    from,
    to,
    subject: "Code de verification Lea Location",
    text: [
      "Bonjour,",
      "",
      `Vous avez demande a ${purposeLabel}.`,
      `Votre code de verification est: ${code}`,
      "Ce code expire dans 5 minutes.",
      "",
      "Si vous n'etes pas a l'origine de cette demande, ignorez cet email."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #2a1d14; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Code de verification</h2>
        <p>Vous avez demande a ${purposeLabel}.</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 0.2em;">
          ${code}
        </p>
        <p>Ce code expire dans <strong>5 minutes</strong>.</p>
        <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
      </div>
    `
  });
}

module.exports = {
  sendVerificationCodeEmail
};
