"use server";

import { transporter } from "@/lib/nodemailer";

export async function sendEmail(
  brandName: string,
  name: string,
  email: string,
  body: string
) {
  const platform = brandName == "IRLS" ? "IRLS" : "STREETMINT";
  console.log("platform", platform);

  let fromEmail = "";
  let fromName = "";

  if (platform == "STREETMINT") {
    fromEmail = "hello@streetmint.xyz";
    fromName = "Street Mint";
  } else {
    fromEmail = "hello@irls.xyz";
    fromName = "IRLS";
  }

  try {
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: fromEmail,
      subject: `Query from Contact Us Form - ${brandName}`,
      text: `Name: ${name}\nEmail: ${email}\n\nBody: ${body}`,
    };

    const emailResponse = await transporter.sendMail(mailOptions);
    console.log("emailResponse", emailResponse);
    return { success: true, message: "Email sent successfully" };
  } catch (emailError) {
    console.error("Error sending email:", emailError);
    return {
      success: false,
      message: "An error occurred while sending the email",
    };
  }
}
