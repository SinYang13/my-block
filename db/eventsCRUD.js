// db/crud.js
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Create function
async function createEvent(eventData) {
    if (!eventData || !eventData.name || !eventData.date || !eventData.desc || !eventData.link) {
        throw new Error("Incomplete event data");
    }
    const docRef = await addDoc(collection(db, "events"), eventData);
    return docRef.id;
}

// Read function
async function readEvents() {
    const querySnapshot = await getDocs(collection(db, "events"));
    const data = {};
    querySnapshot.forEach((doc) => {
        data[doc.id] = doc.data();
    });
    return data;
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
