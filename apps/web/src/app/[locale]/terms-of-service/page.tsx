import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Terms of Service | Nexus Cards',
  description: 'Terms of Service for Nexus Cards digital business card platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground">
          Last Updated: November 20, 2025
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              By accessing or using Nexus Cards (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
              If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Service after changes 
              constitutes acceptance of the modified Terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Account Registration and Security</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>2.1 Account Creation</h4>
            <p>
              You must provide accurate, complete, and current information during registration. You are responsible 
              for maintaining the confidentiality of your account credentials.
            </p>
            <h4>2.2 Account Eligibility</h4>
            <p>
              You must be at least 18 years old to create an account. By registering, you represent that you meet 
              this age requirement.
            </p>
            <h4>2.3 Account Security</h4>
            <p>
              You are solely responsible for all activities that occur under your account. Notify us immediately 
              of any unauthorized access or security breach.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Subscription Plans and Billing</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>3.1 Subscription Tiers</h4>
            <p>
              Nexus Cards offers Free, Professional, and Premium subscription tiers. Each tier has specific 
              features and limitations as described on our pricing page.
            </p>
            <h4>3.2 Billing and Payment</h4>
            <p>
              Paid subscriptions are billed in advance on a monthly or annual basis. You authorize us to charge 
              your payment method for all fees incurred.
            </p>
            <h4>3.3 Automatic Renewal</h4>
            <p>
              Subscriptions automatically renew unless canceled before the renewal date. You may cancel at any 
              time through your account settings.
            </p>
            <h4>3.4 Refunds</h4>
            <p>
              Refunds are provided on a case-by-case basis at our sole discretion. Contact support for refund 
              requests within 14 days of purchase.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Acceptable Use Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>4.1 Prohibited Activities</h4>
            <p>You may not use the Service to:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Impersonate others or provide false information</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt unauthorized access to systems or data</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
            <h4>4.2 Content Responsibility</h4>
            <p>
              You are solely responsible for all content you upload or share through the Service. We reserve 
              the right to remove content that violates these Terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. NFC Tags and Physical Products</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>5.1 NFC Tag Assignment</h4>
            <p>
              NFC tags are assigned to user accounts by administrators. Users may associate and disassociate 
              tags with their digital cards but cannot add new tags independently.
            </p>
            <h4>5.2 Tag Ownership</h4>
            <p>
              Physical NFC tags remain the property of Nexus Cards. Upon account termination or subscription 
              cancellation, tag assignments may be revoked.
            </p>
            <h4>5.3 Tag Limitations</h4>
            <p>
              Each NFC tag may be associated with only one digital card at a time. We do not guarantee 
              compatibility with all NFC-enabled devices.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Intellectual Property Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>6.1 Nexus Cards IP</h4>
            <p>
              All intellectual property rights in the Service, including software, design, trademarks, and 
              content, are owned by Nexus Cards or our licensors.
            </p>
            <h4>6.2 User Content License</h4>
            <p>
              You grant us a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and 
              distribute your content solely for the purpose of providing the Service.
            </p>
            <h4>6.3 Trademark Usage</h4>
            <p>
              You may not use Nexus Cards trademarks, logos, or branding without prior written permission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Privacy and Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Your use of the Service is subject to our Privacy Policy, which describes how we collect, use, 
              and protect your personal information. By using the Service, you consent to our data practices 
              as described in the Privacy Policy.
            </p>
            <p>
              We comply with GDPR, CCPA, and other applicable data protection regulations. You have rights 
              regarding your personal data, including the right to access, export, and delete your information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Service Availability and Modifications</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>8.1 Service Availability</h4>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service 
              may be temporarily unavailable for maintenance, updates, or unforeseen circumstances.
            </p>
            <h4>8.2 Service Modifications</h4>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, 
              with or without notice.
            </p>
            <h4>8.3 Beta Features</h4>
            <p>
              Beta or experimental features are provided &quot;as-is&quot; without warranties. These features may change 
              or be removed at any time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Termination</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>9.1 Termination by User</h4>
            <p>
              You may terminate your account at any time through account settings. Upon termination, your 
              access to the Service will cease, and your data will be processed according to our Privacy Policy.
            </p>
            <h4>9.2 Termination by Nexus Cards</h4>
            <p>
              We may suspend or terminate your account for violation of these Terms, fraudulent activity, 
              or any other reason at our sole discretion, with or without notice.
            </p>
            <h4>9.3 Effect of Termination</h4>
            <p>
              Upon termination, all rights granted to you under these Terms will immediately cease. Provisions 
              that by their nature should survive termination will remain in effect.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Disclaimers and Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>10.1 Disclaimer of Warranties</h4>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER 
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR 
              A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <h4>10.2 Limitation of Liability</h4>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXUS CARDS SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
              INTANGIBLE LOSSES.
            </p>
            <h4>10.3 Maximum Liability</h4>
            <p>
              Our total liability to you for all claims arising from or related to the Service shall not 
              exceed the amount paid by you to Nexus Cards in the twelve (12) months preceding the claim.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              You agree to indemnify, defend, and hold harmless Nexus Cards, its officers, directors, employees, 
              and agents from any claims, liabilities, damages, losses, or expenses, including reasonable 
              attorneys&apos; fees, arising from:
            </p>
            <ul>
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your content or conduct on the Service</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>12.1 Informal Resolution</h4>
            <p>
              Before filing a claim, you agree to contact us to attempt informal resolution of any dispute.
            </p>
            <h4>12.2 Governing Law</h4>
            <p>
              These Terms are governed by and construed in accordance with the laws of [Jurisdiction], 
              without regard to conflict of law principles.
            </p>
            <h4>12.3 Arbitration</h4>
            <p>
              Any dispute arising from these Terms or the Service shall be resolved through binding arbitration 
              rather than in court, except where prohibited by law.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. General Provisions</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>13.1 Entire Agreement</h4>
            <p>
              These Terms, together with the Privacy Policy, constitute the entire agreement between you and 
              Nexus Cards regarding the Service.
            </p>
            <h4>13.2 Severability</h4>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions will 
              continue in full force and effect.
            </p>
            <h4>13.3 Waiver</h4>
            <p>
              No waiver of any term shall be deemed a further or continuing waiver of such term or any other term.
            </p>
            <h4>13.4 Assignment</h4>
            <p>
              You may not assign these Terms without our prior written consent. We may assign these Terms 
              without restriction.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>14. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> legal@nexuscards.com</li>
              <li><strong>Address:</strong> [Company Address]</li>
              <li><strong>Support:</strong> support@nexuscards.com</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
