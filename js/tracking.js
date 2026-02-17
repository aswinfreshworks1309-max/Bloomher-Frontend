// Usage: Provides order tracking functionality and status visualization.

// The server address for orders
const ORDER_API_URL = `${window.API_BASE_URL}/orders`;
// Get the secret session token from the browser's memory
const token = localStorage.getItem("access_token");

// Finding all the spots on the page to put order info
const orderIdInput = document.getElementById("order-id-input");
const searchBtn = document.getElementById("search-btn");
const trackingContent = document.getElementById("tracking-content");
const displayOrderId = document.getElementById("display-order-id");
const trackingItemsListEl = document.getElementById("tracking-items-list");
const orderSubtotalEl = document.getElementById("order-subtotal");
const orderTotalEl = document.getElementById("order-total");
const trackingStatusEl = document.getElementById("tracking-status");
const deliveryDateEl = document.getElementById("delivery-date");
const orderShippingEl = document.getElementById("order-shipping");
const trackingTitleEl = document.getElementById("tracking-title");

// Finding the parts of the visual progress bar (Step 1, 2, 3)
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const progressLine = document.getElementById("progress-line");

// Variable to keep track of the bar animation
let animationInterval = null;

// Function to make the progress bar grow smoothly
function animateProgressBar(targetWidth) {
  // If it's already moving, stop it first
  if (animationInterval) cancelAnimationFrame(animationInterval);
  // Get where the bar starts currently
  const startWidth = parseFloat(progressLine.style.width) || 0;
  const endurance = 800; // How long the animation lasts (800 milliseconds)
  let startTime = null;

  // Small steps the animation takes
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    // Calculate how much time has passed
    const progress = Math.min((timestamp - startTime) / endurance, 1);
    // Calculate the current width based on time
    const currentWidth = startWidth + (targetWidth - startWidth) * progress;
    // Apply the width to the blue line on the page
    progressLine.style.width = currentWidth + "%";
    // If not finished, keep going
    if (progress < 1) animationInterval = requestAnimationFrame(step);
  }
  // Start the animation
  animationInterval = requestAnimationFrame(step);
}

// Function that runs when the page opens
function init() {
  // If not logged in, send them to login page
  if (!token) {
    window.location.href = "./login.html";
    return;
  }

  // Look at the web address to see if there is an Order ID already (from checkout)
  const urlParams = new URLSearchParams(window.location.search);
  const orderIdParam = urlParams.get("order_id");

  // If an Order ID was found in the address...
  if (orderIdParam) {
    // Put that ID into the search box
    orderIdInput.value = orderIdParam;
    // Start the search automatically
    handleSearch();
  }
}

// Function to fetch order details when the "Track" button is clicked
async function handleSearch() {
  // Get the ID typed by the user
  const orderIds = orderIdInput.value.trim();
  // If they typed nothing, show an alert
  if (!orderIds) {
    alert("Please enter an Order ID");
    return;
  }

  // Change button text to show we are working
  searchBtn.textContent = "Searching...";
  searchBtn.disabled = true;

  try {
    // Split the IDs if there are multiple (separated by commas)
    const ids = orderIds.split(",").map((id) => id.trim());
    // For each ID, ask the server for its details
    const promises = ids.map((id) =>
      fetch(`${ORDER_API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        // If ID is not found, throw an error
        if (!res.ok) throw new Error(`Order #${id} not found`);
        return res.json();
      }),
    );

    // Wait for ALL IDs to be found
    const orders = await Promise.all(promises);

    // Show the tracking box on the page
    trackingContent.style.display = "block";

    // Format the date of the first order
    const date = new Date(orders[0].order_date || Date.now());
    const orderDateStr = date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Show the Order ID(s) and the date on the page
    displayOrderId.innerHTML =
      (ids.length > 1
        ? `Order IDs: #${ids.join(", #")}`
        : `Order ID: #${ids[0]}`) +
      `<br><small style="color: #666; font-weight: normal;">Ordered on: ${orderDateStr}</small>`;

    // Draw the list of items found
    renderOrdersSummary(orders);

    // Scroll the page down so the user can see the results
    trackingContent.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    // If it fails, show why it failed
    alert(err.message || "Error tracking order");
    // Hide the results box
    trackingContent.style.display = "none";
  } finally {
    // Reset the button back to "Track"
    searchBtn.textContent = "Track";
    searchBtn.disabled = false;
  }
}

