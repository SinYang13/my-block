// index.js

import { db } from "./config.js"; // Keep Firebase import
import {
  getStorage,
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import {
  collection,
  getDocs,
  query,
  limit,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const storage = getStorage();

// Use the global Vue object instead of importing createApp
const eventsApp = Vue.createApp({
  data() {
    return {
      events: [], // Stores the event data
      map: null,
      googleMapsApiKey: "",
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
        const imageRef = ref(storage, "events/" + eventData.image); // Assuming image path is under events/
        const imageURL = await getDownloadURL(imageRef);

        this.events.push({
          ...eventData,
          id: doc.id,
          imageURL, // Image URL fetched from Firebase Storage
          link: eventData.link || "#", // Assuming link field exists, if not default "#"
        });
      });
    },
    initMap() {
      // Initialize the map
      this.map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 1.2963, lng: 103.8502 }, // Centered on the marker's position
        zoom: 15,
      });

      // Add marker to the map
      const marker = new google.maps.Marker({
        position: { lat: 1.2963, lng: 103.8502 },
        map: this.map,
        title: "Marker Location",
      });

      // Center the map on the marker
      this.map.setCenter(marker.getPosition());
    },

    loadGoogleMapsScript(apiKey) {
      return new Promise((resolve, reject) => {
        if (typeof google !== "undefined" && google.maps) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);

        window.initMap = () => {
          this.initMap();
        };
      });
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

        // profileLink.innerHTML = `<a href="profile.html"><i class="fa fa-calendar"></i> Profile</a>`;
      } else {
        const profileLinkRedir = document.getElementById("profileLinkRedir");
        profileLinkRedir.setAttribute("href", "login.html");

        const profileLinkImg = document.getElementById("profileLinkImg");
        profileLinkImg.className = "fa fa-sign-in-alt";

        const profileLinkText = document.getElementById("profileLinkText");
        profileLinkText.textContent = "Login / Register";

        // profileLink.innerHTML = `<a href="login.html"><i class="fa fa-sign-in-alt"></i> Login / Register</a>`;
      }
    },
  },
  async mounted() {
    try {
      // Fetch Google Maps API key from external JSON
      const response = await fetch("./db/api.json");
      const apiData = await response.json();
      this.googleMapsApiKey = apiData.maps;

      // Load Google Maps script
      await this.loadGoogleMapsScript(this.googleMapsApiKey);
    } catch (err) {
      console.error("Error loading Google Maps API key or script:", err);
    }

    this.fetchEvents(); // Fetch events when the component is mounted

    this.handleProfileLink();
    window.addEventListener("scroll", this.handleScroll);
  },
});

// Mount to the #app element
eventsApp.mount("#app");
