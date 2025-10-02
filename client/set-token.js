// Auto-login by setting token in localStorage
// Run this in the browser console

// Set the token (replace with actual token from login response)
const token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInN1YiI6InNjb3R0IiwiaWF0IjoxNzU5NDQ5NTA2LCJleHAiOjE3NjAwNTQzMDZ9.AnDri2WLFiG0P7TmkdYEY6c6C-PHixrokfFY7bdB_Rg";

// Set token in localStorage
localStorage.setItem('token', token);

console.log('Token set in localStorage. Refreshing page...');

// Refresh the page to trigger authentication
window.location.reload();