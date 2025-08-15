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

interface SignupConfirmationEmailProps {
  confirmationUrl: string;
  token: string;
  userEmail: string;
}

export const SignupConfirmationEmail = ({
  confirmationUrl,
  token,
  userEmail,
}: SignupConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Zamar - Confirm your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Heading style={logo}>Zamar</Heading>
        </Section>
        
        <Heading style={h1}>Welcome to Zamar! 🎵</Heading>
        
        <Text style={text}>
          Thank you for joining Zamar, your platform for Christian music and inspiration. 
          To complete your registration, please confirm your email address by clicking the button below.
        </Text>
        
        <Section style={buttonSection}>
          <Link href={confirmationUrl} style={button}>
            Confirm Email Address
          </Link>
        </Section>
        
        <Text style={text}>
          Once confirmed, you'll be able to:
        </Text>
        
        <Section style={listSection}>
          <Text style={listItem}>• Discover and listen to inspiring Christian music</Text>
          <Text style={listItem}>• Create and share your own playlists</Text>
          <Text style={listItem}>• Connect with a community of believers</Text>
          <Text style={listItem}>• Request custom songs for special occasions</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Text style={{ ...text, fontSize: '14px', color: '#666' }}>
          Or copy and paste this confirmation code if the button doesn't work:
        </Text>
        <code style={code}>{token}</code>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          If you didn't create an account with Zamar, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          This email was sent to {userEmail}. If you have any questions, 
          feel free to <Link href="mailto:hello@zamar.com" style={link}>contact us</Link>.
        </Text>
        
        <Text style={brandFooter}>
          Blessings,<br />
          — The Zamar Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SignupConfirmationEmail;

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

const listSection = {
  margin: '0 24px',
};

const listItem = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
};

const buttonSection = {
  padding: '24px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
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