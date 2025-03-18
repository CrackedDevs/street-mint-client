import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_USER_PASS
    },
    logger: true, // Logs all SMTP communication
    debug: true   // Enables detailed debugging
});