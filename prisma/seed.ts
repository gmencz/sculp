import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "admin@sculpapp.com";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("hypertrophyiscool", 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Chest",
      exercises: {
        create: [
          { userId: user.id, name: "Decline Chest Press Machine" },
          { userId: user.id, name: "Incline Chest Press Machine" },
          { userId: user.id, name: "Chest Fly Machine" },
          { userId: user.id, name: "Cable Fly" },
        ],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Shoulders",
      exercises: {
        create: [
          { userId: user.id, name: "Shoulder Press Machine" },
          { userId: user.id, name: "Smith Machine Shoulder Press" },
          { userId: user.id, name: "Lateral Raise Machine" },
          { userId: user.id, name: "Cable Lateral Raise" },
        ],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Triceps",
      exercises: {
        create: [
          { userId: user.id, name: "Cable Triceps Pushdown" },
          { userId: user.id, name: "Cable Triceps Overhead Extension" },
          { userId: user.id, name: "Reverse Fly Machine" },
        ],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Back",
      exercises: {
        create: [
          { userId: user.id, name: "Lat Pulldown" },
          { userId: user.id, name: "Seated Cable Row" },
          { userId: user.id, name: "T Bar Row" },
        ],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Biceps",
      exercises: {
        create: [
          { userId: user.id, name: "Cable Curl" },
          { userId: user.id, name: "Dumbbell Hammer Curl" },
        ],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Quads",
      exercises: {
        create: [
          { userId: user.id, name: "Leg Extensions" },
          { userId: user.id, name: "Hack Squat" },
        ],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Calves",
      exercises: {
        create: [{ userId: user.id, name: "Calf Raise" }],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Hamstrings",
      exercises: {
        create: [{ userId: user.id, name: "SLDL" }],
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Glutes",
      exercises: {
        create: [{ userId: user.id, name: "Hip Thrust" }],
      },
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
