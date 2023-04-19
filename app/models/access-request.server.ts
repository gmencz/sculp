import type { AccessRequest } from "@prisma/client";
import { prisma } from "~/db.server";

export async function createAccessRequest(
  email: AccessRequest["email"],
  currentLogbook: AccessRequest["currentLogbook"]
) {
  return prisma.accessRequest.create({
    data: {
      email,
      currentLogbook,
    },
  });
}
