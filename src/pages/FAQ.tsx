import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import Footer from "@/components/sections/Footer";

interface FaqItem { q: string; a: JSX.Element | string }
interface FaqSection { title: string; items: FaqItem[] }

const FAQ = () => {
  const [query, setQuery] = useState("");

  const sections: FaqSection[] = useMemo(() => [
    {
      title: "General Information",
      items: [
        {
          q: "What is Zamar?",
          a: (
            <>
              Zamar is a global Christian music platform where you can stream uplifting, Bible-inspired songs, download lyrics,
              create playlists, and even suggest new songs. It’s designed to inspire worship and connect believers worldwide.
            </>
          )
        },
        {
          q: "Do I need an account to use Zamar?",
          a: (
            <>
              No. Guests can browse and stream music for free. However, creating a free account unlocks additional features, and
              upgrading to a Supporter account gives you ad-free listening, downloads, and playlists.
            </>
          )
        },
        {
          q: "What makes Zamar different from other music platforms?",
          a: (
            <>
              Zamar is 100% faith-based, multilingual, and community-driven. We focus on scripture-inspired content, testimonies,
              and supporter-driven song creation.
            </>
          )
        }
      ]
    },
    {
      title: "User Accounts",
      items: [
        {
          q: "What’s the difference between Guest, Free Listener, and Supporter?",
          a: (
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Guest:</strong> Stream music with ads, view public playlists, and donate without logging in.</li>
              <li><strong>Free Listener:</strong> Stream unlimited music with ads, view lyrics, and submit testimonies.</li>
              <li><strong>Supporter:</strong> Ad-free streaming, unlimited downloads, create/manage playlists, and suggest new songs.</li>
            </ul>
          )
        },
        {
          q: "How do I become a Supporter?",
          a: (
            <>
              Upgrade anytime via the “Go Ad-Free + Download” button. Payments are processed securely through Stripe.
            </>
          )
        },
        {
          q: "Can I switch back from Supporter to Free Listener?",
          a: (
            <>
              Yes. You can manage or cancel your subscription in your account settings.
            </>
          )
        }
      ]
    },
    {
      title: "Music & Playlists",
      items: [
        {
          q: "Can I download songs?",
          a: (
            <>
              Downloads are available for Supporters only. Once downloaded, songs appear in your My Library section.
            </>
          )
        },
        {
          q: "How do playlists work?",
          a: (
            <>
              Supporters can create custom playlists for personal devotion, church services, or special occasions. All users can view and play
              public playlists curated by Zamar or other supporters.
            </>
          )
        },
        {
          q: "Is there continuous play?",
          a: (
            <>
              Yes. Whether you’re listening to a playlist or browsing songs, Zamar supports uninterrupted continuous playback.
            </>
          )
        }
      ]
    },
    {
      title: "Ads & Payments",
      items: [
        {
          q: "Why do I hear or see ads?",
          a: (
            <>Ads help keep Zamar free for everyone. Supporters enjoy an ad-free experience.</>
          )
        },
        {
          q: "How can I remove ads?",
          a: (
            <>Upgrade to a Supporter plan via the upgrade button on the player or in your account menu.</>
          )
        },
        {
          q: "What payment methods do you accept?",
          a: (
            <>We accept major credit/debit cards and other payment methods supported by Stripe.</>
          )
        }
      ]
    },
    {
      title: "Song Suggestions",
      items: [
        {
          q: "Can I request a song to be created?",
          a: (
            <>
              Yes! Supporters can suggest new songs by providing themes, scriptures, languages, or personal testimonies. Approved requests may be turned into songs, and we’ll notify you when your suggestion is live.
            </>
          )
        },
        {
          q: "How will I know if my suggestion is used?",
          a: (
            <>You’ll get a notification and your name may be credited on the song page.</>
          )
        }
      ]
    },
    {
      title: "Lyrics & Languages",
      items: [
        {
          q: "Are lyrics available for all songs?",
          a: (
            <>Yes. You can view the original KJV-based lyrics for every song, and many have translations in popular global languages.</>
          )
        },
        {
          q: "Can I print lyrics for church use?",
          a: (
            <>Yes, there’s a print-friendly view available in the lyrics section.</>
          )
        }
      ]
    },
    {
      title: "Testimonies & Community",
      items: [
        {
          q: "Can I share how a song has blessed me?",
          a: (
            <>Absolutely. Free Listeners and Supporters can submit testimonies for review by our team before they are published.</>
          )
        },
        {
          q: "Can I see other people’s testimonies?",
          a: (
            <>Yes. Approved testimonies appear on the Testimonies page and sometimes on song pages.</>
          )
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          q: "How can I support Zamar?",
          a: (
            <>
              You can support us by <a className="underline hover:text-primary" href="/pricing">upgrading to Supporter</a>, sharing our music, and leaving testimonies about how our songs have impacted you.
            </>
          )
        },
        {
          q: "Do I need an account to make purchases?",
          a: (<>No. You can purchase songs and upgrade to Supporter without creating an account.</>)
        }
      ]
    },
    {
      title: "Technical & Support",
      items: [
        {
          q: "Why can’t I find a page or feature?",
          a: (
            <>If you see a “404 – Page Not Found” message, the page may be under development or the link may be incorrect. Use the menu to navigate to active sections.</>
          )
        },
        {
          q: "The music stopped playing when my screen locked. What can I do?",
          a: (
            <>Ensure your device’s battery settings allow background audio. If you’re using our PWA app, enable notifications and background activity.</>
          )
        },
        {
          q: "How do I contact support?",
          a: (
            <>Email us at <a className="underline" href="mailto:info@zamarsongs.com">info@zamarsongs.com</a> or use the contact form in the app.</>
          )
        }
      ]
    },
    {
      title: "Privacy & Safety",
      items: [
        {
          q: "How is my data protected?",
          a: (
            <>We use secure authentication (Supabase Auth) and encryption to keep your data safe. See our Privacy Policy for details.</>
          )
        },
        {
          q: "Will my information be shared?",
          a: (
            <>No. We do not sell or share your personal data with third parties.</>
          )
        }
      ]
    }
  ], []);

  const filteredSections: FaqSection[] = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sections;
    return sections
      .map((section) => ({
        title: section.title,
        items: section.items.filter(({ q, a }) => {
          const text = (typeof a === "string" ? a : (typeof a === "object" ? (a as any).props?.children?.toString?.() ?? "" : ""));
          return q.toLowerCase().includes(term) || text.toLowerCase().includes(term);
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, query]);

  // SEO and canonical
  useEffect(() => {
    const title = "Zamar FAQ | Answers to Common Questions";
    const description = "Find answers about Zamar: streaming, playlists, custom songs, downloads, radio, referrals, and support.";
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }

    const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = window.location.origin + "/faq";
    if (existing) existing.href = href; else {
      const link = document.createElement("link");
      link.rel = "canonical"; link.href = href; document.head.appendChild(link);
    }
  }, []);

  // Structured data (FAQPage)
  const faqJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) => s.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: typeof f.a === "string" ? f.a : (Array.isArray((f.a as any).props?.children) ? (f.a as any).props.children.join(" ") : String((f.a as any).props?.children ?? "")) },
    }))),
  }), [sections]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header className="bg-gradient-to-b from-background to-background/40 border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold font-playfair text-foreground">Zamar – Frequently Asked Questions</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Quick answers about streaming, playlists, custom songs, radio, referrals, and more.</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section aria-label="Search FAQs" className="mb-6">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search FAQs..." className="w-full" />
          <p className="text-xs text-muted-foreground mt-2">{filteredSections.reduce((n, s) => n + s.items.length, 0)} result(s)</p>
        </section>

        {filteredSections.map((section, sIdx) => (
          <section key={section.title} className="mb-8" aria-label={section.title}>
            <h2 className="text-xl font-semibold mb-3 text-foreground font-playfair">{sIdx + 1}. {section.title}</h2>
            <Accordion type="single" collapsible className="w-full">
              {section.items.map((item, idx) => (
                <AccordionItem key={item.q} value={`s${sIdx}-item-${idx}`}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <div className="mt-12">
          <Footer />
        </div>
      </main>
    </>
  );
};

export default FAQ;
