// db/crud.js
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Create function
async function createEvent(eventData) {
    // if (!eventData || !eventData.name || !eventData.date || !eventData.description || !eventData.link) {
    //     throw new Error("Incomplete event data");
    // }
    const docRef = await addDoc(collection(db, "events"), eventData);
    return docRef.id;
}

// Read function
async function readEvents() {
    const querySnapshot = await getDocs(collection(db, "events"));
    const events = [];
    querySnapshot.forEach((doc) => {
        const data = { ...doc.data() }; // Create a new object to pass by value
        // Update img path to Firebase Storage URL
        if (data.image) {
            data.imgName = String(data.image); // Create a distinct copy of the img value
            data.image = `https://firebasestorage.googleapis.com/v0/b/myblock-wad.appspot.com/o/events%2F${encodeURIComponent(data.image)}?alt=media`;
        }
        events.push({ id: doc.id, ...data });
    });
    return events;
}

// Update function
async function updateEvent(eventId, updatedData) {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, updatedData);
}

// Delete function
async function deleteEvent(eventId) {
    const eventRef = doc(db, "events", eventId);
    await deleteDoc(eventRef);
}

export { createEvent, readEvents, updateEvent, deleteEvent };
