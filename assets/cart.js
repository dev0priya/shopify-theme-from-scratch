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

class SideCart extends HTMLElement {
    constructor() {
        super();
        this.itemTemplate = this.querySelector('template#side-cart-item');
    }

    getCart() {
        this.setLoading(true);
        fetch(window.Shopify.routes.root + 'cart.js')
        .then(response => response.json())
        .then(cart => { 
            this.cart = cart;
            this.buildCart(cart);
        }).finally(() => {
            this.setLoading(false);
        });
    }

    buildCart(cart) {
        const cartItemsContainer = this.querySelector('#cart-items');
        const cartFooter = this.querySelector('.sidebar__footer');

        cartItemsContainer.innerHTML = '';

        if (cart.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <p>Your cart is empty</p>
                    <a href="/collections/all" class="button">Continue Shopping</a>
                </div>
            `;
            cartFooter.classList.add('is-empty');
        } else {
            cart.items.forEach(item => {
                const fragment = this.renderSideCartItem({ item });
                cartItemsContainer.appendChild(fragment);
            });
            cartFooter.classList.remove('is-empty');
        }
        
        this.querySelector('#cart-subtotal').textContent = formatMoney(cart.total_price);
        document.querySelector('#header-cart-icon .cart-count-bubble').textContent = cart.item_count;
    }

    renderSideCartItem(context = {}) {
        const template = this.itemTemplate;
        const clone = template.content.cloneNode(true);
        const element = clone.querySelector('side-cart-item');
        const item = context.item;

        element.setAttribute('key', item.key);
        element.setAttribute('item-count', item.quantity);

        const imageUrl = item.image ? item.image + '&width=150' : 'https://via.placeholder.com/150';
        
        element.querySelector('.cart-item__image').src = imageUrl;
        element.querySelector('.cart-item__title').textContent = item.product_title;
        element.querySelector('.cart-item__price').textContent = formatMoney(item.final_line_price);
        element.querySelector('.cart-item__quantity-value').textContent = item.quantity;

        if (item.variant_title && item.variant_title !== 'Default Title') {
            element.querySelector('.cart-item__variant').textContent = item.variant_title;
        } else {
            element.querySelector('.cart-item__variant').remove();
        }
      
        return clone;
    }

    setLoading(isLoading) {
        this.querySelector('#cart-items').classList.toggle('is-loading', isLoading);
    }
}
customElements.define('side-cart', SideCart);

class SideCartItem extends HTMLElement {
    constructor() {
        super();
        this.key = this.getAttribute('key');
        this.sideCart = this.closest('side-cart');

        this.querySelector('.cart-item__remove').addEventListener('click', () => this.updateItem(0));
        this.querySelector('.cart-item__quantity-plus').addEventListener('click', () => this.updateItem(this.getQty() + 1));
        this.querySelector('.cart-item__quantity-minus').addEventListener('click', () => this.updateItem(this.getQty() - 1));
    }

    getQty() {
        return parseInt(this.getAttribute('item-count'));
    }

    updateItem(quantity) {
        this.sideCart.setLoading(true);
        const updates = { [this.key]: quantity };

        fetch(window.Shopify.routes.root + 'cart/update.js', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({updates})
        })
        .then(response => response.json())
        .then(cart => {
            this.sideCart.cart = cart;
            this.sideCart.buildCart(cart);
        }).finally(() => {
            this.sideCart.setLoading(false);
        });
    }
}
customElements.define('side-cart-item', SideCartItem);