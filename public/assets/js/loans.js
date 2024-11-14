import { db } from './config.js';
import {
    collection, getDocs, addDoc, query,
    Timestamp, orderBy, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";


function formatDate(date) {
    const d = new Date(date.seconds * 1000);
    const parts = d.toLocaleDateString();
    return parts
};
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


const app = Vue.createApp({
    data() {
        return {
            
            loading:true,
            searchTerm: "",
            filteredLoans: [],
            loans: [], // Initialize as an empty array
            collectionVenue: '', // Store the user's collection venue here
            formdisplayActive: false,
            userName: sessionStorage.getItem("loggedInUserEmail"),
            startdate: new Date(),
            currItemName: '',
            currNo: 0,
            ccMissing:false,

            successDisplay: false,
            CLIENT_ID:"815388161577-1q8k35ihr9mtr8cvhis048ljdod8v7f8.apps.googleusercontent.com",
            API_KEY : "AIzaSyCp8RabRDvoSbfNgDqzy14fqxj-5ePsOBI",
            DISCOVERY_DOC: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
            SCOPES : "https://www.googleapis.com/auth/calendar",

            tokenClient: null,
            gapiInited: false,
            gisInited: false,
        };
    },
    computed: {
        endDate() {
            const start = new Date(this.startdate);
            const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
            var output = end.toDateString()
            console.log(output)

            return output;
        },

        getNums() {
            this.loans.forEach(element => {
                if (element.name == this.currItemName) {
                    // console.log(element.quantity)
                    const currNo = element.quantity
                    return currNo;
                }
            });
        },
        currentDate() {
            var tdy = new Date()
            tdy.setDate(tdy.getDate() + 1); // Set to the next day
            var yr = tdy.getFullYear()
            var mth = tdy.getMonth() + 1
            var date = tdy.getDate()

            var mindate = yr + "-" + mth + "-" + date
            console.log(mindate)

            return (mindate)
        },
        

    },
    async mounted() {
        window.addEventListener("load", () => {
            this.gapiLoaded();
            this.gisLoaded();
        });
        
        this.loading = true;
        if (this.userName) {
            await this.getUserCollectionVenue(); // Fetch the user's collection venue if logged in
        }
        

        // Fetch the loans when the component is mounted
        const loanlist = await this.readLoan();
        this.loans = loanlist; // Update the reactive property
        this.filteredLoans = this.loans;
        this.loading = false;

        const app = this;
        this.handleProfileLink();
        window.addEventListener('scroll', this.handleScroll);
    },
    methods: {
        async getUserCollectionVenue() {
            if (!this.userName) {
                console.error("No user is logged in.");
                return;
            }
            const userDocRef = doc(db, "users", this.userName); // Assumes userName is the document ID
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const venue = userDoc.data().preferredCommunityClub;
                if (venue) {
                    this.collectionVenue = venue;
                    this.ccMissing = false; // CC is found
                } else {
                    this.ccMissing = true; // CC is missing
                }
            } else {
                console.error("No such user document found!");
            }
        },
        async readLoan() {
            const loanlist = [];
            const querySnapshot = await getDocs(collection(db, "loans"));
            for (const doc of querySnapshot.docs) {
                const docId = doc.id;
                const rentalRef = collection(db, `loans/${docId}/rental`);
                const orderedQuery = query(rentalRef, orderBy("endDate", "asc"));
                const loansSnapshot = await getDocs(orderedQuery);
                const rental = [];
                loansSnapshot.forEach((rentalDoc) => {
                    // var finish = new Date(loanDoc.data().endDate.seconds * 1000)
                    // var formate = formatDate(finish) 
                    rental.push({
                        loanedto: rentalDoc.data().loanedTo,
                        endDate: formatDate(rentalDoc.data().endDate),
                        startDate: formatDate(rentalDoc.data().startDate)
                    });
                    // var date = loanDoc.data().endDate
                    // var jsDate = new Date(date.seconds * 1000)
                    // console.log(jsDate)
                });

                const storage = getStorage();
                const imagePath = doc.data().image;

                // Get the download URL from Firebase Storage
                let imageUrl = '';
                try {
                    const imageRef = ref(storage, "/donations/"+ imagePath);
                    imageUrl = await getDownloadURL(imageRef);
                } catch (error) {
                    console.error("Error getting image URL:", error);
                }

                loanlist.push({
                    name: docId,
                    quantity: doc.data().availableQuantity,
                    image: imageUrl,
                    loans: rental
                });
            }
            console.log(loanlist);
            return loanlist;
        },

        filterLoans() {
            const term = this.searchTerm.toLowerCase();
            if (term != "") {
                console.log(term)
                this.filteredLoans = this.loans.filter(loan =>
                    loan.name.toLowerCase().includes(term)
                );
            }
            else {
                this.filteredLoans = this.loans
            }

        },

        openForm(itemName) {
            const userId = sessionStorage.getItem("loggedInUserEmail");
        
            if (!userId) {
                // Show the login prompt modal instead of alert
                const loginModal = new bootstrap.Modal(document.getElementById('loginPromptModal'));
                loginModal.show();
                return;
            };
            if (!this.collectionVenue) {
                // If collectionVenue is missing, show alert
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
                return;
            };
        
            // If logged in, proceed with opening the form
            this.formdisplayActive = true;
            this.currItemName = itemName;
        },

        closeForm1() {
            // console.log("sup")
            this.formdisplayActive = false;
            this.successDisplay = false;
            this.curritemName = '';
        },
        closeForm2() {
            // console.log("sup")
            this.formdisplayActive = false;
            this.successDisplay = false;
            this.curritemName = '';
            window.location.reload()
        },

        submitLoan() {
            //need to connect to firebase and include all the random stuff
            this.successDisplay = false; // Ensure it's hidden initially
            let inputDate = new Date(this.startdate)
            let currentDate = new Date()
            if(inputDate >= currentDate){
                this.editLoan();

                const loanRef = collection(db, 'loans/' + this.currItemName + '/rental')
                addDoc(loanRef, {
                    endDate: Timestamp.fromDate(new Date(this.endDate)),
                    startDate: Timestamp.fromDate(new Date(this.startdate)),
                    loanedTo: this.userName,
                    status: "Collection"
                })
                    .then(() => {
                        // console.log("successful") //try to reset page
                        this.editLoan();
                        this.successDisplay = true; // Display on success
    
                    })
                    .catch((error) => {
                        console.error("Error adding loan: ", error);
                    });
            }
            else{
                window.alert("The date you have inputed is not valid")

            }
            

           


            console.log(); // This is your Firestore timestamp
        },

        async editLoan() {
            var currNo = 0
            this.loans.forEach(element => {
                if (element.name == this.currItemName) {
                    currNo = element.quantity
                }
            });

            // this.getNums;
            const don = doc(db, 'loans/' + this.currItemName)
            const newTotal = currNo - 1
            console.log(currNo, newTotal)
            const niceDate = new Date(this.startdate)


            try {
                await updateDoc(don, {
                    availableQuantity: newTotal
                });
                this.formdisplayActive = false
                this.successDisplay = true
            }
            catch (error) {
                console.error("Error updating loans: " + error)
                window.alert("Loan was unsuccessful. Please contact the RC instead")
            }
        },

        handleScroll() {
            const scrollPosition = window.scrollY + 60;
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
              profileLinkImg.className = "fa fa-user";
      
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
            let start = new Date(this.startdate).toISOString()
            console.log(start)
            let end = new Date(this.endDate).toISOString()
            console.log(end)



            console.log("Running scheduleEvent...")

            const event = {
              summary: "Loaned " + this.currItemName,
              location: "4B Boon Tiong Rd, #01-35 Boon Tiong Arcadia, Singapore 165004",
              description: "Your deadline is fixed regardless of when u collect it:)",
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
              }
            });
        },
    }
});
const vm = app.mount('#app');
