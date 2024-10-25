import { db } from './config'
import {
    collection, getDocs, addDoc, query,
    Timestamp, orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// <div id='app'></div>
const app = Vue.createApp({
    data() {
        return {
            // key: value
            displayForumForm: true,
            displayButton: true,
            title: "",
            category: "General",
            content: "",
            userName: "Kelly",
            forums: [],
            commentDetails: "",
            parentID: "jgse9dsngNJ2p1iAdTwm",            
            selectedCategory: 'All', // Default category filter
        };
        
    }, // data
    computed: { 
        filteredPosts() {
            if (this.selectedCategory === 'All') {
                return this.forums; // Show all posts if 'All' is selected
            } else {
                return this.forums.filter(post => post.category === this.selectedCategory);
            }
        }
    
    }, // computed
    // created() { 
    // },
    async mounted() {
        this.forums = await this.getposts()
        const app = this;
        this.handleProfileLink();
        window.addEventListener('scroll', this.handleScroll);
    },
    methods: {
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
                profileLinkRedir.setAttribute("href", "profile.html");

                const profileLinkImg = document.getElementById("profileLinkImg");
                profileLinkImg.className = "fa fa-calendar";

                const profileLinkText = document.getElementById("profileLinkText");
                profileLinkText.textContent = "Profile"
            } else {
                const profileLinkRedir = document.getElementById("profileLinkRedir");
                profileLinkRedir.setAttribute("href", "login.html");

                const profileLinkImg = document.getElementById("profileLinkImg");
                profileLinkImg.className = "fa fa-sign-in-alt";

                const profileLinkText = document.getElementById("profileLinkText");
                profileLinkText.textContent = "Login / Register"
            }
        },
        openForm() {
            console.log("opening form...")
            this.displayForumForm = false
            this.displayButton = false
        },
        closeForm() {
            // console.log("sup")
            this.displayForumForm = true
            this.displayButton = true
        },
        createPost() {
            if (!this.userName || !this.category || !this.content || !this.title) {
                alert("Please fill in all required fields before submitting.");
                return; // Stop the function from proceeding further
            }


            //need to connect to firebase and include all the random stuff
            const postRef = collection(db, 'forum')
            console.log("creating Post")

            addDoc(postRef, {
                author: this.userName,
                category: this.category,
                content: this.content,
                title: this.title,
                createdAt: Timestamp.fromDate(new Date())
            })
                .then((docRef) => { // docRef contains the reference to the newly created document
                    console.log("Post added successfully with ID: ", docRef.id); // Log the document ID
                    // return docRef.id; // You can return the ID if needed
                    window.location.reload();
                })
                .catch((error) => {
                    console.error("Error adding loan: ", error);
                });

            this.closeForm()
            console.log(); // This is your Firestore timestamp
        },

        async getposts() {
            const forumList = [];
            const categoryCount = {};

            const querySnapshot = await getDocs(collection(db, "forum"));
            for (const doc of querySnapshot.docs) {
                const docId = doc.id;
                const commentRef = collection(db, `forum/${docId}/comments`);
                const orderedQuery = query(commentRef, orderBy("createdAt", "desc"));
                const commentSnapshot = await getDocs(orderedQuery);
                const comments = [];

                commentSnapshot.forEach((commentDoc) => {
                    comments.push({
                        author: commentDoc.data().author,
                        content: commentDoc.data().content,
                        createdAt: commentDoc.data().createdAt.toDate(),
                    });
                });

                forumList.push({
                    id: docId,
                    author: doc.data().author,
                    category: doc.data().category,
                    content: doc.data().content,
                    title: doc.data().title,
                    createdAt: doc.data().createdAt.toDate(),
                    showComments: false,
                    comments: comments
                });

                // Update the category count
                const category = doc.data().category;
                if (categoryCount[category]) {
                    categoryCount[category]++;
                } else {
                    categoryCount[category] = 1;
                }
            }
            console.log(forumList)
            console.log(categoryCount)
            return forumList; // Return the forumList array
        },

        postComments() {
            if (!this.content) {
                alert("Please fill in all required fields before submitting.");
                return; // Stop the function from proceeding further
            }

            const commentRef = collection(db, "forum/" + this.parentID + "/comments")


            addDoc(commentRef, {
                author: this.userName,
                content: this.commentDetails,
                createdAt: Timestamp.fromDate(new Date())
            })
                .then((docRef) => { // docRef contains the reference to the newly created document
                    console.log("Comment added successfully with ID: ", docRef.id); // Log the document ID
                    // return docRef.id; // You can return the ID if needed
                    // window.location.reload();
                })
                .catch((error) => {
                    console.error("Error adding loan: ", error);
                });


            console.log(); // This is your Firestore timestamp
        }
    } // methods
});
const vm = app.mount('#app'); 