import {
  collection,
  getDocs,
  addDoc,
  query,
  setDoc,
  Timestamp,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import { db } from "../../db/firebaseConfig.js";

const storage = getStorage();

function formatDate(date) {
  const d = new Date(date.seconds * 1000);
  const parts = d.toLocaleDateString();
  return parts;
}

const app = Vue.createApp({
  data() {
    return {
      searchTerm: "",
      filteredLoans: [],
      loanOwners: [],
      loans: [],
      itemName: "",
      status: "",
      selectedLoan: "",
      selectedCategory: "All",
      selectedStatus: "",
      selectedOption: true,

      item: {
        name: "",
        availableQuantity: "",
        imgFile: null,
      },

      updateItem: {
        name: "",
        availableQuantity: "",
        imgFile: null,
      },

      items: [],
    };
  },
  watch: {
    "updateItem.name"(newName) {
      const selectedItem = this.items.find((item) => item.name === newName);
      if (selectedItem) {
        this.updateItem.availableQuantity = selectedItem.availableQuantity;
        console.log(this.updateItem);
      } else {
        this.updateItem.availableQuantity = "";
      }
    },
  },
  computed: {
    // isDeleteDisabled() {
    //   console.log(this.updateItem.name);
    //   return !this.updateItem.name; // Disable if no item name is selected
    // },
    // formValid() {
    //   // Check if item name is not empty, quantity is a positive number, and an image is selected
    //   const isNameValid = this.item.name.trim().length > 0;
    //   const isQuantityValid = Number(this.item.availableQuantity) > 0;
    //   const isImageValid = this.item.imgFile !== null;

    //   // The form is valid only if all three conditions are met
    //   return isNameValid && isQuantityValid && isImageValid;
    // },

    filterItems() {
      return this.loanOwners.filter((loans) => {
        // Apply status filter
        let statusMatch;
        if (this.selectedStatus === "") {
          statusMatch = true;
        } else if (this.selectedStatus === "Collection") {
          statusMatch = loans.status === this.selectedStatus;
        } else {
          statusMatch = loans.status === "Loaned" || loans.status === "Overdue";
        }

        // Apply item name filter
        let itemMatch =
          this.itemName === "" || loans.itemName === this.itemName;

        // console.log(loans.loanedto.toLowerCase())
        // Apply search term filter
        let searchMatch =
          this.searchTerm === "" ||
          loans.loanedto.toLowerCase().includes(this.searchTerm.toLowerCase());

        // All conditions must be true
        return statusMatch && itemMatch && searchMatch;
      });
    },
  },
  async mounted() {
    this.items = await this.getNumbers();
    console.log("ITEMS");
    console.log(this.items);

    //  NEED TO CHANGE
    const loanlist = await this.readLoan();
    this.loans = loanlist; // Update the reactive property
    this.filteredLoans = this.loans;

    // this.getData();
    this.getRentals();
    this.handleProfileLink();
    window.addEventListener("scroll", this.handleScroll);
  },
  methods: {
    showDeleteModal(name) {
      // Set the `name` of the item to delete in `updateItem`
      this.updateItem.name = name;

      // Show the delete confirmation modal
      const deleteModal = new bootstrap.Modal(
        document.getElementById("deleteConfirmationModal")
      );
      deleteModal.show();
    },
    confirmDelete() {
      // Call handleDeleteEvent with `updateItem.name`
      console.log("Confirm delete triggered");
      if (this.updateItem.name) {
        this.handleDeleteItem(this.updateItem.name);
      }

      // Close the modal
      const deleteModal = bootstrap.Modal.getInstance(
        document.getElementById("deleteConfirmationModal")
      );
      deleteModal.hide();
    },
    async handleDeleteItem(name) {
      console.log("Deleting item with name:", name);

      try {
        // Reference the document in the "loans" collection by its `name`
        const itemDocRef = doc(db, "loans", name);

        // Delete the document from Firestore
        await deleteDoc(itemDocRef);
        alert("Item deleted successfully");

        // Remove the item from the local `this.items` array
        this.items = this.items.filter((item) => item.name !== name);

        this.updateItem = {
          name: "",
          availableQuantity: "",
          imgFile: null,
        };
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item.");
      }
    },
    async getNumbers() {
      const querySnapshot = await getDocs(collection(db, "loans"));
      const items = [];
      querySnapshot.forEach((doc) => {
        const data = { ...doc.data() };

        items.push({ name: doc.id, ...data });
      });
      return items;
    },
    handleFileUpload(item) {
      this.item.imgFile = item.target.files[0];
    },
    handleUpdateFileUpload(event) {
      this.updateItem.imgFile = event.target.files[0];
    },
    async handleCreateItem() {
      const { name, availableQuantity, imgFile } = this.item;
      console.log(this.item);

      if (!name || !availableQuantity || !imgFile) {
        alert("Please fill in all fields.");
        return;
      }

      // Upload the image to Firebase Storage
      const imgRef = ref(storage, `donations/${imgFile.name}`);
      await uploadBytes(imgRef, imgFile);
      const imgUrl = await getDownloadURL(imgRef).then((url) =>
        decodeURIComponent(url)
      );

      const itemData = { name, availableQuantity, image: imgFile.name };
      try {
        // Create the main document in the "loans" collection
        const itemDocRef = doc(db, "loans", name); // Use the document ID as the item name
        await setDoc(itemDocRef, itemData);

        // Create a "rentals" subcollection within this document
        const rentalsRef = collection(itemDocRef, "rentals");

        // Optionally, add an initial rental document
        // await setDoc(doc(rentalsRef, "sampleRental"), {
        //     rentalDate: new Date(),
        //     renterName: "John Doe",
        //     returnDate: null,
        //     status: "active"
        // });

        alert(`Item created with ID: ${name}`);
        console.log("Document and rentals subcollection created successfully");

        let imgUrl = `https://firebasestorage.googleapis.com/v0/b/myblock-wad.appspot.com/o/loans%2F${encodeURIComponent(itemData.image)}?alt=media`;
        // Add the new announcement to the events array without reloading
        this.items.push({ ...itemData, image: imgUrl });

        console.log(this.items);

        // Clear fields after creation
        this.item = {
          name: "",
          availableQuantity: "",
          imgFile: null,
        };
      } catch (error) {
        console.error("Error creating item:", error);
        alert("Failed to create item.");
      }
    },
    async handleSaveUpdate() {
      const { name, availableQuantity, imgFile } = this.updateItem;
      console.log(this.updateItem);

      if (!name || !availableQuantity) {
        alert("Please fill in all fields.");
        return;
      }

      let imgUrl = `https://firebasestorage.googleapis.com/v0/b/myblock-wad.appspot.com/o/donations%2F${encodeURIComponent(
        this.updateItem.imgName
      )}?alt=media`;
      if (imgFile) {
        // Upload the new image to Firebase Storage
        const imgRef = ref(storage, `donations/${imgFile.name}`);
        await uploadBytes(imgRef, imgFile);
        imgUrl = await getDownloadURL(imgRef);
      }

      const itemData = {
        name,
        availableQuantity,
      };

      // Conditionally add the image URL to itemData only if a new image was uploaded
      if (imgFile) {
        itemData.image = imgFile.name;
      }

      try {
        console.log("Updating item with data:", itemData);
        const itemDocRef = doc(db, "loans", name);
        await updateDoc(itemDocRef, itemData);
        alert("Item updated successfully");

        const itemIndex = this.items.findIndex((item) => item.name === name);
        if (itemIndex !== -1) {
          // Update the item fields in the array
          this.items[itemIndex].availableQuantity = availableQuantity;
          if (imgFile) {
            this.items[itemIndex].image = imgFile.name;
          }
        }
      } catch (error) {
        console.error("Error updating item:", error);
        alert("Failed to update item.");
      }
    },
    clearSelection() {
      this.selectedLoan = ""; // Clear radio selection
      this.itemName = ""; // Clear the item name
    },
    clearStatus() {
      this.selectedStatus = ""; // Clear the radio selection
    },
    resetFilters() {
      this.selectedStatus = ""; // Clear all filters, including radio selection
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
            id: rentalDoc.id,
          });
          // var date = loanDoc.data().endDate
          // var jsDate = new Date(date.seconds * 1000)
          // console.log(jsDate)

          this.loanOwners = rental;
        });

        const storage = getStorage();
        const imagePath = doc.data().image;

        // Get the download URL from Firebase Storage
        let imageUrl = "";
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
          loans: rental,
        });
      }
      console.log(loanlist);
      return loanlist;
    },

    async getRentals() {
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
            itemName: doc.id,
          });
        });
      }
      this.loanOwners = rentalList;

      console.log(rentalList);
      return rentalList;
    },
    async updateRental(itemId, curritemName) {
      let statustype = "";
      let count = 0;

      this.loans.forEach((element) => {
        console.log(element);
        if (element.name == curritemName) {
          let loanlist = element.loans;
          count = element.quantity;
          loanlist.forEach((loan) => {
            // console.log("sup" + loan.status)
            if (loan.id == itemId) {
              statustype = loan.status;
            }
          });
          console.log("hi");
        }
      });

      // this.getNums;
      // const docUpdate = doc(db, `loans/${this.itemName}/rental`,itemId)
      console.log(curritemName);
      console.log(itemId);
      console.log("loans/" + curritemName + "/rental/" + itemId);
      const docUpdate = doc(db, "loans/" + curritemName + "/rental/" + itemId);
      const docDelete = doc(db, "loans/" + curritemName + "/rental/" + itemId);
      // const docDelete = doc(db, `loans/${this.itemName}/rental`,itemId)

      console.log(count);
      console.log(statustype);

      if (statustype == "Loaned" || statustype == "Overdue") {
        //delete item
        try {
          await deleteDoc(docDelete); // Deletes the document
          console.log(`Document with ID ${itemId} deleted successfully`);
          console.log(`loans/${curritemName}`);
          const docUpdate2 = doc(db, `loans/${curritemName}`);

          try {
            await updateDoc(docUpdate2, {
              availableQuantity: count + 1,
            });
            console.log("updated and deleted");

            window.location.reload();
          } catch (error) {
            console.error("Error updating loans: " + error);
          }
        } catch (err) {
          console.error("Error deleting document:", err.message);
        }
      } else if (statustype == "Collection") {
        try {
          await updateDoc(docUpdate, {
            status: "Loaned",
          });
          console.log("updated");

          window.location.reload();
        } catch (error) {
          console.error("Error updating loans: " + error);
        }
      } else {
        window.alert("Something went wrong somewhere");
      }
    },
    updateItemName(name, event) {
      if (event.target.checked) {
        this.itemName = name;
      } else {
        // Optionally clear `itemName` if the checkbox is unchecked
        this.itemName = "";
      }
      // console.log(this.itemName)
    },

    resetFilters() {
      window.location.reload();
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
        profileLinkRedir.setAttribute("href", "../profile.html");

        const profileLinkImg = document.getElementById("profileLinkImg");
        profileLinkImg.className = "fa fa-calendar";

        const profileLinkText = document.getElementById("profileLinkText");
        profileLinkText.textContent = "Profile";
      } else {
        const profileLinkRedir = document.getElementById("profileLinkRedir");
        profileLinkRedir.setAttribute("href", "../login.html");

        const profileLinkImg = document.getElementById("profileLinkImg");
        profileLinkImg.className = "fa fa-sign-in-alt";

        const profileLinkText = document.getElementById("profileLinkText");
        profileLinkText.textContent = "Login";
      }
    },
  },
});
const vm = app.mount("#app");
