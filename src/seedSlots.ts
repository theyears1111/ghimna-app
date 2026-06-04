// ============================================================
// GHIMNA TROTTA 2.0 — seedSlots.ts
// Esegui questa funzione UNA VOLTA per popolare Firestore
// Chiamala da browser console oppure da un componente temporaneo
// ============================================================

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// dayOfWeek: 1=Lun, 2=Mar, 3=Mer, 4=Gio, 5=Ven, 6=Sab

const SLOTS = [
  // ---- SALA ALPHA ----
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 1, startTime: '09:15', endTime: '10:00', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 1, startTime: '15:00', endTime: '15:45', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 1, startTime: '18:00', endTime: '18:45', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'mobility',    courseName: 'Mobility + Addome', dayOfWeek: 1, startTime: '18:45', endTime: '19:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'programmafc', courseName: 'Programma FC',      dayOfWeek: 1, startTime: '19:15', endTime: '20:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'boxe',        courseName: 'Box Training',      dayOfWeek: 1, startTime: '20:30', endTime: '21:30', room: 'Sala Alpha', trainerName: '', maxCapacity: 15 },

  { courseKey: 'bodyflying',  courseName: 'Body Flying',       dayOfWeek: 2, startTime: '09:30', endTime: '10:30', room: 'Sala Alpha', trainerName: '', maxCapacity: 12 },
  { courseKey: 'functional',  courseName: 'Functional Training',dayOfWeek: 2, startTime: '18:15', endTime: '19:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 15 },
  { courseKey: 'pump',        courseName: 'Pump',              dayOfWeek: 2, startTime: '19:30', endTime: '20:30', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking Burn Fit',  dayOfWeek: 2, startTime: '20:20', endTime: '21:10', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },

  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 3, startTime: '09:15', endTime: '10:00', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 3, startTime: '15:00', endTime: '15:45', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 3, startTime: '18:00', endTime: '18:45', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'mobility',    courseName: 'Mobility + Addome', dayOfWeek: 3, startTime: '18:45', endTime: '19:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'programmafc', courseName: 'Programma FC',      dayOfWeek: 3, startTime: '19:15', endTime: '20:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },

  { courseKey: 'boxe',        courseName: 'Box Training',      dayOfWeek: 4, startTime: '18:15', endTime: '19:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 15 },
  { courseKey: 'pump',        courseName: 'Pump',              dayOfWeek: 4, startTime: '19:30', endTime: '20:30', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking Burn Fit',  dayOfWeek: 4, startTime: '20:20', endTime: '21:10', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },

  { courseKey: 'pump',        courseName: 'Pump',              dayOfWeek: 5, startTime: '09:15', endTime: '10:00', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 5, startTime: '18:00', endTime: '18:45', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'programmafc', courseName: 'Programma FC',      dayOfWeek: 5, startTime: '19:15', endTime: '20:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 5, startTime: '20:30', endTime: '21:15', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },

  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 6, startTime: '15:00', endTime: '15:45', room: 'Sala Alpha', trainerName: '', maxCapacity: 20 },

  // ---- POWER ROOM ----
  { courseKey: 'aereo',       courseName: 'Aereo Workout',     dayOfWeek: 2, startTime: '09:00', endTime: '10:00', room: 'Power Room', trainerName: '', maxCapacity: 12 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 1, startTime: '09:30', endTime: '10:15', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 1, startTime: '15:00', endTime: '15:45', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 1, startTime: '18:20', endTime: '19:05', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'programmafc', courseName: 'Programma FC',      dayOfWeek: 1, startTime: '19:20', endTime: '20:20', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'boxe',        courseName: 'Box Training',      dayOfWeek: 1, startTime: '20:30', endTime: '21:30', room: 'Power Room', trainerName: '', maxCapacity: 15 },

  { courseKey: 'aereo',       courseName: 'Aereo Workout',     dayOfWeek: 4, startTime: '09:00', endTime: '10:00', room: 'Power Room', trainerName: '', maxCapacity: 12 },
  { courseKey: 'pump',        courseName: 'Pump',              dayOfWeek: 5, startTime: '09:30', endTime: '10:30', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 3, startTime: '09:30', endTime: '10:15', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'functional',  courseName: 'Functional Training',dayOfWeek: 2, startTime: '18:20', endTime: '19:20', room: 'Power Room', trainerName: '', maxCapacity: 15 },
  { courseKey: 'boxe',        courseName: 'Box Training',      dayOfWeek: 4, startTime: '18:20', endTime: '19:20', room: 'Power Room', trainerName: '', maxCapacity: 15 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 5, startTime: '18:20', endTime: '19:05', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'programmafc', courseName: 'Programma FC',      dayOfWeek: 2, startTime: '19:20', endTime: '20:20', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'pump',        courseName: 'Pump',              dayOfWeek: 2, startTime: '19:20', endTime: '20:20', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'programmafc', courseName: 'Programma FC',      dayOfWeek: 3, startTime: '19:20', endTime: '20:20', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'pump',        courseName: 'Pump',              dayOfWeek: 4, startTime: '19:20', endTime: '20:20', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'programmafc', courseName: 'Programma FC',      dayOfWeek: 5, startTime: '19:20', endTime: '20:20', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 2, startTime: '20:10', endTime: '20:55', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 4, startTime: '20:10', endTime: '20:55', room: 'Power Room', trainerName: '', maxCapacity: 20 },
  { courseKey: 'yoga',        courseName: 'Yoga Aereo',        dayOfWeek: 3, startTime: '20:30', endTime: '21:30', room: 'Power Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'walking',     courseName: 'Walking',           dayOfWeek: 6, startTime: '15:00', endTime: '15:45', room: 'Power Room', trainerName: '', maxCapacity: 20 },

  // ---- FLOW ROOM ----
  { courseKey: 'postural',    courseName: 'Postural Pilates',  dayOfWeek: 1, startTime: '09:30', endTime: '10:20', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 1, startTime: '10:20', endTime: '11:10', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 1, startTime: '11:00', endTime: '11:50', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 1, startTime: '16:15', endTime: '17:05', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 1, startTime: '18:15', endTime: '19:05', room: 'Flow Room', trainerName: '', maxCapacity: 10 },

  { courseKey: 'yoga',        courseName: 'Hatha Yoga',        dayOfWeek: 2, startTime: '19:00', endTime: '20:00', room: 'Flow Room', trainerName: '', maxCapacity: 12 },
  { courseKey: 'autodifesa',  courseName: 'Autodifesa',        dayOfWeek: 2, startTime: '20:15', endTime: '21:15', room: 'Flow Room', trainerName: '', maxCapacity: 15 },

  { courseKey: 'postural',    courseName: 'Postural Pilates',  dayOfWeek: 3, startTime: '09:30', endTime: '10:20', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 3, startTime: '10:20', endTime: '11:10', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 3, startTime: '11:00', endTime: '11:50', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 3, startTime: '16:15', endTime: '17:05', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 3, startTime: '18:15', endTime: '19:05', room: 'Flow Room', trainerName: '', maxCapacity: 10 },

  { courseKey: 'yoga',        courseName: 'Hatha Yoga',        dayOfWeek: 4, startTime: '19:00', endTime: '20:00', room: 'Flow Room', trainerName: '', maxCapacity: 12 },
  { courseKey: 'autodifesa',  courseName: 'Autodifesa',        dayOfWeek: 4, startTime: '20:15', endTime: '21:15', room: 'Flow Room', trainerName: '', maxCapacity: 15 },

  { courseKey: 'postural',    courseName: 'Postural Pilates',  dayOfWeek: 5, startTime: '09:30', endTime: '10:20', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 5, startTime: '10:20', endTime: '11:10', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 5, startTime: '16:15', endTime: '17:05', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
  { courseKey: 'pilates',     courseName: 'Pilates',           dayOfWeek: 5, startTime: '18:15', endTime: '19:05', room: 'Flow Room', trainerName: '', maxCapacity: 10 },
];

export async function seedSlots() {
  console.log(`Inizio popolamento: ${SLOTS.length} slot...`);
  let count = 0;
  for (const slot of SLOTS) {
    await addDoc(collection(db, 'slots'), {
      ...slot,
      currentBookings: 0,
      isActive: true,
      createdAt: serverTimestamp(),
    });
    count++;
    console.log(`✅ ${count}/${SLOTS.length} — ${slot.courseName} ${slot.dayOfWeek} ${slot.startTime}`);
  }
  console.log('🎉 Popolamento completato!');
}
