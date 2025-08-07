import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/sections/Footer";
import { useTranslation } from "@/contexts/TranslationContext";

const Terms = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl md:text-4xl font-playfair font-bold">
              {t('terms.title', 'Terms & Conditions')}
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-6">
              {t('terms.effective_date', 'Effective Date: December 1, 2025')}
            </p>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.acceptance.title', '1. Acceptance of Terms')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.acceptance.content', 'By accessing and using Zamar, you accept and agree to be bound by the terms and provision of this agreement.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.use_license.title', '2. Use License')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.use_license.content', 'Permission is granted to temporarily download one copy of the materials on Zamar for personal, non-commercial transitory viewing only.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.user_content.title', '3. User Content')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.user_content.content', 'Users may submit content including song requests and testimonies. By submitting content, you grant us a non-exclusive license to use, modify, and display such content.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.faith_policy.title', '4. Faith-Based Content Policy')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.faith_policy.content', 'Zamar is a Christian platform. Content that conflicts with biblical principles may be declined. We reserve the right to review and moderate all submissions.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.disclaimer.title', '5. Disclaimer')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.disclaimer.content', 'The materials on Zamar are provided on an \'as is\' basis. Zamar makes no warranties, expressed or implied, and disclaims all other warranties.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.limitations.title', '6. Limitations')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.limitations.content', 'In no event shall Zamar be liable for any damages arising out of the use or inability to use the materials on our platform.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.accuracy.title', '7. Accuracy of Materials')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.accuracy.content', 'The materials appearing on Zamar could include technical, typographical, or photographic errors. We do not warrant accuracy.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.links.title', '8. Links')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.links.content', 'Zamar has not reviewed all sites linked to our platform and is not responsible for the contents of any linked site.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.modifications.title', '9. Modifications')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.modifications.content', 'Zamar may revise these terms at any time without notice. By using this platform, you agree to be bound by the current version.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.governing_law.title', '10. Governing Law')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.governing_law.content', 'These terms are governed by and construed in accordance with applicable laws.')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('terms.contact.title', 'Contact Information')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  {t('terms.contact.content', 'If you have any questions about these Terms & Conditions, please contact us at support@zamar.com')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;