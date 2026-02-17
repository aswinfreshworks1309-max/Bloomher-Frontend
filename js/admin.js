// Usage: Handles admin dashboard, product management, user listing, and order status updates.

//  1. Admin Access Control (CRITICAL)
// Get the user's role and token from memory
const userRole = localStorage.getItem("role");
const token = localStorage.getItem("access_token");

// If the user is NOT an admin...
if (userRole !== "admin") {
  // Show an alert and kick them out to the home page
  alert("Access Denied! Admins only.");
  window.location.href = "../index.html";
}

// The backend server address
const BASE_URL = window.API_BASE_URL;

//  2. Sidebar Navigation & Initialization
// Wait for the page to load
document.addEventListener("DOMContentLoaded", () => {
  // Find all menu buttons and content sections
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".content-section");

  // For each menu button...
  menuItems.forEach((item) => {
    // When a button is clicked...
    item.addEventListener("click", () => {
      // Remove "active" color from all buttons
      menuItems.forEach((i) => i.classList.remove("active"));
      // Add "active" color to the clicked button
      item.classList.add("active");

      // Hide all sections
      sections.forEach((section) => {
        section.style.display = "none";
        section.classList.remove("active");
      });

      // Find the ID of the section we want to show
      const sectionId = item.getAttribute("data-section");
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        // Show that section
        targetSection.style.display = "block";
        // Small delay to make the entry animation look smooth
        setTimeout(() => targetSection.classList.add("active"), 10);

        // Load correct data depending on which section was opened
        if (sectionId === "products") fetchProducts();
        if (sectionId === "users") fetchUsers();
        if (sectionId === "orders") fetchOrders();
        if (sectionId === "dashboard") refreshDashboard();
      }
    });
  });

  // Handle Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Ask "Are you sure?"
      if (confirm("Are you sure you want to logout?")) {
        // Clear everything from browser memory and go to login page
        localStorage.clear();
        window.location.href = "./login.html";
      }
    });
  }

  // Handle the Product Form being submitted
  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
  }

  // Load the main dashboard numbers when first opening the page
  refreshDashboard();
});

//  3. UI Helpers
// Function to show or hide the "Add Product" form
function toggleProductForm() {
  const container = document.getElementById("addProductFormContainer");
  // If it's hidden, show it. If it's shown, hide it.
  container.style.display =
    container.style.display === "none" ? "block" : "none";
}

// Function to prepare the form for adding a completely NEW product
function openAddProductForm() {
  const container = document.getElementById("addProductFormContainer");
  // Set title to "Add New Product"
  document.getElementById("formTitle").innerText = "Add New Product";
  // Reset all input boxes to empty
  document.getElementById("addProductForm").reset();
  // Clear the hidden ID box
  document.getElementById("p_id").value = "";
  // Set default rating to 0
  document.getElementById("p_rating").value = "0";
  // Clear features box
  document.getElementById("p_features").value = "";
  // Make the form visible
  container.style.display = "block";
}

//  4. Data Fetching Functions

