// usersCRUD.js

import { db } from './firebaseConfig.js';
import { collection, setDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

// Create a user (using email as document ID)
export async function createUser(email, userData) {
    try {
        const userDocRef = doc(db, 'users', email);
        await setDoc(userDocRef, userData);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Read a user by email
export async function readUser(email) {
    try {
        const userDocRef = doc(db, 'users', email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return userDoc.data();
        } else {
            throw new Error('User does not exist');
        }
    } catch (error) {
        console.error('Error reading user data:', error);
        throw error;
    }
}

// Read all users
export async function readUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error('Error reading users:', error);
        throw error;
    }
}

// Update a user (using email as document ID)
export async function updateUser(email, updatedData) {
    try {
        const userRef = doc(db, "users", email);
        await updateDoc(userRef, updatedData);
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

// Delete a user (using email as document ID)
export async function deleteUser(email) {
    try {
        const userRef = doc(db, "users", email);
        await deleteDoc(userRef);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}