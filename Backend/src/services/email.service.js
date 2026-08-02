const nodemailer = require("nodemailer");

/*
|--------------------------------------------------------------------------
| Email Service
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Transporter
|--------------------------------------------------------------------------
*/

// ==================================================
// Create Transporter
// ==================================================

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,

    port: Number(process.env.EMAIL_PORT),

    secure: process.env.EMAIL_SECURE === "true",

    auth: {
      user: process.env.EMAIL_USER,

      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/*
|--------------------------------------------------------------------------
| Shared Email Sender
|--------------------------------------------------------------------------
*/

// ==================================================
// Send Email
// ==================================================

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "LSA"}" <${
      process.env.EMAIL_FROM || process.env.EMAIL_USER
    }>`,
    to,
    subject,
    text,
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Shared Templates
|--------------------------------------------------------------------------
*/

// ==================================================
// Generate Verification Template
// ==================================================

const generateVerificationTemplate = ({
  title,
  fullName,
  description,
  verificationCode,
  expirationText,
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${title}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background-color: #f4f7fb;
            padding: 40px 16px;
          "
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 620px;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
                "
              >
                <tr>
                  <td
                    style="
                      background-color: #072b61;
                      padding: 32px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                      "
                    >
                      LSA
                    </h1>

                    <p
                      style="
                        margin: 10px 0 0;
                        color: rgba(255, 255, 255, 0.75);
                        font-size: 14px;
                      "
                    >
                      Secure Account Verification
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 40px 32px;
                    "
                  >
                    <h2
                      style="
                        margin: 0 0 20px;
                        color: #0f172a;
                        font-size: 24px;
                        font-weight: 700;
                      "
                    >
                      ${title}
                    </h2>

                    <p
                      style="
                        margin: 0 0 16px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      Hello ${fullName || "User"},
                    </p>

                    <p
                      style="
                        margin: 0 0 28px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      ${description}
                    </p>

                    <div
                      style="
                        margin: 0 auto 28px;
                        padding: 22px;
                        background-color: #f1f5f9;
                        border: 1px solid #dbe4ef;
                        border-radius: 12px;
                        text-align: center;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 10px;
                          color: #64748b;
                          font-size: 13px;
                          font-weight: 700;
                          text-transform: uppercase;
                          letter-spacing: 1.5px;
                        "
                      >
                        Verification Code
                      </p>

                      <p
                        style="
                          margin: 0;
                          color: #072b61;
                          font-size: 36px;
                          font-weight: 800;
                          letter-spacing: 10px;
                        "
                      >
                        ${verificationCode}
                      </p>
                    </div>

                    <p
                      style="
                        margin: 0 0 14px;
                        color: #475569;
                        font-size: 14px;
                        line-height: 1.7;
                      "
                    >
                      ${expirationText}
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #64748b;
                        font-size: 14px;
                        line-height: 1.7;
                      "
                    >
                      If you did not request this action, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 24px 32px;
                      background-color: #f8fafc;
                      border-top: 1px solid #e2e8f0;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #94a3b8;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      This is an automated message. Please do not reply to this email.
                    </p>

                    <p
                      style="
                        margin: 8px 0 0;
                        color: #64748b;
                        font-size: 12px;
                      "
                    >
                      © ${new Date().getFullYear()} LSA. All rights reserved.
                    </p>
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

// ==================================================
// Generate Equipment Request Template
// ==================================================

const generateEquipmentRequestTemplate = ({
  fullName,
  requestId,
  equipmentTitle,
  company,
  workLocation,
  estimatedRequiredDays,
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Equipment Request Received</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background-color: #f4f7fb;
            padding: 40px 16px;
          "
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 620px;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
                "
              >
                <tr>
                  <td
                    style="
                      background-color: #072b61;
                      padding: 32px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                      "
                    >
                      LSA
                    </h1>

                    <p
                      style="
                        margin: 10px 0 0;
                        color: rgba(255, 255, 255, 0.75);
                        font-size: 14px;
                      "
                    >
                      Equipment Request Confirmation
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 40px 32px;
                    "
                  >
                    <h2
                      style="
                        margin: 0 0 20px;
                        color: #0f172a;
                        font-size: 24px;
                        font-weight: 700;
                      "
                    >
                      Request Successfully Received
                    </h2>

                    <p
                      style="
                        margin: 0 0 16px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      Hello ${fullName || "Customer"},
                    </p>

                    <p
                      style="
                        margin: 0 0 24px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      Thank you for contacting LSA. We have successfully received your equipment request.
                      Our equipment team will review the submitted information and contact you shortly.
                    </p>

                    <div
                      style="
                        margin: 0 0 28px;
                        padding: 24px;
                        background-color: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 18px;
                          color: #0f172a;
                          font-size: 16px;
                          font-weight: 700;
                        "
                      >
                        Request Details
                      </p>

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        ${
                          requestId
                            ? `
                              <tr>
                                <td
                                  style="
                                    padding: 8px 0;
                                    color: #64748b;
                                    font-size: 14px;
                                  "
                                >
                                  Request ID
                                </td>

                                <td
                                  align="right"
                                  style="
                                    padding: 8px 0;
                                    color: #0f172a;
                                    font-size: 14px;
                                    font-weight: 700;
                                    word-break: break-all;
                                  "
                                >
                                  ${requestId}
                                </td>
                              </tr>
                            `
                            : ""
                        }

                        <tr>
                          <td
                            style="
                              padding: 8px 0;
                              color: #64748b;
                              font-size: 14px;
                            "
                          >
                            Equipment
                          </td>

                          <td
                            align="right"
                            style="
                              padding: 8px 0;
                              color: #0f172a;
                              font-size: 14px;
                              font-weight: 700;
                            "
                          >
                            ${equipmentTitle}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 8px 0;
                              color: #64748b;
                              font-size: 14px;
                            "
                          >
                            Company
                          </td>

                          <td
                            align="right"
                            style="
                              padding: 8px 0;
                              color: #0f172a;
                              font-size: 14px;
                              font-weight: 700;
                            "
                          >
                            ${company}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 8px 0;
                              color: #64748b;
                              font-size: 14px;
                            "
                          >
                            Work Location
                          </td>

                          <td
                            align="right"
                            style="
                              padding: 8px 0;
                              color: #0f172a;
                              font-size: 14px;
                              font-weight: 700;
                            "
                          >
                            ${workLocation}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 8px 0;
                              color: #64748b;
                              font-size: 14px;
                            "
                          >
                            Estimated Required Days
                          </td>

                          <td
                            align="right"
                            style="
                              padding: 8px 0;
                              color: #0f172a;
                              font-size: 14px;
                              font-weight: 700;
                            "
                          >
                            ${estimatedRequiredDays}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <p
                      style="
                        margin: 0 0 14px;
                        color: #475569;
                        font-size: 15px;
                        line-height: 1.7;
                      "
                    >
                      If additional information is required, our team will contact you using the email address or phone number provided in your request.
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #475569;
                        font-size: 15px;
                        line-height: 1.7;
                      "
                    >
                      Thank you for choosing LSA.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 24px 32px;
                      background-color: #f8fafc;
                      border-top: 1px solid #e2e8f0;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #94a3b8;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      This is an automated message. Please do not reply to this email.
                    </p>

                    <p
                      style="
                        margin: 8px 0 0;
                        color: #64748b;
                        font-size: 12px;
                      "
                    >
                      © ${new Date().getFullYear()} LSA. All rights reserved.
                    </p>
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

/*
|--------------------------------------------------------------------------
| Password Reset
|--------------------------------------------------------------------------
*/

// ==================================================
// Send Password Reset Email
// ==================================================

const sendPasswordResetEmail = async ({ to, firstName, resetUrl }) => {
  const subject = "Reset Your Password";

  const text = `
