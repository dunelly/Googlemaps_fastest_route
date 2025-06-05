// Firebase Authentication Module

function initializeFirebaseAuth() {
  // FirebaseUI config
  var uiConfig = {
    signInFlow: "popup",
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // Hide login card after successful login
        var authCard = document.getElementById('firebaseui-auth-card');
        if (authCard) authCard.style.display = 'none';
        return false;
      }
    }
  };

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());

  // Elements
  var authCard = document.getElementById('firebaseui-auth-card');
  var authContainer = document.getElementById('firebaseui-auth-container');
  var showLoginBtn = document.getElementById('show-login-btn');
  var closeLoginBtn = document.getElementById('close-login-btn');
  var userInfo = document.getElementById('user-info');
  var userEmail = document.getElementById('user-email');
  var logoutBtn = document.getElementById('logout-btn');

  // Show login card on button click
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', function() {
      if (authCard) {
        authCard.style.display = 'block';
        if (authContainer) ui.start('#firebaseui-auth-container', uiConfig);
      }
    });
  }

  // Hide login card on cancel
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', function() {
      if (authCard) authCard.style.display = 'none';
    });
  }

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(function(user) {
    // Always hide login card on state change
    if (authCard) authCard.style.display = 'none';
    if (user) {
      // User is signed in
      if (showLoginBtn) showLoginBtn.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'inline-block';
        if (userEmail) userEmail.textContent = user.email || '';
      }
      showMessage('Signed in successfully!', 'success');
    } else {
      // User is signed out
      if (showLoginBtn) showLoginBtn.style.display = 'inline-block';
      if (userInfo) userInfo.style.display = 'none';
    }
  });

  // Logout button handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      firebase.auth().signOut();
      showMessage('Signed out successfully.', 'info');
    });
  }

  // Connect sign-in link in header to show login
  const signInLink = document.querySelector('.sign-in-link');
  if (signInLink) {
    signInLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (showLoginBtn) showLoginBtn.click();
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeFirebaseAuth);
