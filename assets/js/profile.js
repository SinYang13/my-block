import { db } from './config.js';
import { readUser } from '../../db/usersCRUD.js';
import {
    collection, getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


function formatDate(date) {
    const d = new Date(date.seconds * 1000);
    const parts = d.toLocaleDateString();
    return parts
}

function generateQR(value) {
    JsBarcode("#barcode", value, {
        format: 'code128',
        displayValue: true,
        width: 1
    });
}


// <div id='app'></div>
const app = Vue.createApp({
    data() {
        return {
            loanOwners: [],
            userid: sessionStorage.getItem("loggedInUserEmail"),
            userType:sessionStorage.getItem("loggedInUserType"),
            showProfile: false,
            userDetails: '',
            createdDate: '',
            eventsList: [],
            serviceList: [],
            showModal: false,
            modalData: {},
            attendees: [],
            ticketId: ''

        };
    }, // data
    // computed: { 
    //     derivedProperty() {
    //         return false;
    //     }  
    // }, // computed
    // created() { 
    // },
    async mounted() {
        this.getRentals();
        const app = this;
        this.handleProfileLink();
        window.addEventListener("scroll", this.handleScroll);

        if (this.userid != null) {
            this.showProfile = true
        };
        this.getuser();
        this.getEvents();
        this.getServices();
    },
    methods: {
        async getRentals() {
            const rentalList = [];
            const querySnapshot = await getDocs(collection(db, "loans"));
            for (const doc of querySnapshot.docs) {
                const docId = doc.id;
                const rentalRef = collection(db, `loans/${docId}/rental`);
                const loansSnapshot = await getDocs(rentalRef);
                loansSnapshot.forEach((rentalDoc) => {
                    if (rentalDoc.data().loanedTo == this.userid) {
                        rentalList.push({
                            loanedto: rentalDoc.data().loanedTo,
                            endDate: formatDate(rentalDoc.data().endDate),
                            startDate: formatDate(rentalDoc.data().startDate),
                            status: rentalDoc.data().status,
                            id: rentalDoc.id,
                            itemName: doc.id
                        });
                    }

                });
            }
            this.loanOwners = rentalList;

            console.log(rentalList);
            return rentalList;
        },

        async getEvents() {
            const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const shortmonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const colRef = collection(db, 'users/' + this.userid + '/registrations')

            //get collection data
            getDocs(colRef)
                .then((snapshot) => {
                    let event = []
                    snapshot.docs.forEach((doc) => {
                        let eventDate = doc.data().eventDate
                        eventDate = new Date(eventDate)
                        console.log(eventDate)

                        // let date = eventDate.getDate();
                        let longmth = month[eventDate.getMonth()];
                        let shortmth = shortmonth[eventDate.getMonth()];
                        let dd = eventDate.getDate();
                        let day = weekday[eventDate.getDay()];
                        let yyyy = eventDate.getFullYear();

                        let fulldate = day + " " + dd + " " + longmth + " " + yyyy

                        const time = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
                        console.log(time);

                        event.push({
                            ...doc.data(),
                            id: doc.id,
                            "fulldate": fulldate,
                            "date": dd, "shortmth": shortmth, "time": time
                        })

                        // event.push({"fulldate":fulldate, "date":dd, "shortmth":shortmth})

                    })
                    console.log(event)
                    this.eventsList = event
                })
                .catch(err => {
                    console.log(err.message)
                })


        },

        async getServices() {
            const colRef = collection(db, 'users/' + this.userid + '/selectedServices')

            //get collection data
            getDocs(colRef)
                .then((snapshot) => {
                    let services = []
                    snapshot.docs.forEach((doc) => {
                        services.push({
                            ...doc.data(),
                            id: doc.id,
                        })

                    })
                    console.log(services)
                    this.serviceList = services
                })
                .catch(err => {
                    console.log(err.message)
                })


        },
        deleteService(serviceId) {
            console.log(serviceId)
            const docRef = doc(db, 'users/' + this.userid + '/selectedServices', serviceId)
            deleteDoc(docRef)
                .then(() => {
                    console.log("Successful")
                    window.location.reload();
                })
        },
        openModal(barcodeValue) {
            this.modalData.barcodeValue = barcodeValue;
            this.showModal = true;

            // Generate the barcode when the modal opens
            this.$nextTick(() => {
                generateQR(this.modalData.barcodeValue);
            });

            this.eventsList.forEach(item => {
                if (item.eventId == barcodeValue) {
                    this.attendees = item.attendees
                }
            })
        },
        closeModal() {
            this.showModal = false;
        },

        async getuser() {
            const user = await readUser(this.userid);
            this.userDetails = user
            const registerDate = user.registerDate

            let date = registerDate.toDate();
            let mm = date.getMonth();
            let dd = date.getDate();
            let yyyy = date.getFullYear();

            this.createdDate = dd + '/' + mm + '/' + yyyy;

            console.log(this.userDetails)
        },
        logout() {
            console.log("Loging out")
            sessionStorage.clear();
            window.location.reload();
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
                const profileLinkRedir =
                    document.getElementById("profileLinkRedir");
                profileLinkRedir.setAttribute("href", "profile.html");

                const profileLinkImg = document.getElementById("profileLinkImg");
                profileLinkImg.className = "fa fa-calendar";

                const profileLinkText =
                    document.getElementById("profileLinkText");
                profileLinkText.textContent = "Profile";
            } else {
                const profileLinkRedir =
                    document.getElementById("profileLinkRedir");
                profileLinkRedir.setAttribute("href", "login.html");

                const profileLinkImg = document.getElementById("profileLinkImg");
                profileLinkImg.className = "fa fa-sign-in-alt";

                const profileLinkText =
                    document.getElementById("profileLinkText");
                profileLinkText.textContent = "Login";
            }
        },
    } // methods
});
const vm = app.mount('#app'); 