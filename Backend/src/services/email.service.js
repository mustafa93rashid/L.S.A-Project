const nodemailer = require("nodemailer");

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

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "LSA"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>${title}</title>
      </head>

      <body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7fb; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);">
                <tr>
                  <td style="background-color: #072b61; padding: 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">
                      LSA
                    </h1>

                    <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.75); font-size: 14px;">
                      Secure Account Verification
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 32px;">
                    <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 700;">
                      ${title}
                    </h2>

                    <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.7;">
                      Hello ${fullName || "User"},
                    </p>

                    <p style="margin: 0 0 28px; color: #475569; font-size: 16px; line-height: 1.7;">
                      ${description}
                    </p>

                    <div style="margin: 0 auto 28px; padding: 22px; background-color: #f1f5f9; border: 1px solid #dbe4ef; border-radius: 12px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                        Verification Code
                      </p>

                      <p style="margin: 0; color: #072b61; font-size: 36px; font-weight: 800; letter-spacing: 10px;">
                        ${verificationCode}
                      </p>
                    </div>

                    <p style="margin: 0 0 14px; color: #475569; font-size: 14px; line-height: 1.7;">
                      ${expirationText}
                    </p>

                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7;">
                      If you did not request this action, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                      This is an automated message. Please do not reply to this email.
                    </p>

                    <p style="margin: 8px 0 0; color: #64748b; font-size: 12px;">
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

// Send password reset email
const sendPasswordResetEmail = async ({
  to,
  firstName,
  resetUrl,
}) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Reset Your Password",
    html: `
      <div>
        <h2>Password Reset Request</h2>

        <p>Hello ${firstName || "User"},</p>

        <p>
          We received a request to reset your password.
        </p>

        <a href="${resetUrl}">
          Reset Password
        </a>

        <p>This link expires in 15 minutes.</p>
      </div>
    `,
  });
};

// Send signup verification email
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

// Send password change verification email
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

module.exports = {
  sendPasswordResetEmail,
  sendSignupVerificationEmail,
  sendPasswordChangeVerificationEmail,
};