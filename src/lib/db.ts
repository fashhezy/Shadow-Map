import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, Timestamp } from "firebase/firestore";

export interface ScanResult {
  id?: string;
  target: string;
  timestamp: string;
  riskScore: number;
  riskLevel: string;
  summary: string;
  findings: any[];
  attackPaths: any[];
  recommendations: string[];
  exposedData: any;
  userId: string;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then(res => {
      clearTimeout(timeoutId);
      return res;
    }).catch(err => {
      clearTimeout(timeoutId);
      throw err;
    }),
    timeoutPromise
  ]);
};

// Save a new scan result to Firestore
export const saveScanResult = async (userId: string, scanData: Partial<ScanResult>) => {
  if (!userId) throw new Error("User ID is required to save scan results");
  
  try {
    const docRefPromise = addDoc(collection(db, "scans"), {
      ...scanData,
      userId,
      createdAt: Timestamp.now(),
    });
    const docRef: any = await withTimeout(docRefPromise, 2000, null);
    if (!docRef) throw new Error("Firestore save timeout");
    return docRef.id;
  } catch (error) {
    console.error("Error saving scan:", error);
    throw error;
  }
};

// Fetch all scans for a user
export const getUserScans = async (userId: string) => {
  if (!userId) return [];
  
  try {
    const q = query(
      collection(db, "scans"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot: any = await withTimeout(getDocs(q), 2000, null);
    if (!querySnapshot) return [];
    
    return querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as ScanResult[];
  } catch (error) {
    return [];
  }
};

// Fetch a specific scan by ID
export const getScanById = async (scanId: string) => {
  try {
    const docRef = doc(db, "scans", scanId);
    const docSnap: any = await withTimeout(getDoc(docRef), 2000, null);
    if (docSnap && docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ScanResult;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export interface SupportTicket {
  userId: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  createdAt: Date;
}

// Submit a new support ticket
export const submitSupportTicket = async (userId: string, ticketData: Partial<SupportTicket>) => {
  if (!userId) throw new Error("User ID is required to submit a ticket");
  
  try {
    const docRefPromise = addDoc(collection(db, "tickets"), {
      ...ticketData,
      userId,
      status: "Open",
      createdAt: Timestamp.now(),
    });
    const docRef: any = await withTimeout(docRefPromise, 5000, null);
    if (!docRef) throw new Error("Firestore save timeout");
    return docRef.id;
  } catch (error) {
    console.error("Error submitting ticket:", error);
    throw error;
  }
};
