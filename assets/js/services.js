import { db } from './config.js';
import {
    collection, getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

// Initialize Firebase storage
const storage = getStorage();

const servicesApp = Vue.createApp({
  data() {
    return {
      services: [], // Store services fetched from Firestore
      filteredServices: [], // Store filtered services for the search functionality
      searchTerm: "", // Track the search term entered by the user
      selectedService: null, // Track the service selected for detailed view in the modal
      isLoading: true, // Track whether data is being loaded
    };
  },
  methods: {
    // Fetch services from Firestore
    async fetchServices() {
      try {
        const servicesRef = collection(db, "services"); // Reference to the services collection in Firestore
        const querySnapshot = await getDocs(servicesRef); // Fetch all service documents

        const servicesArray = []; // Array to hold all services

        // Collect promises to fetch image URLs for each service
        const promises = querySnapshot.docs.map(async (doc) => {
          const serviceData = doc.data();
          const imageRef = ref(storage, "services/" + serviceData.serviceImage); // Get the image reference from Firebase storage
          
          try {
            const imageURL = await getDownloadURL(imageRef); // Fetch image URL
            serviceData.imageURL = imageURL; // Store image URL in service data
          } catch (error) {
            console.error(`Error fetching image for ${serviceData.serviceName}:`, error); 
            serviceData.imageURL = '/path/to/default-image.png'; // Use a default image if fetch fails
          }

          servicesArray.push({
            ...serviceData,
            id: doc.id,
          });
        });

        // Wait for all image fetch promises to resolve
        await Promise.all(promises);

        // Set the services data and initialize filtered services
        this.services = servicesArray;
        this.filteredServices = servicesArray;
        this.isLoading = false; // Data loading is complete
      } catch (error) {
        console.error("Error fetching services:", error);
        this.isLoading = false;
      }
    },

    // Open modal with the selected service details
    openServiceModal(service) {
      this.selectedService = service;
    },

    // Filter services based on search term
    filterServices() {
      const searchTermLower = this.searchTerm.toLowerCase();
      if (searchTermLower !== "") {
        // Filter services based on name matching the search term
        this.filteredServices = this.services.filter((service) =>
          service.serviceName.toLowerCase().includes(searchTermLower)
        );
      } else {
        // If search term is empty, show all services
        this.filteredServices = this.services;
      }
    },
  },
  async mounted() {
    // Fetch the services when the component is mounted
    this.fetchServices();
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

});

// Mount the Vue instance to the #app element in the HTML
servicesApp.mount("#app");
