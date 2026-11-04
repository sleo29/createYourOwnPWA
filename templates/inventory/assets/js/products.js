import {
  deleteProduct,
  getCategories,
  getProducts,
  saveProduct,
} from './data.js';
import {
  closeDialog,
  escapeHtml,
  formatCurrency,
  openDialog,
  showError,
  showToast,
} from './app.js';

const form = document.querySelector('#product-form');
const modal = document.querySelector('#product-modal');
const categoryFilter = document.querySelector('#category-filter');
const searchInput = document.querySelector('#product-search');
const filterState = { search: '', category: '', stock: '', sort: 'name' };

const populateCategories = () => {
  const categories = getCategories();
  categoryFilter.innerHTML =
    '<option value="">All categories</option>' +
    categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`
      )
      .join('');
  form.elements.categoryId.innerHTML =
    '<option value="">Choose category</option>' +
    categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`
      )
      .join('');
};

const stockLabel = (product) => {
  if (product.quantity === 0) return ['Out of stock', 'badge-danger'];
  if (product.quantity <= product.minStock)
    return ['Low stock', 'badge-warning'];
  return ['In stock', 'badge-success'];
};

const renderProducts = () => {
  const categories = getCategories();
  let products = getProducts().filter((product) => {
    const category =
      categories.find((item) => item.id === product.categoryId)?.name || '';
    const query = filterState.search.toLowerCase();
    const matchesText =
      !query ||
      [product.name, product.sku, product.barcode, category].some((value) =>
        value.toLowerCase().includes(query)
      );
    const matchesCategory =
      !filterState.category || product.categoryId === filterState.category;
    const matchesStock =
      !filterState.stock ||
      (filterState.stock === 'low' && product.quantity <= product.minStock) ||
      (filterState.stock === 'in-stock' &&
        product.quantity > product.minStock) ||
      (filterState.stock === 'out' && product.quantity === 0);
    return matchesText && matchesCategory && matchesStock;
  });
  products.sort((first, second) => {
    if (filterState.sort === 'name-desc')
      return second.name.localeCompare(first.name);
    if (filterState.sort === 'quantity')
      return first.quantity - second.quantity;
    if (filterState.sort === 'value')
      return (
        second.quantity * second.purchasePrice -
        first.quantity * first.purchasePrice
      );
    return first.name.localeCompare(second.name);
  });

  const rows = products.map((product) => {
    const [label, badge] = stockLabel(product);
    const category =
      categories.find((item) => item.id === product.categoryId)?.name ||
      'Uncategorized';
    return `<tr>
      <td><div class="product-cell">${product.image ? `<img class="product-thumb" src="${escapeHtml(product.image)}" alt="" loading="lazy" onerror="this.hidden=true">` : '<span class="product-thumb product-thumb-placeholder" aria-hidden="true">▦</span>'}<span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.description || 'No description')}</small></span></div></td>
      <td><strong>${escapeHtml(product.sku)}</strong><small class="table-subtext">${escapeHtml(product.barcode || 'No barcode')}</small></td>
      <td>${escapeHtml(category)}</td><td>${formatCurrency(product.purchasePrice)}</td><td>${formatCurrency(product.sellingPrice)}</td>
      <td><strong>${product.quantity}</strong><small class="table-subtext">Min. ${product.minStock}</small></td><td><span class="badge ${badge}">${label}</span></td>
      <td><div class="row-actions"><button class="icon-button row-action" type="button" aria-label="Edit ${escapeHtml(product.name)}" data-edit-product="${escapeHtml(product.id)}">✎</button><button class="icon-button row-action row-action-danger" type="button" aria-label="Delete ${escapeHtml(product.name)}" data-delete-product="${escapeHtml(product.id)}">×</button></div></td>
    </tr>`;
  });
  document.querySelector('#products-table').innerHTML =
    rows.join('') ||
    '<tr><td colspan="8"><div class="empty-state"><span class="empty-icon">▦</span><strong>No products found</strong><span>Try changing your filters or add a new product.</span><button class="button button-secondary button-small" type="button" data-open-product>Add product</button></div></td></tr>';
  document.querySelector('#product-count').textContent =
    `${products.length} of ${getProducts().length} products`;
};

const openProductForm = (product) => {
  populateCategories();
  form.reset();
  form.elements.id.value = product?.id || '';
  form.elements.name.value = product?.name || '';
  form.elements.sku.value = product?.sku || '';
  form.elements.barcode.value = product?.barcode || '';
  form.elements.categoryId.value = product?.categoryId || '';
  form.elements.quantity.value = product?.quantity ?? 0;
  form.elements.purchasePrice.value = product?.purchasePrice ?? 0;
  form.elements.sellingPrice.value = product?.sellingPrice ?? 0;
  form.elements.minStock.value = product?.minStock ?? 5;
  form.elements.image.value = product?.image || '';
  form.elements.description.value = product?.description || '';
  document.querySelector('#product-modal-title').textContent = product
    ? 'Edit product'
    : 'Add product';
  openDialog(modal);
};

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-open-product]')) openProductForm();
  const editButton = event.target.closest('[data-edit-product]');
  if (editButton)
    openProductForm(
      getProducts().find(
        (product) => product.id === editButton.dataset.editProduct
      )
    );
  const deleteButton = event.target.closest('[data-delete-product]');
  if (deleteButton) {
    const product = getProducts().find(
      (item) => item.id === deleteButton.dataset.deleteProduct
    );
    if (
      !product ||
      !window.confirm(
        `Delete "${product.name}"? This will keep its existing movement history.`
      )
    )
      return;
    try {
      deleteProduct(product.id);
      showToast('Product deleted.');
    } catch (error) {
      showError(error);
    }
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  try {
    saveProduct(values);
    closeDialog(modal);
    showToast(values.id ? 'Product updated.' : 'Product added.');
  } catch (error) {
    showError(error);
  }
});

searchInput.addEventListener('input', () => {
  filterState.search = searchInput.value.trim();
  renderProducts();
});
categoryFilter.addEventListener('change', () => {
  filterState.category = categoryFilter.value;
  renderProducts();
});
document.querySelector('#stock-filter').addEventListener('change', (event) => {
  filterState.stock = event.target.value;
  renderProducts();
});
document.querySelector('#product-sort').addEventListener('change', (event) => {
  filterState.sort = event.target.value;
  renderProducts();
});
document
  .querySelector('#clear-product-filters')
  .addEventListener('click', () => {
    filterState.search = '';
    filterState.category = '';
    filterState.stock = '';
    filterState.sort = 'name';
    searchInput.value = '';
    categoryFilter.value = '';
    document.querySelector('#stock-filter').value = '';
    document.querySelector('#product-sort').value = 'name';
    renderProducts();
  });

const params = new URLSearchParams(window.location.search);
filterState.search = params.get('search') || '';
searchInput.value = filterState.search;
populateCategories();
filterState.category = params.get('category') || '';
categoryFilter.value = filterState.category;
if (filterState.category && !categoryFilter.value) {
  filterState.category = '';
  categoryFilter.value = '';
}
renderProducts();
window.addEventListener('inventory:changed', () => {
  populateCategories();
  renderProducts();
});
