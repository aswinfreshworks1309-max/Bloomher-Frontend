// Usage: Manages the shopping cart, including fetching items, updating quantities, and navigating to checkout.

const CART_API_URL = `${window.API_BASE_URL}/cart`;

const cartItemsContainer = document.querySelector(".cart-items");

const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const itemCountEl = document.getElementById("itemCount");
// Get the user's secret ID and token
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

// If the user is not logged in, show they have an empty cart and hide the content
if (!userId) {
  document.getElementById("emptyCart").style.display = "block";
  document.getElementById("cartContent").style.display = "none";
}

// Function to ask the server for all items in the user's cart
async function fetchCartItems() {
  if (!userId) return; // Error if not logged in
  try {
    // Fetch cart data using the user's authentication token
    const response = await fetch(`${CART_API_URL}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cartItems = await response.json();
    // Send the data to be drawn on the page
    renderCartItems(cartItems);
  } catch (error) {
    // Stopped here if fails
  }
}

// Function to draw each item from the cart data onto the page
function renderCartItems(cartItems) {
  // Empty the box first
  cartItemsContainer.innerHTML = "";
  // If the cart is actually empty in the server...
  if (cartItems.length === 0) {
    document.getElementById("emptyCart").style.display = "block";
    document.getElementById("cartContent").style.display = "none";
    return;
  }

  // Otherwise show the cart content box
  document.getElementById("emptyCart").style.display = "none";
  document.getElementById("cartContent").style.display = "block";

  let subtotal = 0;
  let totalItems = 0;

  // For each item in the data...
  cartItems.forEach((item) => {
    const product = item.product;
    const itemSize = item.size || "Regular";
    // Calculate price based on size (10% increments)
    const pricePerItem = calculatePriceBySize(product.price, itemSize);

    // Calculate costs
    const itemTotal = pricePerItem * item.quantity;
    subtotal += itemTotal;
    totalItems += item.quantity;

    // Build a little box (HTML) for this cart item
    const cartItemEl = document.createElement("div");
    cartItemEl.classList.add("cart-item");
    cartItemEl.innerHTML = `
      <div class="item-image">
          <img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
      </div>
      <div class="item-details">
        <div class="item-name">${product.name}</div>
        <div class="item-size">${item.size || "Regular"}</div>
      </div>
      <div class="item-actions">
        <div class="item-price">₹<span class="item-price-value">${pricePerItem}</span></div>
        <div class="quantity-control" style="display: flex; gap: 10px; align-items: center;">
             <button onclick="updateQuantity(${product.id}, ${item.quantity - 1})" 
                     style="padding: 2px 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px;">-</button>
             <span class="qty-display">${item.quantity}</span>
             <button onclick="updateQuantity(${product.id}, ${item.quantity + 1})" 
                     style="padding: 2px 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px;">+</button>
        </div>
        <button class="remove-btn" onclick="removeCartItem(${product.id})">Remove</button>
      </div>
    `;
    // Put the item box into the container
    cartItemsContainer.appendChild(cartItemEl);
  });

  // Update the final totals on the page
  subtotalEl.innerText = subtotal;
  const shippingEl = document.getElementById("shipping");
  if (shippingEl) shippingEl.innerText = "FREE";
  totalEl.innerText = subtotal;
  itemCountEl.innerText = totalItems;
}

// Function triggered when user clicks + or - symbols next to items
async function updateQuantity(productId, newQty) {
  // If quantity goes below 1, remove the item entirely
  if (newQty < 1) {
    await removeCartItem(productId, false);
    return;
  }
  // Limit to 98
  if (newQty >= 99) newQty = 98;

  try {
    // Send the updated quantity to the server
    const response = await fetch(
      `${CART_API_URL}/item/${productId}?quantity=${newQty}`,
      {
        method: "PUT", // Use PUT to update existing information
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    // Reload all cart items to reflect changes
    if (response.ok) await fetchCartItems();
  } catch (err) {
    // Failed
  }
}

// Function to remove an item from the cart
async function removeCartItem(productId, askConfirmation = true) {
  // Ask the user "Are you sure?" unless we skip it
  if (askConfirmation && !confirm("Remove this item?")) return;

  try {
    // Send a DELETE request to the server for this product
    const response = await fetch(`${CART_API_URL}/item/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    // If it worked, reload the cart list
    if (response.ok) {
      await fetchCartItems();
    } else {
      alert("Failed to remove item.");
    }
  } catch (error) {
    // Failed
  }
}

// Helper for when user clicks "Proceed to Checkout"
function proceedToCheckout() {
  const subtotalAmount = parseFloat(subtotalEl.innerText) || 0;
  // Tell the checkout page we are coming from the cart
  localStorage.setItem("checkoutMode", "cart");
  // Memory the current total
  localStorage.setItem("cartTotal", subtotalAmount);
  // Remove individual single-buy item info if any
  localStorage.removeItem("selectedProduct");
  // Send them to the checkout page
  window.location.href = "./address.html";
}

// Start loading the cart immediately
fetchCartItems();
