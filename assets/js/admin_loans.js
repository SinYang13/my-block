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
            selectedCategory: "All",
            selectedStatus:''
        };
        
    },
    computed: {
        filterType() {
            console.log(this.selectedStatus)
            if (this.selectedStatus ==  '') {
                return this.loanOwners; // Show all posts if 'All' is selected
            } 
            else if(this.selectedStatus === 'Collection'){
                return this.loanOwners.filter(loans => loans.status === this.selectedCategory);

            }
            else {
                return this.loanOwners.filter(loans => loans.status === "Loaned" || loans.status === "Overdue");
            }
        },
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
        

    },
    methods: {
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

        filterLoans() {
            const term = (this.searchTerm || "").toLowerCase();
            console.log(term)
            if (term != "") {
                console.log(term)
                this.filteredLoans = this.loanOwners.filter(loan =>
                    loan.name.toLowerCase().includes(term)
                );
            }
            else {
                this.filteredLoans = this.loanOwners
            }

        },

        // async getData() {
        //     const rentalRef = collection(db, `loans/${this.itemName}/rental`);
        //     const loansSnapshot = await getDocs(rentalRef);
        //     const rental = [];
        //         loansSnapshot.forEach((rentalDoc) => {
        //             // var finish = new Date(loanDoc.data().endDate.seconds * 1000)
        //             // var formate = formatDate(finish) 
        //             rental.push({
        //                 loanedto: rentalDoc.data().loanedTo,
        //                 endDate: formatDate(rentalDoc.data().endDate),
        //                 startDate: formatDate(rentalDoc.data().startDate),
        //                 status: rentalDoc.data().status,
        //                 id: rentalDoc.id,
        //             });
        //         });
        //         // this.loanOwners = rental;
        //         console.log(rental)

        // },
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
        async updateRental(itemId){
            let statustype = ""
            let count = 0

            this.loans.forEach(element => {
                console.log(element)
                if (element.name == this.itemName) {
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
            const docUpdate = doc(db, `loans/${this.itemName}/rental/${itemId}`)
            const docDelete = doc(db, `loans/${this.itemName}/rental`,itemId)

            console.log(count)
            console.log(statustype)

            if(statustype == "Loaned" || statustype == "Overdue"){
                //delete item
                try {
                    await deleteDoc(docDelete); // Deletes the document
                    // console.log(`Document with ID ${itemId} deleted successfully`);
                    const docUpdate2 = doc(db, `loans/${this.itemName}`)
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
        }

       
    }
});
const vm = app.mount('#app');