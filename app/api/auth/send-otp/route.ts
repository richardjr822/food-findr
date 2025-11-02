import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { storeOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Generate and store OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await storeOtp(email, code);

    // Send OTP email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"FoodFindr" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your FoodFindr Confirmation Code",
      text: `Your confirmation code is: ${code}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 32px;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; background: linear-gradient(135deg,#d1fae5,#fff); border-radius: 16px; padding: 16px;">
                <img src="https://img.icons8.com/color/48/000000/meal.png" alt="FoodFindr" width="40" height="40" />
              </span>
            </div>
            <h2 style="color: #065f46; text-align: center; margin-bottom: 8px;">Confirm your email</h2>
            <p style="color: #374151; text-align: center; margin-bottom: 24px;">
              Use the code below to verify your email address for <b>FoodFindr</b>:
            </p>
            <div style="font-size: 2rem; letter-spacing: 0.3em; color: #059669; background: #f0fdf4; border-radius: 8px; text-align: center; padding: 16px 0; font-weight: bold; margin-bottom: 24px;">
              ${code}
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 0.95rem;">
              This code will expire in 10 minutes.<br>
              If you did not request this, you can safely ignore this email.
            </p>
            <div style="margin-top: 32px; text-align: center;">
              <span style="color: #065f46; font-weight: bold;">FoodFindr</span>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send code." }, { status: 500 });
  }
}