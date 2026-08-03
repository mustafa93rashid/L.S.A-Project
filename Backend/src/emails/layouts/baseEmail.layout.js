const EMAIL_THEME = require("../config/emailTheme");

// ==================== Escape HTML ====================

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ==================== Base Email Layout ====================

const createBaseEmailLayout = ({
  title,
  eyebrow = "LSA Notification",
  preheader = "",
  content,
  footerText = "This is an automated message. Please do not reply to this email.",
}) => {
  const {
    colors,
    typography,
    company,
  } = EMAIL_THEME;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <meta
          name="x-apple-disable-message-reformatting"
        />

        <title>${escapeHtml(title)}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: ${colors.background};
          font-family: ${typography.fontFamily};
          -webkit-font-smoothing: antialiased;
        "
      >
        <div
          style="
            display: none;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            color: transparent;
          "
        >
          ${escapeHtml(preheader)}
        </div>

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width: 100%;
            background-color: ${colors.background};
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding: 40px 16px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width: 100%;
                  max-width: 640px;
                "
              >
                <tr>
                  <td
                    style="
                      overflow: hidden;
                      background-color: ${colors.surface};
                      border: 1px solid ${colors.border};
                      border-radius: 20px;
                      box-shadow: 0 18px 45px rgba(18, 41, 104, 0.10);
                    "
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            padding: 34px 30px;
                            background-color: ${colors.primary};
                            border-bottom: 4px solid ${colors.secondary};
                          "
                        >
                          ${
                            company.logo?.url
                              ? `
                                <img
                                  src="${escapeHtml(company.logo.url)}"
                                  alt="${escapeHtml(company.logo.alt || company.name)}"
                                  width="${Number(company.logo.width) || 170}"
                                  style="
                                    display: block;
                                    margin: 0 auto 18px;
                                    max-width: 100%;
                                    height: auto;
                                    border: 0;
                                  "
                                />
                              `
                              : ""
                          }

                          <p
                            style="
                              margin: 0 0 8px;
                              color: rgba(255, 255, 255, 0.72);
                              font-size: 11px;
                              font-weight: 700;
                              letter-spacing: 2px;
                              text-transform: uppercase;
                            "
                          >
                            ${escapeHtml(eyebrow)}
                          </p>

                          <h1
                            style="
                              margin: 0;
                              color: ${colors.white};
                              font-size: 28px;
                              line-height: 1.2;
                              font-weight: 800;
                            "
                          >
                            ${escapeHtml(company.name)}
                          </h1>

                          <p
                            style="
                              margin: 8px 0 0;
                              color: rgba(255, 255, 255, 0.82);
                              font-size: 14px;
                              line-height: 1.6;
                            "
                          >
                            ${escapeHtml(company.tagline)}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding: 42px 40px;
                          "
                        >
                          ${content}
                        </td>
                      </tr>

                      <tr>
                        <td
                          align="center"
                          style="
                            padding: 24px 32px;
                            background-color: ${colors.softSurface};
                            border-top: 1px solid ${colors.border};
                          "
                        >
                          <p
                            style="
                              margin: 0;
                              color: ${colors.muted};
                              font-size: 12px;
                              line-height: 1.7;
                            "
                          >
                            ${escapeHtml(footerText)}
                          </p>

                          <p
                            style="
                              margin: 8px 0 0;
                              color: ${colors.text};
                              font-size: 12px;
                              line-height: 1.6;
                            "
                          >
                            © ${new Date().getFullYear()} ${escapeHtml(company.name)}. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

// ==================== Email Heading ====================

const createEmailHeading = ({
  eyebrow,
  title,
  description,
}) => {
  const { colors } = EMAIL_THEME;

  return `
    ${
      eyebrow
        ? `
          <p
            style="
              margin: 0 0 12px;
              color: ${colors.secondary};
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 1.8px;
              text-transform: uppercase;
            "
          >
            ${escapeHtml(eyebrow)}
          </p>
        `
        : ""
    }

    <h2
      style="
        margin: 0 0 18px;
        color: ${colors.heading};
        font-size: 28px;
        line-height: 1.3;
        font-weight: 800;
      "
    >
      ${escapeHtml(title)}
    </h2>

    ${
      description
        ? `
          <p
            style="
              margin: 0 0 28px;
              color: ${colors.text};
              font-size: 16px;
              line-height: 1.8;
            "
          >
            ${description}
          </p>
        `
        : ""
    }
  `;
};

// ==================== Email Button ====================

const createEmailButton = ({
  label,
  url,
}) => {
  const { colors } = EMAIL_THEME;

  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 28px 0;
      "
    >
      <tr>
        <td align="center">
          <a
            href="${escapeHtml(url)}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-block;
              padding: 15px 30px;
              color: ${colors.white};
              background-color: ${colors.secondary};
              border-radius: 999px;
              text-decoration: none;
              font-size: 15px;
              font-weight: 800;
              line-height: 1;
            "
          >
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
};

// ==================== Information Card ====================

const createInformationCard = ({
  title = "Details",
  rows = [],
}) => {
  const { colors } = EMAIL_THEME;

  const visibleRows = rows.filter(
    (row) =>
      row &&
      row.label &&
      row.value !== undefined &&
      row.value !== null &&
      row.value !== "",
  );

  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 26px 0;
        background-color: ${colors.softSurface};
        border: 1px solid ${colors.border};
        border-radius: 14px;
      "
    >
      <tr>
        <td
          style="
            padding: 22px 24px;
          "
        >
          <p
            style="
              margin: 0 0 16px;
              color: ${colors.primary};
              font-size: 15px;
              font-weight: 800;
            "
          >
            ${escapeHtml(title)}
          </p>

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            ${visibleRows
              .map(
                (row, index) => `
                  <tr>
                    <td
                      valign="top"
                      style="
                        width: 42%;
                        padding: 11px 0;
                        color: ${colors.muted};
                        border-top: ${
                          index === 0
                            ? "none"
                            : `1px solid ${colors.lightBorder}`
                        };
                        font-size: 13px;
                        line-height: 1.5;
                      "
                    >
                      ${escapeHtml(row.label)}
                    </td>

                    <td
                      align="right"
                      valign="top"
                      style="
                        padding: 11px 0;
                        color: ${colors.heading};
                        border-top: ${
                          index === 0
                            ? "none"
                            : `1px solid ${colors.lightBorder}`
                        };
                        font-size: 14px;
                        line-height: 1.5;
                        font-weight: 700;
                        word-break: break-word;
                      "
                    >
                      ${escapeHtml(row.value)}
                    </td>
                  </tr>
                `,
              )
              .join("")}
          </table>
        </td>
      </tr>
    </table>
  `;
};

// ==================== Verification Code Card ====================

const createVerificationCodeCard = ({
  verificationCode,
}) => {
  const { colors } = EMAIL_THEME;

  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 28px 0;
        background-color: ${colors.softSurface};
        border: 1px solid ${colors.border};
        border-radius: 14px;
      "
    >
      <tr>
        <td
          align="center"
          style="
            padding: 26px 20px;
          "
        >
          <p
            style="
              margin: 0 0 12px;
              color: ${colors.muted};
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.8px;
              text-transform: uppercase;
            "
          >
            Verification Code
          </p>

          <p
            style="
              margin: 0;
              color: ${colors.primary};
              font-size: 38px;
              line-height: 1.2;
              font-weight: 900;
              letter-spacing: 10px;
            "
          >
            ${escapeHtml(verificationCode)}
          </p>
        </td>
      </tr>
    </table>
  `;
};

// ==================== Exports ====================

module.exports = {
  createBaseEmailLayout,
  createEmailHeading,
  createEmailButton,
  createInformationCard,
  createVerificationCodeCard,
};