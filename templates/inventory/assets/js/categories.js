import {
  deleteCategory,
  getCategories,
  getProducts,
  saveCategory,
} from './data.js';
import {
  closeDialog,
  escapeHtml,
  openDialog,
  showError,
  showToast,
} from './app.js';

const form = document.querySelector('#category-form');
const modal = document.querySelector('#category-modal');

const renderCategories = () => {
  const categories = getCategories();
  const products = getProducts();
  document.querySelector('#category-summary').textContent =
    `${categories.length} categories · ${products.length} products`;
  document.querySelector('#categories-table').innerHTML =
    categories
      .map((category) => {
        const categoryProducts = products.filter(
          (product) => product.categoryId === category.id
        );
        const quantity = categoryProducts.reduce(
          (total, product) => total + product.quantity,
          0
        );
        return `<tr>
      <td><div class="category-cell"><span class="category-mark" aria-hidden="true">${escapeHtml(category.name.slice(0, 1).toUpperCase())}</span><strong>${escapeHtml(category.name)}</strong></div></td>
      <td class="text-muted">${escapeHtml(category.description || '—')}</td>
      <td><a class="table-link" href="/products.html?category=${encodeURIComponent(category.id)}">${categoryProducts.length} products</a></td>
      <td>${new Intl.NumberFormat().format(quantity)} units</td>
      <td><div class="row-actions"><button class="icon-button row-action" type="button" aria-label="Edit ${escapeHtml(category.name)}" data-edit-category="${escapeHtml(category.id)}">✎</button><button class="icon-button row-action row-action-danger" type="button" aria-label="Delete ${escapeHtml(category.name)}" data-delete-category="${escapeHtml(category.id)}" ${categoryProducts.length ? 'disabled title="Move products before deleting"' : ''}>×</button></div></td>
    </tr>`;
      })
      .join('') ||
    '<tr><td colspan="5"><div class="empty-state"><span class="empty-icon">▤</span><strong>No categories yet</strong><span>Add a category to start organizing your products.</span><button class="button button-secondary button-small" type="button" data-open-category>Add category</button></div></td></tr>';
};

const openCategoryForm = (category) => {
  form.reset();
  form.elements.id.value = category?.id || '';
  form.elements.name.value = category?.name || '';
  form.elements.description.value = category?.description || '';
  document.querySelector('#category-modal-title').textContent = category
    ? 'Edit category'
    : 'Add category';
  openDialog(modal);
};

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-open-category]')) openCategoryForm();
  const editButton = event.target.closest('[data-edit-category]');
  if (editButton)
    openCategoryForm(
      getCategories().find(
        (category) => category.id === editButton.dataset.editCategory
      )
    );
  const deleteButton = event.target.closest('[data-delete-category]');
  if (deleteButton && !deleteButton.disabled) {
    const category = getCategories().find(
      (item) => item.id === deleteButton.dataset.deleteCategory
    );
    if (!category || !window.confirm(`Delete category "${category.name}"?`))
      return;
    try {
      deleteCategory(category.id);
      showToast('Category deleted.');
    } catch (error) {
      showError(error);
    }
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  try {
    saveCategory(values);
    closeDialog(modal);
    showToast(values.id ? 'Category updated.' : 'Category added.');
  } catch (error) {
    showError(error);
  }
});

renderCategories();
window.addEventListener('inventory:changed', renderCategories);
