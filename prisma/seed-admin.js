const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@doctorify.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@doctorify.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('Admin user seeded successfully! (admin@doctorify.com / password123)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
