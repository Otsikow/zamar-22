import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name?: string;
  email: string;
  subject?: string;
  emailBody: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, emailBody }: ContactEmailRequest = await req.json();

    const brand = "Zamar";
    // Capture basic request context for admin visibility
    const userAgent = req.headers.get("user-agent") ?? "Unknown";
    const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "Unknown";

    // Send confirmation to sender
    const confirmation = await resend.emails.send({
      from: `${brand} <onboarding@resend.dev>`,
      to: [email],
      subject: subject && subject.trim().length > 0 ? `${brand}: ${subject}` : `${brand}: We received your message!`,
      html: `
        <h2>Thank you${name ? ", " + name : ""}!</h2>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <hr />
        <p><strong>Your message:</strong></p>
        <p>${emailBody.replace(/\n/g, '<br/>')}</p>
        <p style="margin-top:16px">Blessings,<br/>The ${brand} Team</p>
      `,
    });

    // Notify internal admin if configured
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (adminEmail) {
      await resend.emails.send({
        from: `${brand} <onboarding@resend.dev>`,
        to: [adminEmail],
        reply_to: [email],
        subject: `New contact form: ${subject ?? "No subject"}`,
        html: `
          <h3>New contact submission</h3>
          <p><strong>Name:</strong> ${name ?? "Unknown"}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject ?? "(none)"}</p>
          <p><strong>Source:</strong> ${origin}</p>
          <p><strong>User-Agent:</strong> ${userAgent}</p>
          <p><strong>Received At:</strong> ${new Date().toISOString()}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${emailBody.replace(/\n/g, '<br/>')}</p>
          <hr />
          <p>
            <a href="mailto:${email}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111;color:#fff;text-decoration:none;margin-right:8px">Reply via Email</a>
            <a href="/admin" style="display:inline-block;padding:10px 14px;border-radius:8px;border:1px solid #ddd;text-decoration:none">Respond in Live Chat</a>
          </p>
        `,
      });
    }

    return new Response(JSON.stringify({ ok: true, confirmation }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in contact-submit:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
