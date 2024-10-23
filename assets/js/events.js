import { db } from "./config.js"; // Firebase config import
import {
  getStorage,
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Initialize Firebase storage
const storage = getStorage();

const eventsApp = Vue.createApp({
  data() {
    return {
      events: [], // Store event data fetched from Firestore
      categories: [], // Store unique categories for filtering
      filter: "all", // Set the default filter to show all events
      isLoading: true, // Track whether data is being loaded
      selectedEvent: null, // Track the event to show in the modal
    };
  },
  methods: {
    // Fetch events from Firestore
    async fetchEvents() {
      try {
        const eventsRef = collection(db, "events");

        // Use orderBy to order by the 'name' field in ascending order (A-Z)
        const eventsQuery = query(eventsRef, orderBy("place", "asc")); // Replace 'name' with your actual field name
        const querySnapshot = await getDocs(eventsQuery);

        const eventsArray = []; // Store event data
        const categoriesSet = new Set(); // Store unique categories

        // Collect promises to fetch image URLs for each event
        const promises = querySnapshot.docs.map(async (doc) => {
          const eventData = doc.data();
          const imageRef = ref(storage, "events/" + eventData.image);
          const imageURL = await getDownloadURL(imageRef);

          // Add the event to eventsArray with imageURL
          eventsArray.push({
            ...eventData,
            id: doc.id,
            imageURL,
            link: eventData.link || "#", // Set a default link if none is provided
          });

          // Add the event category to the Set
          categoriesSet.add(eventData.cat);
        });

        // Wait for all promises (image fetch) to resolve
        await Promise.all(promises);

        // Set the events and categories
        this.events = eventsArray;
        this.categories = Array.from(categoriesSet);
        console.log(this.categories); // Debug to check categories
        this.isLoading = false; // Data has finished loading
      } catch (error) {
        console.error("Error fetching events:", error);
        this.isLoading = false;
      }
    },
    // Update the filter when a button is clicked
    setFilter(category) {
      this.filter = category;
    },

    openEventModal(event) {
      this.selectedEvent = {
        ...event,
        date: event.date.toDate().toLocaleString(), // Convert Firestore timestamp to readable date
      };
    },
    handleScroll() {
      const scrollPosition = window.scrollY;
      const headerHeight = document.querySelector("header").offsetHeight;
      const headerElement = document.querySelector("header");
      if (scrollPosition >= headerHeight) {
        headerElement.classList.add("background-header");
      } else {
        headerElement.classList.remove("background-header");
      }
    },
    handleProfileLink() {
      const email = sessionStorage.getItem("loggedInUserEmail");
      const userName = sessionStorage.getItem("loggedInUserName");
      const userType = sessionStorage.getItem("loggedInUserType");
      const profileLink = document.getElementById("profileLink");

      if (email && userType && userName) {
        const profileLinkRedir = document.getElementById("profileLinkRedir");
        profileLinkRedir.setAttribute("href", "profile.html");

        const profileLinkImg = document.getElementById("profileLinkImg");
        profileLinkImg.className = "fa fa-calendar";

        const profileLinkText = document.getElementById("profileLinkText");
        profileLinkText.textContent = "Profile";
      } else {
        const profileLinkRedir = document.getElementById("profileLinkRedir");
        profileLinkRedir.setAttribute("href", "login.html");

        const profileLinkImg = document.getElementById("profileLinkImg");
        profileLinkImg.className = "fa fa-sign-in-alt";

        const profileLinkText = document.getElementById("profileLinkText");
        profileLinkText.textContent = "Login / Register";
      }
    },
  },
  computed: {
    // Return filtered events based on the selected category
    filteredEvents() {
      if (this.filter === "all") {
        return this.events; // Show all events if 'all' is selected
      } else {
        return this.events.filter((event) => event.cat === this.filter); // Show only events that match the selected category
      }
    },
  },
  async mounted() {
    // Fetch the events once the component is mounted
    this.fetchEvents();

    const app = this;
    this.handleProfileLink();
    window.addEventListener("scroll", this.handleScroll);
  },
});

// Mount the Vue instance to the #app element in the HTML
eventsApp.mount("#app");
