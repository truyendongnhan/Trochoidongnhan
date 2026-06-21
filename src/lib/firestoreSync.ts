import { 
  collection, 
  doc, 
  getDocFromServer, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Project, Chapter, World, Character, Story, PublishedNovel } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRM Validate Connection constraint
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection validated successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection; currently offline.");
    }
  }
}

// --------------------------------------------------------
// customWorlds Sync
// --------------------------------------------------------
export async function saveCustomWorldToFirestore(world: World) {
  const path = `customWorlds/${world.id}`;
  try {
    const worldRef = doc(db, 'customWorlds', world.id);
    await setDoc(worldRef, {
      ...world,
      createdBy: auth.currentUser?.uid || 'anonymous',
      createdAt: Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCustomWorldFromFirestore(worldId: string) {
  const path = `customWorlds/${worldId}`;
  try {
    await deleteDoc(doc(db, 'customWorlds', worldId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToCustomWorlds(onUpdate: (worlds: World[]) => void) {
  const path = 'customWorlds';
  try {
    const q = query(collection(db, 'customWorlds'));
    return onSnapshot(q, (snapshot) => {
      const worlds: World[] = [];
      snapshot.forEach((doc) => {
        worlds.push(doc.data() as World);
      });
      onUpdate(worlds);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// --------------------------------------------------------
// projects & chapters subcollections Sync (Pillar 1 Master-Gate scalable model)
// --------------------------------------------------------
export async function saveProjectToFirestore(project: Project) {
  if (!auth.currentUser) return;
  const path = `projects/${project.id}`;
  try {
    const projectRef = doc(db, 'projects', project.id);
    // Exclude chapters array from parent document to respect the 1MB limits
    const { chapters, ...projectMetadata } = project;
    await setDoc(projectRef, {
      ...projectMetadata,
      userId: auth.currentUser.uid,
      chaptersCount: chapters?.length || 0,
      updatedAt: Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProjectFromFirestore(projectId: string) {
  if (!auth.currentUser) return;
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveChapterToFirestore(projectId: string, chapter: Chapter) {
  const path = `projects/${projectId}/chapters/${chapter.id}`;
  try {
    const chapRef = doc(db, 'projects', projectId, 'chapters', chapter.id);
    await setDoc(chapRef, chapter);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteChapterFromFirestore(projectId: string, chapterId: string) {
  const path = `projects/${projectId}/chapters/${chapterId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'chapters', chapterId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getChaptersFromFirestore(projectId: string): Promise<Chapter[]> {
  const path = `projects/${projectId}/chapters`;
  try {
    const q = query(collection(db, 'projects', projectId, 'chapters'), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const chapters: Chapter[] = [];
    querySnapshot.forEach((doc) => {
      chapters.push(doc.data() as Chapter);
    });
    return chapters;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export function subscribeToUserProjects(userId: string, onUpdate: (projects: Project[]) => void) {
  const path = 'projects';
  try {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    return onSnapshot(q, async (snapshot) => {
      const projectsList: Project[] = [];
      for (const d of snapshot.docs) {
        const metadata = d.data();
        projectsList.push({
          id: metadata.id,
          worldId: metadata.worldId,
          character: metadata.character,
          story: metadata.story,
          updatedAt: metadata.updatedAt,
          chapters: [] // Lazy-loaded on select, or we can load them incrementally
        } as Project);
      }
      onUpdate(projectsList);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// --------------------------------------------------------
// Published Novels Sync and Operations
// --------------------------------------------------------
export async function publishNovelToFirestore(novel: PublishedNovel, chapters: Chapter[]) {
  const path = `publishedNovels/${novel.id}`;
  try {
    const novelRef = doc(db, 'publishedNovels', novel.id);
    await setDoc(novelRef, {
      ...novel,
      updatedAt: Date.now()
    });

    // Copy chapters inside nested public collection
    for (const chap of chapters) {
      const chapRef = doc(db, 'publishedNovels', novel.id, 'chapters', chap.id);
      await setDoc(chapRef, chap);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updatePublishedNovelStatusInFirestore(novelId: string, status: 'approved' | 'rejected') {
  const path = `publishedNovels/${novelId}`;
  try {
    const novelRef = doc(db, 'publishedNovels', novelId);
    await setDoc(novelRef, {
      status,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePublishedNovelFromFirestore(novelId: string) {
  const path = `publishedNovels/${novelId}`;
  try {
    await deleteDoc(doc(db, 'publishedNovels', novelId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getPublishedNovelChaptersFromFirestore(novelId: string): Promise<Chapter[]> {
  const path = `publishedNovels/${novelId}/chapters`;
  try {
    const q = query(collection(db, 'publishedNovels', novelId, 'chapters'), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const chapters: Chapter[] = [];
    querySnapshot.forEach((doc) => {
      chapters.push(doc.data() as Chapter);
    });
    return chapters;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export function subscribeToPublishedNovels(onUpdate: (novels: PublishedNovel[]) => void) {
  const path = 'publishedNovels';
  try {
    const q = query(collection(db, 'publishedNovels'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const novels: PublishedNovel[] = [];
      snapshot.forEach((doc) => {
        novels.push(doc.data() as PublishedNovel);
      });
      onUpdate(novels);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function syncUserProfile(firebaseUser: any) {
  if (!firebaseUser) return null;
  const path = `users/${firebaseUser.uid}`;
  const isAdminEmail = ['hogiakhiem9@gmail.com', 'taigamehanquoc9@gmail.com'].includes(firebaseUser.email || '');
  
  // Construct a safe, compliant fallback profile to ensure offline resilience
  const fallbackProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Kẻ Chuyển Sinh',
    photoURL: firebaseUser.photoURL || '',
    role: isAdminEmail ? 'admin' : 'member',
    banInfo: { isBanned: false, reason: '', bannedUntil: 0 },
    kimNgoc: 500, // Welcome gift of 500 Kim Ngọc
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, fallbackProfile);
      return fallbackProfile;
    } else {
      const existingData = userSnap.data();
      let needsUpdating = false;
      const updateData: any = {};
      
      if (isAdminEmail && existingData.role !== 'admin') {
        updateData.role = 'admin';
        existingData.role = 'admin';
        needsUpdating = true;
      }
      
      if (existingData.kimNgoc === undefined) {
        updateData.kimNgoc = 500;
        existingData.kimNgoc = 500;
        needsUpdating = true;
      }
      
      if (needsUpdating) {
        updateData.updatedAt = Date.now();
        await setDoc(userRef, updateData, { merge: true });
      }
      
      return {
        ...existingData,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || existingData.displayName || 'Kẻ Chuyển Sinh',
        photoURL: firebaseUser.photoURL || existingData.photoURL || '',
      };
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('offline') || errMsg.includes('Failed to get document')) {
      console.warn("Firestore syncUserProfile running in offline mode. Falling back to local auth profile data:", errMsg);
      return fallbackProfile;
    }
    // Otherwise log normally but still return fallback to guarantee app resilience
    console.warn("Firestore syncUserProfile failed. Falling back to safe offline profile:", err);
    return fallbackProfile;
  }
}

/**
 * Updates a user's Kim Ngọc balance directly in Firestore.
 */
export async function updateUserKimNgoc(userId: string, changeAmount: number, currentKimNgoc: number = 0) {
  const userRef = doc(db, 'users', userId);
  const newKimNgoc = Math.max(0, currentKimNgoc + changeAmount);
  try {
    await setDoc(userRef, {
      kimNgoc: newKimNgoc,
      updatedAt: Date.now()
    }, { merge: true });
    return newKimNgoc;
  } catch (err) {
    console.error("Failed to update user's Kim Ngọc balance:", err);
    throw err;
  }
}
