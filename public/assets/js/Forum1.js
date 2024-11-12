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
            title: null,
            category: 'General', // by default, it will be general
            content: null,
            userName: 'Kelly', // need to retrieve username based on profile
            forums: [], // Will be populated with forum posts and comments from getposts()
            commentDetails: null,
            parentID: null, // Initialize as null; will be set when selecting a specific forum post
            selectedCategory: 'All', // Default category filter
            isLiked: false // New property to track like status
        };
    },//data

    computed: { 
        filteredPosts() {
            if (this.selectedCategory === 'All') {
                return this.forums; // Show all posts if 'All' is selected
            } else {
                return this.forums.filter(post => post.category === this.selectedCategory);
            }
        }
    }, // computed

    async mounted() {
        console.log("Mounted is called.");
        this.forums = await this.getposts()
        const app = this;
        this.handleProfileLink();
        window.addEventListener('scroll', this.handleScroll);
    }, //mounted

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

        async createPost() {
            // Debugging: Log each field to check if they are populated
            console.log("Category:", this.category);
            console.log("Title:", this.title);
            console.log("Content:", this.content);

            if (!this.category || !this.content || !this.title) {
                alert("Please fill in all required fields before submitting.");
                return;  // Stop further execution if any field is missing
            }

            try {
                const postRef = await addDoc(collection(db, 'forum'), {
                    author: this.userName || "Anonymous",
                    category: this.category,
                    content: this.content,
                    title: this.title,
                    createdAt: Timestamp.fromDate(new Date())
                });
                console.log("Post added successfully with ID:", postRef.id);

                // Add post to forums immediately without reloading the page
                this.forums.push({
                    id: postRef.id,
                    author: this.userName || "Anonymous",
                    category: this.category,
                    content: this.content,
                    title: this.title,
                    createdAt: new Date(),
                    showComments: false,
                    comments: [],
                    isLiked: false
                });
                this.closeForm();
            } catch (error) {
                console.error("Error adding post:", error);
                alert("Failed to add post.");
            }
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
                        id: commentDoc.id,
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
                    comments: comments,
                    showComments: false, // Initialize toggle
                    comments: comments,
                    isLiked: doc.data().isLiked || false
                });
            }
            console.log("Forums and comments:", forumList);
            this.forums = forumList;
        },

        openComment(postId) {
            this.parentID = postId; // Set parentID to the post ID
            this.displayCommentForm = false;
        },
        closeComment() {
            console.log("Closing form...");
            this.displayCommentForm = true;  
            this.displayCommentButton = true;       
        },

        async postComment(postId) {
            if (!this.commentDetails) {
                alert("Please fill in all required fields before submitting.");
                return;
            }

            try {
                const commentRef = collection(db, `forum/${postId}/comments`);
                await addDoc(commentRef, {
                    author: this.userName,
                    content: this.commentDetails,
                    createdAt: Timestamp.fromDate(new Date())
                });
                console.log("Comment added successfully!");
                // Update comments for post in forums
                this.forums.find(post => post.id === postId).comments.push({
                    author: this.userName,
                    content: this.commentDetails,
                    createdAt: new Date()
                });
                this.closeComment();
            } catch (error) {
                console.error("Error adding comment:", error);
                alert("Failed to add comment.");
            }
        },

        async toggleLike(postId) {
            const post = this.forums.find(post => post.id === postId);
            if (post) {
                post.isLiked = !post.isLiked;  // Toggle the like status
                try {
                    const postRef = doc(db, 'forum', postId);
                    await updateDoc(postRef, { isLiked: post.isLiked });
                    console.log("Like status updated in Firebase:", post.isLiked);
                } catch (error) {
                    console.error("Error updating like:", error);
                }
            }
        }       
    }// methods
});

const vm = app.mount('#app');