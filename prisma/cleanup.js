const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up all test data (Patients, Doctors, Appointments, Prescriptions, Reports, Messages, etc)...')

  await prisma.inAppNotification.deleteMany()
  await prisma.appointmentMessage.deleteMany()
  await prisma.prescriptionItem.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.medicalReport.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.doctorSchedule.deleteMany()
  await prisma.doctorProfile.deleteMany()

  const result = await prisma.user.deleteMany({
    where: {
      role: {
        not: 'ADMIN'
      }
    }
  })
  console.log(`Cleanup complete! Deleted ${result.count} users and all associated records.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
