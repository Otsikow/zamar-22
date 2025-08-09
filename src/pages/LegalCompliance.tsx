import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const LegalCompliance = () => {
  useEffect(() => {
    // SEO
    document.title = "Zamar Legal & Compliance | Terms, Privacy, Cookies";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Zamar Legal & Compliance: Terms of Service, Privacy Policy, Community Guidelines, and Cookie Policy.";
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute("content", "Zamar Legal & Compliance: Terms of Service, Privacy Policy, Community Guidelines, and Cookie Policy.");
    }
    const canonicalId = "legal-canonical";
    let canonical = document.querySelector(`link[rel="canonical"]#${canonicalId}`) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.id = canonicalId;
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/legal";
  }, []);
  return <div className="dark">
      <div id="top" className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Zamar Legal &amp; Compliance</h1>
          <p className="text-sm text-muted-foreground">Last Updated: 9 August 2025</p>
      </header>

      <nav aria-label="Table of contents" className="bg-card border border-border rounded-xl p-4 mb-8">
        <h2 className="text-xl font-semibold mb-3">Table of Contents</h2>
        <ul className="list-disc list-inside space-y-2 text-foreground/90">
          <li>
            <a href="#terms" className="text-primary hover:underline">Terms of Service</a>
            <span className="ml-1 text-muted-foreground">– The rules for using Zamar</span>
          </li>
          <li>
            <a href="#privacy" className="text-primary hover:underline">Privacy Policy</a>
            <span className="ml-1 text-muted-foreground">– How we collect and protect your data</span>
          </li>
          <li>
            <a href="#guidelines" className="text-primary hover:underline">Community Guidelines</a>
            <span className="ml-1 text-muted-foreground">– Keeping Zamar safe and respectful</span>
          </li>
          <li>
            <a href="#cookies" className="text-primary hover:underline">Cookie Policy</a>
            <span className="ml-1 text-muted-foreground">– How we use cookies and tracking tools</span>
          </li>
          <li>
            <a href="#contact" className="text-primary hover:underline">Contact Information</a>
          </li>
        </ul>
      </nav>

      <main>
        {/* Accordion Sections */}
        <section id="terms" className="mb-6">
          <Accordion type="multiple">
            <AccordionItem value="terms">
              <AccordionTrigger className="text-primary font-semibold">Terms of Service – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Introduction</h3>
                  <p>Welcome to Zamar (“Zamar,” “we,” “us,” “our”). These Terms of Service (“Terms”) govern your access to and use of the Zamar platform, including our website, mobile applications, streaming, download services, and any related features (collectively, the “Service”). By using the Service, you agree to be bound by these Terms, our Privacy Policy, Community Guidelines, and Cookie Policy (together, the “Agreements”). If you do not agree, you must not use the Service.</p>
                  <p className="text-muted-foreground">Effective Date: 9 August 2025</p>

                  <h3 className="text-lg font-semibold text-primary">2. User Roles and Eligibility</h3>
                  <ol>
                    <li><b>Roles.</b> Zamar provides the following user roles with different feature sets:
                      <ul className="list-disc ml-5 mt-2">
                        <li><b>Guest:</b> Limited access to browse and stream (with ads).</li>
                        <li><b>Free Listener:</b> Registered account with streaming and ads.</li>
                        <li><b>Supporter:</b> Paid account with ad‑free streaming, downloads, playlists, and other benefits.</li>
                        <li><b>Admin:</b> Internal role for content and platform management.</li>
                      </ul>
                    </li>
                    <li className="mt-2"><b>Age Restrictions.</b> You must be at least 13 years old (or the age of digital consent in your jurisdiction). Users under 18 must have parental/guardian consent. We comply with COPPA (US) and similar laws.</li>
                    <li className="mt-2"><b>Geographic Restrictions.</b> Certain content or features may be unavailable or restricted in specific territories due to licensing or legal constraints. We may implement geo‑blocking as required.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">3. Account Registration and Security</h3>
                  <ol>
                    <li>You must provide accurate, complete, and up‑to‑date information during registration and keep it current.</li>
                    <li>You are responsible for safeguarding your credentials and for all activities under your account.</li>
                    <li>Notify us immediately of any unauthorized use or suspected breach. Zamar is not liable for losses resulting from compromised credentials.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">4. Permitted and Prohibited Use</h3>
                  <ol>
                    <li><b>Permitted Use.</b> The Service is provided for personal, non‑commercial use unless expressly authorized by Zamar in writing.</li>
                    <li><b>Prohibited Conduct.</b> You must not:
                      <ul className="list-disc ml-5 mt-2">
                        <li>Copy, record, capture, redistribute, or publicly perform content without authorization.</li>
                        <li>Circumvent DRM, access controls, or technical protection measures.</li>
                        <li>Upload malicious code, spam, automated scripts, or engage in fraudulent activities.</li>
                        <li>Infringe third‑party rights, including copyright, trademark, or privacy rights.</li>
                        <li>Interfere with Service operation, metrics, or analytics (e.g., play‑count manipulation).</li>
                      </ul>
                    </li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">5. Intellectual Property</h3>
                  <ol>
                    <li><b>Ownership.</b> The Service, including songs, recordings, lyrics, translations, artwork, UI, and software, is owned by Zamar or its licensors and is protected by intellectual property laws.</li>
                    <li><b>User Submissions.</b> By submitting any content (including testimonies, playlists, feedback, or Supporter song suggestions), you grant Zamar a perpetual, irrevocable, worldwide, royalty‑free, sublicensable license to use, adapt, reproduce, distribute, publicly perform, display, and create derivative works from such content in any media now known or later developed.</li>
                    <li><b>Representations.</b> You represent and warrant you have all rights necessary to grant the foregoing license and that your submissions do not infringe any third‑party rights.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">6. Payments, Subscriptions, and Refunds</h3>
                  <ol>
                    <li><b>Payments.</b> Payments are processed by secure third‑party providers (e.g., Stripe). Zamar does not store full card details.</li>
                    <li><b>Renewals.</b> Supporter subscriptions auto‑renew unless canceled at least 24 hours before the end of the billing cycle.</li>
                    <li><b>Refunds.</b> Except where required by law, digital content purchases are non‑refundable once access is granted. Local consumer rights remain unaffected.</li>
                    <li><b>Taxes.</b> Prices may include or exclude applicable taxes. We may collect VAT/GST or sales taxes as required by law.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">7. Content Availability and Quality</h3>
                  <p>Content availability, playback quality, and features may vary by device, network, and location. We may modify or remove content without notice due to legal, licensing, or operational reasons.</p>

                  <h3 className="text-lg font-semibold text-primary">8. Advertisements</h3>
                  <p>Guests and Free Listeners may be served advertisements (audio, visual, or banners). Supporters enjoy ad‑free streaming but may still see platform notices or non‑third‑party promotions.</p>

                  <h3 className="text-lg font-semibold text-primary">9. User‑Generated Content and Moderation</h3>
                  <p>UGC must comply with the Community Guidelines. We may remove, edit, or refuse content at our sole discretion. Users are solely responsible for their submitted content.</p>

                  <h3 className="text-lg font-semibold text-primary">10. Privacy and Data Protection</h3>
                  <p>Your use of the Service is subject to our Privacy Policy, which explains how we collect, use, and protect personal data under GDPR, CCPA/CPRA, and other laws.</p>

                  <h3 className="text-lg font-semibold text-primary">11. Third‑Party Services</h3>
                  <p>The Service may integrate third‑party features (e.g., payments, analytics). Zamar is not responsible for third‑party terms or practices; your use of those services is at your discretion.</p>

                  <h3 className="text-lg font-semibold text-primary">12. Termination and Suspension</h3>
                  <ol>
                    <li>We may suspend or terminate access for violations of the Agreements, illegal activity, or to protect users and the Service.</li>
                    <li>You may terminate your account at any time via settings or by contacting support.</li>
                    <li>Upon termination, licenses granted by you to Zamar survive to the extent necessary for lawful operation and archival purposes.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">13. Disclaimers</h3>
                  <p>The Service is provided “AS IS” and “AS AVAILABLE” without warranties, express or implied, including merchantability, fitness for a particular purpose, or non‑infringement. We do not warrant uninterrupted or error‑free operation.</p>

                  <h3 className="text-lg font-semibold text-primary">14. Limitation of Liability</h3>
                  <p>To the maximum extent permitted by law, Zamar is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, data, or goodwill. Our aggregate liability for all claims in any 12‑month period shall not exceed the amount you paid to Zamar in that period.</p>

                  <h3 className="text-lg font-semibold text-primary">15. Indemnification</h3>
                  <p>You agree to defend, indemnify, and hold harmless Zamar and its affiliates from any claims or liabilities arising from your use of the Service, your submissions, or your breach of the Agreements.</p>

                  <h3 className="text-lg font-semibold text-primary">16. Governing Law and Dispute Resolution</h3>
                  <p>These Terms are governed by the laws of England and Wales. Unless prohibited by local law, disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales, or handled via binding arbitration if specified in a separate arbitration notice provided by Zamar.</p>

                  <h3 className="text-lg font-semibold text-primary">17. Changes to the Terms</h3>
                  <p>We may update these Terms from time to time. Material changes will be posted with a new effective date. Continued use after changes constitutes acceptance.</p>

                  <h3 className="text-lg font-semibold text-primary">18. Contact</h3>
                  <p><b>Zamar Legal Department</b><br />
                    Email: <a className="text-primary hover:underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a><br />
                    Address: Seaview Business Centre, TS10 1AZ, England
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="privacy" className="mb-6">
          <Accordion type="multiple">
            <AccordionItem value="privacy">
              <AccordionTrigger className="text-primary font-semibold">Privacy Policy – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Introduction</h3>
                  <p>Zamar (“we,” “us,” “our”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and safeguard personal data when you use our Service. We comply with applicable data protection laws, including the EU/UK General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA) as amended by CPRA, Brazil’s LGPD, South Africa’s POPIA, and other local laws as applicable.</p>
                  <p className="text-muted-foreground">Effective Date: 9 August 2025</p>

                  <h3 className="text-lg font-semibold text-primary">2. Data We Collect</h3>
                  <ol>
                    <li><b>Information You Provide:</b> name, email, password, country, preferred language; payment and billing details (processed by third‑party providers such as Stripe); user content (testimonies, playlists, song suggestions, donations).</li>
                    <li><b>Information Collected Automatically:</b> IP address, device identifiers, browser type, OS, pages visited, songs played, timestamps, approximate location (IP‑based), cookies and similar technologies.</li>
                    <li><b>Information from Third Parties:</b> social sign‑in information (if used), payment confirmation and fraud checks from payment processors, limited geolocation or analytics insights.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">3. How We Use Personal Data</h3>
                  <ol>
                    <li>To operate and provide the Service (authentication, streaming, downloads, playlists).</li>
                    <li>To process payments, subscriptions, refunds, and donations.</li>
                    <li>To personalize content and improve user experience.</li>
                    <li>To communicate with you (support, updates, service notices).</li>
                    <li>To ensure legal and contractual compliance, including enforcing our Terms and preventing abuse.</li>
                    <li>For analytics and service performance monitoring.</li>
                    <li>For marketing with your consent (where required).</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">4. Legal Bases (GDPR/EU‑UK)</h3>
                  <p>We process personal data under the following legal bases: contract (to provide the Service), consent (e.g., marketing), legitimate interests (e.g., product improvement, security), and legal obligations (e.g., tax and accounting).</p>

                  <h3 className="text-lg font-semibold text-primary">5. Sharing and Disclosure</h3>
                  <ol>
                    <li><b>Service Providers:</b> hosting, storage, analytics, payments, communications (bound by contractual obligations).</li>
                    <li><b>Legal and Compliance:</b> to comply with laws, regulations, law enforcement requests, or to protect rights, safety, and property.</li>
                    <li><b>Business Transfers:</b> in the context of a merger, acquisition, or asset sale, subject to continued protection of your data.</li>
                  </ol>
                  <p>Zamar does <b>not</b> sell your personal information.</p>

                  <h3 className="text-lg font-semibold text-primary">6. International Transfers</h3>
                  <p>Your data may be processed in countries outside your residence. Where required by GDPR, we use appropriate safeguards such as Standard Contractual Clauses (SCCs) for transfers.</p>

                  <h3 className="text-lg font-semibold text-primary">7. Data Retention</h3>
                  <p>We retain data only as long as necessary for the purposes described or as required by law. You may request deletion of your account; certain records (e.g., transaction data) may be retained for legal compliance.</p>

                  <h3 className="text-lg font-semibold text-primary">8. Cookies and Tracking</h3>
                  <p>We use essential, analytics, functionality, and advertising cookies. EU/UK users will be asked for explicit consent before non‑essential cookies are set. See our Cookie Policy for details and management options.</p>

                  <h3 className="text-lg font-semibold text-primary">9. Your Rights</h3>
                  <ol>
                    <li>Access, correction, deletion (erasure), and restriction of processing.</li>
                    <li>Data portability.</li>
                    <li>Objection to processing based on legitimate interests or direct marketing.</li>
                    <li>Withdrawal of consent where processing is based on consent.</li>
                    <li>Right to lodge a complaint with a supervisory authority (e.g., ICO in the UK, an EU DPA, etc.).</li>
                  </ol>
                  <p>To exercise rights, contact: <a className="text-primary hover:underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a>.</p>

                  <h3 className="text-lg font-semibold text-primary">10. Children’s Privacy</h3>
                  <p>We do not knowingly collect personal data from children under 13 (or the minimum legal age in your country) without verifiable parental consent. If you believe a child has provided personal data, contact us to remove it.</p>

                  <h3 className="text-lg font-semibold text-primary">11. Security</h3>
                  <p>We implement appropriate technical and organizational measures (encryption, access controls, monitoring). No system is 100% secure; users should also safeguard their credentials and devices.</p>

                  <h3 className="text-lg font-semibold text-primary">12. Marketing Communications</h3>
                  <p>We may send marketing emails with your consent (where required). You can unsubscribe at any time via email links or by contacting us.</p>

                  <h3 className="text-lg font-semibold text-primary">13. Changes to this Policy</h3>
                  <p>We may update this Privacy Policy periodically. Material changes will be notified via the Service or email. Continued use after changes constitutes acceptance.</p>

                  <h3 className="text-lg font-semibold text-primary">14. Contact</h3>
                  <p><b>Data Protection Officer – Zamar</b><br />
                    Email: <a className="text-primary hover:underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a><br />
                    Address: Seaview Business Centre, TS10 1AZ, England
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="guidelines" className="mb-6">
          <Accordion type="multiple">
            <AccordionItem value="guidelines">
              <AccordionTrigger className="text-primary font-semibold">Community Guidelines – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Purpose</h3>
                  <p>These Community Guidelines (“Guidelines”) define acceptable behavior and content standards for all users of Zamar (Guests, Free Listeners, Supporters, and Admins). By using Zamar, you agree to comply with these Guidelines, our Terms of Service, and applicable laws.</p>
                  <p className="text-muted-foreground">Effective Date: 9 August 2025</p>

                  <h3 className="text-lg font-semibold text-primary">2. Core Principles</h3>
                  <ul className="list-disc ml-5">
                    <li><b>Respect:</b> Show kindness and courtesy; avoid harassment and personal attacks.</li>
                    <li><b>Integrity:</b> Submit only content you own or have the right to share.</li>
                    <li><b>Safety:</b> Keep Zamar free of harmful, illegal, or offensive content.</li>
                    <li><b>Community Spirit:</b> Support creativity, diversity, and faith‑centered expression.</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-primary">3. Content Standards</h3>
                  <ol>
                    <li><b>Prohibited Content:</b> unlawful, defamatory, libelous, fraudulent; hate speech, harassment, threats, discrimination; pornographic or obscene material; promotion of violence, terrorism, or criminal activity; false or misleading claims; spam, scams, or unauthorized advertising; infringing content.</li>
                    <li><b>Music &amp; Audio Submissions:</b> Submit only original works or content with proper licensing (including samples/loops). Supporter song suggestions must not include copyrighted lyrics or melodies without permission.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">4. User Behaviour</h3>
                  <ul className="list-disc ml-5">
                    <li>No disruption (e.g., trolling, flooding, mass unsolicited messages).</li>
                    <li>No automated scripts or bots to manipulate plays/downloads or metrics.</li>
                    <li>No attempts to bypass restrictions (e.g., ads, geo‑limitations, DRM).</li>
                    <li>No impersonation or misrepresentation.</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-primary">5. Testimonies</h3>
                  <p>Testimonies must be truthful, respectful, and relevant to the Zamar experience. We may edit for clarity or remove prohibited material. Testimonies may be moderated prior to publication.</p>

                  <h3 className="text-lg font-semibold text-primary">6. Supporter Song Suggestions</h3>
                  <ul className="list-disc ml-5">
                    <li>Suggestions should specify theme, scripture references, and language where relevant.</li>
                    <li>By submitting a suggestion, you grant Zamar full rights to adapt, record, produce, and distribute works inspired by your submission without further approval or compensation unless otherwise agreed in writing.</li>
                    <li>Suggestions may be accepted, modified, or declined at our discretion.</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-primary">7. Playlists</h3>
                  <p>Public playlists are visible to all users and must comply with these Guidelines. Admins may feature, reorder, or remove public playlists at any time.</p>

                  <h3 className="text-lg font-semibold text-primary">8. Reporting and Enforcement</h3>
                  <ol>
                    <li><b>Reporting:</b> Use in‑app reporting or email <a className="text-primary hover:underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a> with details and any supporting evidence.</li>
                    <li><b>Enforcement:</b> We may remove content, issue warnings, suspend or terminate accounts, or notify authorities where required.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">9. Appeals</h3>
                  <p>If you believe an enforcement action was in error, you may appeal by emailing <a className="text-primary hover:underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a> within 14 days and providing relevant context.</p>

                  <h3 className="text-lg font-semibold text-primary">10. Global Compliance</h3>
                  <p>Users are responsible for complying with local laws, including copyright, privacy, and content regulations in their jurisdictions.</p>

                  <h3 className="text-lg font-semibold text-primary">11. Changes to Guidelines</h3>
                  <p>We may update these Guidelines from time to time. The latest version will be published on the Zamar Legal page.</p>

                  <h3 className="text-lg font-semibold text-primary">12. Contact</h3>
                  <p><b>Community Team – Zamar</b><br />
                    Email: <a className="text-primary hover:underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a><br />
                    Address: Seaview Business Centre, TS10 1AZ, England
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="cookies" className="mb-6">
          <Accordion type="multiple">
            <AccordionItem value="cookies">
              <AccordionTrigger className="text-primary font-semibold">Cookie Policy – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Introduction</h3>
                  <p>This Cookie Policy explains how Zamar uses cookies and similar tracking technologies on our Service. It should be read alongside our Privacy Policy.</p>
                  <p className="text-muted-foreground">Effective Date: 9 August 2025</p>

                  <h3 className="text-lg font-semibold text-primary">2. What Are Cookies and Similar Technologies?</h3>
                  <p>Cookies are small text files stored on your device. We may also use local storage, pixels/web beacons, and SDKs (in apps) to store preferences and understand engagement.</p>

                  <h3 className="text-lg font-semibold text-primary">3. Types of Cookies We Use</h3>
                  <ol>
                    <li><b>Essential Cookies:</b> Required for core functionality (authentication, sessions, security).</li>
                    <li><b>Performance &amp; Analytics Cookies:</b> Help us understand usage, errors, and performance (e.g., page views, song plays).</li>
                    <li><b>Functionality Cookies:</b> Remember preferences (language, theme, playlists).</li>
                    <li><b>Advertising Cookies:</b> Deliver relevant ads to Guests/Free Listeners and measure performance.</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-primary">4. Why We Use Cookies</h3>
                  <ul className="list-disc ml-5">
                    <li>To keep you signed in and secure your session.</li>
                    <li>To save settings and personalize experiences.</li>
                    <li>To analyze and improve the Service.</li>
                    <li>To deliver, cap, and measure ads (where applicable).</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-primary">5. Third‑Party Cookies</h3>
                  <p>Some cookies are set by third parties such as payment processors (e.g., Stripe), analytics providers (e.g., Google Analytics), and advertising networks (if enabled). Their policies govern their use of data.</p>

                  <h3 className="text-lg font-semibold text-primary">6. Consent</h3>
                  <p>EU/UK users will be asked to consent to non‑essential cookies in accordance with GDPR and the ePrivacy Directive. You can withdraw consent at any time via our in‑app Cookie Settings (when available) or your browser settings.</p>

                  <h3 className="text-lg font-semibold text-primary">7. Managing Cookies</h3>
                  <p>You can block or delete cookies through your browser/device controls. Note that disabling certain cookies may affect functionality (e.g., login persistence, playlists).</p>

                  <h3 className="text-lg font-semibold text-primary">8. Data Collected by Cookies</h3>
                  <p>Cookies may collect device identifiers, IP address, approximate location, browsing or playback history, and preferences. See our Privacy Policy for more detail.</p>

                  <h3 className="text-lg font-semibold text-primary">9. Changes to this Policy</h3>
                  <p>We may update this Cookie Policy from time to time. The latest version will be posted with a revised effective date.</p>

                  <h3 className="text-lg font-semibold text-primary">10. Contact</h3>
                  <p><b>Data Protection Officer – Zamar</b><br />
                    Email: <a className="text-primary hover:underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a><br />
                    Address: Seaview Business Centre, TS10 1AZ, England
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="contact" className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-2xl font-bold text-primary mb-2">Contact Information</h2>
          <p>Zamar Legal Department</p>
          <p>
            Email: <a href="mailto:info@zamarsongs.com" className="text-primary hover:underline">info@zamarsongs.com</a>
          </p>
          <p>Address: Seaview Business Centre, England TS10 1AZ</p>
        </section>

        <p className="mt-8">
          <a href="#top" className="text-primary hover:underline">Back to Top</a>
        </p>
      </main>
      </div>
    </div>;
};
export default LegalCompliance;