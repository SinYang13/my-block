import { db } from "./config.js"; // Firebase config import
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Initialize Firebase storage
const storage = getStorage();

// Create a new Vue app instance
const eventsApp = Vue.createApp({
  data() {
    return {
      events: [], // Store event data fetched from Firestore
      categories: [], // Store unique categories for filtering
      filter: 'all', // Set the default filter to show all events
    };
  },
  methods: {
    // Fetch events from Firestore
    async fetchEvents() {
      const eventsRef = collection(db, "events");
      const querySnapshot = await getDocs(query(eventsRef));

      // Temporary set to collect unique categories
      let categoriesSet = new Set();

      // Loop through the events and fetch associated image URLs from Firebase Storage
      querySnapshot.forEach(async (doc) => {
        const eventData = doc.data();
        const imageRef = ref(storage, "events/" + eventData.image);
        const imageURL = await getDownloadURL(imageRef);

        // Push event data to the events array
        this.events.push({
          ...eventData,
          id: doc.id,
          imageURL, // Store the image URL for displaying
          link: eventData.link || "#", // Set a default link if none is provided
        });

        // Add the event category to the categories set
        categoriesSet.add(eventData.cat);
      });

      // Convert the set to an array to populate the categories filter
      this.categories = Array.from(categoriesSet);
    },
    // Update the filter when a button is clicked
    setFilter(category) {
      this.filter = category; // Set the selected category as the filter
    },
  },
  computed: {
    // Return filtered events based on the selected category
    filteredEvents() {
      if (this.filter === 'all') {
        return this.events; // Show all events if 'all' is selected
      } else {
        return this.events.filter(event => event.cat === this.filter); // Show only events that match the selected category
      }
    },
  },
  mounted() {
    // Fetch the events once the component is mounted
    this.fetchEvents();
  },
});

// Mount the Vue instance to the #app element in the HTML
eventsApp.mount("#app");
