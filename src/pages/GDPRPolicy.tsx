import { useEffect } from "react";

const GDPRPolicy = () => {
  useEffect(() => {
    // SEO
    document.title = "Zamar Data Protection & GDPR Policy";
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = "Zamar Data Protection & GDPR Privacy Policy. Effective 11 August 2025.";
    if (!metaDesc) {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute("content", description);
    }
    const canonicalId = "gdpr-canonical";
    let canonical = document.querySelector(`link[rel="canonical"]#${canonicalId}`) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.id = canonicalId;
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/legal/gdpr";
  }, []);

  return (
    <div className="dark">
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Zamar Data Protection & GDPR Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Effective Date: 11 August 2025</p>
        </header>

        <section className="bg-card border border-border rounded-xl p-4 mb-6">
          <p><b>Business Name:</b> Zamar (operated by [Your Legal Entity Name])</p>
          <p><b>Address:</b> Seaview Business Centre, Office 10, Redcar TS10 1AZ, United Kingdom</p>
          <p><b>Email:</b> <a href="mailto:info@zamarsongs.com" className="text-primary hover:underline">info@zamarsongs.com</a></p>
        </section>

        <article className="space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-primary">1. Introduction</h2>
            <p>
              Zamar (“we”, “our”, “us”) is committed to protecting the privacy and personal data of all users (“you”) who use our music streaming, download, and custom song creation services. This policy explains how we collect,
              use, store, and protect your personal data, and your rights under the UK General Data Protection Regulation (UK GDPR), the EU GDPR, and other applicable privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">2. Information We Collect</h2>
            <h3 className="font-medium mt-2">A. Information you provide directly</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Name, email address, password (for account creation)</li>
              <li>Payment information (processed securely via third-party providers such as Stripe)</li>
              <li>Song requests, preferences, and other customisation details</li>
              <li>Testimonies, suggestions, or other content you submit</li>
            </ul>
            <h3 className="font-medium mt-4">B. Information collected automatically</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>IP address and device identifiers</li>
              <li>Browser type, device type, and operating system</li>
              <li>Usage data such as songs played, pages visited, playlists created</li>
              <li>Approximate location (city/country) based on IP for analytics and localisation</li>
            </ul>
            <h3 className="font-medium mt-4">C. Information from third parties</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Login information from social sign-in providers (Google, Facebook, etc.)</li>
              <li>Payment confirmation details from payment processors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">3. How We Use Your Information</h2>
            <p className="mb-2">We process your personal data for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>To create and manage your account</li>
              <li>To deliver our music streaming and download services</li>
              <li>To process your payments and manage subscriptions/donations</li>
              <li>To improve our platform and personalise your experience</li>
              <li>To send you updates, offers, and service-related notifications (if you opt in)</li>
              <li>To comply with legal obligations and resolve disputes</li>
            </ul>
            <p className="mt-3 font-medium">Legal Basis for Processing:</p>
            <ul className="list-disc ml-6 space-y-1 mt-1">
              <li><b>Contract:</b> To fulfil our agreement with you (e.g., providing purchased songs)</li>
              <li><b>Legitimate Interests:</b> Improving our service, preventing fraud</li>
              <li><b>Consent:</b> Marketing communications and certain cookies</li>
              <li><b>Legal Obligation:</b> Compliance with applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">4. Sharing Your Information</h2>
            <p>We will never sell your personal data. We may share your data only with:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><b>Service Providers:</b> e.g., Supabase (data hosting), Stripe (payments), email/SMS providers</li>
              <li><b>Legal Authorities:</b> If required by law or to protect our rights</li>
              <li><b>Business Transfers:</b> If Zamar is acquired or merged with another company</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">5. International Data Transfers</h2>
            <p>
              Some of our service providers may be based outside the UK/EU. In such cases, we ensure your data is protected through adequacy decisions by the UK/EU Commission, Standard Contractual Clauses (SCCs), or other lawful safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">6. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to provide our services and meet legal, accounting, or reporting requirements. When no longer needed, your data will be securely deleted or anonymised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">7. Your Rights Under GDPR</h2>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><b>Access:</b> Request a copy of your personal data</li>
              <li><b>Rectification:</b> Correct inaccurate or incomplete data</li>
              <li><b>Erasure (“Right to be Forgotten”):</b> Request deletion of your data</li>
              <li><b>Restriction:</b> Limit how we process your data</li>
              <li><b>Data Portability:</b> Receive your data in a structured, machine-readable format</li>
              <li><b>Objection:</b> Stop processing based on legitimate interests or for direct marketing</li>
              <li><b>Withdraw Consent:</b> If processing is based on consent</li>
            </ul>
            <p className="mt-2">To exercise your rights, email <a href="mailto:info@zamarsongs.com" className="text-primary hover:underline">info@zamarsongs.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">8. Security Measures</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your data, including encryption in transit and at rest, access controls and authentication, and regular security audits and backups.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">9. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyse usage, and show relevant ads (for free-tier users). You can manage cookies via your browser settings. For more details, see our Cookie Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">10. Children’s Privacy</h2>
            <p>
              Our services are not directed at children under 13 (or under 16 in some jurisdictions). We do not knowingly collect personal data from children without parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">11. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Updates will be posted here, and significant changes will be communicated via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary">12. Contact Us</h2>
            <address className="not-italic">
              <div><b>Data Protection Officer (DPO)</b></div>
              <div>Zamar</div>
              <div>Seaview Business Centre, Office 10, Redcar TS10 1AZ, United Kingdom</div>
              <div>Email: <a href="mailto:info@zamarsongs.com" className="text-primary hover:underline">info@zamarsongs.com</a></div>
            </address>
            <p className="mt-2">If you are unsatisfied, you may lodge a complaint with the Information Commissioner’s Office (ICO) at <a className="text-primary hover:underline" href="https://www.ico.org.uk" target="_blank" rel="noopener noreferrer">www.ico.org.uk</a>.</p>
          </section>
        </article>

        <p className="mt-8">
          <a href="/legal" className="text-primary hover:underline">Back to Legal & Compliance</a>
        </p>
      </main>
    </div>
  );
};

export default GDPRPolicy;
