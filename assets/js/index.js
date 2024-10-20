// index.js

import { db } from "./config.js"; // Keep Firebase import
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import { collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const storage = getStorage();

// Use the global Vue object instead of importing createApp
const eventsApp = Vue.createApp({
  data() {
    return {
      events: [], // Stores the event data
    };
  },
  methods: {
    async fetchEvents() {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, limit(6)); // Limit to 6 events
      const querySnapshot = await getDocs(q);

      // Loop through the events and fetch images from Firebase Storage
      querySnapshot.forEach(async (doc) => {
        const eventData = doc.data();
        const imageRef = ref(storage, "events/" + eventData.image); // Assuming image path is under announcements/
        const imageURL = await getDownloadURL(imageRef);

        this.events.push({
          ...eventData,
          id: doc.id,
          imageURL, // Image URL fetched from Firebase Storage
          link: eventData.link || "#", // Assuming link field exists, if not default "#"
        });
      });
    },
  },
  mounted() {
    this.fetchEvents(); // Fetch events when the component is mounted
  },
});

// Mount to the #app element
eventsApp.mount("#app");
