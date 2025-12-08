// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0siNHh4rZxuvFOZZuAF91WJJKzrWwoWw",
    authDomain: "tiendas-ucq.firebaseapp.com",
    projectId: "tiendas-ucq",
    storageBucket: "tiendas-ucq.firebasestorage.app",
    messagingSenderId: "217784030468",
    appId: "1:217784030468:web:5a386b292668d0bb28ac51"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Public VAPID Key (Optional but recommended for web push)
// Get this from Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
// messaging.usePublicVapidKey("YOUR_PUBLIC_VAPID_KEY");

console.log('Firebase initialized');
