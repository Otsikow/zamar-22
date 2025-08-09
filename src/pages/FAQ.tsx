import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import Footer from "@/components/sections/Footer";

interface FaqItem {
  q: string;
  a: string;
}

const FAQ = () => {
  const [query, setQuery] = useState("");

  const faqs: FaqItem[] = useMemo(
    () => [
      {
        q: "What is Zamar?",
        a: "Zamar is a global Christian music platform for streaming uplifting, Bible‑inspired songs, downloading lyrics, creating playlists, and requesting custom songs.",
      },
      {
        q: "Do I need an account to use Zamar?",
        a: "No. Guests can browse and stream for free. Creating a free account unlocks favourites and playlists. Supporters enjoy ad‑free listening and downloads.",
      },
      {
        q: "How do I create a custom song?",
        a: "Go to Request Song, share your story and preferences, and our team will craft an original track aligned with Christian values.",
      },
      {
        q: "Can I download lyrics?",
        a: "Yes. Many songs include downloadable lyrics for personal use and worship sessions.",
      },
      {
        q: "How do playlists work?",
        a: "You can create, manage, and share playlists. Use the Manage Playlists page to add songs, reorder, or set a playlist as public.",
      },
      {
        q: "Is there a radio feature?",
        a: "Yes. The Radio page streams continuous faith‑based music curated by our editorial team.",
      },
      {
        q: "What is the Referral Bonus?",
        a: "Invite friends and earn bonuses when they support the mission. See Referral Calculator for potential earnings.",
      },
      {
        q: "How do I report an issue or get support?",
        a: "Use the Contact page to message us. Signed‑in users can chat and get email updates when we reply.",
      },
      {
        q: "Are all requests accepted?",
        a: "We are a faith‑based platform and may decline requests that go against our Christian values.",
      },
      {
        q: "Where can I find legal information?",
        a: "Visit the Legal & Compliance page for Terms of Service, Privacy Policy, Guidelines, and Cookies.",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter(({ q, a }) => q.toLowerCase().includes(term) || a.toLowerCase().includes(term));
  }, [faqs, query]);

  // SEO and canonical
  useEffect(() => {
    const title = "Zamar FAQ | Answers to Common Questions";
    const description =
      "Find answers about Zamar: streaming, playlists, custom songs, downloads, radio, referrals, and support.";
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }

    // canonical
    const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = window.location.origin + "/faq";
    if (existing) existing.href = href;
    else {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  // Structured data (FAQPage)
  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    }),
    [faqs]
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="bg-gradient-to-b from-background to-background/40 border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold font-playfair text-foreground">Zamar FAQ</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Quick answers about streaming, playlists, custom songs, radio, referrals, and more.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section aria-label="Search FAQs" className="mb-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-2">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
        </section>

        <section aria-label="Frequently Asked Questions">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No results. Try different keywords.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((item, idx) => (
                <AccordionItem key={item.q} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        <div className="mt-12">
          <Footer />
        </div>
      </main>
    </>
  );
};

export default FAQ;
