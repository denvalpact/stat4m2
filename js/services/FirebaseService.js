import { firebaseConfig } from '../config.js';
import { GameState } from '../models/GameState.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

class FirebaseService {
    constructor() {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        this.db = getFirestore(app);
        this.auth = getAuth(app);
    }

    async saveMatchData(matchId, data) {
        try {
            await setDoc(doc(this.db, 'matches', matchId), data, { merge: true });
            console.log('Match data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving match data:', error);
            return false;
        }
    }

    async loadMatchData(matchId) {
        try {
            const docRef = doc(this.db, 'matches', matchId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return GameState.fromData(docSnap.data());
            }
            return null;
        } catch (error) {
            console.error('Error loading match data:', error);
            return null;
        }
    }

    async getCurrentUser() {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(this.auth, user => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    async signIn(email, password) {
        try {
            await signInWithEmailAndPassword(this.auth, email, password);
            return true;
        } catch (error) {
            console.error('Sign in error:', error);
            return false;
        }
    }

    async signOut() {
        try {
            await signOut(this.auth);
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    }

    listenToMatchData(matchId, callback) {
        return onSnapshot(doc(this.db, 'matches', matchId), doc => {
            if (doc.exists()) {
                callback(GameState.fromData(doc.data()));
            }
        });
    }

    onAuthStateChanged(callback) {
        return onAuthStateChanged(this.auth, callback);
    }

    async deleteMatchData(matchId) {
        try {
            await deleteDoc(doc(this.db, 'matches', matchId));
            console.log('Match data deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting match data:', error);
            return false;
        }
    }
}

// Create and export a singleton instance
export const firebaseService = new FirebaseService(); 