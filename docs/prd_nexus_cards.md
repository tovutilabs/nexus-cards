# Product Requirements Document: Digital Business Card Web App

## 1. Executive Summary

### 1.1 Product Vision

A comprehensive digital business card platform that enables individuals to create, share, and manage professional digital identities seamlessly. The platform replaces traditional paper business cards with dynamic, eco-friendly, and analytics-driven digital alternatives.

### 1.2 Product Goals

- Provide intuitive card creation and customization tools
- Enable instant sharing across multiple channels
- Deliver actionable networking insights through analytics
- Ensure seamless contact management and CRM integration
- Support professionals in building and maintaining their digital presence

### 1.3 Target Users

- **Individual Professionals**: Freelancers, entrepreneurs, sales professionals, consultants, job seekers, networkers, and anyone looking to share their professional information digitally

## 2. Product Features

### 2.1 User Registration & Authentication

- Email and password registration
- Social login (Google, LinkedIn, Microsoft)
- Two-factor authentication (2FA)
- Password recovery
- Email verification

### 2.2 Digital Card Creation

- **Personal Information Fields**:

  - Full name and professional title
  - Company name and logo
  - Profile photo upload (with cropping tool)
  - Multiple phone numbers (mobile, office, direct)
  - Multiple email addresses (work, personal)
  - Physical address
  - Website URL
  - Department and location

- **Social Media Links**:

  - LinkedIn, Twitter, Facebook, Instagram
  - GitHub, Behance, Dribbble
  - YouTube, TikTok, Medium
  - Custom link fields

- **Multimedia Content**:
  - Background images/patterns
  - Video introduction (30-60 seconds)
  - Portfolio/work samples links

### 2.3 Multi-Card Management

- Create multiple cards for different purposes
- Professional vs. personal cards
- Event-specific cards
- Card versioning and history
- Set default card
- Duplicate cards for quick setup

### 2.4 Card Customization

- **Design Templates**:

  - 15+ pre-designed templates
  - Industry-specific themes (tech, creative, corporate, healthcare)
  - Minimalist, modern, and classic styles

- **Customization Options**:

  - Color scheme selector (primary, secondary, accent colors)
  - Font selection (5-7 professional fonts)
  - Layout options (horizontal, vertical, centered)
  - Custom CSS for advanced users
  - Card preview in real-time

- **Branding Elements**:
  - Company brand colors
  - Logo placement options
  - Watermark capability

### 2.5 Card Sharing

- **Digital Sharing Methods**:

  - Unique shareable URL
  - QR code generation (downloadable as PNG/SVG)
  - Email sharing
  - SMS sharing
  - WhatsApp, Telegram integration
  - LinkedIn direct sharing
  - NFC capability support (tap-to-share via registered NFC tags; see **2.11 NFC Support**)

- **Sharing Controls**:
  - Privacy settings (public, private, password-protected)
  - Expiration dates for temporary shares
  - View-only vs. save-to-contacts permissions

### 2.6 Contact Exchange System

- **For Non-Users**:

  - Contact submission form when viewing a card
  - Required fields: Name, Email, Phone
  - Optional note field for context
  - One-click submission creates contact entry
  - Email notification to card owner

- **For Existing Users**:
  - Account detection when viewing cards
  - Auto-fill contact info from user profile
  - Optional note field for context
  - Mutual connection linking
  - Bidirectional contact saving

### 2.7 Contact Management

- **Received Contacts**:

  - Digital wallet for saved contacts
  - Contact details display (name, email, phone, note)
  - Search and filter functionality
  - Tags and categories
  - Notes on contacts
  - Favorite/starred contacts
  - Export to VCF (vCard format)
  - View contact source (which card they came from)

- **Additional Import Options**:
  - Scan QR codes to save other users' cards
  - Bulk import from CSV/Excel
  - Manual contact addition

### 2.7 Analytics Dashboard

- Total card views
- Unique visitors
- Click-through rates on links
- Most clicked elements
- Geographic distribution of viewers
- Time-based analytics (daily, weekly, monthly), aggregated and exposed at **daily granularity** only (no hourly or sub-daily buckets)
- Device type breakdown
- Referral sources
- Engagement trends
- Contact exchange submissions
- Export analytics reports

### 2.8 Payment Integration

- Payment links (M-Pesa, Stripe, PayPal)
- Service pricing display
- Quick payment buttons
- Invoice generation
- Multiple currency support
- Payment tracking

### 2.9 Smart Suggestions

