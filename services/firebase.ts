
// Firebase has been deprecated in favor of Supabase.
// This file is kept to prevent import errors during the transition but exports nothing functional.

console.warn("Firebase services are deprecated. Please use dbService (Supabase) instead.");

export const db = null;
export const auth = null;
export const storage = null;
export const googleProvider = null;
export const secondaryAuth = null;
export const firebase = {
    auth: () => ({}),
    firestore: {
        FieldValue: {
            arrayUnion: () => {},
            arrayRemove: () => {},
            increment: () => {}
        }
    }
};
