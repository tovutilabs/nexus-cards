import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'Data Processing FAQ | Nexus Cards',
  description: 'Frequently asked questions about data processing, privacy, and security at Nexus Cards',
};

export default function DataProcessingFAQPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Data Processing FAQ</h1>
        <p className="text-muted-foreground">
          Common questions about how Nexus Cards collects, processes, and protects your data
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Data Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-data">
                <AccordionTrigger>What personal data does Nexus Cards collect?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>We collect the following types of personal data:</p>
                  <ul>
                    <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
                    <li><strong>Profile Data:</strong> Job title, company, phone number, social media links, profile photos</li>
                    <li><strong>Digital Card Content:</strong> Business information, contact details, custom styling preferences</li>
                    <li><strong>Contact Information:</strong> Details of contacts you receive through your cards</li>
                    <li><strong>Usage Data:</strong> Analytics about card views, link clicks, device types, geographic location (country-level)</li>
                    <li><strong>Billing Information:</strong> Payment details processed through Stripe (we do not store full credit card numbers)</li>
                    <li><strong>Technical Data:</strong> IP addresses, browser types, device identifiers, cookies</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="why-collect">
                <AccordionTrigger>Why do you collect this data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>We collect data for the following purposes:</p>
                  <ul>
                    <li><strong>Service Delivery:</strong> To provide and maintain your digital business cards</li>
                    <li><strong>Analytics:</strong> To show you insights about card performance and visitor engagement</li>
                    <li><strong>Account Management:</strong> To authenticate users and manage subscriptions</li>
                    <li><strong>Communication:</strong> To send notifications, updates, and support responses</li>
                    <li><strong>Billing:</strong> To process payments and manage subscriptions</li>
                    <li><strong>Improvement:</strong> To enhance features and user experience</li>
                    <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
                    <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="legal-basis">
                <AccordionTrigger>What is the legal basis for processing my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>Under GDPR, we process your data based on:</p>
                  <ul>
                    <li><strong>Contract Performance:</strong> Processing necessary to provide the Service you signed up for</li>
                    <li><strong>Consent:</strong> You have given explicit consent for specific processing activities (e.g., marketing emails, analytics cookies)</li>
                    <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate business interests (e.g., fraud prevention, service improvement)</li>
                    <li><strong>Legal Obligations:</strong> Processing required to comply with legal requirements</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-storage">
                <AccordionTrigger>Where is my data stored?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>
                    Your data is stored on secure servers hosted in [Region/Cloud Provider]. We use industry-standard 
                    encryption both in transit (TLS/SSL) and at rest (AES-256). Database backups are encrypted and 
                    stored in geographically distributed locations for redundancy.
                  </p>
                  <p>
                    If you are in the EU, your data is primarily stored within the European Economic Area (EEA) 
                    to comply with GDPR requirements.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-retention">
                <AccordionTrigger>How long do you retain my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>We retain your data according to the following schedules:</p>
                  <ul>
                    <li><strong>Account Data:</strong> Retained while your account is active, plus 30 days after deletion for recovery purposes</li>
                    <li><strong>Analytics Data:</strong> Retention varies by subscription tier:
                      <ul>
                        <li>Free: 7 days</li>
                        <li>Professional: 90 days</li>
                        <li>Premium: Unlimited (or until account deletion)</li>
                      </ul>
                    </li>
                    <li><strong>Contact Data:</strong> Retained until you delete it or close your account</li>
                    <li><strong>Billing Records:</strong> Retained for 7 years for accounting and legal compliance</li>
                    <li><strong>Logs and Technical Data:</strong> Typically retained for 30-90 days unless needed for security investigations</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights and Control</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="my-rights">
                <AccordionTrigger>What are my data protection rights?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>Under GDPR and CCPA, you have the following rights:</p>
                  <ul>
                    <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                    <li><strong>Right to Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
                    <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
                    <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                    <li><strong>Right to Object:</strong> Object to certain types of processing (e.g., direct marketing)</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing based on consent</li>
                    <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your data protection authority</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="export-data">
                <AccordionTrigger>How do I export my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>To export your data:</p>
                  <ol>
                    <li>Go to <strong>Dashboard → Settings → Privacy</strong></li>
                    <li>In the &quot;Data Export&quot; section, select your preferred format (JSON or CSV)</li>
                    <li>Click &quot;Request Export&quot;</li>
                    <li>You&apos;ll receive an email when your export is ready (usually within 24 hours)</li>
                    <li>Download your data from the Privacy settings page or the email link</li>
                    <li>Exports expire after 7 days for security reasons</li>
                  </ol>
                  <p>
                    Your export includes: account details, profile information, all digital cards, contacts, 
                    analytics summaries, notification preferences, and integration settings.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delete-account">
                <AccordionTrigger>How do I delete my account and data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>To permanently delete your account:</p>
                  <ol>
                    <li>Go to <strong>Dashboard → Settings → Privacy</strong></li>
                    <li>Scroll to the &quot;Delete Account&quot; section</li>
                    <li>Read the warnings carefully (this action is irreversible)</li>
                    <li>Click &quot;Delete My Account&quot;</li>
                    <li>Confirm deletion in the dialog</li>
                  </ol>
                  <p><strong>What happens when you delete your account:</strong></p>
                  <ul>
                    <li>Your profile and all digital cards are permanently deleted</li>
                    <li>Your contacts and analytics data are permanently deleted</li>
                    <li>NFC tags assigned to you are unlinked (tags remain in inventory for reassignment)</li>
                    <li>Active subscriptions are canceled (no refunds for unused time)</li>
                    <li>Public card links become inactive immediately</li>
                    <li>Billing records are retained for 7 years per legal requirements</li>
                    <li>Anonymized analytics may be retained for aggregate statistics</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="update-data">
                <AccordionTrigger>How do I update or correct my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>You can update most of your data directly through the dashboard:</p>
                  <ul>
                    <li><strong>Profile Information:</strong> Dashboard → Settings → Account</li>
                    <li><strong>Card Content:</strong> Dashboard → Cards → [Select Card] → Edit</li>
                    <li><strong>Contact Information:</strong> Dashboard → Contacts → [Select Contact] → Edit</li>
                    <li><strong>Email Address:</strong> Contact support@nexuscards.com (requires verification)</li>
                    <li><strong>Password:</strong> Dashboard → Settings → Account → Change Password</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Sharing and Third Parties</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="who-access">
                <AccordionTrigger>Who has access to my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>We limit access to your data to:</p>
                  <ul>
                    <li><strong>You:</strong> Full access to your own data through the dashboard</li>
                    <li><strong>Nexus Cards Employees:</strong> Limited access for support, maintenance, and security purposes</li>
                    <li><strong>Service Providers:</strong> Third-party processors who help us operate the Service (see below)</li>
                    <li><strong>Public Card Visitors:</strong> Information you choose to display on your public cards</li>
                    <li><strong>Law Enforcement:</strong> Only when legally required by valid court orders</li>
                  </ul>
                  <p>
                    We do NOT sell your personal data to third parties. We do NOT share your data with advertisers.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="third-parties">
                <AccordionTrigger>What third-party services do you use?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>We use the following third-party processors:</p>
                  <ul>
                    <li><strong>Stripe:</strong> Payment processing (PCI DSS compliant)</li>
                    <li><strong>SendGrid/Mailchimp:</strong> Transactional and marketing emails (if integrated)</li>
                    <li><strong>Cloud Infrastructure Providers:</strong> Server hosting and database management</li>
                    <li><strong>CDN Providers:</strong> Content delivery for faster load times</li>
                    <li><strong>Analytics Services:</strong> Aggregated usage analytics (anonymized)</li>
                  </ul>
                  <p>
                    All third-party processors are bound by Data Processing Agreements (DPAs) and comply with 
                    GDPR and CCPA requirements.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="integrations">
                <AccordionTrigger>How do integrations affect my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>
                    When you connect third-party integrations (CRM, email marketing, cloud storage), you explicitly 
                    authorize us to share specific data with those services:
                  </p>
                  <ul>
                    <li><strong>CRM Integrations:</strong> Contact information collected through your cards</li>
                    <li><strong>Email Marketing:</strong> Subscriber contact details for list building</li>
                    <li><strong>Cloud Storage:</strong> Exported contact/analytics files</li>
                    <li><strong>Zapier:</strong> Event data (card views, new contacts) for workflow automation</li>
                  </ul>
                  <p>
                    You control which integrations are active and can disconnect them at any time from 
                    Dashboard → Integrations. Disconnecting stops future data sharing but does not delete 
                    data already sent to third parties.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="international">
                <AccordionTrigger>Is my data transferred internationally?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>
                    If you are located outside the region where our servers are hosted, your data may be 
                    transferred internationally. We ensure such transfers comply with applicable data 
                    protection laws through:
                  </p>
                  <ul>
                    <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                    <li>Adequacy decisions recognizing equivalent data protection standards</li>
                    <li>Your explicit consent where required</li>
                  </ul>
                  <p>
                    All international transfers maintain the same level of protection as required by GDPR.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security and Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="security-measures">
                <AccordionTrigger>How do you protect my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>We implement multiple security measures:</p>
                  <ul>
                    <li><strong>Encryption:</strong> TLS/SSL for data in transit, AES-256 for data at rest</li>
                    <li><strong>Authentication:</strong> Bcrypt/Argon2 password hashing, optional 2FA</li>
                    <li><strong>Access Controls:</strong> Role-based access, principle of least privilege</li>
                    <li><strong>Network Security:</strong> Firewalls, DDoS protection, intrusion detection</li>
                    <li><strong>Regular Audits:</strong> Security assessments, penetration testing, code reviews</li>
                    <li><strong>Monitoring:</strong> Real-time alerts for suspicious activities</li>
                    <li><strong>Backups:</strong> Encrypted, geographically distributed backups</li>
                    <li><strong>Incident Response:</strong> Documented procedures for data breach handling</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-breach">
                <AccordionTrigger>What happens if there&apos;s a data breach?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>In the event of a data breach:</p>
                  <ol>
                    <li>We will investigate and contain the breach immediately</li>
                    <li>Affected users will be notified within 72 hours (as required by GDPR)</li>
                    <li>Relevant data protection authorities will be notified as required</li>
                    <li>We will provide details about what data was affected and what actions you should take</li>
                    <li>We will implement additional safeguards to prevent future incidents</li>
                    <li>A post-incident report will be made available to affected users</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cookies">
                <AccordionTrigger>How do you use cookies?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>We use four categories of cookies:</p>
                  <ul>
                    <li><strong>Necessary Cookies:</strong> Essential for authentication and core functionality (always enabled)</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand usage patterns and improve the Service (optional)</li>
                    <li><strong>Marketing Cookies:</strong> Track effectiveness of campaigns (optional, only with your consent)</li>
                    <li><strong>Preferences Cookies:</strong> Remember your settings like language and theme (optional)</li>
                  </ul>
                  <p>
                    You can manage cookie preferences through the cookie consent banner or Dashboard → Settings → Privacy.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="analytics-tracking">
                <AccordionTrigger>What analytics do you track on public cards?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>When someone visits your public card, we track:</p>
                  <ul>
                    <li>View timestamp (daily granularity only)</li>
                    <li>Country-level geographic location (not precise location)</li>
                    <li>Device type (mobile, tablet, desktop)</li>
                    <li>Browser type</li>
                    <li>Referral source (how they found your card)</li>
                    <li>Link clicks on your card</li>
                    <li>Contact form submissions</li>
                  </ul>
                  <p>
                    We do NOT track: precise GPS location, browsing history outside your card, or personally 
                    identifiable information of visitors (unless they submit a contact form).
                  </p>
                  <p>
                    Analytics tracking respects Do Not Track (DNT) browser settings and cookie consent preferences.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="children">
                <AccordionTrigger>Is the Service suitable for children?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>
                    Nexus Cards is not intended for users under 18 years of age. We do not knowingly collect 
                    personal information from children. If you believe we have collected data from a child, 
                    please contact us immediately at privacy@nexuscards.com.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="automated-decisions">
                <AccordionTrigger>Do you use automated decision-making?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>
                    We use limited automated processing for:
                  </p>
                  <ul>
                    <li>Fraud detection and prevention</li>
                    <li>Spam filtering for contact submissions</li>
                    <li>Smart suggestions (e.g., profile completion recommendations)</li>
                  </ul>
                  <p>
                    No automated decisions significantly affect your legal rights or contract terms. You can 
                    request human review of any automated decision by contacting support.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-processing">
                <AccordionTrigger>Do you use AI to process my data?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>
                    Currently, Nexus Cards does not use AI or machine learning to process user data beyond 
                    basic analytics aggregation. If we introduce AI-powered features in the future, we will:
                  </p>
                  <ul>
                    <li>Notify you and update this FAQ</li>
                    <li>Provide opt-in/opt-out controls</li>
                    <li>Ensure AI processing complies with GDPR Article 22 (automated decision-making rights)</li>
                    <li>Maintain transparency about what data is used and how</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="contact-privacy">
                <AccordionTrigger>How do I contact you about privacy concerns?</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                  <p>For privacy-related questions or concerns, contact us:</p>
                  <ul>
                    <li><strong>Email:</strong> privacy@nexuscards.com</li>
                    <li><strong>Data Protection Officer:</strong> dpo@nexuscards.com</li>
                    <li><strong>Support Portal:</strong> support@nexuscards.com</li>
                    <li><strong>Mail:</strong> [Company Address]</li>
                  </ul>
                  <p>
                    We aim to respond to all privacy inquiries within 30 days (or sooner as required by applicable law).
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Still Have Questions?</h3>
          <p className="text-muted-foreground mb-4">
            If you have additional questions about how we process your data, please don&apos;t hesitate to reach out 
            to our privacy team at <a href="mailto:privacy@nexuscards.com" className="text-primary hover:underline">privacy@nexuscards.com</a>
          </p>
          <p className="text-sm text-muted-foreground">
            Last Updated: November 20, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
