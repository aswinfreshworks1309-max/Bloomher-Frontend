// Usage: Handles new user registration.

// Find the signup form on the page
const signupForm = document.getElementById("signupForm");

// Watch for when the user clicks the "Sign Up" button
signupForm.addEventListener("submit", async (e) => {
  // Stop the page from refreshing when the form is submitted
  e.preventDefault();

  // Get the name entered by the user
  const name = document.getElementById("fullname").value.trim();
  // Get the email entered by the user
  const email = document.getElementById("email").value.trim();
  // Get the password
  const password = document.getElementById("password").value;
  // Get the password again to confirm it
  const confirmPassword = document.getElementById("confirm-password").value;
  // Check if they checked the "Agree to Terms" box
  const terms = document.getElementById("terms").checked;

  // Check if the two passwords match
  if (password !== confirmPassword) {
    // If they don't match, show an alert
    alert("Passwords don't match");
    return; // Stop here
  }

  // Check if they forgot to agree to the terms
  if (!terms) {
    // If not checked, show an alert
    alert("Please accept the Terms & Conditions");
    return; // Stop here
  }

  try {
    // Send the user details to the server to create a new account
    const response = await fetch(`${window.API_BASE_URL}/users/signup`, {
      method: "POST", // Use POST to send new information
      headers: { "Content-Type": "application/json" }, // Tell the server we're sending JSON
      body: JSON.stringify({ name, email, password }), // Send the name, email, and password
    });

    // Get the answer from the server
    const data = await response.json();

    // If the server says something is wrong (like the email already exists)
    if (!response.ok) {
      // Show the reason why it failed
      throw new Error(data.detail || "Signup failed");
    }

    // Show a success message
    alert("Signup successful! Redirecting to login...");
    // Send the user to the login page so they can sign in
    window.location.href = "./login.html";
  } catch (error) {
    // If there's a problem, show an error message
    alert(error.message || "Server error");
  }
});
