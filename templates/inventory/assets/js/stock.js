import { createMovement, getMovements, getProducts } from './data.js';
import {
  closeDialog,
  escapeHtml,
  formatDate,
  openDialog,
  showError,
  showToast,
} from './app.js';

const form = document.querySelector('#movement-form');
const modal = document.querySelector('#movement-modal');
const dateInput = form.elements.date;
const today = new Date();
dateInput.value = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);

const populateProducts = () => {
  form.elements.productId.innerHTML =
    '<option value="">Choose product</option>' +
    getProducts()
      .map(
        (product) =>
          `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${escapeHtml(product.sku)} (${product.quantity} in stock)</option>`
      )
      .join('');
};

const renderMovements = () => {
  const query = document
    .querySelector('#movement-search')
    .value.trim()
    .toLowerCase();
  const type = document.querySelector('#movement-type-filter').value;
  const month = document.querySelector('#movement-date-filter').value;
  const allMovements = getMovements()
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date));
  const movements = allMovements.filter((movement) => {
    const matchesText =
      !query ||
      [movement.productName, movement.sku, movement.notes].some((value) =>
        value.toLowerCase().includes(query)
      );
    return (
      matchesText &&
      (!type || movement.type === type) &&
      (!month || movement.date.startsWith(month))
    );
  });
  document.querySelector('#movements-table').innerHTML =
    movements
      .map((movement) => {
        const isIn = movement.quantity > 0;
        const typeLabel =
          movement.type === 'in'
            ? 'Stock in'
            : movement.type === 'out'
              ? 'Stock out'
              : 'Adjustment';
        const movementClass =
          movement.type === 'adjustment'
            ? 'movement-tag-adjustment'
            : isIn
              ? 'movement-tag-in'
              : 'movement-tag-out';
        return `<tr><td>${formatDate(movement.date)}</td><td><strong>${escapeHtml(movement.productName)}</strong></td><td class="text-muted">${escapeHtml(movement.sku)}</td>
      <td><span class="movement-tag ${movementClass}">${typeLabel}</span></td><td><strong class="${isIn ? 'text-positive' : 'text-negative'}">${isIn ? '+' : ''}${movement.quantity}</strong></td>
      <td class="text-muted">${escapeHtml(movement.notes || '—')}</td></tr>`;
      })
      .join('') ||
    '<tr><td colspan="6"><div class="empty-state"><span class="empty-icon">⇄</span><strong>No movements found</strong><span>Record stock activity or change the selected filters.</span></div></td></tr>';
  document.querySelector('#movement-count').textContent =
    `${movements.length} of ${allMovements.length} movements`;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthly = allMovements.filter((movement) =>
    movement.date.startsWith(currentMonth)
  );
  document.querySelector('#movement-month-count').textContent = String(
    monthly.length
  );
  document.querySelector('#movement-in-count').textContent =
    new Intl.NumberFormat().format(
      monthly
        .filter((item) => item.type === 'in')
        .reduce((sum, item) => sum + Math.abs(item.quantity), 0)
    );
  document.querySelector('#movement-out-count').textContent =
    new Intl.NumberFormat().format(
      monthly
        .filter((item) => item.type === 'out')
        .reduce((sum, item) => sum + Math.abs(item.quantity), 0)
    );
};

const updateQuantityHint = () => {
  const adjustment = form.elements.type.value === 'adjustment';
  form.elements.quantity.min = adjustment ? '-999999' : '1';
  document.querySelector('[data-adjustment-hint]').hidden = !adjustment;
  document.querySelector('[data-quantity-label]').textContent = adjustment
    ? 'Signed quantity change'
    : 'Quantity';
};

const exportCsv = () => {
  const query = document
    .querySelector('#movement-search')
    .value.trim()
    .toLowerCase();
  const type = document.querySelector('#movement-type-filter').value;
  const month = document.querySelector('#movement-date-filter').value;
  const rows = getMovements().filter(
    (movement) =>
      (!query ||
        [movement.productName, movement.sku, movement.notes].some((value) =>
          value.toLowerCase().includes(query)
        )) &&
      (!type || movement.type === type) &&
      (!month || movement.date.startsWith(month))
  );
  const csvCell = (value) => {
    const safeValue = /^[=+\-@]/.test(String(value))
      ? `'${value}`
      : String(value);
    return `"${safeValue.replaceAll('"', '""')}"`;
  };
  const csv = [
    ['Date', 'Product', 'SKU', 'Movement', 'Quantity change', 'Notes'],
    ...rows.map((movement) => [
      movement.date,
      movement.productName,
      movement.sku,
      movement.type,
      movement.quantity,
      movement.notes,
    ]),
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'stock-movements.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};

document.querySelector('[data-open-movement]').addEventListener('click', () => {
  if (!getProducts().length) {
    showToast('Add a product before recording stock.', 'error');
    return;
  }
  populateProducts();
  form.reset();
  dateInput.value = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
  form.elements.type.value = 'in';
  updateQuantityHint();
  openDialog(modal);
});

form.elements.type.addEventListener('change', updateQuantityHint);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  try {
    createMovement(values);
    closeDialog(modal);
    showToast('Stock movement recorded.');
  } catch (error) {
    showError(error);
  }
});

document
  .querySelector('#movement-search')
  .addEventListener('input', renderMovements);
document
  .querySelector('#movement-type-filter')
  .addEventListener('change', renderMovements);
document
  .querySelector('#movement-date-filter')
  .addEventListener('change', renderMovements);
document
  .querySelector('#export-movements')
  .addEventListener('click', exportCsv);

populateProducts();
updateQuantityHint();
renderMovements();
window.addEventListener('inventory:changed', () => {
  populateProducts();
  renderMovements();
});
