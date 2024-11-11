// db/servicesCRUD.js
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Create an service
export async function createService(serviceData) {
    const docRef = await addDoc(collection(db, "services"), serviceData);
    return docRef.id;
}

// Read services
export async function readServices() {
    const querySnapshot = await getDocs(collection(db, "services"));
    const services = [];

    for (const doc of querySnapshot.docs) {
        const data = { ...doc.data() }; // Create a new object to pass by value
        // Update img path to Firebase Storage URL
        if (data.serviceImage) {
            data.imgName = String(data.serviceImage); // Create a distinct copy of the img value
            data.serviceImage = `https://firebasestorage.googleapis.com/v0/b/myblock-wad.appspot.com/o/services%2F${encodeURIComponent(data.serviceImage)}?alt=media`;
        }

        try {
            const bookmarkedBy = [];
            const bookmarkedBySnapshot = await getDocs(collection(db, `services/${doc.id}/bookmarkedBy`));

            bookmarkedBySnapshot.forEach((bookmarkedByDoc) => {
                bookmarkedBy.push({ id: bookmarkedByDoc.id, ...bookmarkedByDoc.data() });
            });

            // Add the bookmarkedBy to the event data if there are any
            if (bookmarkedBy.length > 0) {
                data.bookmarkedBy = bookmarkedBy;
            }
        } catch (error) {
            console.error(`Error reading bookmarkedBy for event ${doc.id}:`, error);
        }

        services.push({ id: doc.id, ...data });
    }

    return services;
}



// Update an service
export async function updateService(serviceId, updatedData) {
    const serviceRef = doc(db, "services", serviceId);
    await updateDoc(serviceRef, updatedData);
}

// Delete an service
export async function deleteService(serviceId) {
    const serviceRef = doc(db, "services", serviceId);
    await deleteDoc(serviceRef);
}