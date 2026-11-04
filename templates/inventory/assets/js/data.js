const STORAGE_KEY = 'inventory-pwa-demo-v1';

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const createInitialData = () => ({
  version: 1,
  categories: [
    {
      id: 'cat-electronics',
      name: 'Electronics',
      description: 'Devices and accessories',
    },
    {
      id: 'cat-office',
      name: 'Office supplies',
      description: 'Everyday workplace essentials',
    },
    {
      id: 'cat-equipment',
      name: 'Equipment',
      description: 'Tools and durable equipment',
    },
    {
      id: 'cat-packaging',
      name: 'Packaging',
      description: 'Shipping and storage materials',
    },
  ],
  products: [
    {
      id: 'prod-001',
      name: 'Wireless keyboard',
      sku: 'KEY-1042',
      barcode: '842635104201',
      categoryId: 'cat-electronics',
      description: 'Compact wireless keyboard with a rechargeable battery.',
      purchasePrice: 24.5,
      sellingPrice: 39.99,
      quantity: 24,
      minStock: 8,
      image: '',
    },
    {
      id: 'prod-002',
      name: 'USB-C hub',
      sku: 'HUB-2081',
      barcode: '842635208108',
      categoryId: 'cat-electronics',
      description: 'Multi-port hub for modern workstations.',
      purchasePrice: 31,
      sellingPrice: 54.99,
      quantity: 12,
      minStock: 6,
      image: '',
    },
    {
      id: 'prod-003',
      name: 'Notebook set',
      sku: 'OFF-3105',
      barcode: '842635310504',
      categoryId: 'cat-office',
      description: 'Set of three lined notebooks.',
      purchasePrice: 4.25,
      sellingPrice: 9.5,
      quantity: 4,
      minStock: 10,
      image: '',
    },
    {
      id: 'prod-004',
      name: 'Shipping carton',
      sku: 'PKG-4110',
      barcode: '',
      categoryId: 'cat-packaging',
      description: 'Reusable medium-size shipping carton.',
      purchasePrice: 1.8,
      sellingPrice: 3.25,
      quantity: 0,
      minStock: 15,
      image: '',
    },
    {
      id: 'prod-005',
      name: 'Desk lamp',
      sku: 'EQP-5122',
      barcode: '842635512205',
      categoryId: 'cat-equipment',
      description: 'Adjustable LED desk lamp.',
      purchasePrice: 18,
      sellingPrice: 34,
      quantity: 18,
      minStock: 5,
      image: '',
    },
    {
      id: 'prod-006',
      name: 'Wireless mouse',
      sku: 'MOU-6130',
      barcode: '842635613001',
      categoryId: 'cat-electronics',
      description: 'Ergonomic wireless mouse.',
      purchasePrice: 12,
      sellingPrice: 22.5,
      quantity: 9,
      minStock: 7,
      image: '',
    },
  ],
  movements: [
    {
      id: 'move-001',
      productId: 'prod-001',
      productName: 'Wireless keyboard',
      sku: 'KEY-1042',
      type: 'in',
      quantity: 12,
      date: daysAgo(0),
      notes: 'Supplier delivery',
    },
    {
      id: 'move-002',
      productId: 'prod-003',
      productName: 'Notebook set',
      sku: 'OFF-3105',
      type: 'out',
      quantity: -3,
      date: daysAgo(1),
      notes: 'Order fulfillment',
    },
    {
      id: 'move-003',
      productId: 'prod-002',
      productName: 'USB-C hub',
      sku: 'HUB-2081',
      type: 'in',
      quantity: 6,
      date: daysAgo(2),
      notes: 'Restock',
    },
    {
      id: 'move-004',
      productId: 'prod-006',
      productName: 'Wireless mouse',
      sku: 'MOU-6130',
      type: 'adjustment',
      quantity: -1,
      date: daysAgo(3),
      notes: 'Cycle count correction',
    },
    {
      id: 'move-005',
      productId: 'prod-005',
      productName: 'Desk lamp',
      sku: 'EQP-5122',
      type: 'out',
      quantity: -2,
      date: daysAgo(6),
      notes: 'Order fulfillment',
    },
    {
      id: 'move-006',
      productId: 'prod-004',
      productName: 'Shipping carton',
      sku: 'PKG-4110',
      type: 'out',
      quantity: -5,
      date: daysAgo(9),
      notes: 'Packing materials',
    },
  ],
});

const readStoredData = () => {
  const rawData = window.localStorage.getItem(STORAGE_KEY);
  if (!rawData) {
    const initialData = createInitialData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  try {
    const data = JSON.parse(rawData);
    if (
      !data ||
      !Array.isArray(data.products) ||
      !Array.isArray(data.categories) ||
      !Array.isArray(data.movements)
    ) {
      throw new Error('Stored inventory data has an invalid shape.');
    }
    return data;
  } catch (error) {
    throw new Error(`Could not read inventory data: ${error.message}`, {
      cause: error,
    });
  }
};

const saveData = (data) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('inventory:changed'));
};

