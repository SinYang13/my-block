// forum.js
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


// Create post
export async function createPost(postData) {
    const docRef = await addDoc(collection(db, "forum"), postData);
    return docRef.id;
}

// Read posts
export async function readPosts() {
    try {
        const querySnapshot = await getDocs(collection(db, "forum"));
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        // Inside readPosts function
        console.log("Fetching posts from Firestore...");

        // Check if posts are retrieved
        console.log("Posts fetched:", posts);
        return posts;
    } catch (error) {
        console.error("Error reading posts:", error);
        throw error;
    }
}

// Update post
export async function updatePost(postId, updatedData) {
    const postRef = doc(db, "forum", postId);
    await updateDoc(postRef, updatedData);
}

// Delete post
export async function deletePost(postId) {
    const postRef = doc(db, "forum", postId);
    await deleteDoc(postRef);
}

// Add comment
export async function addComment(postId, commentData) {
    const commentsRef = collection(db, `forum/${postId}/comments`);
    await addDoc(commentsRef, commentData);
}