- AI-powered content suggestions
- Industry-specific recommendations
- Optimal link placement suggestions
- A/B testing recommendations
- Profile completion tips

### 2.10 Integrations

- **CRM Platforms**:
  - Basic integrations with popular CRMs (Salesforce, HubSpot, Zoho)
- **Communication Tools**:
  - Email marketing platforms (Mailchimp, SendGrid)
  - Zapier for custom workflows
- **Cloud Storage**:
  - Google Drive
  - Dropbox

### 2.11 NFC Support

#### 2.11.1 NFC Tag Types

- Supports NTAG-compatible NFC tags (e.g., NTAG21x series).
- All official tags shipped to users must:
  - Contain the user’s profile URL (base URL only).
  - Have **NTAG ASCII Mirror** enabled so the UID is appended to the URL on tap.

Example:
`https://nexus.cards/p/<username>?uid=<TAG_UID>`

---

#### 2.11.2 NFC UID Inventory Management (Admin Only)

- Admins can **add or bulk-import** NFC tag UIDs into the system.
- Imported UIDs go into an **inventory pool** marked as:
  - _Available_
  - _Assigned_
  - _Revoked_ (optional future state)
- The system must track:
  - UID
  - Tag type
  - Date added
  - Status
  - Assigned user (if any)

---

#### 2.11.3 Assignment on Purchase

- When a user purchases a physical NFC tag, the system:
  - Ships a physical tag with the correct embedded profile URL and UID Mirror enabled.
  - Admin selects a UID from inventory and **assigns** it to the user’s account.
- After assignment:
  - The UID becomes visible to the user under **My NFC Tags**.
  - The UID remains unusable until the user associates it with a card.

---

#### 2.11.4 User Access & Permissions

Users **cannot**:

- Add new NFC tags
- Modify or rename tags
- Delete tags
- Register new UIDs

Users **can**:

- View all UIDs assigned to their account
- Associate a tag UID with any of their digital cards
- Disassociate tags from cards

Association examples:

- UID001 → Card A
- UID002 → Card B

Only **association** is user-controlled.

---

#### 2.11.5 Card Association Flow (with UID ASCII Mirror)

- The NFC URL uses ASCII mirror UID. The backend resolves the UID to the associated card via a 1-to-1 mapping.

When a tag is tapped:

1. The NTAG ASCII Mirror appends its UID to the embedded URL.
2. The backend checks:
   - Is the UID **registered**?
   - Is the UID **assigned** to a user?
   - Is the UID **associated** with any of the user’s cards?

**Case A: UID is assigned but NOT associated with any card**

- Redirect user to **Tag Association Page**:
  - "This tag is not associated with any business card. Choose a card to link it."

**Case B: UID is assigned AND associated**

- Load the associated digital business card.

**Case C: UID is unregistered**

- Display: “Invalid or unknown NFC tag.”

---

#### 2.11.6 Tag Usability Rules

- A tag is **not usable** until the user associates it with a card.
- An associated tag immediately becomes live on the next tap.
- If all associations are removed, the tag returns to “inactive” state until reassociated.
- Every NFC tag can be associated with exactly one card at a time.
- A card may have multiple tags.
- A tag cannot link to multiple cards.
- Changing associations requires disassociating the tag first.

---

#### 2.11.7 Security & Validation

- All NFC resolution must be validated server-side.
- Only UIDs:
  - Registered in inventory
  - Assigned to the user
  - AND associated with a card

…are allowed to load the card.

- Unknown or inactive UIDs must **never** reveal user data.

---

#### 2.11.8 Analytics

- All analytics are aggregated into daily buckets (per card, per day).
- Dashboard charts operate exclusively on daily data.
- Range views: last 7 days, last 30 days, last 90 days, all-time based on plan.

Track:

- Taps per UID
- Taps per card (from NFC)
- First-time activation taps
- Tap history timeline (daily/weekly/monthly)

### 2.12 Offline Mode

- Progressive Web App (PWA) capability
- Offline card viewing
- Sync when connection restored
- Cache management

### 2.13 Language Support

- Multi-language interface
- Bilingual cards (dual-language display)
- RTL language support
- Translation assistance

### 2.14 Accessibility Features

- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation
- High contrast mode
- Font size adjustments

## 3. User Experience Requirements

### 3.1 Onboarding

- Interactive tutorial for new users
- Sample card templates to start
- Quick setup wizard (5 minutes or less)
- Video tutorials and help center
- Progressive disclosure of features

### 3.2 Mobile Responsiveness

