import { useEffect, useState } from "react";
import VerificationDialog from "../components/VerificationDialog";
import {
  confirmAdminPasswordChange,
  confirmAdminProfileUpdate,
  getAdminProfile,
  requestAdminPasswordChange,
  requestAdminProfileUpdate,
  resendAdminPasswordCode,
  resendAdminProfileUpdateCode
} from "../services/adminProfileService";

function AdminProfile({ content, admin, onAdminUpdated, onBackClick }) {
  const [profileForm, setProfileForm] = useState({
    username: admin.username,
    email: admin.email
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState(null);

  useEffect(() => {
    setProfileForm({
      username: admin.username,
      email: admin.email
    });
  }, [admin.email, admin.username]);

  const updateProfileField = (event) => {
    const { name, value } = event.target;
    setProfileForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const updatePasswordField = (event) => {
    const { name, value } = event.target;
    setPasswordForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const openVerificationDialog = (requestResult, purpose) => {
    setVerificationDialog({
      purpose,
      purposeLabel:
        purpose === "password"
          ? content.passwordSectionTitle
          : content.profileSectionTitle,
      title:
        purpose === "password"
          ? content.verificationTitle
          : content.profileSectionTitle,
      verificationId: requestResult.verificationId,
      maskedEmail: requestResult.maskedEmail,
      expiresAt: requestResult.expiresAt
    });
  };

  const refreshAdminProfile = async () => {
    const response = await getAdminProfile();
    onAdminUpdated(response.admin);
    return response.admin;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsProfileSubmitting(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const response = await requestAdminProfileUpdate(profileForm);
      setProfileMessage(response.message);
      openVerificationDialog(response, "profile");
    } catch (error) {
      setProfileError(error.message || "Modification du profile impossible.");
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setIsPasswordSubmitting(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      const response = await requestAdminPasswordChange(passwordForm);
      setPasswordMessage(response.message);
      openVerificationDialog(response, "password");
    } catch (error) {
      setPasswordError(error.message || "Modification du mot de passe impossible.");
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleVerificationConfirm = async ({ verificationId, code }) => {
    if (!verificationDialog) {
      return;
    }

    if (verificationDialog.purpose === "profile") {
      const response = await confirmAdminProfileUpdate({
        verificationId,
        code
      });

      onAdminUpdated(response.admin);
      setProfileMessage(response.message);
      setProfileError("");
      setVerificationDialog(null);
      return;
    }

    const response = await confirmAdminPasswordChange({
      verificationId,
      code
    });

    await refreshAdminProfile();
    setPasswordForm({
      currentPassword: "",
      newPassword: ""
    });
    setPasswordMessage(response.message);
    setPasswordError("");
    setVerificationDialog(null);
  };

  const handleVerificationResend = async ({ verificationId }) => {
    if (!verificationDialog) {
      return;
    }

    const response =
      verificationDialog.purpose === "profile"
        ? await resendAdminProfileUpdateCode({ verificationId })
        : await resendAdminPasswordCode({ verificationId });

    setVerificationDialog((currentValue) => ({
      ...currentValue,
      verificationId: response.verificationId,
      maskedEmail: response.maskedEmail,
      expiresAt: response.expiresAt
    }));
  };

  return (
    <>
      <main className="admin-profile-page">
        <section className="admin-profile-page__section">
          <div className="admin-profile-page__topbar">
            <button
              type="button"
              className="admin-profile-page__topbar-back"
              onClick={onBackClick}
              aria-label={content.backLabel}
            >
              <i className="far fa-arrow-left" aria-hidden="true"></i>
            </button>

            <h1>Settings</h1>
          </div>

          <header className="admin-profile-page__hero">
            <span className="admin-profile-page__eyebrow">Compte</span>
            <h2>Modifier les informations</h2>
            <p>
              Vous pouvez modifier le nom d&apos;utilisateur, l&apos;email et le mot de passe
              depuis cette page securisee.
            </p>
          </header>

          <div className="admin-profile-page__layout">
            <form
              className="admin-profile-page__card admin-profile-page__card--identity"
              onSubmit={handleProfileSubmit}
            >
              {profileError ? (
                <div className="admin-profile-page__notice admin-profile-page__notice--error">
                  {profileError}
                </div>
              ) : null}

              {profileMessage ? (
                <div className="admin-profile-page__notice">{profileMessage}</div>
              ) : null}

              <div className="admin-profile-page__field-row">
                <label htmlFor="admin-profile-username">Username</label>
                <input
                  id="admin-profile-username"
                  className="admin-profile-page__ghost-input"
                  type="text"
                  name="username"
                  value={profileForm.username}
                  onChange={updateProfileField}
                  placeholder={content.profileUsernameLabel}
                />
              </div>

              <div className="admin-profile-page__field-row">
                <label htmlFor="admin-profile-email">Email</label>
                <input
                  id="admin-profile-email"
                  className="admin-profile-page__ghost-input"
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={updateProfileField}
                  placeholder={content.profileEmailLabel}
                />
              </div>

              <div className="admin-profile-page__actions">
                <button
                  type="submit"
                  className="vehica-button admin-profile-page__submit admin-profile-page__submit--primary"
                  disabled={isProfileSubmitting}
                >
                  <span>
                    {isProfileSubmitting
                      ? content.profileSubmitPendingLabel || "Enregistrement en cours..."
                      : content.profileSubmitLabel}
                  </span>
                  <i className="far fa-angle-right" aria-hidden="true"></i>
                </button>
              </div>
            </form>

            <aside className="admin-profile-page__aside">
              <div className="admin-profile-page__aside-line"></div>
              <p className="admin-profile-page__aside-title">
                Securite et confidentialite de vos donnees.
              </p>
              <div className="admin-profile-page__aside-visual">
                <div className="admin-profile-page__aside-glow"></div>
                <div className="admin-profile-page__aside-grid"></div>
              </div>
            </aside>

            <form
              className="admin-profile-page__card admin-profile-page__card--password"
              onSubmit={handlePasswordSubmit}
            >
              <div className="admin-profile-page__password-head">
                <h3>{content.passwordSectionTitle}</h3>
                <p>{content.passwordSectionDescription}</p>
              </div>

              {passwordError ? (
                <div className="admin-profile-page__notice admin-profile-page__notice--error">
                  {passwordError}
                </div>
              ) : null}

              {passwordMessage ? (
                <div className="admin-profile-page__notice">{passwordMessage}</div>
              ) : null}

              <div className="admin-profile-page__password-grid">
                <div className="admin-profile-page__stack-field">
                  <label htmlFor="admin-profile-current-password">
                    Entrez le mot de passe actuelle
                  </label>
                  <input
                    id="admin-profile-current-password"
                    className="admin-profile-page__ghost-input"
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={updatePasswordField}
                    placeholder={content.currentPasswordPlaceholder}
                    autoComplete="current-password"
                  />
                </div>

                <div className="admin-profile-page__stack-field">
                  <label htmlFor="admin-profile-new-password">
                    Entrez le nouveau mot de passe
                  </label>
                  <input
                    id="admin-profile-new-password"
                    className="admin-profile-page__ghost-input"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={updatePasswordField}
                    placeholder={content.newPasswordPlaceholder}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="admin-profile-page__actions">
                <button
                  type="submit"
                  className="vehica-button admin-profile-page__submit admin-profile-page__submit--secondary"
                  disabled={isPasswordSubmitting}
                >
                  {isPasswordSubmitting
                    ? content.passwordSubmitPendingLabel || "Modification en cours..."
                    : content.passwordSubmitLabel}
                </button>
              </div>
            </form>
          </div>

          <div className="admin-profile-page__back-row">
            <button
              type="button"
              className="admin-profile-page__back-button"
              onClick={onBackClick}
            >
              {content.backLabel}
            </button>
          </div>
        </section>
      </main>

      {verificationDialog ? (
        <VerificationDialog
          content={content}
          dialog={verificationDialog}
          onConfirm={handleVerificationConfirm}
          onResend={handleVerificationResend}
          onClose={() => setVerificationDialog(null)}
        />
      ) : null}
    </>
  );
}

export default AdminProfile;
