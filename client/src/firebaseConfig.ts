import { initializeApp } from 'firebase/app';

const firebaseConfig = {
    projectId: 'newproject-fa93d',
    appId: '1:67104270872:web:272eccce3b5bbe9c14b16d',
    storageBucket: 'newproject-fa93d.firebasestorage.app',
    apiKey: 'AIzaSyCKVvDuVLdqMKMunYpk6tE9Qmo3At_PTE0',
    authDomain: 'newproject-fa93d.firebaseapp.com',
    messagingSenderId: '67104270872',
    measurementId: 'G-2B7Y6Y4PCY',
    projectNumber: '67104270872'
} as const;

const app = initializeApp(firebaseConfig);

export default app;