import { getCategories, getSettings } from './data.js';

const currencyFormatter = () => {
  const { currency } = getSettings();
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency });
  } catch (error) {
    throw new Error(`Unsupported currency "${currency}": ${error.message}`, {
      cause: error,
    });
  }
};

export const formatCurrency = (amount) =>
  currencyFormatter().format(Number(amount) || 0);

export const formatDate = (date) => {
  if (!date) return '—';
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        parsedDate
      );
};

export const escapeHtml = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]
  );

export const getCategoryName = (categoryId) =>
  getCategories().find((category) => category.id === categoryId)?.name ||
  'Uncategorized';

export const showToast = (message, type = 'success') => {
  const region = document.querySelector('#toast-region');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3800);
};

export const showError = (error) => {
  showToast(error instanceof Error ? error.message : String(error), 'error');
};

export const openDialog = (dialog) => {
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
};

export const closeDialog = (dialog) => {
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
};

export const setButtonLoading = (button, loading, text = 'Saving…') => {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
};

const updateIdentity = () => {
  const settings = getSettings();
  document.querySelectorAll('.app-name').forEach((element) => {
    element.textContent = settings.appName;
  });
  document
    .querySelectorAll('.business-name, .breadcrumb-business')
    .forEach((element) => {
      element.textContent = settings.businessName;
    });
  const title = document.querySelector('#page-title');
  const routeTitle = document.querySelector(
    `[data-route="${document.body.dataset.page}"]`
  );
  if (title && routeTitle)
    title.textContent = routeTitle.textContent
      .trim()
      .replace(/^[⌂▦▤⇄◷⚙]\s*/, '');
  document.title = `${settings.appName} · ${settings.businessName}`;
  document.documentElement.style.setProperty('--accent', settings.primaryColor);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', settings.primaryColor);
  const logo = document.querySelector('.business-logo');
  const avatar = document.querySelector('.avatar-button .business-avatar');
  if (logo && avatar) {
    if (settings.businessLogo) {
      logo.src = settings.businessLogo;
      logo.hidden = false;
      avatar.hidden = true;
      logo.onerror = () => {
        logo.hidden = true;
        avatar.hidden = false;
      };
    } else {
      logo.hidden = true;
      avatar.hidden = false;
    }
  }
};

const initializeNavigation = () => {
  const { page } = document.body.dataset;
  document
    .querySelector(`[data-route="${page}"]`)
    ?.classList.add('nav-link-active');
  const sidebar = document.querySelector('#app-sidebar');
  const toggle = document.querySelector('[data-sidebar-toggle]');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const isMobile = window.matchMedia('(max-width: 820px)').matches;
  toggle?.setAttribute('aria-expanded', String(!isMobile));
  toggle?.setAttribute(
    'aria-label',
    isMobile ? 'Open navigation' : 'Collapse navigation'
  );

  const closeSidebar = () => {
    sidebar?.classList.remove('sidebar-open');
    backdrop?.classList.remove('sidebar-backdrop-visible');
    toggle?.setAttribute('aria-expanded', 'false');
  };
  toggle?.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 820px)').matches) {
      const isOpen = sidebar?.classList.toggle('sidebar-open');
      backdrop?.classList.toggle('sidebar-backdrop-visible', Boolean(isOpen));
      toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
      toggle.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation' : 'Open navigation'
      );
      return;
    }
    const collapsed = document
      .querySelector('.app-shell')
      ?.classList.toggle('sidebar-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute(
      'aria-label',
      collapsed ? 'Expand navigation' : 'Collapse navigation'
    );
  });
  backdrop?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSidebar();
  });

  document
    .querySelector('[data-global-search]')
    ?.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = new FormData(event.currentTarget)
        .get('search')
        ?.toString()
        .trim();
      if (query)
        window.location.href = `/products.html?search=${encodeURIComponent(query)}`;
    });
  document
    .querySelector('[data-settings-link]')
    ?.addEventListener('click', () => {
      window.location.href = '/settings.html';
    });
};

const initializeDialogs = () => {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-dialog]'))
      closeDialog(event.target.closest('dialog'));
    if (event.target.matches('dialog.modal')) closeDialog(event.target);
  });
};

const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      showError(
        new Error(`Service worker registration failed: ${error.message}`, {
          cause: error,
        })
      );
    });
  });
};

const initialize = () => {
  updateIdentity();
  initializeNavigation();
  initializeDialogs();
  registerServiceWorker();
  window.addEventListener('inventory:settings-changed', updateIdentity);
};

initialize();
