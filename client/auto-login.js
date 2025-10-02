// Auto-login script for testing
// Run this in the browser console on the login page

// Fill in the login form
const usernameInput = document.querySelector('input[type="text"]') || document.querySelector('input[name="username"]');
const passwordInput = document.querySelector('input[type="password"]') || document.querySelector('input[name="password"]');
const loginButton = document.querySelector('button[type="submit"]') || document.querySelector('button');

if (usernameInput && passwordInput && loginButton) {
    usernameInput.value = 'scott';
    passwordInput.value = 'mmqqforever';
    
    // Trigger input events to ensure React state is updated
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('Credentials filled. Click the login button or press Enter.');
    
    // Optionally auto-submit (uncomment the next line)
    // loginButton.click();
} else {
    console.log('Login form elements not found. Make sure you are on the login page.');
}