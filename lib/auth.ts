import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    const errorCode = error.code;
    let message = 'Unable to sign in. Please try again.';
    
    switch (errorCode) {
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        message = 'This account is currently disabled.';
        break;
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        message = 'Email or password is incorrect.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many sign-in attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Unable to connect. Please check your internet connection.';
        break;
    }
    
    throw new Error(message);
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error('Unable to sign out. Please try again.');
  }
}

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export async function updateUserProfile(name: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently signed in.');
  await updateProfile(user, { displayName: name });
}

export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No user is currently signed in.');
  
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
  try {
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (error: any) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Current password is incorrect.');
    }
    throw new Error('Failed to update password. Please try again.');
  }
}
