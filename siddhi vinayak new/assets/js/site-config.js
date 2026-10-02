/* ==========================================================================
   Site configuration - single place for business, legal and consent settings
   --------------------------------------------------------------------------
   EVERYTHING IN THIS FILE MUST BE CONFIRMED BY THE BUSINESS OWNER BEFORE THE
   SITE GOES LIVE. Run `node tools/check-config.mjs` to see what is still
   missing. Any field left as an empty string is simply not rendered on the
   site - the site never invents, guesses or pre-fills statutory identifiers,
   registration numbers or certifications.

   Legal note: publishing an IEC, GSTIN, FSSAI licence number, Spices Board
   CRES number or APEDA RCMC number that you do not hold is a false claim.
   Fill these in only from the actual certificates.
   ========================================================================== */
window.SV_CONFIG = {
  /* Legal entity name as it appears on the GST / IEC certificate. */
  legalName: '',

  /* Public brand name used across the site. */
  brandName: 'Siddhi Vinayak Exporters',

  /* Official line shown with the logo and in the footer. */
  brandTagline: 'Quality that speaks for itself',

  contact: {
    /* Enquiries email. Leave empty until the mailbox exists - the contact
       form falls back to a clear, on-page instruction when this is blank. */
    email: '',
    phone: '+91 97120 11025',
    whatsapp: '919712011025',
    /* Registered / correspondence address, one line per entry. */
    addressLines: [],
    country: 'India'
  },

  /* Statutory and regulatory identifiers. Only filled entries are shown.
     Suggested keys (rename freely): IEC, GSTIN, FSSAI licence,
     Spices Board CRES, APEDA RCMC, Udyam / MSME. */
  registrations: [
    { label: 'IEC (DGFT)', value: '' },
    { label: 'GSTIN', value: '' },
    { label: 'FSSAI licence', value: '' },
    { label: 'Spices Board registration', value: '' },
    { label: 'APEDA RCMC', value: '' }
  ],

  /* Designated contact for data protection questions and grievances.
     Required by the DPDP Act 2023 - see privacy.html. */
  dpo: {
    name: '',
    role: 'Grievance Officer / Data Protection contact',
    email: ''
  },

  /* Contact form transport.
     endpoint   - optional HTTPS URL of a form handler (Formspree, Web3Forms,
                  your own API). When empty the form composes an email in the
                  visitor's mail client instead, so no enquiry is lost.
     maxMessage - advisory character limit shown to the visitor. */
  form: {
    endpoint: '',
    maxMessage: 1200,
    /* Minimum seconds a human needs before the form will submit (bot filter). */
    minSeconds: 2
  },

  /* Cookie / storage consent. Bump `version` whenever the policies change so
     returning visitors are asked again. */
  consent: {
    version: '2026-09-26',
    storageKey: 'sv-exporters-consent'
  },

  /* Third-party measurement. Nothing loads until the visitor opts in AND a
     provider below is configured. Supported: '' (none), 'plausible', 'ga4'. */
  analytics: {
    provider: '',
    measurementId: ''
  },

  /* Date shown on the legal pages and in the footer. Update whenever the
     policies or site content change. */
  lastReviewed: '26 September 2026'
};
