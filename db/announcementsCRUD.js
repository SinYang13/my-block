// db/announcementsCRUD.js
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Create an announcement
export async function createAnnouncement(announcementData) {
    const docRef = await addDoc(collection(db, "announcements"), announcementData);
    return docRef.id;
}

// Read announcements
export async function readAnnouncements() {
    const querySnapshot = await getDocs(collection(db, "announcements"));
    const announcements = [];
    querySnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() });
    });
    return announcements;
}

// Update an announcement
export async function updateAnnouncement(announcementId, updatedData) {
    const announcementRef = doc(db, "announcements", announcementId);
    await updateDoc(announcementRef, updatedData);
}

// Delete an announcement
export async function deleteAnnouncement(announcementId) {
    const announcementRef = doc(db, "announcements", announcementId);
    await deleteDoc(announcementRef);
}
