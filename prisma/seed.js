const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up existing data
  await prisma.appointment.deleteMany()
  await prisma.doctorProfile.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Admin
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@doctorify.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  // 2. Create Doctors
  const doctor1 = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'sarah@doctorify.com',
      password: passwordHash,
      role: 'DOCTOR',
      image: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random',
      doctorProfile: {
        create: {
          specialty: 'Cardiologist',
          bio: 'Dr. Jenkins has over 15 years of experience in diagnosing and treating heart conditions. She believes in a patient-first approach to cardiovascular health.',
          experience: 15,
          consultationFee: 150.0,
          clinicAddress: '123 Heart Center Bldg, Medical District',
        }
      }
    },
  })

  const doctor2 = await prisma.user.create({
    data: {
      name: 'Dr. Michael Chen',
      email: 'michael@doctorify.com',
      password: passwordHash,
      role: 'DOCTOR',
      image: 'https://ui-avatars.com/api/?name=Michael+Chen&background=random',
      doctorProfile: {
        create: {
          specialty: 'Dermatologist',
          bio: 'Dr. Chen specializes in medical and cosmetic dermatology. He is passionate about helping patients achieve healthy, radiant skin.',
          experience: 8,
          consultationFee: 120.0,
          clinicAddress: 'Skin & Laser Clinic, Downtown',
        }
      }
    },
  })

  // 3. Create Patients
  const patient1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: passwordHash,
      role: 'PATIENT',
      image: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
    },
  })

  const patient2 = await prisma.user.create({
    data: {
      name: 'Emily Davis',
      email: 'emily@example.com',
      password: passwordHash,
      role: 'PATIENT',
      image: 'https://ui-avatars.com/api/?name=Emily+Davis&background=random',
    },
  })

  // 4. Create Appointments
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      date: tomorrow,
      time: '10:00',
      status: 'CONFIRMED',
      reason: 'Routine checkup',
    }
  })

  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor2.id,
      date: tomorrow,
      time: '14:30',
      status: 'PENDING',
      reason: 'Skin rash consultation',
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
