import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessibilityStatementPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Accessibility Statement</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Our Commitment to Accessibility</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Nexus Cards is committed to ensuring digital accessibility for people with
              disabilities. We are continually improving the user experience for everyone and
              applying the relevant accessibility standards.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conformance Status</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              The{' '}
              <a
                href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Web Content Accessibility Guidelines (WCAG)
              </a>{' '}
              defines requirements for designers and developers to improve accessibility for people
              with disabilities. It defines three levels of conformance: Level A, Level AA, and
              Level AAA.
            </p>
            <p>
              Nexus Cards is <strong>partially conformant</strong> with WCAG 2.1 level AA. Partially
              conformant means that some parts of the content do not fully conform to the
              accessibility standard.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside">
              <li>Keyboard navigation support throughout the application</li>
              <li>Screen reader compatibility with proper ARIA labels</li>
              <li>High contrast color schemes meeting WCAG AA standards</li>
              <li>Resizable text without loss of functionality</li>
              <li>Clear focus indicators for interactive elements</li>
              <li>Skip-to-content links for efficient navigation</li>
              <li>Descriptive alt text for images</li>
              <li>Semantic HTML markup</li>
              <li>Form labels and error messages</li>
              <li>Consistent navigation patterns</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Known Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Despite our best efforts to ensure accessibility, there may be some limitations.
              Below is a list of known issues we are working to address:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                Some third-party integrations may not be fully accessible and are beyond our
                control
              </li>
              <li>PDF exports may not be fully accessible with screen readers</li>
              <li>Some dynamic content updates may require manual page refresh</li>
              <li>Complex data visualizations may have limited alternative text descriptions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback and Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              We welcome your feedback on the accessibility of Nexus Cards. Please let us know if
              you encounter accessibility barriers:
            </p>
            <ul className="space-y-2 list-disc list-inside mt-4">
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:accessibility@nexus.cards" className="text-primary hover:underline">
                  accessibility@nexus.cards
                </a>
              </li>
              <li>
                <strong>Phone:</strong> +1 (555) 123-4567
              </li>
              <li>
                <strong>Address:</strong> 123 Tech Street, San Francisco, CA 94102
              </li>
            </ul>
            <p className="mt-4">
              We aim to respond to accessibility feedback within 5 business days and to propose a
              solution within 10 business days.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Accessibility of Nexus Cards relies on the following technologies to work with the
              particular combination of web browser and any assistive technologies or plugins
              installed on your computer:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>HTML5</li>
              <li>CSS3</li>
              <li>JavaScript</li>
              <li>WAI-ARIA</li>
            </ul>
            <p className="mt-4">
              These technologies are relied upon for conformance with the accessibility standards
              used.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Approach</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Nexus Cards assessed the accessibility of this website by the following approaches:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Self-evaluation using automated tools</li>
              <li>Manual testing with keyboard navigation</li>
              <li>Screen reader testing (NVDA, JAWS, VoiceOver)</li>
              <li>User testing with people with disabilities</li>
              <li>Regular audits by third-party accessibility consultants</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formal Complaints</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              If you are not satisfied with our response to your feedback, you may escalate your
              concerns to:
            </p>
            <p className="mt-4">
              <strong>Accessibility Compliance Team</strong>
              <br />
              Nexus Cards Inc.
              <br />
              123 Tech Street
              <br />
              San Francisco, CA 94102
              <br />
              Email:{' '}
              <a href="mailto:compliance@nexus.cards" className="text-primary hover:underline">
                compliance@nexus.cards
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This statement was created on <strong>November 20, 2025</strong> and last reviewed on{' '}
              <strong>November 20, 2025</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
