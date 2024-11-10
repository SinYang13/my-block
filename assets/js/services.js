import { db } from "./config.js";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

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

const servicesApp = Vue.createApp({
  data() {
    return {
      services: [], // Store all services
      filteredProviders: [], // Filtered providers based on selected category
      searchTerm: "", // Search term entered by the user
      selectedService: null, // Currently selected service for modal view
      isLoading: true, // Track data loading status
      selectedCategory: "Home Cleaning", // Default category to show on page load
      uniqueCategories: [], // Unique service categories
    };
  },
  methods: {
    // Fetch services from Firestore
    async fetchServices() {
      try {
        const servicesRef = collection(db, "services");
        const querySnapshot = await getDocs(servicesRef);

        const servicesArray = [];
        const promises = querySnapshot.docs.map(async (doc) => {
          const serviceData = doc.data();
          const imageRef = ref(storage, "services/" + serviceData.serviceImage);

          try {
            const imageURL = await getDownloadURL(imageRef);
            serviceData.imageURL = imageURL;
          } catch (error) {
            console.error(
              `Error fetching image for ${serviceData.serviceName}:`,
              error
            );
            serviceData.imageURL = "/path/to/default-image.png";
          }

          servicesArray.push({ ...serviceData, id: doc.id });
        });

        await Promise.all(promises);

        // Extract unique categories
        this.uniqueCategories = [
          ...new Set(servicesArray.map((service) => service.serviceName)),
        ];

        this.services = servicesArray;
        this.showProviders(this.selectedCategory); // Display default category
        this.isLoading = false;
      } catch (error) {
        console.error("Error fetching services:", error);
        this.isLoading = false;
      }
    },

    // Filter providers by selected category
    showProviders(category) {
      this.selectedCategory = category;
      this.filteredProviders = this.services.filter(
        (service) => service.serviceName === category
      );
    },

    // Filter services based on search term
    filterServices() {
      const searchTermLower = this.searchTerm.toLowerCase();
      if (searchTermLower !== "") {
        this.filteredProviders = this.filteredProviders.filter((service) =>
          service.serviceName.toLowerCase().includes(searchTermLower)
        );
      } else {
        this.showProviders(this.selectedCategory);
      }
    },

    // Open modal with selected service details
    openServiceModal(service) {
      this.selectedService = service;
      // console.log(this.selectedService);
    },
    async bookmarkService() {
      if (!this.selectedService) {
        alert("No service selected.");
        return;
      }

      const userId = sessionStorage.getItem("loggedInUserEmail");
      if (!userId) {
        alert("Please log in to bookmark services.");
        return;
      }

      const bookmarkData = {
        serviceName: this.selectedService.serviceName,
        description: this.selectedService.description,
        price: this.selectedService.price,
        serviceProviderInformation:
          this.selectedService.serviceProviderInformation,
        serviceDuration: this.selectedService.serviceDuration,
        rating: this.selectedService.rating,
        imageURL: this.selectedService.imageURL,
        userId: userId,
        timestamp: new Date(), // Optional: Add timestamp
      };

      try {
        // Generate a unique service ID based on the service name or other attributes
        const uniqueServiceId =
          this.selectedService.id ||
          this.selectedService.serviceName.replace(/\s+/g, "_");

        // Reference to the service document in the "services" collection using unique ID
        const serviceRef = doc(db, "services", uniqueServiceId);

        // Check if the service document already exists
        const serviceSnap = await getDoc(serviceRef);

        if (!serviceSnap.exists()) {
          // If not, create a new service document with the unique ID
          await setDoc(serviceRef, {
            serviceName: this.selectedService.serviceName,
            serviceProviderInformation:
              this.selectedService.serviceProviderInformation,
            price: this.selectedService.price,
            serviceDuration: this.selectedService.serviceDuration,
            rating: this.selectedService.rating,
            imageURL: this.selectedService.imageURL,
          });
        }

        // Add bookmark data to the "bookmarkedBy" subcollection within this service document
        const bookmarkedByRef = collection(serviceRef, "bookmarkedBy");
        await addDoc(bookmarkedByRef, {
          ...bookmarkData,
          userId: userId, // Adding the user ID for reference
        });

        // Also add to user's "selectedServices" collection
        const userRef = collection(db, "users", userId, "selectedServices");
        await addDoc(userRef, bookmarkData);

        alert("Service bookmarked successfully!");
      } catch (error) {
        console.error("Error bookmarking service:", error.message);
        alert("Failed to bookmark the service. Please try again.");
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
  },
  async mounted() {
    this.fetchServices();
    const app = this;
    this.handleProfileLink();
    window.addEventListener("scroll", this.handleScroll);
  },
});

servicesApp.mount("#app");

// import { db } from './config.js';
// import {
//     collection, getDocs,
// } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
// import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

// // Initialize Firebase storage
// const storage = getStorage();

// const servicesApp = Vue.createApp({
//   data() {
//     return {
//       services: [], // Store services fetched from Firestore
//       filteredServices: [], // Store filtered services for the search functionality
//       searchTerm: "", // Track the search term entered by the user
//       selectedService: null, // Track the service selected for detailed view in the modal
//       isLoading: true, // Track whether data is being loaded
//     };
//   },
//   methods: {
//     // Fetch services from Firestore
//     async fetchServices() {
//       try {
//         const servicesRef = collection(db, "services"); // Reference to the services collection in Firestore
//         const querySnapshot = await getDocs(servicesRef); // Fetch all service documents

//         const servicesArray = []; // Array to hold all services

//         // Collect promises to fetch image URLs for each service
//         const promises = querySnapshot.docs.map(async (doc) => {
//           const serviceData = doc.data();
//           const imageRef = ref(storage, "services/" + serviceData.serviceImage); // Get the image reference from Firebase storage

//           try {
//             const imageURL = await getDownloadURL(imageRef); // Fetch image URL
//             serviceData.imageURL = imageURL; // Store image URL in service data
//           } catch (error) {
//             console.error(`Error fetching image for ${serviceData.serviceName}:`, error);
//             serviceData.imageURL = '/path/to/default-image.png'; // Use a default image if fetch fails
//           }

//           servicesArray.push({
//             ...serviceData,
//             id: doc.id,
//           });
//         });

//         // Wait for all image fetch promises to resolve
//         await Promise.all(promises);

//         // Set the services data and initialize filtered services
//         this.services = servicesArray;
//         this.filteredServices = servicesArray;
//         this.isLoading = false; // Data loading is complete
//       } catch (error) {
//         console.error("Error fetching services:", error);
//         this.isLoading = false;
//       }
//     },

//     // Open modal with the selected service details
//     openServiceModal(service) {
//       this.selectedService = service;
//     },

//     // Filter services based on search term
//     filterServices() {
//       const searchTermLower = this.searchTerm.toLowerCase();
//       if (searchTermLower !== "") {
//         // Filter services based on name matching the search term
//         this.filteredServices = this.services.filter((service) =>
//           service.serviceName.toLowerCase().includes(searchTermLower)
//         );
//       } else {
//         // If search term is empty, show all services
//         this.filteredServices = this.services;
//       }
//     },
//     handleScroll() {
//       const scrollPosition = window.scrollY;
//       const headerHeight = document.querySelector("header").offsetHeight;
//       const headerElement = document.querySelector("header");
//       if (scrollPosition >= headerHeight) {
//         headerElement.classList.add("background-header");
//       } else {
//         headerElement.classList.remove("background-header");
//       }
//     },
//     handleProfileLink() {
//       const email = sessionStorage.getItem("loggedInUserEmail");
//       const userName = sessionStorage.getItem("loggedInUserName");
//       const userType = sessionStorage.getItem("loggedInUserType");
//       const profileLink = document.getElementById("profileLink");

//       if (email && userType && userName) {
//         const profileLinkRedir = document.getElementById("profileLinkRedir");
//         profileLinkRedir.setAttribute("href", "profile.html");

//         const profileLinkImg = document.getElementById("profileLinkImg");
//         profileLinkImg.className = "fa fa-calendar";

//         const profileLinkText = document.getElementById("profileLinkText");
//         profileLinkText.textContent = "Profile";

//         // profileLink.innerHTML = `<a href="profile.html"><i class="fa fa-calendar"></i> Profile</a>`;
//       } else {
//         const profileLinkRedir = document.getElementById("profileLinkRedir");
//         profileLinkRedir.setAttribute("href", "login.html");

//         const profileLinkImg = document.getElementById("profileLinkImg");
//         profileLinkImg.className = "fa fa-sign-in-alt";

//         const profileLinkText = document.getElementById("profileLinkText");
//         profileLinkText.textContent = "Login / Register";

//         // profileLink.innerHTML = `<a href="login.html"><i class="fa fa-sign-in-alt"></i> Login / Register</a>`;
//       }
//     },

//   },
//   async mounted() {
//     // Fetch the services when the component is mounted
//     this.fetchServices();
//   },

// });

// // Mount the Vue instance to the #app element in the HTML
// servicesApp.mount("#app");
