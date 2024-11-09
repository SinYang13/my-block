import { db } from './config'
import {
    collection, getDocs, addDoc, query,
    Timestamp, orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


// <div id='app'></div>
const app = Vue.createApp({
    data() {
        return {
            // Control variables for displaying forms and buttons
            displayForumForm: true,
            displayForumButton: true,
            displayCommentForm: true,
            displayCommentButton: true,


            // Initialize data properties for forum posts and comments
            title: '',
            category: 'General',
            content: null,
            userName: 'Kelly',
            forums: [], // Will be populated with forum posts and comments from getposts()
            commentDetails: null,
            parentID: '0pfHsr9HMpg9ZZYVGbmO', // Initialize as null; will be set when selecting a specific forum post
            selectedCategory: 'All', // Default category filter
            isLiked: false // Track like status
        };
    },


    computed: {
        filteredPosts() {
            return this.selectedCategory === 'All'
                ? [...this.forums] // Returns all posts if 'All' is selected
                : this.forums.filter(post => post.category === this.selectedCategory);
        }
    },    
   
    mounted() {
        console.log("Vue app is mounted and initialized."); // This should log if Vue is mounted correctly
        // Continue with data fetching
        this.getposts().then(posts => {
            this.forums = posts;
            console.log("Data retrieved:", posts);  // Confirm data retrieval here
        }).catch(error => {
            console.error("Data fetch error:", error);  // Log if there’s a data fetch issue
        });
    },    
       
    methods: {
        handleScroll() {
            const scrollPosition = window.scrollY;
            const headerHeight = document.querySelector('header').offsetHeight;
            const headerElement = document.querySelector('header');
            if (scrollPosition >= headerHeight) {
                headerElement.classList.add('background-header');
            }
            else {
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
            }
            else {
                const profileLinkRedir = document.getElementById("profileLinkRedir");
                profileLinkRedir.setAttribute("href", "login.html");


                const profileLinkImg = document.getElementById("profileLinkImg");
                profileLinkImg.className = "fa fa-sign-in-alt";


                const profileLinkText = document.getElementById("profileLinkText");
                profileLinkText.textContent = "Login"
            }
        },


        openForm() {
            console.log("opening form...")
            this.displayForumForm = false
            this.displayForumButton = false
        },
        closeForm() {
            // console.log("sup")
            this.displayForumForm = true
            this.displayForumButton = true
        },


        createPost() {
            if (!this.category || !this.content || !this.title) {
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
            try {
                const forumList = [];
                const querySnapshot = await getDocs(collection(db, "forum"));
                for (const doc of querySnapshot.docs) {
                    const docId = doc.id;
                    const commentRef = collection(db, `forum/${docId}/comments`);
                    const orderedQuery = query(commentRef, orderBy("createdAt", "desc"));
                    const commentSnapshot = await getDocs(orderedQuery);
                    const comments = commentSnapshot.docs.map((commentDoc) => ({
                        author: commentDoc.data().author,
                        content: commentDoc.data().content,
                        createdAt: commentDoc.data().createdAt.toDate(),
                    }));
       
                    forumList.push({
                        id: docId,
                        author: doc.data().author,
                        category: doc.data().category,
                        content: doc.data().content,
                        title: doc.data().title,
                        createdAt: doc.data().createdAt.toDate(),
                        showComments: false,
                        comments: comments,
                        isLiked: false
                    });
                }
                this.forums = forumList;
                console.log("Posts loaded successfully:", forumList); // Debugging log
            } catch (error) {
                console.error("Error loading posts:", error); // Error logging
            }
        },        
       
        
        openComment() {
            console.log("Opening form...");
            this.displayCommentForm = false;  
            this.displayCommentButton = true;      
        },
        closeComment() {
            console.log("Closing form...");
            this.displayCommentForm = true;  
            this.displayCommentButton = true;      
        },


        postComment() {
            if (!this.commentDetails) {
                alert("Please fill in all required fields before submitting.");
                return;
            }
        
            const commentRef = collection(db, "forum/" + this.parentID + "/comments");
        
            addDoc(commentRef, {
                author: this.userName,
                content: this.commentDetails,
                createdAt: Timestamp.fromDate(new Date())
            })
                .then((docRef) => {
                    console.log("Comment added successfully with ID: ", docRef.id);
                    this.commentDetails = ''; // Clear the input after successful submission
                    this.closeComment(); // Close the comment form
                })
                .catch((error) => {
                    console.error("Error adding comment: ", error);
                });
        },


        toggleLike(postID) {
            const post = this.forums.find(post => post.id === postID);
            if (post) {
                post.isLiked = !post.isLiked; // Toggle the like status
                
                // Optionally: Save the like status to the database if needed
                const postRef = doc(db, "forum", postID); // Get the reference to the specific post in the Firestore collection
                updateDoc(postRef, {
                    isLiked: post.isLiked
                })
                .then(() => {
                    console.log(`Like status updated for post with ID: ${postID}`);
                })
                .catch((error) => {
                    console.error("Error updating like status: ", error);
                });
            }
        }                       
    }// methods
});
const vm = app.mount('#app');





