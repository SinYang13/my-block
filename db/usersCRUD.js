// usersCRUD.js

import { db } from './firebaseConfig.js';
import { collection, setDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

// Create a user (using email as document ID)
export async function createUser(email, userData, fname, lname, telNo) {
    try {
        const userDocRef = doc(db, 'users', email);
        // Adding registerDate if not already provided
        if (!userData.registerDate) {
            userData.registerDate = new Date();
        }

        userData.firstName = fname;
        userData.lastName = lname;
        userData.phoneNumber = telNo;
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
            console.log(userDoc.data())
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

        // Loop through each user document
        for (const userDoc of querySnapshot.docs) {
            const userData = { id: userDoc.id, ...userDoc.data() };

            // Try to read the "registrations" subcollection if it exists
            try {
                const registrationsSnapshot = await getDocs(collection(db, `users/${userDoc.id}/registrations`));
                
                // Only add registrations data if it exists
                if (!registrationsSnapshot.empty) {
                    const registrations = [];
                    registrationsSnapshot.forEach((regDoc) => {
                        registrations.push({ id: regDoc.id, ...regDoc.data() });
                    });
                    userData.registrations = registrations;
                }
            } catch (subCollectionError) {
                console.warn(`No registrations subcollection for user ${userDoc.id}`);
            }

            users.push(userData);
        }

        return users;
    } catch (error) {
        console.error("Error reading users:", error);
        throw error;
    }
}


// Update a user (using email as document ID)
export async function updateUser(email, updatedData) {
    try {
        const userRef = doc(db, "users", email);

        // Update the main user document
        await updateDoc(userRef, updatedData);

        console.log('User and registrations updated successfully');
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}


// Delete a user (using email as document ID)
export async function deleteUser(email) {
    const userRef = doc(db, "users", email);
    const registrationsRef = collection(userRef, "registrations");

    try {
        // Delete all documents in the 'posts' subcollection
        const registrationsSnapshot = await getDocs(registrationsRef);
        const deleteRegistrationsPromises = registrationsSnapshot.docs.map((userDoc) => deleteDoc(userDoc.ref));
        await Promise.all(deleteRegistrationsPromises);

        // After deleting all posts, delete the main user document
        await deleteDoc(userRef);
        console.log("User and their posts successfully deleted.");
    } catch (error) {
        console.error("Error deleting user and posts:", error);
        throw error;
    }
}
