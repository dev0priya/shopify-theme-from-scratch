/**
 * Standalone money formatting function.
 */
function formatMoney(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.', ''); }
  let value = '';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = (format || '${{amount}}');

  function defaultOption(opt, def) { return (typeof opt == 'undefined' ? def : opt); }
  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');
    if (isNaN(number) || number == null) { return 0; }
    number = (number/100.0).toFixed(precision);
    let parts   = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents   = parts[1] ? (decimal + parts[1]) : '';
    return dollars + cents;
  }
  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
  }
  return formatString.replace(placeholderRegex, value);
}


/**
 * Final Side Cart Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const sideCartElement = document.querySelector('sidebar-drawer');
  const container = document.querySelector('[data-cart-items-container]');
  const itemTemplate = document.querySelector('[data-cart-item-template]');
  const footer = document.querySelector('[data-cart-footer]');
  const subtotalEl = document.querySelector('[data-cart-subtotal]');
  const totalEl = document.querySelector('[data-cart-total]');
  const cartCountBubble = document.querySelector('#header-cart-icon .cart-count-bubble'); 

  async function getCart() {
    const response = await fetch('/cart.js');
    return await response.json();
  }

  async function updateCart(updates) {
    const response = await fetch('/cart/update.js', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ updates })
    });
    return await response.json();
  }

  function renderCart(cart) {
    container.innerHTML = '';
    if (cart.item_count === 0) {
      container.innerHTML = '<p>Your cart is empty.</p>';
      footer.style.display = 'none';
    } else {
      cart.items.forEach(item => {
        const templateHTML = itemTemplate.innerHTML
          .replace(/{KEY}/g, item.key)
          .replace(/{IMAGE_URL}/g, item.image)
          .replace(/{PRODUCT_TITLE}/g, item.product_title)
          .replace(/{PRICE}/g, formatMoney(item.final_price, window.Shopify.money_format))
          .replace(/{QUANTITY}/g, item.quantity);
        container.innerHTML += templateHTML;
      });
      footer.style.display = 'block';
    }
    if (subtotalEl) subtotalEl.innerHTML = formatMoney(cart.total_price, window.Shopify.money_format);
    if (totalEl) totalEl.innerHTML = formatMoney(cart.total_price, window.Shopify.money_format);
    if (cartCountBubble) cartCountBubble.textContent = cart.item_count;
  }

  getCart().then(renderCart);

  document.body.addEventListener('click', async (event) => {
    const target = event.target;
    const cartItem = target.closest('[data-cart-item-key]');
    if (!cartItem) return;

    const key = cartItem.dataset.cartItemKey;
    const currentQuantity = parseInt(cartItem.querySelector('input[type="number"]').value);
    let newQuantity;

    if (target.closest('[data-sweedesi-cart-plus]')) {
      event.preventDefault();
      newQuantity = currentQuantity + 1;
    } else if (target.closest('[data-sweedesi-cart-minus]')) {
      event.preventDefault();
      newQuantity = currentQuantity - 1;
    } else if (target.closest('[data-sweedesi-cart-remove]')) {
      event.preventDefault();
      newQuantity = 0;
    }

    if (typeof newQuantity !== 'undefined') {
      container.style.opacity = '0.5';
      const updatedCart = await updateCart({ [key]: newQuantity });
      renderCart(updatedCart);
      container.style.opacity = '1';
    }
  });

  // Refreshes cart content when cart icon is clicked
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('a[href="/cart"]') || e.target.closest('[data-open-cart]')) {
      getCart().then(renderCart);
    }
  });

  // Listens for the signal to refresh the cart content
  document.body.addEventListener('cart:updated', () => {
    console.log('Cart was updated! Refreshing side cart.');
    getCart().then(renderCart);
  });

  // Listens for the signal to open the side cart
  document.body.addEventListener('cart:open', () => {
    console.log('Received signal to open the side cart.');
    if (sideCartElement) {
      sideCartElement.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  });

});