// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACfpLUClS91Zn7FOxY8wYFrJC3U-UI4pA",
  authDomain: "clozzet-89cd5.firebaseapp.com",
  projectId: "clozzet-89cd5",
  storageBucket: "clozzet-89cd5.firebasestorage.app",
  messagingSenderId: "890593537852",
  appId: "1:890593537852:web:b4cee0e94f58a9b292b839",
  measurementId: "G-96ZT2KSKRC"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

export const getFCMToken = async (vapidKey) => {
  try {
    const currentToken = await getToken(messaging, { vapidKey });
    if (currentToken) {
      console.log("FCM Token:", currentToken);
      return currentToken;
    } else {
      console.warn("No registration token available.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token.", error);
    return null;
  }
};

// Listen to messages while app is open
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      resolve(payload);
    });
  });



//frontedncode
// firebase.js
// import { initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "your-app.firebaseapp.com",
//   projectId: "your-app-id",
//   storageBucket: "your-app.appspot.com",
//   messagingSenderId: "your_sender_id",
//   appId: "your_app_id",
// };

// const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);

// export { messaging, getToken, onMessage };