Hello ${firstName || "User"},

We received a request to reset your password.

Use the link below to reset your password:

${resetUrl}

This link expires in 15 minutes.

If you did not request this action, you can safely ignore this email.
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Reset Your Password</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background-color: #f4f7fb;
            padding: 40px 16px;
          "
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 620px;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
                "
              >
                <tr>
                  <td
                    style="
                      background-color: #072b61;
                      padding: 32px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 700;
                      "
                    >
                      LSA
                    </h1>

                    <p
                      style="
                        margin: 10px 0 0;
                        color: rgba(255, 255, 255, 0.75);
                        font-size: 14px;
                      "
                    >
                      Password Reset
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 40px 32px;
                    "
                  >
                    <h2
                      style="
                        margin: 0 0 20px;
                        color: #0f172a;
                        font-size: 24px;
                      "
                    >
                      Reset Your Password
                    </h2>

                    <p
                      style="
                        margin: 0 0 16px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      Hello ${firstName || "User"},
                    </p>

                    <p
                      style="
                        margin: 0 0 28px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      We received a request to reset your password. Click the button below to create a new password.
                    </p>

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">
                          <a
                            href="${resetUrl}"
                            style="
                              display: inline-block;
                              padding: 14px 28px;
                              background-color: #d97706;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 8px;
                              font-size: 15px;
                              font-weight: 700;
                            "
                          >
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 28px 0 12px;
                        color: #475569;
                        font-size: 14px;
                        line-height: 1.7;
                      "
                    >
                      This link expires in 15 minutes.
                    </p>

                    <p
                      style="
                        margin: 0 0 8px;
                        color: #64748b;
                        font-size: 13px;
                        line-height: 1.7;
                      "
                    >
                      If the button does not work, copy and paste this link into your browser:
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #2563eb;
                        font-size: 12px;
                        line-height: 1.7;
                        word-break: break-all;
                      "
                    >
                      ${resetUrl}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 24px 32px;
                      background-color: #f8fafc;
                      border-top: 1px solid #e2e8f0;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #94a3b8;
                        font-size: 12px;
                      "
                    >
                      This is an automated message. Please do not reply to this email.
                    </p>

                    <p
                      style="
                        margin: 8px 0 0;
                        color: #64748b;
                        font-size: 12px;
                      "
                    >
                      © ${new Date().getFullYear()} LSA. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Account Verification
