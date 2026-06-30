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
const fstorage = firebase.storage();

// ════════════════════════════════════════
//  UID da administradora (Luana)
//  IMPORTANTE: substitui o texto abaixo pelo UID real da conta da
//  administradora. Para encontrar: Firebase Console → Authentication →
//  lista de utilizadores → copia o "User UID" da conta da Luana.
//  Tens de colocar o MESMO valor aqui e no ficheiro firestore.rules.
// ════════════════════════════════════════
const ADMIN_UID = "UbefpX4TALPJk3eXs3CKJMXiEaC2";
