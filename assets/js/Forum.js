import { db } from '../js/config'
import { createPost, postComment} from "../../db/forumCRUD"
import {
    collection, getDocs, addDoc, query,
    Timestamp, orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// import { createPost, readPosts, updatePost, deletePost, postComment, deleteComment } from '../db/forumCRUD.js';


// <div id='app'></div>
const app = Vue.createApp({
    data() {
        return {
            // key: value
            displayForumForm: true,
            displayButton: true,
            displayCommentButton: false,
            displayCommentForm: false,
            title: "",
            category: "General",
            content: "",
            userName: sessionStorage.getItem("loggedInUserEmail"),
            forums: [],
            commentDetails: "",
            parentID: "",            
            selectedCategory: 'All', // Default category filter
            isLiked: ""
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
        console.log(this.displayCommentForm)
        const app = this;
        this.handleProfileLink();
        window.addEventListener('scroll', this.handleScroll);
    },
    methods: {
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
        async createPost() {
            if (!this.category || !this.content || !this.title) {
                alert("Please fill in all required fields before submitting.");
                return; // Stop the function from proceeding further
            }
            else{
                const postData = {
                    author: this.userName,
                    category: this.category,
                    content: this.content,
                    title: this.title,
                    createdAt: Timestamp.fromDate(new Date()),
                    isLiked: false
                };

                try {
                    const postID = await createPost(postData);
                    alert(`Post created with ID: ${postID}`);
                    this.closeForm()
                }
                catch (error) {
                    console.error(`Error creating new post`, error);
                }
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
                    isLiked: doc.data().isLiked,
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

        openCommentform(postID) {
            this.parentID = postID
            console.log("Opening form...");
            this.displayCommentForm = true;  
            this.displayCommentButton = false; 
            console.log(this.displayCommentForm);   
        },
        closeCommentform() {
            console.log("Closing form...");
            this.displayCommentForm = false;  
            this.displayCommentButton = true;      
        },


        async postComment() {
            if (!this.commentDetails) {
                alert("Please fill in all required fields before submitting.");
                return; // Stop the function from proceeding further
            }
            else{
                const commentData = {author: this.userName,
                        content: this.commentDetails,
                        createdAt: Timestamp.fromDate(new Date())}

                        try {
                            const commentId = await postComment(this.parentID,commentData);
                            alert(`Comment created with ID: ${commentId}`);
                            this.closeForm()
                        }
                        catch (error) {
                            console.error(`Error creating new comment ${this.parentID}`, error);
                        }
            }
        },

        toggleLike(post) {
            post.isLiked = !post.isLiked; // Toggle like status for the specific post
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
        }
    } // methods
});
const vm = app.mount('#app'); 