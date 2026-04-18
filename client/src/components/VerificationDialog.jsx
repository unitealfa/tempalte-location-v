import { useEffect, useState } from "react";

function getRemainingSeconds(expiresAt) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

function formatRemainingTime(remainingSeconds) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return minutes + ":" + String(seconds).padStart(2, "0");
}

function VerificationDialog({
  content,
  dialog,
  onConfirm,
  onResend,
  onClose
}) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    getRemainingSeconds(dialog.expiresAt)
  );

  useEffect(() => {
    setCode("");
    setErrorMessage("");
    setRemainingSeconds(getRemainingSeconds(dialog.expiresAt));
  }, [dialog.expiresAt, dialog.verificationId, dialog.purpose]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(dialog.expiresAt));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [dialog.expiresAt]);

  const handleConfirm = async (event) => {
    event.preventDefault();
    setIsConfirming(true);
    setErrorMessage("");

    try {
      await onConfirm({
        verificationId: dialog.verificationId,
        code
      });
    } catch (error) {
      setErrorMessage(error.message || "Confirmation impossible.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage("");

    try {
      await onResend({
        verificationId: dialog.verificationId
      });
    } catch (error) {
      setErrorMessage(error.message || "Renvoi impossible.");
    } finally {
      setIsResending(false);
    }
  };

  const resendDisabled = remainingSeconds > 0 || isResending;
  const isBusy = isConfirming || isResending;
  const handleRequestClose = () => {
    if (isBusy) {
      return;
    }

    onClose();
  };

  return (
    <div className="verification-overlay" onClick={handleRequestClose} role="presentation">
      <section
        className="verification-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={dialog.title}
      >
        <button
          type="button"
          className="verification-dialog__close"
          onClick={handleRequestClose}
          disabled={isBusy}
        >
          x
        </button>

        <p className="verification-dialog__eyebrow">{dialog.purposeLabel}</p>
        <h2>{dialog.title}</h2>
        <p className="verification-dialog__text">
          {content.verificationDescriptionPrefix}{" "}
          <strong>{dialog.maskedEmail}</strong>
        </p>

        <form className="verification-dialog__form" onSubmit={handleConfirm}>
          <label className="login-form__field">
            <span>{content.verificationCodeLabel}</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={content.verificationCodePlaceholder}
            />
          </label>

          {errorMessage ? (
            <p className="login-form__message login-form__message--error">
              {errorMessage}
            </p>
          ) : null}

          <p className="verification-dialog__timer">
            {remainingSeconds > 0
              ? "Expiration dans " + formatRemainingTime(remainingSeconds)
              : content.verificationExpiredLabel}
          </p>

          <div className="verification-dialog__actions">
            <button
              type="submit"
              className="login-form__submit"
              disabled={isBusy}
            >
              {isConfirming
                ? content.verificationConfirmPendingLabel || "Confirmation en cours..."
                : content.verificationConfirmLabel}
            </button>

            <button
              type="button"
              className="verification-dialog__secondary"
              onClick={handleResend}
              disabled={resendDisabled || isConfirming}
            >
              {isResending
                ? content.verificationResendPendingLabel || "Renvoi en cours..."
                : content.verificationResendLabel}
            </button>

            <button
              type="button"
              className="login-card__back"
              onClick={handleRequestClose}
              disabled={isBusy}
            >
              {isBusy
                ? content.verificationCancelPendingLabel || "Operation en cours..."
                : content.verificationCancelLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default VerificationDialog;
