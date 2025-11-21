import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: November 20, 2025</p>

      <div className="space-y-6 prose prose-sm max-w-none">
        <Card>
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold">1.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Profile information (photo, job title, company)</li>
              <li>Digital card content (contact details, social links, bio)</li>
              <li>Contact information from card exchanges</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>

            <h3 className="font-semibold mt-6">1.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Usage data (pages visited, features used)</li>
              <li>Device information (browser, OS, device type)</li>
              <li>Analytics data (views, taps, interactions)</li>
              <li>Location data (approximate, based on IP)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide and improve our services</li>
              <li>Process transactions and send notifications</li>
              <li>Personalize your experience</li>
              <li>Analyze usage patterns and optimize performance</li>
              <li>Communicate with you about updates and features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Information Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Service providers (hosting, payment processing, analytics)</li>
              <li>Third-party integrations you explicitly connect</li>
              <li>Law enforcement when legally required</li>
              <li>In the event of a merger or acquisition</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We implement industry-standard security measures to protect your data, including
              encryption, secure servers, and regular security audits. However, no method of
              transmission over the internet is 100% secure.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Your Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We retain your data for as long as your account is active or as needed to provide
              services. Analytics data is retained according to your subscription tier (7-90 days
              for free/pro, unlimited for premium).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Children&apos;s Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Nexus Cards is not intended for users under 16 years of age. We do not knowingly
              collect information from children.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Your data may be transferred and stored on servers in different countries. We ensure
              adequate safeguards are in place for international transfers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              For privacy-related questions or to exercise your rights:
              <br />
              <br />
              Email:{' '}
              <a href="mailto:privacy@nexus.cards" className="text-primary hover:underline">
                privacy@nexus.cards
              </a>
              <br />
              Address: 123 Tech Street, San Francisco, CA 94102
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
