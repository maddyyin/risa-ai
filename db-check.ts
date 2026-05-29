import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users);
  
  const habits = await prisma.habit.findMany({
    include: { completions: true }
  });
  console.log('Habits in DB:', habits.map(h => ({ id: h.id, name: h.name, category: h.category, completionsCount: h.completions.length })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