|--------------------------------------------------------------------------
*/

// ==================================================
// Send Signup Verification Email
// ==================================================

const sendSignupVerificationEmail = async ({
  to,
  fullName,
  verificationCode,
}) => {
  const subject = "Verify Your LSA Account";

  const text = `
Hello ${fullName || "User"},

Your account verification code is:

${verificationCode}

This code will expire in 10 minutes.

If you did not create this account, please ignore this email.
  `.trim();

  const html = generateVerificationTemplate({
    title: "Verify Your Account",

    fullName,

    description:
      "Use the verification code below to confirm your email address and activate your account.",

    verificationCode,

    expirationText:
      "This verification code will expire in 10 minutes and can only be used once.",
  });

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

// ==================================================
// Send Password Change Verification Email
// ==================================================

const sendPasswordChangeVerificationEmail = async ({
  to,
  fullName,
  verificationCode,
}) => {
  const subject = "Confirm Your LSA Password Change";

  const text = `
Hello ${fullName || "User"},

Your password change verification code is:

${verificationCode}

This code will expire in 10 minutes.

If you did not request this password change, please secure your account immediately.
    `.trim();

  const html = generateVerificationTemplate({
    title: "Confirm Password Change",

    fullName,

    description:
      "We received a request to change your account password. Enter the verification code below to confirm this action.",

    verificationCode,

    expirationText:
      "This verification code will expire in 10 minutes. Do not share it with anyone.",
  });

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Account Activation
|--------------------------------------------------------------------------
*/

// ==================================================
// Send Account Activation Email
// ==================================================

const sendAccountActivationEmail = async ({ to, fullName, activationUrl }) => {
  const subject = "Activate Your LSA Account";

  const text = `
Hello ${fullName || "User"},

An administrator has created an LSA dashboard account for you.

Use the link below to activate your account and create your password:

${activationUrl}

This activation link will expire in 24 hours.

If you were not expecting this email, you can safely ignore it.
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Activate Your Account</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background-color: #f4f7fb;
            padding: 40px 16px;
          "
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 620px;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
                "
              >
                <tr>
                  <td
                    style="
                      background-color: #072b61;
                      padding: 32px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                      "
                    >
                      LSA
                    </h1>

                    <p
                      style="
                        margin: 10px 0 0;
                        color: rgba(255, 255, 255, 0.75);
                        font-size: 14px;
                      "
                    >
                      Account Activation
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 40px 32px;
                    "
                  >
                    <h2
                      style="
                        margin: 0 0 20px;
                        color: #0f172a;
                        font-size: 24px;
                        font-weight: 700;
                      "
                    >
                      Welcome to LSA
                    </h2>

                    <p
                      style="
                        margin: 0 0 16px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      Hello ${fullName || "User"},
                    </p>

                    <p
                      style="
                        margin: 0 0 28px;
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      An administrator has created an account for you on the LSA dashboard.
                      Click the button below to activate your account and create your password.
                    </p>

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">
                          <a
                            href="${activationUrl}"
                            style="
                              display: inline-block;
                              padding: 14px 28px;
                              background-color: #d97706;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 8px;
                              font-size: 15px;
                              font-weight: 700;
                            "
                          >
                            Activate Account
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 28px 0 12px;
                        color: #475569;
                        font-size: 14px;
                        line-height: 1.7;
                      "
                    >
                      This activation link will expire in 24 hours.
                    </p>

                    <p
                      style="
                        margin: 0 0 8px;
                        color: #64748b;
                        font-size: 13px;
                        line-height: 1.7;
                      "
                    >
                      If the button does not work, copy and paste this link into your browser:
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #2563eb;
                        font-size: 12px;
                        line-height: 1.7;
                        word-break: break-all;
                      "
                    >
                      ${activationUrl}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 24px 32px;
                      background-color: #f8fafc;
                      border-top: 1px solid #e2e8f0;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #94a3b8;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      This is an automated message. Please do not reply to this email.
                    </p>

                    <p
                      style="
                        margin: 8px 0 0;
                        color: #64748b;
                        font-size: 12px;
                      "
                    >
                      © ${new Date().getFullYear()} LSA. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Equipment Requests
|--------------------------------------------------------------------------
*/

// ==================================================
// Send Equipment Request Received Email
// ==================================================

const sendEquipmentRequestReceivedEmail = async ({
  to,
  fullName,
  requestId,
  equipmentTitle,
  company,
  workLocation,
  estimatedRequiredDays,
}) => {
  const subject = "Your Equipment Request Has Been Received";

  const text = `
Hello ${fullName || "Customer"},

Thank you for contacting LSA.

We have successfully received your equipment request.

Request ID:
${requestId || "Not available"}

Requested Equipment:
${equipmentTitle}

Company:
${company}

Work Location:
${workLocation}

Estimated Required Days:
${estimatedRequiredDays}

Our equipment team will review your request and contact you shortly.

Thank you for choosing LSA.
    `.trim();

  const html = generateEquipmentRequestTemplate({
    fullName,
    requestId,
    equipmentTitle,
    company,
    workLocation,
    estimatedRequiredDays,
  });

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

// ==================================================
// Send Equipment Request Status Email
// ==================================================

const sendEquipmentRequestStatusEmail = async ({
  to,
  fullName,
  equipmentTitle,
  status,
}) => {
  const statusConfig = {
    approved: {
      subject: "Your Equipment Request Has Been Approved",

      heading: "Request Approved",

      message: `
        We are pleased to inform you that your equipment request has been approved.
        Our team will contact you shortly to finalize the remaining arrangements.
      `,
    },

    rejected: {
      subject: "Update Regarding Your Equipment Request",

      heading: "Request Rejected",

      message: `
        Thank you for your interest in our equipment.
        Unfortunately, we are unable to approve your request at this time.
        If you need additional information, please contact our team.
      `,
    },

    completed: {
      subject: "Your Equipment Request Has Been Completed",

      heading: "Request Completed",

      message: `
        Your equipment request has been successfully completed.
        Thank you for choosing LSA. We look forward to serving you again.
      `,
    },
  };

  const emailData = statusConfig[status];

  if (!emailData) {
    return;
  }

  const text = `
Hello ${fullName},

${emailData.message}

Equipment:
${equipmentTitle}

Thank you,
LSA Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${emailData.heading}</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#f4f7fb;">
<tr>

<td align="center">

<table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 35px rgba(15,23,42,.08);">

<tr>

<td style="background:#072b61;padding:32px;text-align:center;">

<h1 style="margin:0;color:#ffffff;">
LSA
</h1>

<p style="margin-top:10px;color:rgba(255,255,255,.75);">
Equipment Request
</p>

</td>

</tr>

<tr>

<td style="padding:40px 32px;">

<h2 style="margin-top:0;color:#0f172a;">
${emailData.heading}
</h2>

<p>
Hello <strong>${fullName}</strong>,
</p>

<p>
${emailData.message}
</p>

<hr>

<p>
<strong>Equipment:</strong>
</p>

<p>
${equipmentTitle}
</p>

<hr>

<p>
Thank you for choosing <strong>LSA</strong>.
</p>

</td>

</tr>

<tr>

<td style="padding:24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">

<p style="margin:0;font-size:12px;color:#64748b;">
© ${new Date().getFullYear()} LSA. All rights reserved.
</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
  `;

  await sendEmail({
    to,
    subject: emailData.subject,
    text,
    html,
  });
};

// ==================================================
// Send Job Request Status Email
// ==================================================

const sendJobRequestStatusEmail = async ({
  to,
  fullName,
  jobTitle,
  status,
}) => {
  const statusConfig = {
    accepted: {
      subject: `Application Accepted - ${jobTitle}`,
      heading: "Congratulations!",
      message:
        "We are pleased to inform you that your job application has been accepted. Our Human Resources team will contact you shortly with the next steps.",
    },

    rejected: {
      subject: `Application Update - ${jobTitle}`,
      heading: "Application Update",
      message:
        "Thank you for your interest in joining LSA. After reviewing your application, we regret to inform you that you have not been selected for this opportunity.",
    },
  };

  const emailData = statusConfig[status];

  if (!emailData) {
    return;
  }

  const text = `
Hello ${fullName || "Applicant"},

${emailData.message}

Position:
${jobTitle}

Best regards,
LSA Human Resources Team
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>${emailData.heading}</title>
      </head>

      <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 16px;background-color:#f4f7fb;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 35px rgba(15,23,42,0.08);">
                <tr>
                  <td style="background-color:#072b61;padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
                      LSA
                    </h1>

                    <p style="margin:10px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">
                      Careers Application
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="margin:0 0 20px;color:#0f172a;font-size:24px;font-weight:700;">
                      ${emailData.heading}
                    </h2>

                    <p style="margin:0 0 16px;color:#475569;font-size:16px;line-height:1.7;">
                      Hello ${fullName || "Applicant"},
                    </p>

                    <p style="margin:0 0 24px;color:#475569;font-size:16px;line-height:1.7;">
                      ${emailData.message}
                    </p>

                    <div style="padding:22px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                      <p style="margin:0 0 10px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;">
                        Position
                      </p>

                      <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">
                        ${jobTitle}
                      </p>
                    </div>

                    <p style="margin:24px 0 0;color:#475569;font-size:15px;line-height:1.7;">
                      Best regards,<br />
                      <strong>LSA Human Resources Team</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;">
                      This is an automated message. Please do not reply.
                    </p>

                    <p style="margin:8px 0 0;color:#64748b;font-size:12px;">
                      © ${new Date().getFullYear()} LSA. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: emailData.subject,
    text,
    html,
  });
};

