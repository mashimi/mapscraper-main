import 'dotenv/config';
// @ts-ignore
import admin from 'firebase-admin';
import { Lead } from '../models/scrape-job.model';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'newproject-fa93d';

const adminAny: any = admin;
let db: any = null;
let initialized = false;

try {
  if (!adminAny.apps || !adminAny.apps.length) {
    adminAny.initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
  }
  db = adminAny.firestore();
  initialized = true;
  console.log('[FirebaseService] Connected to Firestore');
} catch (error) {
  console.error('[FirebaseService] Initialization failed:', error);
}

class FirebaseService {
  async saveLeads(jobId: string, leads: Lead[]) {
    if (leads.length === 0 || !initialized || !db) return;

    const batch = db.batch();
    const collectionRef = db.collection('leads');

    for (const lead of leads) {
      const docRef = collectionRef.doc();
      batch.set(docRef, {
        jobId,
        name: lead.name,
        rating: lead.rating,
        reviews: lead.reviews,
        phone: lead.phone,
        email: lead.email || null,
        website: lead.website,
        category: lead.category,
        sentiment: lead.sentiment || null,
        createdAt: adminAny.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`[FirebaseService] Saved ${leads.length} leads to Firestore (job: ${jobId})`);
  }

  async getLeads(limit: number = 1000, offset: number = 0, search?: string) {
    if (!initialized || !db) return [];

    const query = db
      .collection('leads')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const snapshot = await query.get();
    const results: any[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (!data) return;

      if (search && typeof data.name === 'string' && typeof data.category === 'string' && typeof data.phone === 'string') {
        const searchLower = search.toLowerCase();
        const matches =
          data.name.toLowerCase().includes(searchLower) ||
          data.category.toLowerCase().includes(searchLower) ||
          data.phone.toLowerCase().includes(searchLower);

        if (!matches) return;
      }

      results.push({ id: doc.id, ...data });
    });

    return results.slice(offset, offset + limit);
  }
}

export default new FirebaseService();