import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendNotificationEmail(toName: string, toEmail: string, subject: string, htmlContent: string) {
  console.log("SENDING EMAIL WITH ARGS:", { toName, toEmail, subject });
  try {
    const info = await transporter.sendMail({
      from: `"Doctorify" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          ${htmlContent}
        </div>
      `,
    });
    
    console.log("Email sent successfully:", info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
