import { db } from './config.js';
import {
    collection, getDocs, addDoc, query,
    Timestamp, orderBy, doc, updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";


function formatDate(date) {
    const d = new Date(date.seconds * 1000);
    const parts = d.toLocaleDateString();
    return parts
}


const app = Vue.createApp({
    data() {
        return {
            searchTerm: "",
            filteredDonations: [],
            donations: [], // Initialize as an empty array
            // formnodisplayActive: true,
            formdisplayActive: false,
            userName: '',
            startdate: new Date(),
            currItemName: '',
            // totalQuantity:0,
            currNo: 0
            // newloanNo:
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
            this.donations.forEach(element => {
                if (element.name == this.currItemName) {
                    // console.log(element.quantity)
                    const currNo = element.quantity
                    return currNo;
                }
            });
        },
        currentDate() {
            var tdy = new Date()
            var yr = tdy.getFullYear()
            var mth = tdy.getMonth() + 1
            var date = tdy.getDate()

            var mindate = yr + "-" + mth + "-" + date
            console.log(mindate)

            return (mindate)
        }

    },
    async mounted() {
        // Fetch the donations when the component is mounted
        const donationlist = await this.readDonation();
        this.donations = donationlist; // Update the reactive property
        this.filteredDonations = this.donations;
    },
    methods: {
        async readDonation() {
            const donationlist = [];
            const querySnapshot = await getDocs(collection(db, "donation"));
            for (const doc of querySnapshot.docs) {
                const docId = doc.id;
                const loansRef = collection(db, `donation/${docId}/loans`);
                const orderedQuery = query(loansRef, orderBy("endDate", "asc"));
                const loansSnapshot = await getDocs(orderedQuery);
                const loans = [];
                loansSnapshot.forEach((loanDoc) => {
                    // var finish = new Date(loanDoc.data().endDate.seconds * 1000)
                    // var formate = formatDate(finish) 
                    loans.push({
                        loanedto: loanDoc.data().loanedTo,
                        endDate: formatDate(loanDoc.data().endDate),
                        startDate: formatDate(loanDoc.data().startDate)
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

                donationlist.push({
                    name: docId,
                    quantity: doc.data().availableQuantity,
                    image: imageUrl,
                    loans: loans
                });
            }
            console.log(donationlist);
            return donationlist;
        },

filterDonations() {
            const term = this.searchTerm.toLowerCase();
            if (term != "") {
                console.log(term)
                this.filteredDonations = this.donations.filter(donation =>
                    donation.name.toLowerCase().includes(term)
                );
            }
            else {
                this.filteredDonations = this.donations
            }

        },

        openForm(itemName) {
            // console.log("sup")
            this.formdisplayActive = true
            this.currItemName = itemName;
            // this.getNums
        },

        closeForm() {
            // console.log("sup")
            this.formdisplayActive = false
            this.curritemName = '';
        },

        submitLoan() {
            //need to connect to firebase and include all the random stuff
            const loanRef = collection(db, 'donation/' + this.currItemName + '/loans')

            this.editDonation();

            addDoc(loanRef, {
                endDate: Timestamp.fromDate(new Date(this.endDate)),
                startDate: Timestamp.fromDate(new Date(this.startdate)),
                loanedTo: this.userName
            })
                .then(() => {
                    // console.log("successful") //try to reset page
                    this.editDonation();

                })
                .catch((error) => {
                    console.error("Error adding loan: ", error);
                });


            console.log(); // This is your Firestore timestamp
        },

        async editDonation() {
            var currNo = 0
            this.donations.forEach(element => {
                if (element.name == this.currItemName) {
                    currNo = element.quantity
                }
            });

            // this.getNums;
            const don = doc(db, 'donation/' + this.currItemName)
            const newTotal = currNo - 1
            console.log(currNo, newTotal)
            const niceDate = new Date(this.startdate)


            try {
                await updateDoc(don, {
                    availableQuantity: newTotal
                });

                window.alert("Loan was successful. Please head down to the CC to collect your item on " + niceDate.toDateString())
                window.location.reload();
            }
            catch (error) {
                console.error("Error updating donations: " + error)
            }
        },

    }
});
const vm = app.mount('#app');
