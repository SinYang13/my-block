import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Google Cloud Natural Language API for Sentiment Analysis
export async function analyzeSentiment(text) {
    const url = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=AIzaSyALDiz5yPQGR-NfTW9E92W30hhPBufU06A`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                document: { type: 'PLAIN_TEXT', content: text },
                encodingType: 'UTF8',
            }),
        });

        const data = await response.json();
        return data.documentSentiment;
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
    }
}

export async function classifyContent(text) {
    const url = `https://language.googleapis.com/v1/documents:classifyText?key=AIzaSyALDiz5yPQGR-NfTW9E92W30hhPBufU06A`;

    // Check if content length is within limits
    if (text.length < 20 || text.length > 10000) {
        console.error("Content length must be between 20 and 10,000 bytes for classification.");
        return [];
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                document: {
                    type: 'PLAIN_TEXT',
                    content: text,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.categories || [];
    } catch (error) {
        console.error('Error classifying content:', error);
    }
}



// Create post with sentiment analysis and content classification
export async function createPost(postData) {
    try {
        // Analyze sentiment of the post content
        const sentiment = await analyzeSentiment(postData.content);
        postData.score = sentiment ? sentiment.score : null;
        postData.magnitude = sentiment ? sentiment.magnitude : null;

        // Classify content of the post
        const categories = await classifyContent(postData.content);
        postData.categories = categories || [];

        // Add post to Firestore
        const docRef = await addDoc(collection(db, "forum"), postData);
        console.log("posted")
        return docRef.id;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
}

// Update post with sentiment analysis on content update
export async function updatePost(postId, updatedData) {
    const postRef = doc(db, "forum", postId);
    try {
        if (updatedData.content) {
            const sentiment = await analyzeSentiment(updatedData.content);
            updatedData.score = sentiment ? sentiment.score : null;
            updatedData.magnitude = sentiment ? sentiment.magnitude : null;

            // Classify content of the post
            const categories = await classifyContent(postData.content);
            postData.categories = categories || [];
        }
        await updateDoc(postRef, updatedData);
        console.log(`Post ${postId} updated successfully with sentiment and classification data.`);
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
}

// Add comment with sentiment analysis
export async function postComment(postId, commentData) {
    const commentsRef = collection(db, `forum/${postId}/comments`);
    try {
        // Analyze sentiment for the comment content
        const sentiment = await analyzeSentiment(commentData.content);
        commentData.score = sentiment ? sentiment.score : null;
        commentData.magnitude = sentiment ? sentiment.magnitude : null;

        // Classify content of the post
        const categories = await classifyContent(commentData.content);
        commentData.categories = categories || [];

        // Add the comment to Firestore
        await addDoc(commentsRef, commentData);
        console.log(`Comment added to post ${postId} with sentiment and classification data.`);
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
}

// Read posts with comments
export async function readPosts() {
    try {
        const querySnapshot = await getDocs(collection(db, "forum"));
        const posts = [];
        for (const forumDoc of querySnapshot.docs) {
            const postData = forumDoc.data();
            postData.id = forumDoc.id;

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

// Delete post
export async function deletePost(postId) {
    const postRef = doc(db, "forum", postId);
    await deleteDoc(postRef);
}

// Delete comment
export async function deleteComment(postId, commentId) {
    if (typeof postId !== 'string' || typeof commentId !== 'string') {
        console.error("Invalid postId or commentId:", postId, commentId);
        return;
    }

    try {
        const commentsCol = collection(db, `forum/${postId}/comments`);
        const commentsRef = doc(commentsCol, commentId);
        await deleteDoc(commentsRef);
        console.log("Comment deleted successfully");
    } catch (error) {
        console.error("Error deleting comment:", error);
    }
}

// Toggle like status
export async function toggleLike(postId, isLiked) {
    const postRef = doc(db, "forum", postId);
    await updateDoc(postRef, { isLiked: isLiked });
}
