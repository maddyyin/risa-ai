import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Validates the Firebase ID token passed in the Authorization header.
 * Automatically synchronizes/registers the user record in PostgreSQL if they don't exist.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.substring(7);
  if (!idToken) {
    return null;
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('[Auth Backend] Firebase API Key is missing on backend env');
      return null;
    }

    // Call Firebase Auth token verification endpoint
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[Auth Backend] Firebase token verification failed:', errorData);
      return null;
    }

    const data = await res.json();
    const firebaseUser = data.users?.[0];
    if (!firebaseUser) {
      console.error('[Auth Backend] No user found in Firebase token response');
      return null;
    }

    const userId = firebaseUser.localId;
    const email = firebaseUser.email;

    // Check if user exists in our local PostgreSQL database, otherwise auto-register them
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log(`[Auth Backend] Syncing/registering new user: ${email} (${userId})`);
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          name: email.split('@')[0], // Default name to email prefix
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('[Auth Backend] Error verifying user session:', error);
    return null;
  }
}
