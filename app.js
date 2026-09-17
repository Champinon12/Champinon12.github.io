/**
 * Mucha Ensalada — Apple-Inspired Interactive Engine
 * Reglas Oficiales:
 * - Precio Base: $120 MXN
 * - Base e Ingredientes: Asegurados (incluidos por defecto en cada ensalada)
 *   Base: Lechuga italiana y Espinaca baby
 *   Ingredientes: Pepino, Zanahoria, Pimiento morrón, Betabel, Tomates cherry, Col morada, Pasta
 * - 3 Proteínas en total (una de cada una):
 *   * 1 tipo de Pechuga de pollo asada (Pastor, Leña, Chipotle o Finas hierbas)
 *   * 2 Proteínas más (Huevo hervido, Queso panela, Atún, Salmón +$80)
 * - 2 Complementos (Crutones, Arándanos, Nuez de la india, Almendras, Nuez, Pasas)
 * - Agrega (+ $15 c/u: Fresas, Uvas, Aguacate, Piña, Manzana verde, Mango, Kiwi)
 * - Sin aderezos ni recetas preestablecidas: Cada cliente diseña a su gusto
 */

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const BASE_PRICE = 120.00;
const OTRAS_PROTEINAS_MAX = 2;
const COMPLEMENT_MAX = 2;

// Fixed/Assured ingredients list
const INGREDIENTES_ASEGURADOS = [
  'Lechuga italiana',
  'Espinaca baby',
  'Pepino',
  'Zanahoria',
  'Pimiento morrón',
  'Betabel',
  'Tomates cherry',
  'Col morada',
  'Pasta'
];

// Cart State
let cart = [];

// Query Helpers
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Theme Management
function initTheme() {
  const toggleBtn = qs('#themeToggleBtn');
  const savedTheme = localStorage.getItem('apple_theme');

  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  updateThemeIcon();

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('apple_theme', newTheme);
      updateThemeIcon();
    });
  }
}

function updateThemeIcon() {
  const icon = qs('#themeIcon');
  if (!icon) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  icon.textContent = isDark ? '☀️' : '🌙';
}

// Otras Proteínas Limit Enforcement (0/2, max 1 of each)
function updateOtrasProteinasLimits() {
  const container = qs('.apple-options-grid[data-group="otras-proteinas"]');
  const counterEl = qs('#otras-proteinas-count');
  const limitMsgEl = qs('#otras-proteinas-limit');
  if (!container) return;

  const checkboxes = qsa('input[name="otras_proteinas"]', container);
  const checked = checkboxes.filter(cb => cb.checked);

  if (counterEl) {
    counterEl.textContent = `${checked.length}/${OTRAS_PROTEINAS_MAX}`;
  }

  if (checked.length >= OTRAS_PROTEINAS_MAX) {
    checkboxes.forEach(cb => {
      const card = cb.closest('.apple-option-card');
      if (!cb.checked) {
        cb.disabled = true;
        card?.classList.add('disabled');
      }
    });
    if (limitMsgEl) {
      limitMsgEl.textContent = 'Has seleccionado tus 2 proteínas adicionales.';
      limitMsgEl.style.color = 'var(--apple-green-dark)';
    }
  } else {
    checkboxes.forEach(cb => {
      cb.disabled = false;
      const card = cb.closest('.apple-option-card');
      card?.classList.remove('disabled');
    });
    if (limitMsgEl) {
      limitMsgEl.textContent = '';
    }
  }

  calculateConfiguratorTotal();
}

// Complementos Limit Enforcement (0/2)
function updateComplementoLimits() {
  const container = qs('.apple-options-grid[data-group="complementos"]');
  const counterEl = qs('#comp-count');
  const limitMsgEl = qs('#comp-limit');
  if (!container) return;

  const checkboxes = qsa('input[name="complementos"]', container);
  const checked = checkboxes.filter(cb => cb.checked);

  if (counterEl) counterEl.textContent = `${checked.length}/${COMPLEMENT_MAX}`;

  if (checked.length >= COMPLEMENT_MAX) {
    checkboxes.forEach(cb => {
      const card = cb.closest('.apple-option-card');
      if (!cb.checked) {
        cb.disabled = true;
        card?.classList.add('disabled');
      }
    });
    if (limitMsgEl) {
      limitMsgEl.textContent = 'Has alcanzado los 2 complementos incluidos.';
      limitMsgEl.style.color = 'var(--apple-green-dark)';
    }
  } else {
    checkboxes.forEach(cb => {
      cb.disabled = false;
      const card = cb.closest('.apple-option-card');
      card?.classList.remove('disabled');
    });
    if (limitMsgEl) limitMsgEl.textContent = '';
  }
}

