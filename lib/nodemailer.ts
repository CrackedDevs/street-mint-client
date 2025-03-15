import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    // secure: true,
    auth: {
      user: "87ee20001@smtp-brevo.com",
      pass: "P59CsXIHxUS3wWQh",
    },
});