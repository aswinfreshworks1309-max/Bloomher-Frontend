// Usage: Processes orders, manages payment methods, and handles the transition from cart to order placement.

// Web addresses for orders and payments
const ORDER_API_URL = `${window.API_BASE_URL}/orders`;
const PAYMENT_API_URL = `${window.API_BASE_URL}/payments`;

// Buttons and user information
const placeOrderBtn = document.querySelector(".place-order-btn");
const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("access_token");

// Separate function to calculate price based on size (10% increments)
function calculatePriceBySize(basePrice, size) {
  let multiplier = 1.0;
  if (size === "Small") multiplier = 0.9;
  else if (size === "Regular") multiplier = 1.0;
  else if (size === "Large") multiplier = 1.1;
  else if (size === "XL") multiplier = 1.2;
  return Math.round(basePrice * multiplier);
}

// Finding spots where we show order details
const productNameEl = document.getElementById("product-name");
const productSizeEl = document.getElementById("product-size");
const productPriceEl = document.getElementById("product-price");
const productQuantityEl = document.getElementById("product-quantity");
const orderSubtotalEl = document.getElementById("order-subtotal");
const orderShippingEl = document.getElementById("order-shipping");
const orderTotalEl = document.getElementById("order-total");

// Finding list elements
const orderItemsList = document.getElementById("order-items-list");
let selectedProduct = null;

// Function that runs when the page starts to set everything up
async function init() {
  // Check if we are checking out a full cart or just one product
  const checkoutMode = localStorage.getItem("checkoutMode");
  const storedProduct = localStorage.getItem("selectedProduct");

  if (checkoutMode === "cart") {
    // Load and show items from the full cart
    await renderCartSummary();
  } else if (storedProduct) {
    // Load and show details for just the single "Buy Now" product
    selectedProduct = JSON.parse(storedProduct);
    renderOrderSummary();
  } else {
    // Otherwise show no items
    productNameEl.textContent = "No items selected";
  }

  // Set up the section that hides/shows card numbers
  setupPaymentToggle();
}

// Function to show or hide credit card fields based on choice
function setupPaymentToggle() {
  const paymentInputs = document.querySelectorAll('input[name="payment"]');
  const cardDetails = document.getElementById("cardDetails");

  paymentInputs.forEach((input) => {
    // Watch for when the payment type changes
    input.addEventListener("change", (e) => {
      // If "card" is selected, show the extra fields
      if (e.target.value === "card") {
        cardDetails.classList.add("active");
      } else {
        // Otherwise hide them
        cardDetails.classList.remove("active");
      }
    });
  });
}

