import { getCategories, getMovements, getProducts } from './data.js';
import {
  escapeHtml,
  formatCurrency,
  formatDate,
  showError,
  showToast,
} from './app.js';

const getReportData = () => {
  const products = getProducts();
  const categories = getCategories();
  const movements = getMovements()
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date));
  const lowStock = products.filter(
    (product) => product.quantity <= product.minStock
  );
  return { products, categories, movements, lowStock };
};

const renderReports = () => {
  const { products, categories, movements, lowStock } = getReportData();
  const costValue = products.reduce(
    (sum, product) => sum + product.quantity * product.purchasePrice,
    0
  );
  const salesValue = products.reduce(
    (sum, product) => sum + product.quantity * product.sellingPrice,
    0
  );
  document.querySelector('#report-valuation').textContent =
    formatCurrency(costValue);
  document.querySelector('#report-sales-value').textContent =
    formatCurrency(salesValue);
  document.querySelector('#report-low-count').textContent = String(
    lowStock.length
  );
  document.querySelector('#low-stock-badge').textContent =
    `${lowStock.length} items`;
  document.querySelector('#low-stock-report').innerHTML =
    lowStock
      .map((product) => {
        const category =
          categories.find((item) => item.id === product.categoryId)?.name ||
          'Uncategorized';
        return `<tr><td><strong>${escapeHtml(product.name)}</strong></td><td class="text-muted">${escapeHtml(product.sku)}</td><td>${escapeHtml(category)}</td><td><strong>${product.quantity}</strong></td><td>${product.minStock}</td><td>${Math.max(product.minStock - product.quantity, 0)} units</td></tr>`;
      })
      .join('') ||
    '<tr><td colspan="6"><div class="empty-state"><strong>No products need replenishment</strong><span>All stock levels are above their minimum.</span></div></td></tr>';
  document.querySelector('#valuation-report').innerHTML =
    products
      .map((product) => {
        const category =
          categories.find((item) => item.id === product.categoryId)?.name ||
          'Uncategorized';
        return `<tr><td><strong>${escapeHtml(product.name)}</strong></td><td class="text-muted">${escapeHtml(product.sku)}</td><td>${escapeHtml(category)}</td><td>${product.quantity}</td><td>${formatCurrency(product.purchasePrice)}</td><td><strong>${formatCurrency(product.quantity * product.purchasePrice)}</strong></td></tr>`;
      })
      .join('') ||
    '<tr><td colspan="6"><div class="empty-state"><strong>No products to value</strong><span>Add inventory products to see the valuation.</span></div></td></tr>';
  document.querySelector('#movement-report').innerHTML =
    movements
      .slice(0, 10)
      .map((movement) => {
        const typeLabel =
          movement.type === 'in'
            ? 'Stock in'
            : movement.type === 'out'
              ? 'Stock out'
              : 'Adjustment';
        return `<tr><td>${formatDate(movement.date)}</td><td><strong>${escapeHtml(movement.productName)}</strong></td><td>${typeLabel}</td><td class="${movement.quantity > 0 ? 'text-positive' : 'text-negative'}"><strong>${movement.quantity > 0 ? '+' : ''}${movement.quantity}</strong></td><td class="text-muted">${escapeHtml(movement.notes || '—')}</td></tr>`;
      })
      .join('') ||
    '<tr><td colspan="5"><div class="empty-state"><strong>No movements recorded</strong><span>Stock changes will appear here.</span></div></td></tr>';
};

const exportReport = () => {
  const { products, categories, movements } = getReportData();
  const rows = [
    ['Inventory valuation'],
    ['Product', 'SKU', 'Category', 'Quantity', 'Purchase price', 'Total value'],
    ...products.map((product) => [
      product.name,
      product.sku,
      categories.find((category) => category.id === product.categoryId)?.name ||
        'Uncategorized',
      product.quantity,
      product.purchasePrice,
      (product.quantity * product.purchasePrice).toFixed(2),
    ]),
    [],
    ['Stock movement report'],
    ['Date', 'Product', 'SKU', 'Type', 'Quantity change', 'Notes'],
    ...movements.map((movement) => [
      movement.date,
      movement.productName,
      movement.sku,
      movement.type,
      movement.quantity,
      movement.notes,
    ]),
  ];
  const csvCell = (value) => {
    const safeValue = /^[=+\-@]/.test(String(value))
      ? `'${value}`
      : String(value);
    return `"${safeValue.replaceAll('"', '""')}"`;
  };
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'inventory-report.csv';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Report exported.');
};

document.querySelector('[data-export-report]').addEventListener('click', () => {
  try {
    exportReport();
  } catch (error) {
    showError(error);
  }
});

try {
  renderReports();
  window.addEventListener('inventory:changed', renderReports);
} catch (error) {
  showError(error);
}