// ==================================================
// Send Job Request Received Email
// ==================================================

const sendJobRequestReceivedEmail = async ({
  to,
  fullName,
  jobTitle,
  requestId,
}) => {
  const subject =
    `Application Received - ${jobTitle}`;

  const text = `
Hello ${fullName || "Applicant"},

Thank you for applying for the position of ${jobTitle}.

We have successfully received your job application and CV.

Application ID:
${requestId}

Our Human Resources team will review your application. We will contact you if your qualifications match the position requirements.

Best regards,
LSA Human Resources Team
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Application Received</title>
      </head>

      <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 16px;background-color:#f4f7fb;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 35px rgba(15,23,42,0.08);">
                <tr>
                  <td style="background-color:#072b61;padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
                      LSA
                    </h1>

                    <p style="margin:10px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">
                      Careers Application
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="margin:0 0 20px;color:#0f172a;font-size:24px;font-weight:700;">
                      Application Successfully Received
                    </h2>

                    <p style="margin:0 0 16px;color:#475569;font-size:16px;line-height:1.7;">
                      Hello ${fullName || "Applicant"},
                    </p>

                    <p style="margin:0 0 24px;color:#475569;font-size:16px;line-height:1.7;">
                      Thank you for applying to LSA. We have successfully received your application and CV.
                    </p>

                    <div style="padding:22px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                      <p style="margin:0 0 12px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;">
                        Position
                      </p>

                      <p style="margin:0 0 20px;color:#0f172a;font-size:16px;font-weight:700;">
                        ${jobTitle}
                      </p>

                      <p style="margin:0 0 12px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;">
                        Application ID
                      </p>

                      <p style="margin:0;color:#0f172a;font-size:14px;font-weight:700;word-break:break-all;">
                        ${requestId}
                      </p>
                    </div>

                    <p style="margin:24px 0 0;color:#475569;font-size:15px;line-height:1.7;">
                      Our Human Resources team will review your application and contact you if your qualifications match the position requirements.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;">
                      This is an automated message. Please do not reply.
                    </p>

                    <p style="margin:8px 0 0;color:#64748b;font-size:12px;">
                      © ${new Date().getFullYear()} LSA. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

// ==================================================
// Send Contact Message Received Email
// ==================================================

const sendContactMessageReceivedEmail = async ({
  to,
  fullName,
  service,
  messageId,
}) => {
  const subject =
    "We Received Your Message";

  const text = `
Hello ${fullName || "Customer"},

Thank you for contacting LSA.

We have successfully received your inquiry and our team will review it as soon as possible.

Service:
${service}

Reference ID:
${messageId}

We appreciate your interest in our services and will get back to you shortly.

Best regards,
LSA Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>
<title>Message Received</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 16px;background:#f4f7fb;">

<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 35px rgba(15,23,42,.08);">

<tr>
<td style="background:#072b61;padding:32px;text-align:center;">

<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
LSA
</h1>

<p style="margin:10px 0 0;color:rgba(255,255,255,.75);font-size:14px;">
Engineering & Energy Solutions
</p>

</td>
</tr>

<tr>
<td style="padding:40px 32px;">

<h2 style="margin:0 0 20px;color:#0f172a;font-size:24px;">
Message Received Successfully
</h2>

<p style="margin:0 0 18px;color:#475569;font-size:16px;line-height:1.7;">
Hello <strong>${fullName || "Customer"}</strong>,
</p>

<p style="margin:0 0 20px;color:#475569;font-size:16px;line-height:1.7;">
Thank you for contacting LSA.
Your inquiry has been received successfully and one of our specialists will contact you as soon as possible.
</p>

<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:22px;">

<p style="margin:0 0 10px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;">
Selected Service
</p>

<p style="margin:0 0 20px;color:#0f172a;font-size:16px;font-weight:700;">
${service}
</p>

<p style="margin:0 0 10px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;">
Reference Number
</p>

<p style="margin:0;color:#0f172a;font-size:14px;font-weight:700;word-break:break-all;">
${messageId}
</p>

</div>

<p style="margin:24px 0 0;color:#475569;font-size:15px;line-height:1.7;">
We appreciate your interest in our services and look forward to assisting you.
</p>

</td>
</tr>

<tr>
<td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">

<p style="margin:0;color:#94a3b8;font-size:12px;">
This is an automated email. Please do not reply.
</p>

<p style="margin:8px 0 0;color:#64748b;font-size:12px;">
© ${new Date().getFullYear()} LSA. All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>

</html>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  sendEmail,

  sendPasswordResetEmail,

  sendSignupVerificationEmail,

  sendPasswordChangeVerificationEmail,

  sendAccountActivationEmail,

  sendEquipmentRequestReceivedEmail,

    sendEquipmentRequestStatusEmail,

    sendJobRequestReceivedEmail,

    sendJobRequestStatusEmail,

    sendContactMessageReceivedEmail

};