// Function to get the current cart from the server and show a summary
async function renderCartSummary() {
  if (!userId) return;

  try {
    // Ask the server for the latest cart
    const res = await fetch(`${window.API_BASE_URL}/cart/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await res.json();

    // If suddenly empty, send user back to cart page
    if (items.length === 0) {
      alert("Your cart is empty! Redirecting to cart page...");
      window.location.href = "./card.html";
      return;
    }

    // Clear and redraw cart list
    orderItemsList.innerHTML = "";
    let subtotal = 0;

    items.forEach((item) => {
      const product = item.product;
      const itemSize = item.size || "Regular";
      // Calculate price based on size (10% increments)
      const pricePerItem = calculatePriceBySize(product.price, itemSize);

      const itemTotal = pricePerItem * item.quantity;
      subtotal += itemTotal;

      const itemRow = document.createElement("div");
      itemRow.classList.add("item-row");
      itemRow.style.marginBottom = "15px";
      itemRow.innerHTML = `
        <div>
          <div style="font-weight: 600;">${product.name}</div>
          <div style="font-size: 0.9rem; color: #666">${item.size || "Regular"}</div>
          <div style="font-size: 0.8rem; color: #888">Qty: ${item.quantity}</div>
        </div>
        <div style="font-weight: 600;">₹${itemTotal}</div>
      `;
      orderItemsList.appendChild(itemRow);
    });

    // Update displayed prices
    const total = subtotal;
    if (orderSubtotalEl) orderSubtotalEl.textContent = `₹${subtotal}`;
    if (orderShippingEl) orderShippingEl.textContent = "FREE";
    orderTotalEl.textContent = `₹${total}`;
  } catch (err) {
    // Final error message
    productNameEl.textContent = "Error loading order items";
  }
}

// Function to show the single item if you clicked "Buy Now"
function renderOrderSummary() {
  if (!selectedProduct) return;

  productNameEl.textContent = selectedProduct.name;
  productSizeEl.textContent = selectedProduct.selectedSize || "Regular";
  productPriceEl.textContent = `₹${selectedProduct.price * selectedProduct.quantity}`;
  if (productQuantityEl)
    productQuantityEl.textContent = `Qty: ${selectedProduct.quantity}`;

  const subtotal = selectedProduct.price * selectedProduct.quantity;
  const total = subtotal;

  if (orderSubtotalEl) orderSubtotalEl.textContent = `₹${subtotal}`;
  if (orderShippingEl) orderShippingEl.textContent = "FREE";
  orderTotalEl.textContent = `₹${total}`;
}

// Watch for when the "Place Order" button is clicked
placeOrderBtn.addEventListener("click", async () => {
  // Check if address/fields are correctly filled
  if (!validateForm()) return;
  // Make sure logged in
  if (!userId) {
    alert("Please login to complete your order.");
    window.location.href = "./login.html";
    return;
  }

  // Figure out if we are buying a cart or a single product
  const checkoutMode = localStorage.getItem("checkoutMode");
  if (checkoutMode === "cart") {
    await createCartOrder();
  } else {
    await createOrder();
  }
});

// Function to check if name, address, zip code etc. are filled
function validateForm() {
  const fields = ["name", "email", "address", "city", "state", "zip"];
  for (let f of fields) {
    if (!document.getElementById(f).value.trim()) {
      alert(`Please enter your ${f}`);
      return false;
    }
  }

  // Check which payment method is selected
  const paymentMethodInput = document.querySelector(
    'input[name="payment"]:checked',
  );
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : "card";

  // If they chose card, make sure they filled card details
  if (paymentMethod === "card") {
    const cardFields = ["cardNumber", "expiry", "cvv", "cardName"];
    for (let f of cardFields) {
      const el = document.getElementById(f);
      if (!el || !el.value.trim()) {
        alert(
          `Please enter your ${f.replace(/([A-Z])/g, " $1").toLowerCase()} `,
        );
        return false;
      }
    }
  }
  return true;
}

// Function to place a single order for just one product
async function createOrder() {
  try {
    const response = await fetch(`${ORDER_API_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: selectedProduct.id,
        quantity: selectedProduct.quantity,
        size: selectedProduct.selectedSize || "Regular",
      }),
    });

    if (!response.ok) throw new Error("Order creation failed");
    const order = await response.json();
    // After creating the order, process the payment for it
    await processPayment(order.id);
  } catch (error) {
    alert("Failed to place order. " + error.message);
  }
}

// Function to turn every item in the cart into a real order
async function createCartOrder() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/cart/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await res.json();

    if (items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Create a request for each item at once
    const orderPromises = items.map((item) => {
      return fetch(`${ORDER_API_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size || "Regular",
        }),
      }).then((r) => r.json());
    });

    // Wait for all items to be ordered
    const orders = await Promise.all(orderPromises);

    // Process payment for each new order
    for (const order of orders) {
      await processPayment(order.id, true);
    }

    const orderIds = orders.map((o) => o.id).join(",");
    alert("Order placed successfully! ");
    // Clear the memory of these items since they are now bought
    localStorage.removeItem("selectedProduct");
    localStorage.removeItem("checkoutMode");
    localStorage.removeItem("cartTotal");
    // Go to tracking page
    window.location.href = `./tracking.html?order_id=${orderIds}`;
  } catch (err) {
    alert("Error processing cart order: " + err.message);
  }
}

// Function that tells the server we are paying for our order
async function processPayment(orderId, silent = false) {
  const paymentMethodInput = document.querySelector(
    'input[name="payment"]:checked',
  );
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : "card";

  try {
    const res = await fetch(`${PAYMENT_API_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        payment_method: paymentMethod,
      }),
    });

    if (!res.ok) throw new Error("Payment failed");

    // If this is the final item, show success and redirect
    if (!silent) {
      alert("Order placed successfully! ");
      localStorage.removeItem("selectedProduct");
      localStorage.removeItem("checkoutMode");
      localStorage.removeItem("cartTotal");
      window.location.href = `./tracking.html?order_id=${orderId}`;
    }
  } catch (err) {
    if (!silent) alert("Payment processing failed.");
  }
}

// Run the setup function
init();
