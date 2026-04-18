import { useMemo, useState } from "react";
import { loginAdmin } from "../services/adminAuthService";

function LoginProgress() {
  return (
    <svg
      width="120"
      height="30"
      viewBox="0 0 120 30"
      xmlns="http://www.w3.org/2000/svg"
      fill="#fff"
      aria-hidden="true"
    >
      <circle cx="15" cy="15" r="15">
        <animate
          attributeName="r"
          from="15"
          to="15"
          begin="0s"
          dur="0.8s"
          values="15;9;15"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="fill-opacity"
          from="1"
          to="1"
          begin="0s"
          dur="0.8s"
          values="1;.5;1"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>

      <circle cx="60" cy="15" r="9" fillOpacity="0.3">
        <animate
          attributeName="r"
          from="9"
          to="9"
          begin="0s"
          dur="0.8s"
          values="9;15;9"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="fill-opacity"
          from="0.5"
          to="0.5"
          begin="0s"
          dur="0.8s"
          values=".5;1;.5"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>

      <circle cx="105" cy="15" r="15">
        <animate
          attributeName="r"
          from="15"
          to="15"
          begin="0s"
          dur="0.8s"
          values="15;9;15"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="fill-opacity"
          from="1"
          to="1"
          begin="0s"
          dur="0.8s"
          values="1;.5;1"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function AdminLogin({ content, onLoginSuccess }) {
  const [formValues, setFormValues] = useState({
    login: "",
    password: "",
    remember: true
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const forgotPasswordHref = useMemo(() => {
    if (content.forgotPasswordUrl) {
      return content.forgotPasswordUrl;
    }

    const email = content.supportEmail || "lea@gmail.com";
    return "mailto:" + email + "?subject=Mot%20de%20passe%20oubli%C3%A9";
  }, [content.forgotPasswordUrl, content.supportEmail]);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await loginAdmin(formValues);
      onLoginSuccess(response.admin);
    } catch (error) {
      setErrorMessage(error.message || content.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-page__section">
        <div className="admin-login-page__container">
          <div className="vehica-panel-login-register admin-login-page__panel">
            <div className="vehica-login vehica-active">
              <div className="vehica-login__inner">
                <h2>{content.title}</h2>
                <h3>{content.description}</h3>

                <form onSubmit={handleSubmit}>
                  {errorMessage ? (
                    <div className="vehica-register-login-notice">{errorMessage}</div>
                  ) : null}

                  <div className="vehica-fields">
                    <div className="vehica-field">
                      <input
                        id="login"
                        name="login"
                        type="text"
                        placeholder={content.loginPlaceholder}
                        autoComplete="username"
                        value={formValues.login}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="vehica-field">
                      <input
                        id="vehica-login-password"
                        name="password"
                        type="password"
                        placeholder={content.passwordPlaceholder}
                        autoComplete="current-password"
                        value={formValues.password}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="vehica-login__below-fields">
                    <div className="vehica-login__remember">
                      <div className="vehica-checkbox">
                        <input
                          id="remember"
                          name="remember"
                          type="checkbox"
                          checked={formValues.remember}
                          onChange={handleChange}
                        />
                        <label htmlFor="remember">{content.rememberLabel}</label>
                      </div>
                    </div>

                    <div className="vehica-login__forgotten-password">
                      <a href={forgotPasswordHref}>{content.forgotPasswordLabel}</a>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={
                      "vehica-button vehica-button--login vehica-button--with-progress-animation" +
                      (isSubmitting
                        ? " vehica-button--with-progress-animation--active"
                        : "")
                    }
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <LoginProgress /> : null}
                    <span>{content.submitLabel}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
