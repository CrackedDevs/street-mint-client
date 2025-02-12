"use server";

import { Resend } from "resend";

export async function sendEmail(name: string, email: string, body: string) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const { data, error } = await resend.emails.send({
        from: "Daryl <daryl@mail.irls.xyz>",
        to: "Daryl <daryl@mail.irls.xyz>",
        subject: "Query from Contact Us Form",
        text: `Name: ${name}\nEmail: ${email}\n\nBody: ${body}`,
      })
  
      if (error) {
        console.log(error)
        return { success: false, message: "Failed to send email" }
      }
      return { success: true, message: "Email sent successfully" }
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      return { success: false, message: "An error occurred while sending the email" }
    }
  }