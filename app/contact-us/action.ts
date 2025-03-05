"use server";

import nodemailer from "nodemailer";

export async function sendEmail(
  brandName: string,
  name: string,
  email: string,
  body: string
) {
  const platform = brandName == "IRLS" ? "IRLS" : "STREETMINT";

  let fromEmail = "";
  let fromName = "";
  let app_password = "";

  if (platform == "STREETMINT") {
    fromEmail = "hello@streetmint.xyz";
    fromName = "Street Mint";
    app_password = process.env.STREETMINT_NODEMAILER_APP_PASSWORD!;
  } else {
    fromEmail = "hello@irls.xyz";
    fromName = "IRLS";
    app_password = process.env.IRLS_NODEMAILER_APP_PASSWORD!;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: fromEmail,
        pass: app_password,
      },
    });

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: fromEmail,
      subject: `Query from Contact Us Form - ${brandName}`,
      text: `Name: ${name}\nEmail: ${email}\n\nBody: ${body}`,
    };

    transporter.sendMail(mailOptions, function (error: any, info: any) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    return { success: true, message: "Email sent successfully" };
  } catch (emailError) {
    console.error("Error sending email:", emailError);
    return {
      success: false,
      message: "An error occurred while sending the email",
    };
  }
}
