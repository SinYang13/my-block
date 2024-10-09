// js/main.js
import { createEvent, readEvents, updateEvent, deleteEvent } from '../db/crud.js';

// Example usage: Create a new event
document.getElementById("createBtn").addEventListener("click", async () => {
    const eventData = { name: "New Event", date: "2024-10-09" };
    const eventId = await createEvent(eventData);
    console.log("Event created with ID:", eventId);
});

// Example usage: Read all events
async function displayEvents() {
    const events = await readEvents();
    console.log("Events:", events);
}

displayEvents();
