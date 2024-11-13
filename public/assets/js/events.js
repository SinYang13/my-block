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
  addDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Initialize Firebase storage
const storage = getStorage();



// Function to handle link clicks
function handleLinkClick(event) {
  event.preventDefault(); // Prevent default link navigation

  const url = event.currentTarget.href; // Get the destination URL

  // Add fade-out class to trigger animation
  document.body.classList.add("fade-out");

  // Delay the navigation to allow the fade-out animation to complete
  setTimeout(() => {
    window.location.href = url;
  }, 500); // Delay matches the duration of the fadeOut animation (0.5s)
}

// Apply the event listener to all <a> tags with class "animated-link"
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("a.animated-link");

  // Add event listeners for the fade-out animation on link click
  links.forEach((link) => link.addEventListener("click", handleLinkClick));

  // Trigger fade-in when the page loads
  document.body.classList.add("fade-in");
});

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
      showPastEvents: false, // Toggle for past events view
      pastEvents: [], // Filtered array for past events

      CLIENT_ID:
        "815388161577-1q8k35ihr9mtr8cvhis048ljdod8v7f8.apps.googleusercontent.com",
      API_KEY: "AIzaSyCp8RabRDvoSbfNgDqzy14fqxj-5ePsOBI",
      DISCOVERY_DOC:
        "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      SCOPES: "https://www.googleapis.com/auth/calendar",

      tokenClient: null,
      gapiInited: false,
      gisInited: false,
      cardNumber: '',
      cardLogo: '',
      paymentReady: false,
    };
  },
  methods: {
    // Fetch events from Firestore
    async fetchEvents() {
      try {
        const eventsRef = collection(db, "events");
        const eventsQuery = query(eventsRef, orderBy("place", "asc"));
        const querySnapshot = await getDocs(eventsQuery);

        const eventsArray = [];
        const pastEventsArray = [];
        const categoriesSet = new Set();
        const currentDate = new Date();

        const promises = querySnapshot.docs.map(async (doc) => {
          const eventData = doc.data();
          const eventDate = eventData.date.toDate();

          const imageRef = ref(storage, "events/" + eventData.image);
          const imageURL = await getDownloadURL(imageRef);

          const event = {
            ...eventData,
            id: doc.id,
            imageURL,
            link: eventData.link || "#",
          };

          if (eventDate >= currentDate) {
            eventsArray.push(event);
          } else {
            pastEventsArray.push(event);
          }

          categoriesSet.add(eventData.cat);
        });

        await Promise.all(promises);

        this.events = eventsArray;
        this.pastEvents = pastEventsArray;
        this.categories = Array.from(categoriesSet);
        this.isLoading = false;
      } catch (error) {
        console.error("Error fetching events:", error);
        this.isLoading = false;
      }
    },
    togglePastEvents() {
      this.showPastEvents = !this.showPastEvents;
    },
    togglePaymentReady() {
      this.paymentReady = !this.paymentReady;
    },
    async submitRegistration() {
      let status = true
      this.attendeeForms.forEach(item => {
        if (!item.name || !item.email || !item.phone) {
          console.log("error")
          
          status = false
          // alert("Attendee's Details not filled in correctly")
          const successModal = new bootstrap.Modal(document.getElementById('successModal3'));
          successModal.show();

          return; // Stop the function from proceeding further
        }

      })

      if (status == true) {
        const userId = sessionStorage.getItem("loggedInUserEmail");

        if (!userId) {
          alert("Please log in to register for events.");
          return;
        }

        const registrationData = {
          eventId: this.selectedEvent.id,
          eventTitle: this.selectedEvent.title,
          eventDate: this.selectedEvent.date,
          eventLocation: this.selectedEvent.place,
          attendees: this.attendeeForms.map((form) => ({
            name: form.name,
            email: form.email,
            phone: form.phone,
            dietaryRestrictions: form.dietaryRestrictions,
            specialRequests: form.specialRequests,
          })),
          userInfo: {
            email: userId, // Include user information in the registration data
          },
          timestamp: new Date(), // Optional: add a timestamp
        };

        try {
          // Add registration to user's "registrations" subcollection
          await addDoc(
            collection(db, "users", userId, "registrations"),
            registrationData
          );

          // Add registration to the event's "registrations" subcollection
          await addDoc(
            collection(db, "events", this.selectedEvent.id, "registrations"),
            registrationData
          );

          const successModal = new bootstrap.Modal(document.getElementById('successModal'));
          successModal.show();
          this.closeSignupModal(); // Close the modal after successful submission
        } catch (error) {
          console.error("Error adding registration:", error);
          alert("Failed to register. Please try again.");
        }
      }

    },

    checkCardType() {
      const cardNum = this.cardNumber.replace(/\s+/g, '');
      if (cardNum.startsWith("4")) {
        this.cardLogo = "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png";
      } else if (/^5[1-5]/.test(cardNum)) {
        this.cardLogo = "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png";
      } else {
        this.cardLogo = '';
      }
      console.log("Card Logo URL:", this.cardLogo); // Debugging line to check the logo URL
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
        name: "",
        email: "",
        phone: "",
        dietaryRestrictions: "",
        specialRequests: "",
      };
      this.attendeeForms.push(attendeeForm);
      console.log(this.attendeeForms);
    },
    removeAttendeeForm(index) {
      this.attendeeForms.splice(index, 1);
    },

    openEventModal(event) {
      this.selectedEvent = {
        ...event,
        date: event.date.toDate().toLocaleString(), // Convert Firestore timestamp to readable date
      };
      // console.log({
      //   ...event,
      //   date: event.date.toDate().toLocaleString(), // Convert Firestore timestamp to readable date
      // });

      console.log(this.selectedEvent);
      this.showSignupModal = false;
    },

    openSignupModal() {

      console.log("Opening signup modal");

      // Check if the user is logged in
      const userId = sessionStorage.getItem("loggedInUserEmail");

      if (!userId) {
        // Show the login prompt modal for events instead of alert
        const loginModal = new bootstrap.Modal(
          document.getElementById("loginPromptModalEvents")
        );
        loginModal.show();
        return;
      }

      // If logged in, proceed to show the signup modal
      this.showSignupModal = true;

      if (this.attendeeForms.length === 0) {
        this.addAttendeeForm(); // Ensure at least one form is available initially
      }



      // Manually show the signup modal using Bootstrap's JavaScript API
      this.$nextTick(() => {
        const signupModalInstance = new bootstrap.Modal(
          document.getElementById("signupModal")
        );
        signupModalInstance.show();
      });

      console.log(this.selectedEvent);
    },

    closeSignupModal() {
      console.log("Closing signup modal"); // Debugging line
      this.showSignupModal = false;
      this.attendeeForms = [
        {
          name: "",
          email: "",
          phone: "",
          dietaryRestrictions: "",
          specialRequests: "",
        },
      ];

      const signupModalInstance = bootstrap.Modal.getInstance(
        document.getElementById("signupModal")
      );
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
      console.log("Running gapiLoaded...");
      gapi.load("client", this.initializeGapiClient);
    },
    async initializeGapiClient() {
      console.log("Running initializeGapiClient...");

      await gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: [this.DISCOVERY_DOC],
      });
      this.gapiInited = true;
      console.log("Google API client initialized.");
    },
    gisLoaded() {
      console.log("Running gisLoaded...");

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: this.SCOPES,
        callback: this.handleTokenResponse, // Assign a callback function
      });
      this.gisInited = true;
      console.log("Google Identity Services initialized.");
    },
    handleTokenResponse(resp) {
      console.log("Running handleTokenResponse...");

      if (resp.error !== undefined) {
        console.error("Error during token response", resp.error);
        return;
      }
      // Assuming you want to create an event with some event details
      const eventDetails = {
        email: "example@example.com", // Replace with actual email or event data
      };
      this.scheduleEvent();
    },
    googleCreateEvent() {
      console.log("Running googleCreateEvent...");

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
      let start = new Date(this.selectedEvent.date).toISOString();

      let endDate = new Date(start);

      // Add 2 hours (2 * 60 * 60 * 1000 milliseconds) to the start date
      endDate.setTime(endDate.getTime() + 2 * 60 * 60 * 1000);

      // Convert back to ISO string if needed
      let end = endDate.toISOString();
      console.log(start);
      console.log("End:", end);

      console.log("Running scheduleEvent...");

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
          const successModal = new bootstrap.Modal(document.getElementById('successModal2'));
          successModal.show();
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
    pastFilteredEvents() {
      return this.filter === "all"
        ? this.pastEvents
        : this.pastEvents.filter((event) => event.cat === this.filter);
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
