import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PasswordResetEmailProps {
  resetUrl: string;
  token: string;
  userEmail: string;
}

export const PasswordResetEmail = ({
  resetUrl,
  token,
  userEmail,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Zamar password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Heading style={logo}>Zamar</Heading>
        </Section>
        
        <Heading style={h1}>Reset your password</Heading>
        
        <Text style={text}>
          We received a request to reset the password for your Zamar account. 
          If you made this request, click the button below to create a new password.
        </Text>
        
        <Section style={buttonSection}>
          <Link href={resetUrl} style={button}>
            Reset Password
          </Link>
        </Section>
        
        <Text style={{ ...text, fontWeight: '600' }}>
          This link will expire in 1 hour for security reasons.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={{ ...text, fontSize: '14px', color: '#666' }}>
          Or copy and paste this reset code if the button doesn't work:
        </Text>
        <code style={code}>{token}</code>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email. 
          Your password will remain unchanged.
        </Text>
        
        <Text style={footer}>
          For security, this request came from your account: {userEmail}. 
          If you have any concerns, please <Link href="mailto:hello@zamar.com" style={link}>contact us</Link> immediately.
        </Text>
        
        <Text style={brandFooter}>
          Stay secure,<br />
          — The Zamar Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '560px',
};

const logoSection = {
  padding: '24px 24px 0',
  textAlign: 'center' as const,
};

const logo = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 24px 16px',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 24px',
};

const buttonSection = {
  padding: '24px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  lineHeight: '100%',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 24px',
};

const code = {
  display: 'inline-block',
  padding: '16px',
  width: 'calc(100% - 48px)',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  color: '#374151',
  fontSize: '14px',
  fontFamily: 'monospace',
  margin: '0 24px',
  textAlign: 'center' as const,
  letterSpacing: '2px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 24px',
};

const brandFooter = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '24px 24px 16px',
  lineHeight: '20px',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};