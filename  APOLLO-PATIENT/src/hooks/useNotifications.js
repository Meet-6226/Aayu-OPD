import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

export function useNotifications(patientId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. Real-time unread count listener
  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where("patientId", "==", patientId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [patientId]);

  // 2. Fetch notifications (ordered desc client-side to avoid index requirement)
  const fetchNotifications = useCallback(async () => {
    if (!patientId) return [];
    setLoading(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where("patientId", "==", patientId)
      );
      
      const querySnapshot = await getDocs(q);
      const docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort client-side by createdAt descending
      docsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      // Limit to 50
      const limited = docsData.slice(0, 50);
      setNotifications(limited);
      return limited;
    } catch (err) {
      console.error("Error fetching notifications:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // 3. Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(docRef, { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  // 4. Mark all unread notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!patientId) return;
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where("patientId", "==", patientId),
        where("read", "==", false)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return;

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true });
      });

      await batch.commit();

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [patientId]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}

export default useNotifications;
