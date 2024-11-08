// forumCRUD.js
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
        for (const forumDoc of querySnapshot.docs) {
            const postData = forumDoc.data();
            postData.id = forumDoc.id;

            // Fetch comments for each post
            const commentsSnapshot = await getDocs(collection(db, `forum/${forumDoc.id}/comments`));
            const comments = commentsSnapshot.docs.map((commentDoc) => ({ id: commentDoc.id, ...commentDoc.data() }));
            postData.comments = comments;

            posts.push(postData);
        }
        console.log("Fetching posts from Firestore...");
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
export async function postComment(postId, commentData) {
    const commentsRef = collection(db, `forum/${postId}/comments`);
    await addDoc(commentsRef, commentData);
}

// Update like status in Firestore
export async function toggleLike(postId, isLiked) {
    const postRef = doc(db, "forum", postId);
    await updateDoc(postRef, { isLiked: isLiked });
}