import { prisma } from "../prismaClient.js";

const includeRelations = {
  company: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
};

export const createPosition = async (data) => {
  return prisma.position.create({ data, include: includeRelations });
};

export const getPositions = async (companyId) => {
  return prisma.position.findMany({
    where: companyId ? { companyId } : {},
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });
};

export const getPositionById = async (id, companyId) => {
  const position = await prisma.position.findFirst({
    where: companyId ? { id, companyId } : { id },
    include: includeRelations,
  });
  if (!position) {
    throw { status: 404, message: "Position not found" };
  }
  return position;
};

export const updatePosition = async (id, data, companyId) => {
  await getPositionById(id, companyId);
  return prisma.position.update({ where: { id }, data, include: includeRelations });
};

export const deletePosition = async (id, companyId) => {
  await getPositionById(id, companyId);
  await prisma.position.delete({ where: { id } });
};
