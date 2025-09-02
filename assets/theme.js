// --- Side Cart Drawer Logic ---

class SidebarDrawer extends HTMLElement {
  constructor() {
    super();
    this.drawerContainer = this.querySelector('.sidebar-drawer__container');
    this.overlay = this.querySelector('.sidebar-overlay');
    this.closeBtn = this.querySelector('.sidebar-drawer__close-btn');

    // Bind this to methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);

    // Event listeners
    this.overlay.addEventListener('click', this.close);
    this.closeBtn.addEventListener('click', this.close);
  }

  open() {
    this.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // Prevents scrolling of the main page
  }

  close() {
    this.classList.remove('is-open');
    document.body.style.overflow = ''; // Re-enables scrolling
  }
}

customElements.define('sidebar-drawer', SidebarDrawer);

// --- Global Event Listener to Open the Cart ---
// This listens for clicks on any element that should open the cart.
// We assume your cart icon is a link to '/cart'.
document.addEventListener('DOMContentLoaded', () => {
  const cartLink = document.querySelector('a[href="/cart"]');
  const sidebarDrawer = document.querySelector('sidebar-drawer');

  if (cartLink && sidebarDrawer) {
    cartLink.addEventListener('click', (event) => {
      event.preventDefault(); // Prevents navigating to the cart page
      sidebarDrawer.open();
    });
  }
});