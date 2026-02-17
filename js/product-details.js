// Usage: Manages the detailed view of a single product, including features, size selection, and cart/buy actions.

// Web addresses for cart and products
const CART_API_URL = `${window.API_BASE_URL}/cart`;
const PRODUCT_API_URL = `${window.API_BASE_URL}/products`;

const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("access_token");

// Get the product ID from the website address (like ?id=5)
const urlParams = new URLSearchParams(window.location.search);
let productId = urlParams.get("id") || document.body.dataset.productId;

// Find all the spots on the page where we want to put information
const productName = document.getElementById("productName");
const productImage = document.getElementById("productImage");
const productPrice = document.getElementById("productPrice");
const productDescription = document.getElementById("productDescription");
const featuresBox = document.getElementById("featuresBox");
const quantityInput = document.getElementById("productQuantity");
const addToCartBtn = document.getElementById("addToCartBtn");
const buyNowBtn = document.getElementById("buyNowBtn");

// Loading and content areas
const loadingContent = document.getElementById("loadingContent");
const productContent = document.getElementById("productContent");

// Function to load the product details from the server
async function fetchProductDetails() {
  // If there's no product ID, we can't do anything
  if (!productId) {
    if (loadingContent)
      loadingContent.textContent = "Error: No product ID provided.";
    return;
  }

  try {
    // Ask the server for details about this product
    const res = await fetch(`${PRODUCT_API_URL}/${productId}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("Product not found");
      throw new Error("Failed to fetch product details");
    }
    // Get the product data
    const product = await res.json();

    // Fill the page with the product's information
    if (productName) productName.textContent = product.name;
    if (productImage) {
      productImage.src = product.image_url;
      productImage.alt = product.name;
    }
    if (productPrice) productPrice.textContent = `₹${product.price}`;
    if (productDescription)
      productDescription.textContent = product.description;

    // Build the star ratings
    const starSpan = document.querySelector(".rating .stars");
    if (starSpan) {
      const rating = product.rating || 0;
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5 ? 1 : 0;
      const emptyStars = 5 - fullStars - halfStar;
      starSpan.textContent =
        "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars);
    }

    // Change the title of the tab in the browser
    // document.title = `${product.name} - BLOOMHER`;

    // Build the list of product features (the little checkmarks)
    if (featuresBox) {
      let featuresHtml = '<h2 class="features-title">Key Features</h2>';
      let features = [];

      // Figure out if features are a list or just a text block
      if (Array.isArray(product.features)) {
        features = product.features;
      } else if (
        typeof product.features === "string" &&
        product.features.trim() !== ""
      ) {
        features = product.features
          .split(/\r?\n|,/)
          .map((f) => f.trim())
          .filter((f) => f !== "");
      }

      // If no features are given, use some default ones
      if (features.length === 0) {
        features = [
          "100% Certified Organic Cotton",
          "Breathable & Chemical-Free",
          "Ultra-Absorbent Core",
          "Eco-friendly & Biodegradable",
        ];
      }

      // Add each feature to the HTML string
      features.forEach((f) => {
        featuresHtml += `<div class="feature-item"><span class="checkmark">✓</span><span>${f}</span></div>`;
      });
      // Put the features into the box on the page
      featuresBox.innerHTML = featuresHtml;
    }

    // Hide the "Loading..." text and show the actual product info
    if (loadingContent) loadingContent.style.display = "none";
    if (productContent) productContent.style.display = "block";
  } catch (err) {
    // If it fails, show an error on the page
    if (loadingContent) {
      loadingContent.style.color = "red";
      loadingContent.textContent = "Error: " + err.message;
    }
  }
}

// Function to add the item to the cart when the button is clicked
async function addToCart() {
  // If the user isn't logged in, they can't add to cart
  if (!userId) {
    alert("Please login first!");
    window.location.href = "./login.html";
    return;
  }

  // Get the quantity number chosen by the user
  let quantity = parseInt(quantityInput.value) || 1;
  // Don't allow more than 98 items
  if (quantity >= 99) {
    quantity = 98;
    quantityInput.value = 98;
  }

  // Get the size chosen by the user (check which radio button is selected)
  const selectedSize =
    document.querySelector('input[name="size"]:checked')?.value || "Regular";

  try {
    // Ask the server to save these items to the cart
    const response = await fetch(`${CART_API_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Show our secret token
      },
      body: JSON.stringify({
        product_id: parseInt(productId),
        quantity,
        size: selectedSize,
      }),
    });

    // If it worked, show success
    if (response.ok) {
      alert("Added to cart successfully!");
    } else if (response.status === 401) {
      // If token expired, login again
      alert("Session expired. Please login again.");
      window.location.href = "./login.html";
    } else {
      // Otherwise show why it failed
      const errorData = await response.json();
      alert("Failed to add to cart: " + (errorData.detail || "Unknown error"));
    }
  } catch (error) {
    // Network errors
    alert("Server error. Could not add to cart.");
  }
}

// Function to handle the "Buy Now" button
async function buyNow() {
  // Login required
  if (!userId) {
    alert("Please login first!");
    window.location.href = "./login.html";
    return;
  }

  // Get quantity and size
  let quantity =
    (parseInt(quantityInput.value) || 1) >= 99
      ? 98
      : parseInt(quantityInput.value) || 1;
  const selectedSize =
    document.querySelector('input[name="size"]:checked')?.value || "Regular";

  // Package all product information for the checkout page
  const productData = {
    id: productId,
    name: productName.textContent,
    image: productImage.src,
    selectedSize,
    quantity,
    price: parseFloat(productPrice.textContent.replace("₹", "")),
  };

  // Save to browser memory
  localStorage.setItem("selectedProduct", JSON.stringify(productData));
  // Remove any old checkout settings
  localStorage.removeItem("checkoutMode");
  localStorage.removeItem("cartTotal");
  // Go to address page
  window.location.href = "./address.html";
}

// When the page is finished loading...
document.addEventListener("DOMContentLoaded", () => {
  fetchProductDetails();

  if (addToCartBtn)
    addToCartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart();
    });

  if (buyNowBtn)
    buyNowBtn.addEventListener("click", (e) => {
      e.preventDefault();
      buyNow();
    });
});
