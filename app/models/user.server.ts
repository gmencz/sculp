import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import type Stripe from "stripe";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id }, select: { id: true } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(email: User["email"], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function sendPasswordResetEmail(email: User["email"]) {
  // TODO
  return true;
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
      subscription: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function getUserDetails(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
    },
  });
}

export async function deleteUser(userId: string) {
  return prisma.user.delete({ where: { id: userId }, select: { id: true } });
}

export async function getUserByCustomerId(customerId: string) {
  return prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: {
      id: true,
      subscription: {
        select: {
          status: true,
        },
      },
    },
  });
}
