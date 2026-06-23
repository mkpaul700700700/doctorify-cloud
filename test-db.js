const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const s = await prisma.doctorSchedule.findMany()
  console.log(s)
}
main()
