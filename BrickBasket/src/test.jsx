import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { app } from './firebase';
import { useState } from 'react';

export default function TestFirestore() {
  const [status, setStatus] = useState('Click to test');

  const testFirestore = async () => {
    console.log('Starting Firestore test...');
    
    try {
      // Get Firestore instance
      const db = getFirestore(app);
      console.log('Firestore instance created');

      // Create a reference to a document
      const testDocRef = doc(collection(db, 'tests'), 'testDocument');
      
      // Test data
      const testData = {
        message: 'Hello from Brick Basket Firestore!',
        timestamp: new Date().toISOString(),
        randomNumber: Math.random(),
        project: 'Brick Basket'
      };

      // Write to Firestore
      await setDoc(testDocRef, testData);
      
      setStatus('✅ SUCCESS! Data written to Firestore');
      console.log('Data written successfully:', testData);

    } catch (error) {
      setStatus('❌ ERROR: ' + error.message);
      console.error('Error details:', error);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', margin: '20px' }}>
      <h3>Firestore Test</h3>
      <button onClick={testFirestore} style={{ padding: '10px', margin: '10px' }}>
        Test Firestore Connection
      </button>
      <p>Status: {status}</p>
    </div>
  );
}