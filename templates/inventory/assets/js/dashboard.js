import { getCategories, getMovements, getProducts } from './data.js';
import {
  escapeHtml,
  formatCurrency,
  formatDate,
  getCategoryName,
  showError,
} from './app.js';

const renderMovement = (movement) => {
  const direction =
    movement.type === 'adjustment'
      ? 'adjustment'
      : movement.quantity > 0
        ? 'in'
        : 'out';
  const label =
    movement.type === 'adjustment'
      ? 'Adjustment'
      : movement.type === 'in'
        ? 'Stock in'
        : 'Stock out';
  const symbol = direction === 'in' ? '↓' : direction === 'out' ? '↑' : '↔';
  const quantityTone =
    movement.quantity > 0 ? 'text-positive' : 'text-negative';
  return `<div class="movement-item">
    <span class="movement-type movement-type-${direction}" aria-hidden="true">${symbol}</span>
    <div class="movement-copy"><strong>${escapeHtml(movement.productName)}</strong><span>${label} · ${formatDate(movement.date)}</span></div>
    <strong class="movement-quantity ${quantityTone}">${movement.quantity > 0 ? '+' : ''}${movement.quantity}</strong>
  </div>`;
};

const renderChart = (products, categories) => {
  const canvas = document.querySelector('#inventory-chart');
  const empty = document.querySelector('.chart-empty');
  if (!canvas) return;
  const totals = categories
    .map((category) => ({
      name: category.name,
      quantity: products
        .filter((product) => product.categoryId === category.id)
        .reduce((sum, product) => sum + product.quantity, 0),
    }))
    .filter((category) => category.quantity > 0);
  if (!totals.length) {
    canvas.hidden = true;
    empty.hidden = false;
    return;
  }
  canvas.hidden = false;
  empty.hidden = true;
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error('Your browser does not support the inventory chart.');
  const width = canvas.clientWidth || 600;
  const height = 250;
  const scale = window.devicePixelRatio || 1;
  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);
  const max = Math.max(...totals.map((item) => item.quantity), 1);
  const colors = [
    '#635bff',
    '#27a98a',
    '#f0a33a',
    '#4385e8',
    '#e36c83',
    '#8758c7',
  ];
  const left = 38;
  const bottom = height - 34;
  const chartHeight = height - 58;
  const slot = (width - left - 12) / totals.length;
  context.font = '12px Inter, ui-sans-serif, system-ui, sans-serif';
  context.textBaseline = 'middle';
  totals.forEach((item, index) => {
    const barHeight = (item.quantity / max) * chartHeight;
    const x = left + index * slot + slot * 0.19;
    const barWidth = Math.min(42, slot * 0.62);
    const y = bottom - barHeight;
    context.fillStyle = colors[index % colors.length];
    context.beginPath();
    context.roundRect(x, y, barWidth, barHeight, 6);
    context.fill();
    context.fillStyle = '#5f6675';
    context.textAlign = 'center';
    context.fillText(
      String(item.quantity),
      x + barWidth / 2,
      Math.max(12, y - 10)
    );
    const shortName =
      item.name.length > 12 ? `${item.name.slice(0, 11)}…` : item.name;
    context.fillText(shortName, x + barWidth / 2, bottom + 18);
  });
};

const renderDashboard = () => {
  const products = getProducts();
  const categories = getCategories();
  const movements = getMovements();
  const lowStock = products.filter(
    (product) => product.quantity <= product.minStock
  );
  document.querySelector('#stat-products').textContent = String(
    products.length
  );
  document.querySelector('#stat-quantity').textContent =
    new Intl.NumberFormat().format(
      products.reduce((sum, product) => sum + product.quantity, 0)
    );
  document.querySelector('#stat-low-stock').textContent = String(
    lowStock.length
  );
  document.querySelector('#stat-value').textContent = formatCurrency(
    products.reduce(
      (sum, product) => sum + product.quantity * product.purchasePrice,
      0
    )
  );
  document.querySelector('#recent-movements').innerHTML =
    movements.slice(0, 5).map(renderMovement).join('') ||
    '<div class="empty-state"><span class="empty-icon">⇄</span><strong>No stock movements yet</strong><span>Record your first stock change to see activity.</span></div>';
  document.querySelector('#dashboard-low-stock').innerHTML =
    lowStock
      .slice(0, 5)
      .map(
        (product) => `<tr>
    <td><strong>${escapeHtml(product.name)}</strong></td><td class="text-muted">${escapeHtml(product.sku)}</td><td>${escapeHtml(getCategoryName(product.categoryId))}</td>
    <td><strong>${product.quantity}</strong></td><td>${product.minStock}</td><td><span class="badge badge-warning">${product.quantity === 0 ? 'Out of stock' : 'Low stock'}</span></td>
  </tr>`
      )
      .join('') ||
    '<tr><td colspan="6"><div class="empty-state"><strong>Stock levels look good</strong><span>No products are currently below their minimum.</span></div></td></tr>';
  renderChart(products, categories);
};

try {
  renderDashboard();
  window.addEventListener('inventory:changed', renderDashboard);
  window.addEventListener('resize', renderDashboard);
} catch (error) {
  showError(error);
}
