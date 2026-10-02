/* ==========================================================================
   SiddhiVinayak Exporters - site behaviour
   --------------------------------------------------------------------------
   Progressive enhancement only. With JavaScript disabled the site remains
   fully readable and navigable: every product, policy and contact detail is
   present in the HTML, the mobile menu degrades to a visible link list, the
   consent banner is not shown (so no optional storage or script is created)
   and the enquiry form falls back to a plain email link.

   Modules
     config   - reads assets/js/site-config.js and fills the page
     nav      - small-screen navigation toggle
     consent  - cookie / storage consent banner and preferences
     filters  - product range filter on products.html
     enquiry  - contact form validation, consent gate and transport
   ========================================================================== */
(function () {
  'use strict';

  var FALLBACK_CONFIG = {
    brandName: 'Siddhi Vinayak Exporters',
    brandTagline: 'Quality that speaks for itself',
    contact: { email: '', phone: '', whatsapp: '', addressLines: [], country: '' },
    registrations: [],
    dpo: { name: '', role: '', email: '' },
    form: { endpoint: '', maxMessage: 1200, minSeconds: 2 },
    consent: { version: '1', storageKey: 'sv-exporters-consent' },
    analytics: { provider: '', measurementId: '' },
    lastReviewed: ''
  };

  var CONFIG = Object.assign({}, FALLBACK_CONFIG, window.SV_CONFIG || {});
  CONFIG.contact = Object.assign({}, FALLBACK_CONFIG.contact, CONFIG.contact || {});
  CONFIG.form = Object.assign({}, FALLBACK_CONFIG.form, CONFIG.form || {});
  CONFIG.consent = Object.assign({}, FALLBACK_CONFIG.consent, CONFIG.consent || {});
  CONFIG.analytics = Object.assign({}, FALLBACK_CONFIG.analytics, CONFIG.analytics || {});

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function has(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function brandLabel() {
    return has(CONFIG.legalName) ? CONFIG.legalName : CONFIG.brandName;
  }

  /* Reveals a configured value and its wrapper. Values that are not configured
     stay hidden, so the page never shows an empty or invented detail. */
  function reveal(node) {
    node.hidden = false;
    var wrap = node.closest('[data-config-wrap]');
    if (wrap) wrap.hidden = false;
  }

  /* ------------------------------------------------------------------------
     config - push values from site-config.js into the markup.
     Anything not configured is left out rather than filled with a guess.
     ---------------------------------------------------------------------- */
  var config = {
    init: function () {
      $$('[data-brand-name]').forEach(function (node) {
        node.textContent = CONFIG.brandName;
      });

      $$('[data-legal-name]').forEach(function (node) {
        node.textContent = brandLabel();
      });

      $$('[data-brand-tagline]').forEach(function (node) {
        node.textContent = CONFIG.brandTagline;
      });

      $$('[data-last-reviewed]').forEach(function (node) {
        if (has(CONFIG.lastReviewed)) node.textContent = CONFIG.lastReviewed;
      });

      $$('[data-config="email"]').forEach(function (node) {
        if (!has(CONFIG.contact.email)) return;
        var link = document.createElement('a');
        link.textContent = CONFIG.contact.email;
        link.href = 'mailto:' + CONFIG.contact.email;
        node.textContent = '';
        node.appendChild(link);
        reveal(node);
      });

      $$('[data-config="phone"]').forEach(function (node) {
        if (!has(CONFIG.contact.phone)) return;
        var digits = CONFIG.contact.phone.replace(/[^+\d]/g, '');
        var link = document.createElement('a');
        link.textContent = CONFIG.contact.phone;
        link.href = 'tel:' + digits;
        node.textContent = '';
        node.appendChild(link);
        reveal(node);
      });

      var addressNode = $('[data-config="address"]');
      if (addressNode) {
        var lines = (CONFIG.contact.addressLines || []).filter(has);
        if (lines.length) {
          addressNode.textContent =
            lines.join(', ') + (has(CONFIG.contact.country) ? ', ' + CONFIG.contact.country : '');
          reveal(addressNode);
        }
      }

      var regList = $('[data-registration-list]');
      if (regList) {
        var filled = (CONFIG.registrations || []).filter(function (item) {
          return item && has(item.value);
        });
        var holder = regList.closest('[data-registration-block]');
        if (!filled.length) {
          regList.hidden = true;
          if (holder) holder.hidden = true;
        } else {
          regList.textContent = '';
          filled.forEach(function (item) {
            var li = document.createElement('li');
            var strong = document.createElement('strong');
            strong.textContent = item.label + ':';
            li.appendChild(strong);
            li.insertAdjacentText('beforeend', ' ' + item.value);
            regList.appendChild(li);
          });
        }
      }

      var dpoBlock = $('[data-dpo-block]');
      if (dpoBlock) {
        var dpoEmail = $('[data-dpo-email]', dpoBlock);
        if (dpoEmail && has(CONFIG.dpo.email)) {
          dpoEmail.textContent = CONFIG.dpo.email;
          dpoEmail.href = 'mailto:' + CONFIG.dpo.email;
        }
        var dpoName = $('[data-dpo-name]', dpoBlock);
        if (dpoName && has(CONFIG.dpo.name)) {
          dpoName.textContent = CONFIG.dpo.name;
        }
      }
    }
  };

  /* ------------------------------------------------------------------------
     nav - accessible small-screen menu.
     ---------------------------------------------------------------------- */
  var nav = {
    init: function () {
      var toggle = $('[data-nav-toggle]');
      var menu = $('[data-nav-menu]');
      if (!toggle || !menu) return;

      function setOpen(open) {
        menu.setAttribute('data-open', open ? 'true' : 'false');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      setOpen(false);

      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });

      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) setOpen(false);
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          toggle.focus();
        }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > 960) setOpen(false);
      });
    }
  };

  /* ------------------------------------------------------------------------
     consent - cookie / local storage consent.
     Nothing but strictly necessary storage exists before a choice is made.
     The banner markup sits at the top of the page (early in the tab order)
     and CSS positions it at the bottom of the viewport.
     ---------------------------------------------------------------------- */
  var consent = {
    banner: null,
    panel: null,
    status: null,
    analyticsInput: null,
    mediaInput: null,

    read: function () {
      try {
        var raw = window.localStorage.getItem(CONFIG.consent.storageKey);
        if (!raw) return null;
        var saved = JSON.parse(raw);
        if (!saved || saved.version !== CONFIG.consent.version) return null;
        return saved;
      } catch (error) {
        return null;
      }
    },

    write: function (state) {
      try {
        window.localStorage.setItem(
          CONFIG.consent.storageKey,
          JSON.stringify({
            version: CONFIG.consent.version,
            decidedAt: new Date().toISOString(),
            essential: true,
            analytics: !!state.analytics,
            media: !!state.media
          })
        );
      } catch (error) {
        /* Storage can be blocked (private mode, browser policy). The site
           still works; the choice is simply not remembered. */
      }
    },

    /* Optional measurement is injected only after an explicit opt-in and only
       when a provider is configured in site-config.js. */
    apply: function (state) {
      var analytics = CONFIG.analytics || {};
      if (!state.analytics) return;
      if (!has(analytics.provider) || !has(analytics.measurementId)) return;
      if ($('script[data-consented-analytics]')) return;

      var script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-consented-analytics', analytics.provider);

      if (analytics.provider === 'plausible') {
        script.src = 'https://plausible.io/js/script.js';
        script.setAttribute('data-domain', window.location.hostname);
      } else if (analytics.provider === 'ga4') {
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + analytics.measurementId;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'granted'
        });
        window.gtag('config', analytics.measurementId, { anonymize_ip: true });
      } else {
        return;
      }

      document.head.appendChild(script);
    },

    hide: function () {
      if (this.banner) this.banner.hidden = true;
      if (this.panel) this.panel.hidden = true;
    },

    show: function (openPanel) {
      if (!this.banner) return;
      this.banner.hidden = false;
      var state = this.read();
      if (state) {
        if (this.analyticsInput) this.analyticsInput.checked = !!state.analytics;
        if (this.mediaInput) this.mediaInput.checked = !!state.media;
      }
      var manage = $('[data-consent-manage]', this.banner);
      if (openPanel && this.panel) {
        this.panel.hidden = false;
        if (manage) manage.setAttribute('aria-expanded', 'true');
        if (this.analyticsInput) this.analyticsInput.focus();
      }
    },

    save: function (state) {
      this.write(state);
      this.apply(state);
      this.hide();
    },

    init: function () {
      this.banner = $('[data-consent-banner]');
      if (!this.banner) return;

      this.panel = $('[data-consent-panel]', this.banner);
      this.status = $('[data-consent-status]', this.banner);
      this.analyticsInput = $('#consent-analytics');
      this.mediaInput = $('#consent-media');

      var self = this;

      var saved = this.read();
      if (saved) {
        this.apply(saved);
        this.banner.hidden = true;
      } else {
        this.banner.hidden = false;
      }

      $$('[data-consent-accept]', this.banner).forEach(function (button) {
        button.addEventListener('click', function () {
          if (self.analyticsInput) self.analyticsInput.checked = true;
          if (self.mediaInput) self.mediaInput.checked = true;
          self.save({ analytics: true, media: true });
        });
      });

      $$('[data-consent-reject]', this.banner).forEach(function (button) {
        button.addEventListener('click', function () {
          if (self.analyticsInput) self.analyticsInput.checked = false;
          if (self.mediaInput) self.mediaInput.checked = false;
          self.save({ analytics: false, media: false });
        });
      });

      $$('[data-consent-manage]', this.banner).forEach(function (button) {
        button.addEventListener('click', function () {
          if (!self.panel) return;
          var opening = self.panel.hidden;
          self.panel.hidden = !opening;
          button.setAttribute('aria-expanded', opening ? 'true' : 'false');
          if (opening && self.analyticsInput) self.analyticsInput.focus();
        });
      });

      $$('[data-consent-save]', this.banner).forEach(function (button) {
        button.addEventListener('click', function () {
          self.save({
            analytics: !!(self.analyticsInput && self.analyticsInput.checked),
            media: !!(self.mediaInput && self.mediaInput.checked)
          });
          if (self.status) {
            self.status.textContent = 'Your cookie preferences have been saved.';
          }
        });
      });

      /* Footer and policy page buttons that re-open the banner. */
      $$('[data-consent-open]').forEach(function (button) {
        button.addEventListener('click', function () {
          self.show(true);
          if (self.banner) self.banner.scrollIntoView({ block: 'nearest' });
        });
      });

      this.banner.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && self.panel && !self.panel.hidden) {
          self.panel.hidden = true;
        }
      });
    }
  };

  /* ------------------------------------------------------------------------
     filters - product range filter on products.html.
     Starts from a fully rendered list; without JS every range stays visible.
     ---------------------------------------------------------------------- */
  var filters = {
    init: function () {
      var list = $('[data-product-list]');
      if (!list) return;

      var buttons = $$('[data-filter-value]');
      var status = $('[data-filter-status]');
      var cards = $$('[data-category]', list);
      if (!buttons.length || !cards.length) return;

      function apply(value) {
        var shown = 0;
        cards.forEach(function (card) {
          var categories = (card.getAttribute('data-category') || '').split(/\s+/);
          var match = value === 'all' || categories.indexOf(value) !== -1;
          card.hidden = !match;
          if (match) shown += 1;
        });

        buttons.forEach(function (button) {
          button.setAttribute(
            'aria-pressed',
            button.getAttribute('data-filter-value') === value ? 'true' : 'false'
          );
        });

        if (status) {
          var label = value === 'all' ? 'all product ranges' : value;
          status.textContent = shown + ' of ' + cards.length + ' items shown (' + label + ').';
        }
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          apply(button.getAttribute('data-filter-value'));
        });
      });

      var hash = window.location.hash.replace('#', '');
      var known = buttons.map(function (button) {
        return button.getAttribute('data-filter-value');
      });
      apply(known.indexOf(hash) !== -1 ? hash : 'all');
    }
  };

  /* ------------------------------------------------------------------------
     enquiry - contact form.
     Validation follows WCAG advice: an error summary at the top of the form,
     inline messages tied to each control with aria-describedby, the invalid
     control marked with aria-invalid, and focus moved to the first problem.
     Consent (DPDP Act 2023) is a separate, unticked checkbox - the form will
     not submit without it.
     ---------------------------------------------------------------------- */
  var enquiry = {
    form: null,
    status: null,
    summary: null,
    startedAt: 0,

    rules: {
      name: {
        test: function (value) {
          return value.trim().length >= 2;
        }
      },
      email: {
        test: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
        }
      },
      country: {
        test: function (value) {
          return value.trim().length >= 2;
        }
      },
      product: {
        test: function (value) {
          return value !== '';
        }
      },
      message: {
        test: function (value) {
          return value.trim().length >= 20;
        }
      },
      consent: {
        test: function (_value, field) {
          return !!field.checked;
        }
      }
    },

    validate: function () {
      var form = this.form;
      var problems = [];

      Object.keys(this.rules).forEach(function (name) {
        var field = form.elements[name];
        if (!field) return;
        var value = field.type === 'checkbox' ? '' : field.value;
        var ok = enquiry.rules[name].test(value, field);
        var wrapper = field.closest('.field, .choice');
        if (wrapper) wrapper.setAttribute('data-invalid', ok ? 'false' : 'true');
        field.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) {
          var errorNode = document.getElementById('err-' + name);
          problems.push({
            message: errorNode ? errorNode.textContent.trim() : 'Please check this field.',
            field: field
          });
        }
      });

      return problems;
    },

    clearState: function () {
      $$('.field[data-invalid="true"], .choice[data-invalid="true"]', this.form).forEach(
        function (wrapper) {
          wrapper.setAttribute('data-invalid', 'false');
          var control = $('input, select, textarea', wrapper);
          if (control) control.setAttribute('aria-invalid', 'false');
        }
      );
      if (this.summary) {
        this.summary.hidden = true;
        this.summary.textContent = '';
      }
    },

    showSummary: function (problems) {
      if (!this.summary) return;
      this.summary.textContent = '';
      this.summary.hidden = false;

      var heading = document.createElement('p');
      heading.textContent =
        'There ' +
        (problems.length === 1 ? 'is 1 problem' : 'are ' + problems.length + ' problems') +
        ' with your enquiry:';
      var strong = document.createElement('strong');
      strong.textContent = heading.textContent;
      heading.textContent = '';
      heading.appendChild(strong);
      this.summary.appendChild(heading);

      var list = document.createElement('ul');
      problems.forEach(function (problem) {
        var li = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + problem.field.id;
        link.textContent = problem.message;
        li.appendChild(link);
        list.appendChild(li);
      });
      this.summary.appendChild(list);
    },

    showStatus: function (message, kind) {
      if (!this.status) return;
      this.status.hidden = false;
      this.status.className = 'form-status form-status--' + kind;
      this.status.innerHTML = message;
    },

    payload: function () {
      var form = this.form;
      var data = {};
      ['name', 'company', 'email', 'phone', 'country', 'product', 'quantity', 'incoterm', 'message']
        .forEach(function (key) {
          if (form.elements[key]) data[key] = form.elements[key].value.trim();
        });
      data.consent = form.elements.consent && form.elements.consent.checked ? 'given' : 'not given';
      data.page = window.location.href;
      data.submittedAt = new Date().toISOString();
      return data;
    },

    mailtoHref: function (data) {
      var to = has(CONFIG.contact.email) ? CONFIG.contact.email : '';
      var subject =
        'Export enquiry - ' + (data.product || 'products') + ' - ' + (data.company || data.name);
      var body = [
        'Name: ' + data.name,
        'Company: ' + data.company,
        'Email: ' + data.email,
        'Phone: ' + data.phone,
        'Country: ' + data.country,
        'Product interest: ' + data.product,
        'Quantity / packing: ' + data.quantity,
        'Preferred Incoterm: ' + data.incoterm,
        '',
        data.message,
        '',
        'Consent given to processing this enquiry under the privacy notice: ' + data.consent
      ].join('\n');

      return (
        'mailto:' +
        to +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(body)
      );
    },

    onSubmit: function (event) {
      event.preventDefault();
      this.clearState();

      /* Honeypot: a human never fills this off-screen field. */
      if (this.form.elements.website && this.form.elements.website.value !== '') return;

      if (Date.now() - this.startedAt < (CONFIG.form.minSeconds || 2) * 1000) {
        this.showStatus(
          'Please take a moment to review your enquiry, then submit again.',
          'error'
        );
        return;
      }

      var problems = this.validate();
      if (problems.length) {
        this.showSummary(problems);
        problems[0].field.focus();
        return;
      }

      var data = this.payload();
      var mailto = this.mailtoHref(data);

      if (has(CONFIG.form.endpoint)) {
        var self = this;
        this.showStatus('Sending your enquiry&hellip;', 'success');

        fetch(CONFIG.form.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        })
          .then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            self.form.reset();
            self.showStatus(
              '<strong>Thank you. Your enquiry has been sent.</strong> ' +
                'We normally reply within two working days.',
              'success'
            );
          })
          .catch(function () {
            self.showStatus(
              '<strong>Your enquiry could not be sent automatically.</strong> ' +
                (has(CONFIG.contact.email)
                  ? 'Please send it by email instead: <a href="' +
                    mailto +
                    '">open the enquiry in your email app</a>, or try again later.'
                  : 'Please try again later.'),
              'error'
            );
          });
        return;
      }

      /* No endpoint configured: hand the enquiry to the visitor's mail client
         so that no enquiry is silently lost. */
      if (!has(CONFIG.contact.email)) {
        this.showStatus(
          '<strong>This form is not connected to a mailbox yet, so nothing was sent.</strong> ' +
            'The site owner still needs to set <code>form.endpoint</code> or ' +
            '<code>contact.email</code> in <code>assets/js/site-config.js</code>. ' +
            'Until that is done, please use the contact details published on this site.',
          'error'
        );
        return;
      }

      window.location.href = mailto;
      this.showStatus(
        '<strong>Almost done.</strong> Your email app should open with the enquiry ready to send. ' +
          'If nothing happened, <a href="' +
          mailto +
          '">open the enquiry in your email app</a> or write to <a href="mailto:' +
          CONFIG.contact.email +
          '">' +
          CONFIG.contact.email +
          '</a>.',
        'success'
      );
    },

    init: function () {
      var form = $('[data-enquiry-form]');
      if (!form) return;

      this.form = form;
      this.status = $('[data-form-status]', form.parentNode);
      this.summary = $('[data-form-errors]', form.parentNode);
      this.startedAt = Date.now();

      var self = this;

      form.addEventListener('submit', function (event) {
        self.onSubmit(event);
      });

      form.addEventListener('reset', function () {
        window.setTimeout(function () {
          self.clearState();
          if (self.status) self.status.hidden = true;
        }, 0);
      });

      $$('.field input, .field select, .field textarea, .choice input', form).forEach(
        function (control) {
          var eventName = control.type === 'checkbox' ? 'change' : 'input';
          control.addEventListener(eventName, function () {
            var wrapper = control.closest('.field, .choice');
            if (!wrapper || wrapper.getAttribute('data-invalid') !== 'true') return;
            wrapper.setAttribute('data-invalid', 'false');
            control.setAttribute('aria-invalid', 'false');
          });
        }
      );
    }
  };

  /* ------------------------------------------------------------------------
     whatsapp - build wa.me links from the small enquiry inputs.
     Always opens WhatsApp to the configured number with a prefilled
     message; works without JS via the plain link fallback in HTML.
     ---------------------------------------------------------------------- */
  var whatsapp = {
    number: function () {
      var raw = (CONFIG.contact && CONFIG.contact.whatsapp) || '';
      var digits = String(raw).replace(/\D/g, '');
      return digits;
    },

    init: function () {
      var self = this;
      $$('[data-whatsapp-form]').forEach(function (form) {
        // Keep the plain fallback link in sync with the configured number.
        var fallback = $('[data-whatsapp-link]', form);
        if (fallback && self.number()) {
          fallback.href =
            'https://wa.me/' +
            self.number() +
            '?text=' +
            encodeURIComponent('Hello Siddhi Vinayak Exporters, I want to enquire about your products.');
        }
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var name = form.elements.name ? form.elements.name.value.trim() : '';
          var product = form.elements.product ? form.elements.product.value : '';
          var message = form.elements.message ? form.elements.message.value.trim() : '';
          if (!name || !product || !message) {
            if (!name && form.elements.name) form.elements.name.focus();
            else if (!product && form.elements.product) form.elements.product.focus();
            else if (form.elements.message) form.elements.message.focus();
            return;
          }
          var text =
            'Hello Siddhi Vinayak Exporters, I am ' +
            name +
            '. I want to enquire about ' +
            product +
            ': ' +
            message;
          var url =
            'https://wa.me/' + self.number() + '?text=' + encodeURIComponent(text);
          window.open(url, '_blank', 'noopener');
        });
      });
    }
  };

  /* ------------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  function boot() {
    config.init();
    nav.init();
    consent.init();
    filters.init();
    enquiry.init();
    whatsapp.init();
    document.documentElement.setAttribute('data-js', 'ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
