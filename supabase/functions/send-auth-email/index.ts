import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { MagicLinkEmail } from './_templates/magic-link.tsx';
import { SignupConfirmationEmail } from './_templates/signup-confirmation.tsx';
import { PasswordResetEmail } from './_templates/password-reset.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    
    // Parse the JSON payload directly (no webhook verification)
    const data = JSON.parse(payload);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url }
    } = data as {
      user: {
        email: string;
        user_metadata?: any;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    let html: string;
    let subject: string;

    // Determine email type and render appropriate template
    switch (email_action_type) {
      case 'signup':
        html = await renderAsync(
          React.createElement(SignupConfirmationEmail, {
            confirmationUrl: `${site_url}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`,
            token,
            userEmail: user.email,
          })
        );
        subject = 'Welcome to Zamar - Confirm your email';
        break;
        
      case 'recovery':
        html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            resetUrl: `${site_url}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`,
            token,
            userEmail: user.email,
          })
        );
        subject = 'Reset your Zamar password';
        break;
        
      case 'magiclink':
      default:
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            loginUrl: `${site_url}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`,
            token,
            userEmail: user.email,
          })
        );
        subject = 'Your Zamar login link';
        break;
    }

    const { error } = await resend.emails.send({
      from: 'Zamar <hello@zamar.com>',
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);