import { getSettings, saveSettings } from './data.js';
import { showError, showToast } from './app.js';

const form = document.querySelector('#settings-form');
const settings = getSettings();

Object.entries(settings).forEach(([name, value]) => {
  if (form.elements[name]) form.elements[name].value = value;
});
document.querySelector('#color-value').textContent = settings.primaryColor;

form.elements.primaryColor.addEventListener('input', (event) => {
  document.querySelector('#color-value').textContent = event.target.value;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  try {
    saveSettings(values);
    document.querySelector('#settings-saved').textContent =
      `Saved at ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date())}`;
    showToast('Settings saved.');
  } catch (error) {
    showError(error);
  }
});