- Fully responsive design
- Mobile-first approach
- Touch-optimized interface
- Native app-like experience
- Swipe gestures support

### 3.3 Performance

- Card load time < 2 seconds
- Dashboard load time < 3 seconds
- Image optimization
- Lazy loading for media
- CDN for global performance

## 4. Technical Requirements

### 4.1 Platform

- Cloud-based web application
- Progressive Web App (PWA)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile browser support (iOS Safari, Chrome Mobile)

### 4.2 Infrastructure

- The production environment will run on a containerized VPS deployment, and the development environment will run locally via Docker.
- The backend uses PostgreSQL with **Prisma ORM** as the single ORM. All database models, relations, migrations, and data access are implemented using Prisma.
- VPS hosting
- Database: PostgreSQL
- File storage: VPS storage
- CDN: CloudFlare
- 99.9% uptime SLA

### 4.3 Security

- SSL/TLS encryption
- SOC 2 Type II compliance
- Regular security audits
- Penetration testing
- Data backup and disaster recovery
- GDPR and CCPA compliance
- Two-factor authentication
- Secure file upload validation

### 4.4 APIs

- RESTful API for integrations
- Webhooks for real-time events
- API documentation
- Rate limiting
- API key management

## 5. Subscription Tiers

### 5.1 Free Tier

- 1 digital card
- Basic templates (5 designs)
- QR code generation
- Basic analytics (7-day history)
- Standard support
- Contact save limit (50 contacts)

### 5.2 Professional Tier

- 5 digital cards
- All premium templates
- Advanced analytics (90-day history)
- Custom branding
- Advanced contact exchange features
- Priority support
- Remove platform branding
- Unlimited contact saves
- Basic integrations

### 5.3 Premium Tier

- Unlimited cards
- Everything in Professional
- Advanced analytics (unlimited history)
- Advanced integrations
- Payment links
- A/B testing
- Custom CSS
- Priority phone support
- White-label option
- API access

## 6. Success Metrics

### 6.1 User Metrics

- Monthly Active Users (MAU)
- User retention rate
- Card creation completion rate
- Average cards per user
- Sharing frequency
- Profile completion rate

### 6.2 Business Metrics

- Conversion rate (free to paid)
- Customer Lifetime Value (CLV)
- Churn rate
- Net Promoter Score (NPS)
- Revenue per user
- Average subscription duration

### 6.3 Engagement Metrics

- Average session duration
- Cards viewed per visitor
- Contact save rate
- Link click-through rate
- Return visitor rate
- Feature adoption rate

## 7. Launch Strategy

### Phase 1: MVP

- User registration and authentication
- Digital card creation with basic fields
- Card customization with templates
- QR code sharing and link sharing
- Basic analytics
- Contact exchange system (non-user submissions)
- Contact management dashboard

### Phase 2: Enhancement

- Multi-card management
- User-to-user contact exchange with account linking
- Mutual connection tracking
- Advanced analytics with contact metrics
- Payment integration
- Advanced notification system

### Phase 3: Advanced Features

- Smart suggestions (AI-powered)
- Advanced integrations
- Custom contact qualification questions
- Connection network visualization
- A/B testing
- API marketplace
- Mobile apps (iOS/Android)

## 8. Support & Documentation

### 8.1 User Support

- Help center/Knowledge base
- Video tutorials
- Live chat support (Premium tier)
- Email support
- Community forum
- FAQ section

### 8.2 Documentation

- User guides
- Quick start guide
- API documentation
- Integration guides
- Best practices
- Video walkthroughs

## 9. Compliance & Legal

### 9.1 Data Protection

- GDPR compliance
- CCPA compliance
- Data processing agreements
- Privacy policy
- Terms of service
- Cookie policy
- Data export functionality
- Right to deletion

### 9.2 Accessibility

- WCAG 2.1 Level AA compliance
- Accessibility statement
- Regular accessibility audits
- Keyboard navigation support

## 10. Future Considerations

### 10.1 Potential Features

- AR business cards
- AI chatbot on cards
- Blockchain verification
- Voice-activated cards
- Social media content aggregation
- Advanced networking recommendations
- Card templates marketplace
- Professional card design service
- Networking events integration
- Business card scanner app
- Enterprise features

### 10.2 Market Expansion

- Industry-specific solutions (real estate, healthcare, legal)
- Regional customization
- Partnership with networking events
- University/student versions
- Affiliate program
- Template marketplace for designers
- Corporate partnerships
