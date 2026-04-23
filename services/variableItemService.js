import { prisma } from "../prismaClient.js";

const includeRelations = {
  employee: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

const parseDates = (data) => ({
  ...data,
  effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
});

export const createVariableItem = async (data) => {
  return prisma.variableItem.create({
    data: parseDates(data),
    include: includeRelations,
  });
};

export const getVariableItems = async (companyId) => {
  return prisma.variableItem.findMany({
    where: companyId ? { companyId } : {},
    include: includeRelations,
    orderBy: { effectiveDate: "desc" },
  });
};

export const getVariableItemById = async (id, companyId) => {
  const item = await prisma.variableItem.findFirst({
    where: companyId ? { id, companyId } : { id },
    include: includeRelations,
  });
  if (!item) {
    throw { status: 404, message: "Variable item not found" };
  }
  return item;
};

export const getVariableItemsByEmployee = async (employeeId, companyId) => {
  return prisma.variableItem.findMany({
    where: companyId ? { employeeId, companyId } : { employeeId },
    include: includeRelations,
    orderBy: { effectiveDate: "desc" },
  });
};

export const updateVariableItem = async (id, data, companyId) => {
  await getVariableItemById(id, companyId);
  return prisma.variableItem.update({
    where: { id },
    data: parseDates(data),
    include: includeRelations,
  });
};

export const deleteVariableItem = async (id, companyId) => {
  await getVariableItemById(id, companyId);
  await prisma.variableItem.delete({ where: { id } });
};