// Function to fetch all products and show them in a table
async function fetchProducts() {
  try {
    // Ask the server for the list of products
    const response = await fetch(`${BASE_URL}/products/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const products = await response.json();
    // Get the table body
    const body = document.getElementById("productsBody");
    body.innerHTML = ""; // Clear existing rows

    // For each product...
    products.forEach((p) => {
      // Add a new row with product image, name, price, and buttons
      body.innerHTML += `
                <tr>
                    <td><img src="${p.image_url}" width="50" style="border-radius: 5px;"></td>
                    <td>${p.name}</td>
                    <td>₹${p.price}</td>
                    <td>${p.stock}</td>
                    <td>
                        <button class="status processing" style="border:none; cursor:pointer;" onclick="editProduct(${p.id})">Edit</button>
                        <button class="status pending" style="border:none; cursor:pointer;" onclick="deleteProduct(${p.id})">Deactivate</button>
                    </td>
                </tr>
            `;
    });
  } catch (err) {
    // Silent catch
  }
}

// Function to fetch all registered users and show them in a table
async function fetchUsers() {
  try {
    // Ask server for user list
    const response = await fetch(`${BASE_URL}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await response.json();
    const body = document.getElementById("usersBody");
    body.innerHTML = "";

    // For each user...
    users.forEach((u) => {
      // Add a row with ID, Name, Email and a badge for their Role
      body.innerHTML += `
                <tr>
                    <td>#${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge" style="background:${u.role === "admin" ? "#ffe2e5" : "#f0f0f0"}">${u.role}</span></td>
                </tr>
            `;
    });
  } catch (err) {
    // Silent catch
  }
}

// Function to fetch all customer orders and show them in a table
async function fetchOrders() {
  try {
    // Ask server for order list
    const response = await fetch(`${BASE_URL}/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await response.json();
    const body = document.getElementById("ordersBody");
    body.innerHTML = "";

    // For each order...
    orders.forEach((o) => {
      const orderDate = new Date(o.order_date).toLocaleDateString();
      // Add row with Order ID, Customer Name, Product Name, Price, and a Status Selector
      body.innerHTML += `
                <tr>
                    <td>#${o.id} <br><small style="color:#666">${orderDate}</small></td>
                    <td>${o.user ? o.user.name : `User #${o.user_id}`}</td>
                    <td>${o.product ? o.product.name : `Product #${o.product_id}`}</td>
                    <td>₹${o.total_amount}</td>
                    <td>
                        <select onchange="updateOrderStatus(${o.id}, this.value)" class="status-select ${o.status}">
                            <option value="processing" ${o.status === "processing" ? "selected" : ""}>Processing</option>
                            <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Shipped</option>
                            <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
                            <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                        </select>
                    </td>
                </tr>
            `;
    });
  } catch (err) {
    // Silent catch
  }
}

// Function to update the numbers and "Recent Orders" on the main Dashboard
async function refreshDashboard() {
  try {
    // 1. Fetch Orders to calculate total sales and order count
    const orderRes = await fetch(`${BASE_URL}/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await orderRes.json();

    const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
    document.getElementById("stat-total-sales").innerText =
      `₹${totalSales.toLocaleString()}`;
    document.getElementById("stat-total-orders").innerText = orders.length;

    // 2. Fetch Product count
    const productRes = await fetch(`${BASE_URL}/products/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const products = await productRes.json();
    document.getElementById("stat-total-products").innerText = products.length;

    // 3. Fetch User count
    const userRes = await fetch(`${BASE_URL}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await userRes.json();
    document.getElementById("stat-total-users").innerText = users.length;

    // 4. Update the "Recent Orders" table with the latest 5 orders
    const recentOrdersBody = document.getElementById(
      "dashboardRecentOrdersBody",
    );
    if (recentOrdersBody) {
      recentOrdersBody.innerHTML = "";
      orders
        .sort((a, b) => b.id - a.id) // Sort newest first
        .slice(0, 5) // Take top 5
        .forEach((o) => {
          const orderDate = new Date(o.order_date).toLocaleDateString();
          recentOrdersBody.innerHTML += `
                    <tr>
                        <td>#${o.id} <br><small style="color:#666">${orderDate}</small></td>
                        <td>${o.user ? o.user.name : `User #${o.user_id}`}</td>
                        <td>${o.product ? o.product.name : `Product #${o.product_id}`}</td>
                        <td>₹${o.total_amount}</td>
                        <td>
                          <select onchange="updateOrderStatus(${o.id}, this.value)" class="status-select ${o.status}">
                            <option value="processing" ${o.status === "processing" ? "selected" : ""}>Processing</option>
                            <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Shipped</option>
                            <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
                            <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                          </select>
                        </td>
                    </tr>
                `;
        });
    }
  } catch (err) {
    // Silent catch
  }
}

//  5. Action Handlers

// Function to handle adding a NEW product or UPDATING an old one
async function handleAddProduct(e) {
  // Stop page from refreshing
  e.preventDefault();

  // Get the ID from the hidden input box (to see if we are updating)
  const pId = document.getElementById("p_id").value;
  // Collect all data from the form
  const payload = {
    name: document.getElementById("p_name").value,
    description: document.getElementById("p_desc").value,
    price: parseFloat(document.getElementById("p_price").value),
    stock: parseInt(document.getElementById("p_stock").value),
    image_url: document.getElementById("p_image").value,
    rating: parseFloat(document.getElementById("p_rating").value) || 0,
    features: document.getElementById("p_features").value,
  };

  // If there's an ID, use PUT. If no ID, use POST.
  const method = pId ? "PUT" : "POST";
  const url = pId ? `${BASE_URL}/products/${pId}` : `${BASE_URL}/products/`;

  try {
    // Send data to the server
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // If worked...
    if (response.ok) {
      alert(` Product ${pId ? "updated" : "added"} successfully!`);
      // Reset form and hide it
      document.getElementById("addProductForm").reset();
      toggleProductForm();
      // Refresh the product table
      fetchProducts();
    } else {
      // If error, show server response
      const error = await response.json();
      alert(
        ` Failed to ${pId ? "update" : "add"} product: ` +
          (error.detail || "Unknown error"),
      );
    }
  } catch (err) {
    // Network error
    alert(" Server connection error!");
  }
}

// Function to load a product's details INTO the form so the admin can edit it
async function editProduct(id) {
  try {
    // Ask server for this specific product
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const p = await response.json();

    // Fill each input box with the existing data
    document.getElementById("p_id").value = p.id;
    document.getElementById("p_name").value = p.name;
    document.getElementById("p_price").value = p.price;
    document.getElementById("p_stock").value = p.stock;
    document.getElementById("p_image").value = p.image_url;
    document.getElementById("p_desc").value = p.description;
    document.getElementById("p_rating").value = p.rating || 0;
    document.getElementById("p_features").value = p.features || "";

    // Change title to "Edit Product" and show the form
    document.getElementById("formTitle").innerText = "Edit Product";
    document.getElementById("addProductFormContainer").style.display = "block";

    // Smoothly scroll down to the editing form
    document
      .getElementById("addProductFormContainer")
      .scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    // Silent catch
  }
}

// Function to deactivate/remove a product
async function deleteProduct(id) {
  // Ask for confirmation
  if (!confirm("Are you sure you want to deactivate this product?")) return;

  try {
    // Send DELETE request to server
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    // If it worked, refresh the table list
    if (response.ok) {
      fetchProducts();
    }
  } catch (err) {
    // Silent catch
  }
}

// Function to change the status (Processing, Shipped, etc.) of a customer order
async function updateOrderStatus(orderId, newStatus) {
  try {
    // Send PATCH request to update only the status part of the order
    const response = await fetch(
      `${BASE_URL}/orders/${orderId}/status?new_status=${newStatus}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    // If successful...
    if (response.ok) {
      alert(`Order #${orderId} status updated to ${newStatus}`);
      fetchOrders(); // Refresh order table
      refreshDashboard(); // Refresh dashboard numbers
    } else {
      // Show error reason
      const error = await response.json();
      alert("Failed to update status: " + (error.detail || "Unknown error"));
    }
  } catch (err) {
    // Network error
    alert("Server connection error!");
  }
}
