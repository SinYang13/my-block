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
  doc,
  getDoc,
  updateDoc,
  setDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { readAnnouncements } from "../../db/announcementsCRUD.js";

import { logEvent } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";

const storage = getStorage();

// Use the global Vue object instead of importing createApp
const eventsApp = Vue.createApp({
  data() {
    return {
      events: [], // Stores the event data
      map: null,
      googleMapsApiKey: "",
      filter: "all", // Set the default filter to show all events
      announcements: [],
      selectedEvent: {}, // Track the event to show in the modal
      showSignupModal: false, // Track visibility of the signup modal
      attendeeForms: [], // Initialize attendee forms array
    };
  },
  methods: {
    async fetchEvents() {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, limit(6)); // Limit to 6 events
      const querySnapshot = await getDocs(q);
    
      const eventsArray = []; // Temporary array to store event data
    
      // Loop through the events and fetch images from Firebase Storage
      const promises = querySnapshot.docs.map(async (doc) => {
        const eventData = doc.data();
        const imageRef = ref(storage, "events/" + eventData.image); // Assuming image path is under events/
        const imageURL = await getDownloadURL(imageRef);
    
        eventsArray.push({
          ...eventData,
          id: doc.id,
          imageURL, // Image URL fetched from Firebase Storage
          link: eventData.link || "#", // Assuming link field exists, if not default "#"
        });
      });
    
      await Promise.all(promises); // Wait for all image URLs to be fetched
      this.events = eventsArray; // Assign the array to `this.events` after all are fetched
    }
    ,
    async submitRegistration() {
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
        attendees: this.attendeeForms.map(form => ({
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
        await addDoc(collection(db, "users", userId, "registrations"), registrationData);
    
        // Add registration to the event's "registrations" subcollection
        await addDoc(collection(db, "events", this.selectedEvent.id, "registrations"), registrationData);
    
        alert("Registration successful! Payment will be collected on site (If Any)");
        this.closeSignupModal(); // Close the modal after successful submission
      } catch (error) {
        console.error("Error adding registration:", error);
        alert("Failed to register. Please try again.");
      }
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
      console.log("event opening up");
      console.log(this.selectedEvent);
      this.showSignupModal = false;
    },
  
    openSignupModal() {
      console.log("Opening signup modal");
  
      // Check if the user is logged in
      const userId = sessionStorage.getItem("loggedInUserEmail");
  
      if (!userId) {
          // Show the login prompt modal for events instead of alert
          const loginModal = new bootstrap.Modal(document.getElementById('loginPromptModalEvents'));
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
    async fetchAnnouncements() {
      try {
        let announcements = await readAnnouncements();
        let filteredAnnouncements = announcements.filter(announcement => announcement.pinned === true);
        
        filteredAnnouncements.sort((a, b) => new Date(b.expiry) - new Date(a.expiry));
        this.announcements = filteredAnnouncements;
        console.log(this.announcements);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
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
        profileLinkText.textContent = "Login";

        // profileLink.innerHTML = `<a href="login.html"><i class="fa fa-sign-in-alt"></i> Login / Register</a>`;
      }
    },
    
    trackPageView() {
      logEvent(analytics, "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    },
 
    async incrementVisitorCount() {
      try {
        // Reference to the visitorCount document
        const visitorDocRef = doc(db, "visitors", "visitorCount");
        const visitorDoc = await getDoc(visitorDocRef);

        // Increment the visitor count
        if (visitorDoc.exists()) {
          await updateDoc(visitorDocRef, {
            count: visitorDoc.data().count + 1,
          });
        } else {
          // Initialize count if document doesn't exist
          await setDoc(visitorDocRef, { count: 1 });
        }

        // Add new document in the datetime subcollection with the current datetime
        const datetimeSubCollectionRef = collection(
          db,
          "visitors",
          "visitorCount",
          "datetime"
        );
        await addDoc(datetimeSubCollectionRef, {
          datetime: new Date(),
        });

        console.log("Visitor count incremented and datetime logged.");
      } catch (error) {
        console.error("Error incrementing visitor count:", error);
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
    this.fetchAnnouncements();

    this.handleProfileLink();
    window.addEventListener("scroll", this.handleScroll);

    await this.incrementVisitorCount();
  },
});

// Mount to the #app element
eventsApp.mount("#app");

var form = document.getElementById("contact-form");

form.addEventListener("submit", function(event) {
  event.preventDefault();

  emailjs.send("service_yk1eg59", "template_d7z5v2j", {
    from_name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value
  })
  .then(function(response) {
    alert("Email sent successfully!");
    document.getElementById("name").value = '';
    document.getElementById("email").value = '';
    document.getElementById("subject").value = '';
    document.getElementById("message").value = '';
  }, function(error) {
    console.error("EmailJS error:", error); // log error to console for debugging
    alert("There was an error sending the email.");
  });
});
