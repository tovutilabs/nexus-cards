UPDATE card_templates 
SET config = jsonb_set(
  config,
  '{customCss}',
  to_jsonb('/* Basic Business Card - clean profile layout with gradient header */

.card-basic-container {
  width: 100% !important;
  max-width: 420px !important;
  min-height: 780px !important;
  margin: 0 auto !important;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 45px rgba(15, 23, 42, 0.15);
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  font-family: ''Inter'', ''Segoe UI'', system-ui, -apple-system, sans-serif;
}

.card-basic-header {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  padding: 2.25rem 1.5rem 2.75rem;
  text-align: center;
  color: #ffffff;
  position: relative;
}

.card-basic-header::before,
.card-basic-header::after {
  content: '''';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.card-basic-header::before {
  width: 128px;
  height: 128px;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}

.card-basic-header::after {
  width: 96px;
  height: 96px;
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
}

.card-basic-avatar {
  width: 112px;
  height: 112px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background: #e2e8f0;
  position: relative;
  z-index: 10;
}

.card-basic-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-basic-avatar-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #cbd5e1, #e2e8f0);
}

.card-basic-name {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 0.25rem;
  position: relative;
  z-index: 10;
}

.card-basic-title {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.95;
  color: #dbeafe;
  position: relative;
  z-index: 10;
}

.card-basic-company {
  font-size: 0.9rem;
  opacity: 0.8;
  color: rgba(219, 234, 254, 0.8);
  margin-top: 0.25rem;
  position: relative;
  z-index: 10;
}

.card-basic-contact {
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
}

.card-basic-contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-basic-contact-item:hover {
  background: #f1f5f9;
  transform: scale(0.98);
}

.card-basic-contact-item:active {
  transform: scale(0.96);
}

.card-basic-contact-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.card-basic-contact-icon.email {
  background: #dbeafe;
  color: #2563eb;
}

.card-basic-contact-icon.phone {
  background: #dcfce7;
  color: #16a34a;
}

.card-basic-contact-icon.website {
  background: #f3e8ff;
  color: #9333ea;
}

.card-basic-contact-icon.location {
  background: #fed7aa;
  color: #ea580c;
}

.card-basic-contact-icon svg {
  width: 20px;
  height: 20px;
}

.card-basic-contact-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  text-align: left;
}

.card-basic-contact-label {
  font-size: 0.75rem;
  text-transform: capitalize;
  letter-spacing: 0.02em;
  color: #64748b;
  font-weight: 500;
}

.card-basic-contact-value {
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 500;
}

.card-basic-social {
  padding: 1.5rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.card-basic-social-title {
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 1rem;
}

.card-basic-social-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.card-basic-social-link {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-basic-social-link.linkedin {
  background: #2563eb;
}

.card-basic-social-link.linkedin:hover {
  background: #1d4ed8;
}

.card-basic-social-link.twitter {
  background: #0ea5e9;
}

.card-basic-social-link.twitter:hover {
  background: #0284c7;
}

.card-basic-social-link.github {
  background: #1e293b;
}

.card-basic-social-link.github:hover {
  background: #0f172a;
}

.card-basic-social-link:active {
  transform: scale(0.95);
}

.card-basic-social-link svg {
  width: 20px;
  height: 20px;
  color: #ffffff;
}

.card-basic-actions {
  padding: 1.5rem 1.5rem;
  background: #ffffff;
}

.card-basic-button {
  width: 100%;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
  transition: all 0.2s ease;
}

.card-basic-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4);
}

.card-basic-button:active {
  transform: translateY(0);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

@media (max-width: 480px) {
  .card-basic-container {
    border-radius: 16px;
    min-height: 720px !important;
  }

  .card-basic-header {
    padding: 1.75rem 1.25rem 2.25rem;
  }

  .card-basic-avatar {
    width: 100px;
    height: 100px;
  }

  .card-basic-name {
    font-size: 1.5rem;
  }
  
  .card-basic-title {
    font-size: 0.9rem;
  }
  
  .card-basic-contact {
    padding: 1.25rem 1.25rem;
  }
  
  .card-basic-social,
  .card-basic-actions {
    padding: 1.25rem 1.25rem;
  }
}'::text)
)
WHERE slug = 'basic-business';
