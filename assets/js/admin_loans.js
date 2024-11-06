import { db } from './config.js';
import {
    collection, getDocs, addDoc, query,
    Timestamp, orderBy, doc, updateDoc,deleteDoc
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
            filteredLoans: [],
            loanOwners: [],
            loans: [], 
            itemName: '',
            status:'',
            selectedLoan: '',
            selectedCategory: "All",
            selectedStatus:'',
            selectedOption:true,
        };
        
    },
    computed: {
        filterItems() {
            return this.loanOwners.filter(loans => {
                // Apply status filter
                let statusMatch;
                if (this.selectedStatus === '') {
                    statusMatch = true;
                } else if (this.selectedStatus === 'Collection') {
                    statusMatch = loans.status === this.selectedStatus;
                } else {
                    statusMatch = loans.status === 'Loaned' || loans.status === 'Overdue';
                }
    
                // Apply item name filter
                let itemMatch = this.itemName === "" || loans.itemName === this.itemName;
    
                // console.log(loans.loanedto.toLowerCase())
                // Apply search term filter
                let searchMatch = this.searchTerm === "" || loans.loanedto.toLowerCase().includes(this.searchTerm.toLowerCase());
    
                // All conditions must be true
                return statusMatch && itemMatch && searchMatch;
            });
        }

    },
    async mounted() {
   
        //  NEED TO CHANGE
        const loanlist = await this.readLoan();
        this.loans = loanlist; // Update the reactive property 
        this.filteredLoans = this.loans;

        // this.getData();
        this.getRentals();
        this.handleProfileLink();
        window.addEventListener('scroll', this.handleScroll);
        

    },
    methods: {
        clearSelection() {
            this.selectedLoan = '';  // Clear radio selection
            this.itemName = '';      // Clear the item name
        },
        clearStatus() {
            this.selectedStatus = '';  // Clear the radio selection
        },
        resetFilters() {
            this.selectedStatus = '';  // Clear all filters, including radio selection
            // Add any additional filters you want to reset here
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
                        startDate: formatDate(rentalDoc.data().startDate),
                        status: rentalDoc.data().status,
                        id: rentalDoc.id
                    });
                    // var date = loanDoc.data().endDate
                    // var jsDate = new Date(date.seconds * 1000)
                    // console.log(jsDate)

                    this.loanOwners = rental;
                });

                const storage = getStorage();
                const imagePath = doc.data().image;

                // Get the download URL from Firebase Storage
                let imageUrl = '';
                try {
                    const imageRef = ref(storage, "/donations/" + imagePath);
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

        async getRentals(){
            const rentalList = [];
            const querySnapshot = await getDocs(collection(db, "loans"));
            for (const doc of querySnapshot.docs) {
                const docId = doc.id;
                const rentalRef = collection(db, `loans/${docId}/rental`);
                const loansSnapshot = await getDocs(rentalRef);
                loansSnapshot.forEach((rentalDoc) => { 
                    rentalList.push({
                        loanedto: rentalDoc.data().loanedTo,
                        endDate: formatDate(rentalDoc.data().endDate),
                        startDate: formatDate(rentalDoc.data().startDate),
                        status: rentalDoc.data().status,
                        id: rentalDoc.id,
                        itemName: doc.id
                    });
                });
            }
            this.loanOwners = rentalList;

            console.log(rentalList);
            return rentalList;
        },
        async updateRental(itemId,curritemName){
            let statustype = ""
            let count = 0

            this.loans.forEach(element => {
                console.log(element)
                if (element.name == curritemName) {
                   let loanlist = element.loans
                   count = element.quantity
                   loanlist.forEach(loan =>{
                    // console.log("sup" + loan.status)
                    if(loan.id == itemId){
                        statustype = loan.status
                    }
                   })
                   console.log("hi")
                }
            });

            // this.getNums;
            // const docUpdate = doc(db, `loans/${this.itemName}/rental`,itemId)
            console.log(curritemName)
            console.log(itemId);
            console.log('loans/' + curritemName +'/rental/'+ itemId);
            const docUpdate = doc(db, 'loans/' + curritemName +'/rental/'+ itemId)
            const docDelete = doc(db, 'loans/' + curritemName +'/rental/'+ itemId)
            // const docDelete = doc(db, `loans/${this.itemName}/rental`,itemId)

            console.log(count)
            console.log(statustype)

            if(statustype == "Loaned" || statustype == "Overdue"){
                //delete item
                try {
                    await deleteDoc(docDelete); // Deletes the document
                    console.log(`Document with ID ${itemId} deleted successfully`);
                    console.log(`loans/${curritemName}`);
                    const docUpdate2 = doc(db, `loans/${curritemName}`)
                   
                    try {
                        await updateDoc(docUpdate2, {
                            availableQuantity: count + 1
                        });
                        console.log("updated and deleted")
        
                        window.location.reload();
                    }
                    catch (error) {
                        console.error("Error updating loans: " + error)
                    }
                    
                } catch (err) {
                    console.error("Error deleting document:", err.message);
                }
            }
            else if(statustype == "Collection"){
                
            try {
                await updateDoc(docUpdate, {
                    status: "Loaned"
                });
                console.log("updated")

                window.location.reload();
            }
            catch (error) {
                console.error("Error updating loans: " + error)
            }
            }
            else{
                window.alert("Something went wrong somewhere")
            }


        },
        updateItemName(name, event) {
            if (event.target.checked) {
                this.itemName = name;
            } else {
                // Optionally clear `itemName` if the checkbox is unchecked
                this.itemName = '';
            }
            // console.log(this.itemName)
        },
        
        resetFilters(){
            window.location.reload();

        },

        handleScroll() {
            const scrollPosition = window.scrollY;
            const headerHeight = document.querySelector('header').offsetHeight;
            const headerElement = document.querySelector('header');
            if (scrollPosition >= headerHeight) {
                headerElement.classList.add('background-header');
            } else {
                headerElement.classList.remove('background-header');
            }
        },
        handleProfileLink() {
            const email = sessionStorage.getItem('loggedInUserEmail');
            const userName = sessionStorage.getItem('loggedInUserName');
            const userType = sessionStorage.getItem('loggedInUserType');
            const profileLink = document.getElementById('profileLink');
            
            if (email && userType && userName) {
                const profileLinkRedir = document.getElementById("profileLinkRedir");
                profileLinkRedir.setAttribute("href", "../profile.html");

                const profileLinkImg = document.getElementById("profileLinkImg");
                profileLinkImg.className = "fa fa-calendar";

                const profileLinkText = document.getElementById("profileLinkText");
                profileLinkText.textContent = "Profile"
            } else {
                const profileLinkRedir = document.getElementById("profileLinkRedir");
                profileLinkRedir.setAttribute("href", "../login.html");

                const profileLinkImg = document.getElementById("profileLinkImg");
                profileLinkImg.className = "fa fa-sign-in-alt";

                const profileLinkText = document.getElementById("profileLinkText");
                profileLinkText.textContent = "Login"
            }
        }
       
    }
});
const vm = app.mount('#app');
