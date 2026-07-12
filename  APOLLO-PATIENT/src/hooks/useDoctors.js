import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

export function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doctorsRef = collection(db, COLLECTIONS.DOCTORS);
      const querySnapshot = await getDocs(doctorsRef);
      const docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(docsData);
      return docsData;
    } catch (err) {
      console.error("Error fetching all doctors:", err);
      setError(err.message || "Failed to fetch doctors");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByDepartment = useCallback(async (department) => {
    if (!department || department === 'All') {
      return fetchAllDoctors();
    }
    setLoading(true);
    setError(null);
    try {
      const doctorsRef = collection(db, COLLECTIONS.DOCTORS);
      const q = query(doctorsRef, where("department", "==", department));
      const querySnapshot = await getDocs(q);
      const docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(docsData);
      return docsData;
    } catch (err) {
      console.error("Error fetching doctors by department:", err);
      setError(err.message || "Failed to fetch doctors");
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchAllDoctors]);

  const searchDoctors = useCallback(async (searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const doctorsRef = collection(db, COLLECTIONS.DOCTORS);
      const querySnapshot = await getDocs(doctorsRef);
      const allDocs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (!searchQuery.trim()) {
        setDoctors(allDocs);
        return allDocs;
      }

      const q = searchQuery.toLowerCase();
      const filtered = allDocs.filter(doc => {
        const nameMatch = doc.name ? doc.name.toLowerCase().includes(q) : false;
        const deptMatch = doc.department ? doc.department.toLowerCase().includes(q) : false;
        const qualMatch = doc.qualifications ? doc.qualifications.toLowerCase().includes(q) : false;
        return nameMatch || deptMatch || qualMatch;
      });

      setDoctors(filtered);
      return filtered;
    } catch (err) {
      console.error("Error searching doctors:", err);
      setError(err.message || "Search failed");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    doctors,
    loading,
    error,
    fetchAllDoctors,
    fetchByDepartment,
    searchDoctors
  };
}

export default useDoctors;
