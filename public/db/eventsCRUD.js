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
    try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const events = [];

        for (const doc of querySnapshot.docs) {
            const data = { ...doc.data() }; // Create a new object to pass by value

            // Update img path to Firebase Storage URL
            if (data.image) {
                data.imgName = String(data.image); // Create a distinct copy of the img value
                data.image = `https://firebasestorage.googleapis.com/v0/b/myblock-wad.appspot.com/o/events%2F${encodeURIComponent(data.image)}?alt=media`;
            }

            // Attempt to read the "registrations" subcollection if it exists
            try {
                const registrations = [];
                const registrationsSnapshot = await getDocs(collection(db, `events/${doc.id}/registrations`));

                registrationsSnapshot.forEach((registrationDoc) => {
                    registrations.push({ id: registrationDoc.id, ...registrationDoc.data() });
                });

                // Add the registrations to the event data if there are any
                if (registrations.length > 0) {
                    data.registrations = registrations;
                }
            } catch (error) {
                console.error(`Error reading registrations for event ${doc.id}:`, error);

            }

            
            

            try {
                // Check if data.price is in the correct format with a '$' symbol
                if (data.price && data.price.includes('$')) {
                    let price = parseFloat(data.price.split('$')[1]); // parseFloat to handle numerical values
                    if (!isNaN(price)) {
                        data.revenue = price * data.registrations.length;
                    } else {
                        console.log("Price is not a valid number.");
                        data.revenue = 0;
                    }
                } else {
                    console.log("Price format is incorrect or missing.");
                    data.revenue = 0;
                }
            } catch (error) {
                console.log("Error calculating revenue:", error);
                data.revenue = 0;
            }
            

            events.push({ id: doc.id, ...data });
        }

        return events;
    } catch (error) {
        console.error("Error reading events:", error);
        return [];
    }
}

// Update function
async function updateEvent(eventId, updatedData) {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, updatedData);
}

// Delete function
async function deleteEvent(eventId) {
    const eventRef = doc(db, "events", eventId);
    const attendeesRef = collection(eventRef, "attendees");

    try {
        // Delete all documents in the 'attendees' subcollection
        const attendeesSnapshot = await getDocs(attendeesRef);
        const deleteAttendeesPromises = attendeesSnapshot.docs.map((attendeeDoc) => deleteDoc(attendeeDoc.ref));
        await Promise.all(deleteAttendeesPromises);

        // After deleting all attendees, delete the main event document
        await deleteDoc(eventRef);
        console.log("Event and its attendees successfully deleted.");
    } catch (error) {
        console.error("Error deleting event and attendees:", error);
    }
}

export { createEvent, readEvents, updateEvent, deleteEvent };
