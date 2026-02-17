// Usage: Displays the product grid, handles "Add to Cart" and "Buy Now" actions from the main list.

// The web address where the product information lives
const API_URL = `${window.API_BASE_URL}/products`;
// The web address for the shopping cart
const CART_API_URL = `${window.API_BASE_URL}/cart`;
// The part of the page where products will be shown
const productsGrid = document.querySelector(".products-grid");

// Get the user's ID and secret token from memory
const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("access_token");

// Function to turn a number into star icons (like 4 stars becomes ★★★★☆)
function getRatingStars(rating) {
  const fullStars = Math.floor(rating); // Number of full stars
  const halfStar = rating % 1 >= 0.5 ? 1 : 0; // Check if we need a half star
  const emptyStars = 5 - fullStars - halfStar; // Remaining empty stars

  // Build the star string
  return "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars);
}

// Function to load all products from the server and show them on the page
async function fetchProducts() {
  try {
    // Ask the server for the list of products
    const response = await fetch(API_URL);
    // If the server didn't answer properly, throw an error
    if (!response.ok) throw new Error("Network response was not ok");

    // Get the product data from the server's answer
    const products = await response.json();
    // Clear the product list on the page
    productsGrid.innerHTML = "";

    // For each product we got back...
    products.forEach((product) => {
      // Create a box to hold the product information
      const productCard = document.createElement("div");
      productCard.classList.add("product-card");

      // Create a link to the details page for this specific product
      const pageLink = `./product_detail.html?id=${product.id}`;

      // Set the HTML inside the box with the product details
      productCard.innerHTML = `
        <div class="product-image">
          <a href="${pageLink}">
            <img src="${product.image_url}" height="330px" alt="${product.name}" />
          </a>
        </div>
        <div class="product-info">
          <h3><a href="${pageLink}" style="text-decoration: none; color: inherit;">${product.name}</a></h3>
          <div class="product-rating" style="color: #ffc107; margin-bottom: 10px;">
            <span class="stars">${getRatingStars(product.rating || 0)}</span>
          </div>
          <p>${product.description}</p>
          <div class="product-price">₹${product.price}</div>
          <div style="display: flex; justify-content: space-between">
            <button class="btn-add-cart" style="width: 150px" onclick="addToCart(${product.id})">
              Add to Cart
            </button>
            <button class="btn-buy" style="width: 150px" onclick="buyNow(${product.id})">
              Buy Now
            </button>
          </div>
        </div>
      `;
      // Add this product box to the page grid
      productsGrid.appendChild(productCard);
    });
  } catch (error) {
    // If it fails, show a message say "Failed to load"
    productsGrid.innerHTML =
      "<p>Failed to load products. Please try again later.</p>";
  }
}

// Function to add an item to the user's shopping cart
async function addToCart(productId) {
  // If the user isn't logged in...
  if (!userId) {
    // Show an alert and send them to the login page
    alert("Please login to add items to cart!");
    window.location.href = "./login.html";
    return;
  }

  try {
    // Tell the server to add 1 of this product to the cart
    const response = await fetch(`${CART_API_URL}/`, {
      method: "POST", // Use POST to send new cart data
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the secret token so the server knows who we are
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 }), // Send the ID and quantity
    });

    // If the server says we aren't authorized (maybe token expired)
    if (!response.ok) {
      if (response.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "./login.html";
        return;
      }
      throw new Error("Failed to add to cart");
    }

    alert("Item added to cart successfully!");
  } catch (error) {
    alert("Failed to add item to cart.");
  }
}

// Function to skip the cart and go straight to checkout
async function buyNow(productId) {
  if (!userId) {
    alert("Please login first!");
    window.location.href = "./login.html";
    return;
  }

  try {
    // Fetch this specific product's data from the server
    const res = await fetch(`${API_URL}/${productId}`);
    const product = await res.json();

    // Prepare information about this product to use on the checkout page
    const productData = {
      id: product.id,
      name: product.name,
      image: product.image_url,
      selectedSize: "Regular",
      quantity: 1,
      price: product.price,
    };

    // Save this item temporarily in the browser's memory
    localStorage.setItem("selectedProduct", JSON.stringify(productData));

    window.location.href = "./address.html";
  } catch (err) {}
}

// Automatically start loading products as soon as the file is loaded
fetchProducts();
