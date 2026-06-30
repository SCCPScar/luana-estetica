// ════════════════════════════════════════
//  FIREBASE CONFIG
// ════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyBbnpYURgVcM4pG8rKHlRv9xG2nt-2IQqs",
  authDomain: "luana-estetica.firebaseapp.com",
  projectId: "luana-estetica",
  storageBucket: "luana-estetica.firebasestorage.app",
  messagingSenderId: "105339832726",
  appId: "1:105339832726:web:9bd0ad7dabbdb6f01df5b7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const fsdb = firebase.firestore();
