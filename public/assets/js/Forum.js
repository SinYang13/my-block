import { db } from "../js/config.js";
import { createPost, postComment } from "../../db/forumCRUD.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  Timestamp,
  orderBy,
  where,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// import { createPost, readPosts, updatePost, deletePost, postComment, deleteComment } from '../db/forumCRUD.js';

// Function to handle link clicks
function handleLinkClick(event) {
  event.preventDefault(); // Prevent default link navigation

  const url = event.currentTarget.href; // Get the destination URL

  // Add fade-out class to trigger animation
  document.body.classList.add("fade-out");

  // Delay the navigation to allow the fade-out animation to complete
  setTimeout(() => {
    window.location.href = url;
  }, 500); // Delay matches the duration of the fadeOut animation (0.5s)
}

// Apply the event listener to all <a> tags with class "animated-link"
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("a.animated-link");

  // Add event listeners for the fade-out animation on link click
  links.forEach((link) => link.addEventListener("click", handleLinkClick));

  // Trigger fade-in when the page loads
  document.body.classList.add("fade-in");
});

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
      userName: sessionStorage.getItem("loggedInUserEmail"),
      forums: [],
      commentDetails: "",
      selectedCategory: "All", // Default category filter
      searchQuery: "",
      posts: [],
      commentsCount: 0,
      heart: "far fa-heart",
      heartStatus: {},
      success:false,
      fillup:false,
      avatarImages: [
        "https://bootdey.com/img/Content/avatar/avatar1.png",
        "https://bootdey.com/img/Content/avatar/avatar2.png",
        "https://bootdey.com/img/Content/avatar/avatar3.png",
        "https://bootdey.com/img/Content/avatar/avatar4.png",
        "https://bootdey.com/img/Content/avatar/avatar5.png",
        "https://bootdey.com/img/Content/avatar/avatar6.png",
        "https://bootdey.com/img/Content/avatar/avatar7.png",
        "https://bootdey.com/img/Content/avatar/avatar8.png"
    ],
    randomImageMap: {}
    };
  }, // data
  computed: {
    filteredPosts() {
      return this.forums.filter((post) => {
        const matchesCategory =
          this.selectedCategory === "All" ||
          post.category === this.selectedCategory;
        const matchesSearch =
          post.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(this.searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
      });
    },
  }, // computed
  // created() {
  // },
  async mounted() {
    this.forums = await this.getposts();
    this.showComments();
    const app = this;
    this.handleProfileLink();
    window.addEventListener("scroll", this.handleScroll);
    console.log("mounted");
  },
  methods: {
    getRandomImage(postId) {
        // Check if an image has already been assigned to this post
        if(postId == "noid"){
            const randomIndex = Math.floor(Math.random() * this.avatarImages.length);
        }
        if (!this.randomImageMap[postId]) {
            // Assign a random image from the array
            const randomIndex = Math.floor(Math.random() * this.avatarImages.length);
            this.randomImageMap[postId] = this.avatarImages[randomIndex];
        }
        // Return the assigned image
        return this.randomImageMap[postId];
    },
    openForm() {
      console.log("opening form...");
      const userId = sessionStorage.getItem("loggedInUserEmail");

        if (userId) {
            // If logged in, open the New Discussion modal
            const newDiscussionModal = new bootstrap.Modal(document.getElementById("threadModal"));
            newDiscussionModal.show();
        } else {
            // If not logged in, show the Login Prompt modal
            const loginModal = new bootstrap.Modal(document.getElementById("loginPromptModal"));
            loginModal.show();
        };
      this.displayForumForm = false;
      this.displayButton = false;
    },
    openFormcomment() {
      console.log("opening form...");
      const userId = sessionStorage.getItem("loggedInUserEmail");

        if (userId) {
            // If logged in, open the New Discussion modal
            const newDiscussionModal = new bootstrap.Modal(document.getElementById("threadModalComment"));
            newDiscussionModal.show();
        } else {
            // If not logged in, show the Login Prompt modal
            const loginModal = new bootstrap.Modal(document.getElementById("loginPromptModal"));
            loginModal.show();
        };
      this.displayForumForm = false;
      this.displayButton = false;
    },
    closeForm() {
      // console.log("sup")
      this.displayForumForm = true;
      this.displayButton = true;
    },
    async createPost() {
      if (!this.category || !this.content || !this.title) {
        const successModal = new bootstrap.Modal(document.getElementById('successModal3'));
        successModal.show();
        return; // Stop the function from proceeding further
      } else {
        const postData = {
          author: this.userName,
          category: this.category,
          content: this.content,
          title: this.title,
          createdAt: Timestamp.fromDate(new Date()),
          isLiked: false,
        };

        try {
          const postID = await createPost(postData);
          // alert("Post created");
          const successModal = new bootstrap.Modal(document.getElementById('successModal'));
          successModal.show();
        } catch (error) {
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

        const likedRef = collection(db, `forum/${docId}/liked`);
        const likedSnapshot = await getDocs(likedRef);
        const likedList = [];

        likedSnapshot.forEach((likedDoc) => {
          if (likedDoc.data().user == this.userName) {
            this.heartStatus[docId] = true;
          }
          likedList.push({
            ...likedDoc.data(),
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
          likedCount: likedList.length,
        });

        // Update the category count
        const category = doc.data().category;
        if (categoryCount[category]) {
          categoryCount[category]++;
        } else {
          categoryCount[category] = 1;
        }
      }
      console.log(forumList);
      console.log(categoryCount);
      return forumList; // Return the forumList array
    },

    openCommentform(postID) {
      this.parentID = postID;
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

    async postComment(parentID) {
      console.log(parentID);
      if (!this.commentDetails) {
        const successModal = new bootstrap.Modal(document.getElementById('successModal3'));
        successModal.show();
        return; // Stop the function from proceeding further
      } else {
        const commentData = {
          author: this.userName,
          content: this.commentDetails,
          createdAt: Timestamp.fromDate(new Date()),
        };

        try {
          const commentId = await postComment(parentID, commentData);
          const successModal = new bootstrap.Modal(document.getElementById('successModal2'));
          successModal.show();
        } catch (error) {
          console.error(`Error creating new comment ${parentID}`, error);
        }
      }
    },

    showComments(postID) {
        try {
            this.forums.forEach((item) => {
                if (item.id == postID) {
                  this.posts = item;
                  console.log(item);
                }
              });
              this.commentsCount = this.posts.comments.length;
            //   console.log(this.posts.comments.length);
        } catch {
            // console.log("failed");
        }
      
    },

    async liked(parentID) {
      const commentRef = collection(db, `forum/${parentID}/liked`);
      const userEmail = this.userName; // Replace with dynamic user email

      // Query to find if the user has already liked the post
      const userLikeQuery = query(commentRef, where("user", "==", userEmail));
      const querySnapshot = await getDocs(userLikeQuery);

      if (!querySnapshot.empty) {
        // User has already liked the post, so remove the like
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
          console.log("Like removed successfully for user:", userEmail);
        });
        this.heartStatus[parentID] = false; // Reset heart icon color
        const post = this.forums.find((post) => post.id === parentID);
        if (post) {
          post.likedCount--;
        }
      } else {
        // User has not liked the post, so add a like
        await addDoc(commentRef, {
          user: userEmail,
        });
        console.log("Like added successfully for user:", userEmail);
        this.heartStatus[parentID] = true; // Set heart icon color
        const post = this.forums.find((post) => post.id === parentID);
        if (post) {
          post.likedCount++;
        }
      }
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
        profileLinkRedir.setAttribute("href", "profile.html");

        const profileLinkImg = document.getElementById("profileLinkImg");
        profileLinkImg.className = "fa fa-user";

        const profileLinkText = document.getElementById("profileLinkText");
        profileLinkText.textContent = "Profile";

        // profileLink.innerHTML = `<a href="profile.html"><i class="fa fa-calendar"></i> Profile</a>`;
      } else {
        const profileLinkRedir = document.getElementById("profileLinkRedir");
        profileLinkRedir.setAttribute("href", "login.html");

        const profileLinkImg = document.getElementById("profileLinkImg");
        profileLinkImg.className = "fa fa-sign-in-alt";

        const profileLinkText = document.getElementById("profileLinkText");
        profileLinkText.textContent = "Login";

        // profileLink.innerHTML = `<a href="login.html"><i class="fa fa-sign-in-alt"></i> Login / Register</a>`;
      }
    },
  }, // methods
});
const vm = app.mount("#app");