// Live Configurator Price Calculation
function calculateConfiguratorTotal() {
  let total = BASE_PRICE;

  // Check if Salmón is selected in otras_proteinas
  const salmonCb = qs('input[name="otras_proteinas"][value*="Salmón"]:checked');
  if (salmonCb) {
    total += Number(salmonCb.dataset.price || 80);
  }

  // Agrega charges (+$15 each)
  qsa('input[name="agrega"]:checked').forEach(input => {
    total += Number(input.dataset.price || 15);
  });

  const priceEl = qs('#builderTotal');
  if (priceEl) priceEl.textContent = MXN.format(total);

  return total;
}

// Toast
let toastTimeout = null;
function showAppleToast(message, icon = '✓') {
  const toastEl = qs('#appleToast');
  const toastText = qs('#toastMessage');
  const toastIcon = qs('#toastIcon');
  if (!toastEl) return;

  if (toastText) toastText.textContent = message;
  if (toastIcon) toastIcon.textContent = icon;

  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

// Render Bag
function renderBag() {
  const listEl = qs('#bagItemsList');
  const emptyEl = qs('#bagEmptyState');
  const countPills = qsa('.bag-count-pill');
  const bagSubtotalEl = qs('#bagSubtotal');
  const bagTotalEl = qs('#bagTotal');
  const applePayBtn = qs('#applePayBtn');
  const whatsappBtn = qs('#whatsappCheckoutBtn');
  const floatingDock = qs('#appleFloatingDock');
  const dockBagCount = qs('#dockBagCount');
  const dockBagTotal = qs('#dockBagTotal');

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  countPills.forEach(pill => { pill.textContent = String(totalItems); });
  if (dockBagCount) dockBagCount.textContent = String(totalItems);

  if (cart.length === 0) {
    if (listEl) listEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    if (bagSubtotalEl) bagSubtotalEl.textContent = MXN.format(0);
    if (bagTotalEl) bagTotalEl.textContent = MXN.format(0);
    if (whatsappBtn) whatsappBtn.disabled = true;
    if (dockBagTotal) dockBagTotal.textContent = MXN.format(0);
    if (floatingDock) floatingDock.classList.remove('visible');
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (listEl) {
    listEl.style.display = 'flex';
    listEl.innerHTML = cart.map((item, idx) => `
      <div class="bag-item-row" data-idx="${idx}">
        <div class="bag-item-top">
          <div>
            <div class="bag-item-name">Ensalada Mucha Ensalada #${idx + 1}</div>
            <div class="bag-item-details">
              <span><strong>Base & Vegetales:</strong> ${escapeHtml(item.asegurados)}</span>
              <span><strong>1 Pechuga:</strong> ${escapeHtml(item.pechuga)}</span>
              <span><strong>2 Proteínas Más:</strong> ${escapeHtml(item.otrasProteinas.join(', '))}</span>
              <span><strong>2 Complementos:</strong> ${escapeHtml(item.complementos.join(', '))}</span>
              ${item.agrega.length ? `<span><strong>Agrega (+):</strong> ${escapeHtml(item.agrega.join(', '))}</span>` : ''}
              ${item.notas ? `<span><strong>Notas:</strong> "${escapeHtml(item.notas)}"</span>` : ''}
            </div>
          </div>
          <div class="bag-item-price">${MXN.format(item.itemTotal * item.qty)}</div>
        </div>
        <div class="bag-item-actions">
          <div class="stepper-control">
            <button type="button" class="stepper-btn" data-action="decrease" data-idx="${idx}" aria-label="Disminuir">−</button>
            <span class="stepper-value">${item.qty}</span>
            <button type="button" class="stepper-btn" data-action="increase" data-idx="${idx}" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="bag-remove-btn" data-action="remove" data-idx="${idx}">Eliminar</button>
        </div>
      </div>
    `).join('');
  }

  const grandTotal = cart.reduce((sum, item) => sum + (item.itemTotal * item.qty), 0);
  if (bagSubtotalEl) bagSubtotalEl.textContent = MXN.format(grandTotal);
  if (bagTotalEl) bagTotalEl.textContent = MXN.format(grandTotal);
  if (dockBagTotal) dockBagTotal.textContent = MXN.format(grandTotal);

  if (whatsappBtn) whatsappBtn.disabled = false;
  if (floatingDock) floatingDock.classList.add('visible');
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Add Item To Cart with strict menu validation
function handleAddToCart() {
  // 1. Pechuga de pollo (1 obligatoria)
  const pechugaChecked = qs('input[name="pechuga"]:checked');
  if (!pechugaChecked) {
    showAppleToast('Elige 1 tipo de pechuga de pollo', '⚠️');
    qs('.apple-options-grid[data-group="pechuga"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const pechuga = pechugaChecked.value;

  // 2. Otras 2 proteínas (exactamente 2)
  const otrasProteinas = qsa('input[name="otras_proteinas"]:checked').map(cb => cb.value);
  const proteinLimitEl = qs('#otras-proteinas-limit');
  if (otrasProteinas.length < OTRAS_PROTEINAS_MAX) {
    const faltan = OTRAS_PROTEINAS_MAX - otrasProteinas.length;
    if (proteinLimitEl) {
      proteinLimitEl.textContent = `Por favor selecciona ${faltan} proteína(s) más para completar tus 2 adicionales.`;
      proteinLimitEl.style.color = 'var(--apple-danger)';
    }
    showAppleToast(`Falta elegir ${faltan} proteína más`, '⚠️');
    qs('.apple-options-grid[data-group="otras-proteinas"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // 3. Complementos (exactamente 2)
  const complementos = qsa('input[name="complementos"]:checked').map(cb => cb.value);
  const compLimitEl = qs('#comp-limit');
  if (complementos.length < COMPLEMENT_MAX) {
    const faltan = COMPLEMENT_MAX - complementos.length;
    if (compLimitEl) {
      compLimitEl.textContent = `Por favor selecciona ${faltan} complemento(s) más para completar tus 2 incluidos.`;
      compLimitEl.style.color = 'var(--apple-danger)';
    }
    showAppleToast(`Falta elegir ${faltan} complemento más`, '⚠️');
    qs('.apple-options-grid[data-group="complementos"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // 4. Agrega
  const agrega = qsa('input[name="agrega"]:checked').map(cb => cb.value);

  // 5. Notas
  const notas = qs('#notasInput') ? qs('#notasInput').value.trim() : '';

  const itemTotal = calculateConfiguratorTotal();

  const item = {
    id: Date.now(),
    asegurados: 'Base completa y 7 vegetales con pasta asegurados',
    pechuga,
    otrasProteinas,
    complementos,
    agrega,
    notas,
    itemTotal,
    qty: 1
  };

  cart.push(item);
  renderBag();
  showAppleToast('Ensalada agregada a tu Bolsa', '🛍');

  // Reset form to clean default state
  resetConfigurator();

  if (window.innerWidth < 980) {
    const bagEl = qs('#bolsa');
    if (bagEl) bagEl.scrollIntoView({ behavior: 'smooth' });
  }
}

function resetConfigurator() {
  const form = qs('#saladForm');
  if (form) form.reset();

  // Reset default radio for pechuga
  const defaultPechuga = qs('input[name="pechuga"][value="Pechuga asada al pastor"]');
  if (defaultPechuga) defaultPechuga.checked = true;

  updateOtrasProteinasLimits();
  updateComplementoLimits();
  calculateConfiguratorTotal();
}

// WhatsApp Order Formatter
function buildWhatsAppMessage() {
  const lines = [
    '🥗 *¡Hola Mucha Ensalada! Quiero realizar un pedido:*',
    ''
  ];

  cart.forEach((item, idx) => {
    lines.push(`*ENSALADA #${idx + 1} (${item.qty} ${item.qty === 1 ? 'porción' : 'porciones'} — ${MXN.format(item.itemTotal * item.qty)})*`);
    lines.push('• *Base e Ingredientes:* Asegurados (Lechuga italiana, Espinaca baby, Pepino, Zanahoria, Pimiento morrón, Betabel, Tomates cherry, Col morada, Pasta)');
    lines.push(`• *Pechuga de pollo (1):* ${item.pechuga}`);
    lines.push(`• *Proteínas adicionales (2):* ${item.otrasProteinas.join(', ')}`);
    lines.push(`• *Complementos (2):* ${item.complementos.join(', ')}`);
    if (item.agrega.length > 0) {
      lines.push(`• *Agrega (+):* ${item.agrega.join(', ')}`);
    }
    if (item.notas) {
      lines.push(`• *Indicaciones especiales:* ${item.notas}`);
    }
    lines.push('');
  });

  const grandTotal = cart.reduce((sum, item) => sum + (item.itemTotal * item.qty), 0);
  lines.push(`💰 *TOTAL A PAGAR: ${MXN.format(grandTotal)}*`);
  lines.push('🛵 *Método de entrega / dirección:* Por favor indíquenme tiempo estimado.');
  lines.push('');
  lines.push('_Pedido generado desde Mucha Ensalada Web App_');

  return encodeURIComponent(lines.join('\n'));
}

function handleWhatsAppCheckout() {
  if (cart.length === 0) return;
  const officialPhone = '525578980060'; // Official phone 1: 55 78 98 00 60
  const messageUrl = `https://wa.me/${officialPhone}?text=${buildWhatsAppMessage()}`;
  window.open(messageUrl, '_blank', 'noopener,noreferrer');
}

// Event Delegations
function attachEvents() {
  // Configurator Add to Cart
  const addBtn = qs('#addToCartBtn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddToCart);
  }

  // Bag Action Buttons
  const whatsappCheckoutBtn = qs('#whatsappCheckoutBtn');
  if (whatsappCheckoutBtn) {
    whatsappCheckoutBtn.addEventListener('click', handleWhatsAppCheckout);
  }

  const dockWhatsappBtn = qs('#dockWhatsappBtn');
  if (dockWhatsappBtn) {
    dockWhatsappBtn.addEventListener('click', handleWhatsAppCheckout);
  }

  const dockBagTrigger = qs('#dockBagTrigger');
  if (dockBagTrigger) {
    dockBagTrigger.addEventListener('click', () => {
      qs('#bolsa')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const navBagTrigger = qs('.apple-bag-trigger');
  if (navBagTrigger) {
    navBagTrigger.addEventListener('click', () => {
      qs('#bolsa')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const clearBagBtn = qs('#clearBagBtn');
  if (clearBagBtn) {
    clearBagBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      if (window.confirm('¿Deseas vaciar tu bolsa?')) {
        cart = [];
        renderBag();
        showAppleToast('Bolsa vaciada');
      }
    });
  }

  // Bag Item Stepper & Remove Delegation
  const bagList = qs('#bagItemsList');
  if (bagList) {
    bagList.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const idx = Number(target.dataset.idx);
      const action = target.dataset.action;
      if (isNaN(idx) || !cart[idx]) return;

      if (action === 'increase') {
        cart[idx].qty += 1;
        renderBag();
      } else if (action === 'decrease') {
        if (cart[idx].qty > 1) {
          cart[idx].qty -= 1;
          renderBag();
        } else {
          cart.splice(idx, 1);
          renderBag();
          showAppleToast('Ensalada eliminada');
        }
      } else if (action === 'remove') {
        cart.splice(idx, 1);
        renderBag();
        showAppleToast('Ensalada eliminada');
      }
    });
  }

  // Configurator Changes: Otras Proteínas
  const otrasProteinasGrid = qs('.apple-options-grid[data-group="otras-proteinas"]');
  if (otrasProteinasGrid) {
    otrasProteinasGrid.addEventListener('change', updateOtrasProteinasLimits);
  }

  // Configurator Changes: Complementos
  const compGrid = qs('.apple-options-grid[data-group="complementos"]');
  if (compGrid) {
    compGrid.addEventListener('change', updateComplementoLimits);
  }

  // Configurator Changes: Agrega checkboxes
  const agregaGrid = qs('.apple-options-grid[data-group="agrega"]');
  if (agregaGrid) {
    agregaGrid.addEventListener('change', calculateConfiguratorTotal);
  }
}

// Reveal on scroll observer
function initScrollReveal() {
  const items = qsa('.reveal-item');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  items.forEach(el => observer.observe(el));
}

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  attachEvents();
  updateOtrasProteinasLimits();
  updateComplementoLimits();
  calculateConfiguratorTotal();
  renderBag();
  initScrollReveal();
});

document.addEventListener('DOMContentLoaded', () => {
  const applePayBtn = document.querySelector('#applePayBtn');
  if (applePayBtn) {
    applePayBtn.style.display = 'none';
  }
});
