// Usage: Handles user authentication and session management.

// Find the login form on the page
const loginForm = document.querySelector("form");

// Watch for when the user clicks the "Login" button
loginForm.addEventListener("submit", async (e) => {
  // Stop the page from refreshing when the form is submitted
  e.preventDefault();

  // Get the email and remove any extra spaces
  const email = document.getElementById("email").value.trim();
  // Get the password
  const password = document.getElementById("password").value;

  // Check if it's the admin details (hardcoded for testing)
  if (email === "admin@gmail.com" && password === "admin") {
    // Save fake admin details to the browser's memory
    localStorage.setItem("access_token", "admin-bypass-token");
    localStorage.setItem("user_id", "999");
    localStorage.setItem("user_email", "admin@gmail.com");
    localStorage.setItem("role", "admin");
    // Send the admin to the admin dashboard page
    window.location.href = "./admin.html";
    return; // Stop here
  }

  // Check if the user left the email or password empty
  if (!email || !password) {
    // Show a message telling them to fill both
    alert("Please enter email and password");
    return; // Stop here
  }

  try {
    // Send the email and password to the server to check them
    const response = await fetch(`${window.API_BASE_URL}/users/login`, {
      method: "POST", // Use POST to send data securely
      headers: { "Content-Type": "application/json" }, // Tell the server we are sending JSON
      body: JSON.stringify({ email, password }), // Convert the data to a text format for sending
    });

    // Get the answer back from the server
    const data = await response.json();

    // If the server says there is an error
    if (!response.ok) {
      // Show the error message found in the server's answer
      throw new Error(data.detail || "Login failed");
    }

    // Save the secret "token" given by the server to remember the user is logged in
    localStorage.setItem("access_token", data.access_token);
    // Save the user's ID
    localStorage.setItem("user_id", data.user_id);
    // Save the user's email
    localStorage.setItem("user_email", data.email);
    // Save whether they are a regular user or an admin
    localStorage.setItem("role", data.role);

    // Show a success message
    alert("Login successful! Welcome back.");

    // Check if the user is an admin
    if (data.role === "admin") {
      // Send admin to the dashboard
      window.location.href = "./admin.html";
    } else {
      // Send regular users to the product shop page
      window.location.href = "./product.html";
    }
  } catch (error) {
    // If something went wrong (like the server being down), show an error message
    alert(error.message || "Server error");
  }
});
