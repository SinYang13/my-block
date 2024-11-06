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
      selectedEvent: {}, // Track the event to show in the modal
      showSignupModal: false, // Track visibility of the signup modal
      attendeeForms: [], // Initialize attendee forms array

      CLIENT_ID: "815388161577-1q8k35ihr9mtr8cvhis048ljdod8v7f8.apps.googleusercontent.com",
      API_KEY: "AIzaSyCp8RabRDvoSbfNgDqzy14fqxj-5ePsOBI",
      DISCOVERY_DOC: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      SCOPES: "https://www.googleapis.com/auth/calendar",

      tokenClient: null,
      gapiInited: false,
      gisInited: false,
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

    closeEventModal() {
      console.log("close");
      this.selectedEvent = {};
      console.log("close");
    },
  
    addAttendeeForm() {
      // Logic to add an attendee form
      const attendeeForm = {
        name: '',
        email: '',
        phone: '',
        dietaryRestrictions: '',
        specialRequests: ''
      };
      this.attendeeForms.push(attendeeForm);
    },
    removeAttendeeForm(index) {
      this.attendeeForms.splice(index, 1);
    },
    
    openEventModal(event) {
      this.selectedEvent = {
        ...event,
        date: event.date.toDate().toLocaleString(), // Convert Firestore timestamp to readable date
      };
      console.log( {
        ...event,
        date: event.date.toDate().toLocaleString(), // Convert Firestore timestamp to readable date
      })
      this.showSignupModal = false;
    },
  
    openSignupModal() {
      console.log("Opening signup modal"); // Debugging line
      this.showSignupModal = true;

      if (this.attendeeForms.length === 0) {
        this.addAttendeeForm(); // Ensure at least one form is available initially
      }
   
      // Manually show the modal using Bootstrap's JavaScript API
      this.$nextTick(() => {
         const signupModalInstance = new bootstrap.Modal(document.getElementById('signupModal'));
         signupModalInstance.show();
      });
   },
   
   closeSignupModal() {
      console.log("Closing signup modal"); // Debugging line
      this.showSignupModal = false;
      this.attendeeForms = [{ name: '', email: '', phone: '', dietaryRestrictions: '', specialRequests: '' }];
   
      const signupModalInstance = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
      if (signupModalInstance) {
         signupModalInstance.hide();
      }
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
        profileLinkText.textContent = "Login";
      }
    },

    gapiLoaded() {
      console.log("Running gapiLoaded...")
      gapi.load("client", this.initializeGapiClient);
    },
    async initializeGapiClient() {
      console.log("Running initializeGapiClient...")

      await gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: [this.DISCOVERY_DOC],
      });
      this.gapiInited = true;
      console.log("Google API client initialized.");
    },
    gisLoaded() {
      console.log("Running gisLoaded...")

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: this.SCOPES,
        callback: this.handleTokenResponse, // Assign a callback function
      });
      this.gisInited = true;
      console.log("Google Identity Services initialized.");
    },
    handleTokenResponse(resp) {
      console.log("Running handleTokenResponse...")

      if (resp.error !== undefined) {
        console.error("Error during token response", resp.error);
        return;
      }
      // Assuming you want to create an event with some event details
      const eventDetails = {
        email: "example@example.com" // Replace with actual email or event data
      };
      this.scheduleEvent();
    },
    googleCreateEvent() {
      console.log("Running googleCreateEvent...")

      if (!this.gapiInited || !this.gisInited) {
        console.error("gapi or gis not initialized.");
        return;
      }

      if (gapi.client.getToken() === null) {
        this.tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        this.tokenClient.requestAccessToken({ prompt: "" });
      }
    },
    scheduleEvent() {
      let start = new Date(this.selectedEvent.date).toISOString()

      let endDate = new Date(start);

      // Add 2 hours (2 * 60 * 60 * 1000 milliseconds) to the start date
      endDate.setTime(endDate.getTime() + (2 * 60 * 60 * 1000));

      // Convert back to ISO string if needed
      let end = endDate.toISOString();
      console.log(start)
      console.log("End:", end);



      console.log("Running scheduleEvent...")

      const event = {
        summary: this.selectedEvent.title,
        location: this.selectedEvent.place,
        description: this.selectedEvent.description,
        start: {
          dateTime: start,
          timeZone: "Asia/Singapore",
        },
        end: {
          dateTime: end,
          timeZone: "Asia/Singapore",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 10 },
          ],
        },
      };

      const request = gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });

      request.execute(function (event) {
        if (event.error) {
          console.error("Error creating event", event.error);
        } else {
          window.alert("Event has been added to your google calendar")
          console.info("Event created: " + event.htmlLink);
        }
      });
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
    window.addEventListener("load", () => {
      this.gapiLoaded();
      this.gisLoaded();
    });

    // Fetch the events once the component is mounted
    this.fetchEvents();

    const app = this;
    this.handleProfileLink();
    window.addEventListener("scroll", this.handleScroll);
  },
});

// Mount the Vue instance to the #app element in the HTML
eventsApp.mount("#app");
