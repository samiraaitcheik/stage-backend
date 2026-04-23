import { prisma } from "../prismaClient.js";

const includeRelations = {
  company: { select: { id: true, name: true } },
  user: { select: { id: true, firstName: true, lastName: true } },
};

export const createLog = async (data) => {
  return prisma.auditLog.create({ data, include: includeRelations });
};

export const getLogs = async (companyId) => {
  return prisma.auditLog.findMany({
    where: companyId ? { companyId } : {},
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });
};

export const getLogById = async (id, companyId) => {
  const log = await prisma.auditLog.findFirst({
    where: companyId ? { id, companyId } : { id },
    include: includeRelations,
  });
  if (!log) {
    throw { status: 404, message: "Audit log not found" };
  }
  return log;
};

export const getLogsByCompany = async (companyId) => {
  return prisma.auditLog.findMany({
    where: { companyId },
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });
};

export const deleteLog = async (id, companyId) => {
  await getLogById(id, companyId);
  await prisma.auditLog.delete({ where: { id } });
};