const makeId = (prefix) => {
  const id =
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${id}`;
};

const recordMovement = (
  data,
  product,
  type,
  quantity,
  date = daysAgo(0),
  notes = ''
) => {
  data.movements.unshift({
    id: makeId('move'),
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    type,
    quantity,
    date,
    notes,
  });
};

export const getData = () => readStoredData();

export const getProducts = () => getData().products;

export const getCategories = () => getData().categories;

export const getMovements = () => getData().movements;

export const createProduct = (input) => saveProduct(input);

export const saveProduct = (input) => {
  const data = getData();
  const existing = input.id
    ? data.products.find((product) => product.id === input.id)
    : null;
  const sku = input.sku.trim();
  const duplicate = data.products.some(
    (product) =>
      product.sku.toLowerCase() === sku.toLowerCase() && product.id !== input.id
  );
  if (duplicate) throw new Error('That SKU is already in use.');
  if (!data.categories.some((category) => category.id === input.categoryId))
    throw new Error('Choose an existing category.');

  const product = {
    id: existing?.id || makeId('prod'),
    name: input.name.trim(),
    sku,
    barcode: input.barcode.trim(),
    categoryId: input.categoryId,
    description: input.description.trim(),
    purchasePrice: Number(input.purchasePrice),
    sellingPrice: Number(input.sellingPrice),
    quantity: Number(input.quantity),
    minStock: Number(input.minStock),
    image: input.image.trim(),
  };
  if (
    !product.name ||
    !product.sku ||
    !Number.isFinite(product.quantity) ||
    product.quantity < 0
  ) {
    throw new Error(
      'Enter a product name, unique SKU, and a valid non-negative quantity.'
    );
  }
  if (
    [product.purchasePrice, product.sellingPrice, product.minStock].some(
      (value) => !Number.isFinite(value) || value < 0
    )
  ) {
    throw new Error(
      'Prices and minimum stock must be valid non-negative numbers.'
    );
  }

  const delta = existing
    ? product.quantity - existing.quantity
    : product.quantity;
  if (existing) {
    data.products[data.products.findIndex((item) => item.id === existing.id)] =
      product;
  } else {
    data.products.unshift(product);
  }
  if (delta !== 0)
    recordMovement(
      data,
      product,
      existing ? 'adjustment' : 'in',
      delta,
      daysAgo(0),
      existing ? 'Quantity updated while editing product' : 'Initial stock'
    );
  saveData(data);
  return product;
};

export const deleteProduct = (id) => {
  const data = getData();
  const product = data.products.find((item) => item.id === id);
  if (!product) throw new Error('Product could not be found.');
  data.products = data.products.filter((item) => item.id !== id);
  saveData(data);
};

export const saveCategory = (input) => {
  const data = getData();
  const name = input.name.trim();
  if (!name) throw new Error('Enter a category name.');
  if (
    data.categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== input.id
    )
  ) {
    throw new Error('A category with that name already exists.');
  }

  const category = {
    id: input.id || makeId('cat'),
    name,
    description: input.description.trim(),
  };
  const index = data.categories.findIndex((item) => item.id === category.id);
  if (index >= 0) data.categories[index] = category;
  else data.categories.unshift(category);
  saveData(data);
  return category;
};

export const deleteCategory = (id) => {
  const data = getData();
  const category = data.categories.find((item) => item.id === id);
  if (!category) throw new Error('Category could not be found.');
  if (data.products.some((product) => product.categoryId === id)) {
    throw new Error(
      "Move or delete this category's products before deleting the category."
    );
  }
  data.categories = data.categories.filter((item) => item.id !== id);
  saveData(data);
};

export const createMovement = (input) => {
  const data = getData();
  const product = data.products.find((item) => item.id === input.productId);
  if (!product) throw new Error('Choose an existing product.');
  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity === 0)
    throw new Error('Enter a non-zero whole number of units.');

  let delta = quantity;
  if (input.type === 'out') {
    delta = -Math.abs(quantity);
    if (product.quantity + delta < 0)
      throw new Error('Stock out cannot exceed the available quantity.');
  } else if (input.type === 'in') {
    delta = Math.abs(quantity);
  } else if (input.type !== 'adjustment') {
    throw new Error('Choose a valid movement type.');
  }

  if (product.quantity + delta < 0)
    throw new Error('An adjustment cannot reduce stock below zero.');
  product.quantity += delta;
  recordMovement(
    data,
    product,
    input.type,
    delta,
    input.date,
    input.notes.trim()
  );
  saveData(data);
  return product;
};

export const getSettings = () => {
  const defaults = {
    appName: document.body.dataset.appName || 'Inventory',
    businessName: document.body.dataset.businessName || 'Sample Business',
    primaryColor: document.body.dataset.primaryColor || '#635bff',
    currency: document.body.dataset.currency || 'USD',
    businessLogo: document.body.dataset.businessLogo || '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
  };
  const saved = window.localStorage.getItem(`${STORAGE_KEY}-settings`);
  return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
};

export const saveSettings = (settings) => {
  window.localStorage.setItem(
    `${STORAGE_KEY}-settings`,
    JSON.stringify(settings)
  );
  window.dispatchEvent(new CustomEvent('inventory:settings-changed'));
};

export const resetDemoData = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(`${STORAGE_KEY}-settings`);
  saveData(createInitialData());
};
