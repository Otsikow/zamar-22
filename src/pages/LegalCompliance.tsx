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
      metaDesc.setAttribute(
        "content",
        "Zamar Legal & Compliance: Terms of Service, Privacy Policy, Community Guidelines, and Cookie Policy."
      );
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

  return (
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
          <Accordion type="single" collapsible>
            <AccordionItem value="terms">
              <AccordionTrigger className="text-primary font-semibold">Terms of Service – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Introduction</h3>
                  <p>Welcome to Zamar. These Terms govern your use of our streaming, download, and related services...</p>

                  <h3 className="text-lg font-semibold text-primary">2. User Roles and Eligibility</h3>
                  <p>Roles include Guest, Free Listener, Supporter, and Admin. Minimum age is 13...</p>

                  <h3 className="text-lg font-semibold text-primary">3. Account Registration and Security</h3>
                  <p>You must provide accurate information, keep your password secure, and notify us of any breach...</p>

                  <h3 className="text-lg font-semibold text-primary">4. Use of the Service</h3>
                  <p>Personal, non-commercial use only. Prohibited uses include copying, scraping, or infringing content...</p>

                  <h3 className="text-lg font-semibold text-primary">5. Intellectual Property</h3>
                  <p>All content belongs to Zamar or licensors. User submissions grant us a perpetual, royalty-free license...</p>

                  <h3 className="text-lg font-semibold text-primary">6–17. [Full remaining Terms content inserted here with numbered headings]</h3>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="privacy" className="mb-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="privacy">
              <AccordionTrigger className="text-primary font-semibold">Privacy Policy – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Introduction</h3>
                  <p>Zamar complies with GDPR, CCPA, LGPD, and other privacy laws. This policy explains...</p>

                  <h3 className="text-lg font-semibold text-primary">2. Information We Collect</h3>
                  <p>Includes account details, payment info, user content, and technical data...</p>

                  <h3 className="text-lg font-semibold text-primary">3. How We Use Your Information</h3>
                  <p>To provide the service, process payments, improve experience, and comply with law...</p>

                  <h3 className="text-lg font-semibold text-primary">4–13. [Full remaining Privacy Policy content inserted here with numbered headings]</h3>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="guidelines" className="mb-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="guidelines">
              <AccordionTrigger className="text-primary font-semibold">Community Guidelines – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Purpose</h3>
                  <p>To foster a respectful, safe, and inspiring environment for music and testimonies...</p>

                  <h3 className="text-lg font-semibold text-primary">2. Core Principles</h3>
                  <p>Respect, integrity, safety, and community spirit...</p>

                  <h3 className="text-lg font-semibold text-primary">3. Content Standards</h3>
                  <p>No unlawful, offensive, or infringing content. All music must be owned or licensed...</p>

                  <h3 className="text-lg font-semibold text-primary">4–12. [Full remaining Guidelines content inserted here with numbered headings]</h3>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="cookies" className="mb-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="cookies">
              <AccordionTrigger className="text-primary font-semibold">Cookie Policy – Full Legal Text</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">1. Introduction</h3>
                  <p>Explains how we use cookies, pixels, and tracking technologies...</p>

                  <h3 className="text-lg font-semibold text-primary">2. Types of Cookies</h3>
                  <p>Essential, performance, functionality, and advertising cookies...</p>

                  <h3 className="text-lg font-semibold text-primary">3. Consent and Management</h3>
                  <p>EU/UK users must give explicit consent before non-essential cookies are set...</p>

                  <h3 className="text-lg font-semibold text-primary">4–10. [Full remaining Cookie Policy content inserted here with numbered headings]</h3>
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
          <p>Address: Seaview Business Centre, TS10 1AZ</p>
        </section>

        <p className="mt-8">
          <a href="#top" className="text-primary hover:underline">Back to Top</a>
        </p>
      </main>
    </div>
  );
};

export default LegalCompliance;
