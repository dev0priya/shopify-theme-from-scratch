class ProductForm extends HTMLElement {
    constructor() {
        super();
        this.form = this.querySelector('form');
        this.addToCartButton = this.querySelector('.add-to-cart');
        this.current_variant_id = this.getAttribute('variant-id');
        this.productHandle = this.getAttribute('product-handle');

        if (this.querySelector('#product-variants-json')) {
            this.variants = JSON.parse(this.querySelector('#product-variants-json').innerText);
            this.currentVariant = this.variants.find(variant => variant.id == this.getAttribute('variant-id'));
        }
    }

    connectedCallback() {
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        if (this.querySelector('[name="id"]')) {
          this.addEventListener('input', this.updateVariant.bind(this));
        }
    }

    disconnectedCallback() {
        this.form.removeEventListener('submit', this.handleFormSubmit.bind(this));
        if (this.querySelector('[name="id"]')) {
          this.removeEventListener('input', this.updateVariant.bind(this));
        }
    }

    updateVariant() {
        this.currentVariant = this.variants.find(variant => variant.id == this.querySelector('[name="id"]:checked').value);

        window.history.replaceState({}, '', `/products/${this.productHandle}?variant=${this.currentVariant.id}`);

        if (this.currentVariant.featured_image) {
          document.querySelector('.product-image img').src = this.currentVariant.featured_image.src+'&width=800';
        }
        
        document.querySelector('.product-price').innerText = formatMoney(this.currentVariant.price, window.Shopify.money_format);

        const inputButton = this.querySelector('button[type="submit"]');
        if(!this.currentVariant.available) {
            inputButton.setAttribute('disabled', true);
            inputButton.textContent = 'Sold Out';
        } else {
            inputButton.removeAttribute('disabled');
            inputButton.textContent = 'Add to Cart';
        }
    }

    handleFormSubmit(evt) {
        evt.preventDefault();

        this.addToCartButton.setAttribute('disabled', true);
        this.addToCartButton.textContent = 'Adding...';

        let formData = new FormData(this.form);

        fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(response => {
            if (response.status) {
                alert(`Error: ${response.message} - ${response.description}`);
                return;
            }

            // Signal 1: Tell cart.js to refresh its content
            document.body.dispatchEvent(new CustomEvent('cart:updated'));
            
            // Signal 2: Tell cart.js to open the side cart
            document.body.dispatchEvent(new CustomEvent('cart:open'));

        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        })
        .finally(() => {
            // Restore button text and state
            this.addToCartButton.removeAttribute('disabled');
            this.addToCartButton.textContent = 'Add to Cart';
        });
    }
}

customElements.define('product-form', ProductForm);

function formatMoney(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.', ''); }
  let value = '';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = (format || window.Shopify.money_format || '${{amount}}');

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