// Function to draw the list of products and totals
function renderOrdersSummary(orders) {
  // Clear the old list
  trackingItemsListEl.innerHTML = "";
  let subtotal = 0;
  let totalAmount = 0;

  // For each order...
  orders.forEach((order) => {
    // Calculate item price
    const itemSubtotal = (order.product?.price || 0) * order.quantity;
    subtotal += itemSubtotal;
    totalAmount += order.total_amount;

    // Create HTML for each product
    const itemEl = document.createElement("div");
    itemEl.className = "order-summary";
    itemEl.style.padding = "10px 0";
    itemEl.innerHTML = `
      <div>
        <div style="font-weight: 600; color: var(--primary);">${order.product?.name || "Product info unavailable"}</div>
        <div style="font-size: 0.85rem; color: #666;">Size: ${order.size || "Regular"} | Qty: ${order.quantity}</div>
      </div>
      <div style="font-weight: 600;">₹${itemSubtotal}</div>
    `;
    // Add item to the list
    trackingItemsListEl.appendChild(itemEl);
  });

  // Update prices on the page
  const shipping = Math.max(0, totalAmount - subtotal);
  orderSubtotalEl.textContent = subtotal.toFixed(2);
  orderShippingEl.textContent =
    shipping < 0.01 ? "FREE" : `₹${shipping.toFixed(2)}`;
  orderTotalEl.textContent = totalAmount.toFixed(2);

  // Update the visual progress bar based on status
  updateTrackingUI(orders[0].status);

  // Estimate delivery date (Order Date + 5 days)
  const date = new Date(orders[0].order_date || Date.now());
  date.setDate(date.getDate() + 5);
  deliveryDateEl.textContent = date.toDateString();
}

// Function to update the 3-step progress bar status
function updateTrackingUI(status) {
  const steps = [step1, step2, step3];
  // Reset all steps to look "inactive" first
  steps.forEach((s) => {
    s.classList.remove("active");
    s.parentElement.classList.remove("active");
  });

  // Convert status to lowercase (e.g. "Shipped" becomes "shipped")
  const currentStatus = (status || "processing").toLowerCase();

  // If status is Processing...
  if (["processing", "pending", "paid"].includes(currentStatus)) {
    step1.classList.add("active"); // Light up Step 1
    trackingStatusEl.textContent = "Your order is being processed.";
    trackingTitleEl.textContent = "Order Confirmed!";
    animateProgressBar(15); // Grow bar to 15%
  }
  // If status is Shipped...
  else if (currentStatus === "shipped") {
    step1.classList.add("active"); // Light up Step 1
    step2.classList.add("active"); // Light up Step 2
    trackingStatusEl.textContent = "Your order has been shipped!";
    trackingTitleEl.textContent = "On its Way!";
    animateProgressBar(50); // Grow bar to 50%
  }
  // If status is Delivered...
  else if (currentStatus === "delivered") {
    steps.forEach((s) => s.classList.add("active")); // Light up ALL steps
    trackingStatusEl.textContent = "Your order has been delivered!";
    trackingTitleEl.textContent = "Order Delivered!";
    animateProgressBar(100); // Grow bar to 100%
  }
  // If status is Cancelled...
  else if (currentStatus === "cancelled") {
    trackingStatusEl.textContent = "This order has been cancelled.";
    trackingStatusEl.style.color = "#c23b5a";
    trackingTitleEl.textContent = "Order Cancelled";
    animateProgressBar(0); // Set bar to 0%
  }
}

// Attach the search function to the button click
searchBtn.addEventListener("click", handleSearch);
// Also allow pressing "Enter" in the search box to start search
orderIdInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Run the setup function automatically
init();
