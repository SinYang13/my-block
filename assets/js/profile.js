import { db } from './config.js';
import { readUser } from '../../db/usersCRUD.js';
import {
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

function formatDate(date) {
    const d = new Date(date.seconds * 1000);
    const parts = d.toLocaleDateString();
    return parts
}


// <div id='app'></div>
const app = Vue.createApp({
    data() {
        return {
            loanOwners: [],
            userid: sessionStorage.getItem("loggedInUserEmail"),
            // userid: "Kelly",
            showProfile: false,
            userDetails: '',
            createdDate: ''
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