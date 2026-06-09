const admin = require('firebase-admin');

// Initialize Firebase Admin
// Assuming you have the GOOGLE_APPLICATION_CREDENTIALS environment variable set
// or you are running this in an environment with default credentials.
// Alternatively, provide a service account key path here.
admin.initializeApp({
  // credential: admin.credential.cert(require('./service-account.json'))
});

const db = admin.firestore();

const mockBookings = [
  { id: 'B1', brand: 'MYVI', amount: 25000, date: '10 mins ago', status: 'Paid', phone: '+20 100 123 4567' },
  { id: 'L12', brand: 'Sweet Treats', amount: 4000, date: '1 hr ago', status: 'Pending Approval', phone: '+20 111 987 6543' },
  { id: 'C4', brand: 'Simple', amount: 25000, date: '3 hrs ago', status: 'Paid', phone: '+20 122 456 7890' },
  { id: 'A2', brand: 'Capixy', amount: 18000, date: '5 hrs ago', status: 'Paid', phone: '+20 155 333 2222' },
  { id: 'R8', brand: 'Handmade Co', amount: 4000, date: 'Yesterday', status: 'Paid', phone: '+20 100 999 8888' },
];

async function migrateData() {
  try {
    const eventId = 'summer-breeze-2024';
    const eventRef = db.collection('Events').doc(eventId);
    
    // Create the event document
    await eventRef.set({
      name: 'Eid with Summer Breeze',
      date: '2024',
      totalRevenue: 1485000,
      boothsSold: 237,
      totalBooths: 264,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Event ${eventId} created/updated.`);

    // Add bookings as a subcollection
    const bookingsRef = eventRef.collection('Bookings');
    
    const batch = db.batch();
    for (const booking of mockBookings) {
      const docRef = bookingsRef.doc(booking.id);
      batch.set(docRef, {
        brand: booking.brand,
        amount: booking.amount,
        dateString: booking.date,
        status: booking.status,
        phone: booking.phone,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.log('Successfully migrated mock bookings to Firestore.');
  } catch (error) {
    console.error('Error migrating data:', error);
  }
}

migrateData();
