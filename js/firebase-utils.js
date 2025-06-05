// Firebase Utilities - Shared helper functions

// Generate consistent address hash for storage
function generateAddressHash(address) {
  // Normalize address by removing extra spaces, converting to lowercase
  const normalized = address.toLowerCase().replace(/\s+/g, ' ').trim();
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

// Common Firebase operations
const FirebaseUtils = {
  // Get current user
  getCurrentUser() {
    return firebase.auth().currentUser;
  },

  // Save data to user collection
  async saveUserData(collection, docId, data) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    return await firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .collection(collection)
      .doc(docId)
      .set(data);
  },

  // Load data from user collection
  async loadUserData(collection) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const snapshot = await firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .collection(collection)
      .get();
    
    const data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    return data;
  },

  // Delete data from user collection
  async deleteUserData(collection, docId) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    return await firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .collection(collection)
      .doc(docId)
      .delete();
  }
};

// Make functions globally available
window.generateAddressHash = generateAddressHash;
window.FirebaseUtils = FirebaseUtils;
