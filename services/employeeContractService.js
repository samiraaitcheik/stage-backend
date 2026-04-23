import { prisma } from "../prismaClient.js";

const includeRelations = {
  employee: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
};

const parseDates = (data) => ({
  ...data,
  startDate: data.startDate ? new Date(data.startDate) : undefined,
  endDate: data.endDate ? new Date(data.endDate) : undefined,
});

export const createContract = async (data) => {
  return prisma.employeeContract.create({
    data: parseDates(data),
    include: includeRelations,
  });
};

export const getContracts = async (companyId) => {
  return prisma.employeeContract.findMany({
    where: companyId ? { companyId } : {},
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });
};

export const getContractById = async (id, companyId) => {
  const contract = await prisma.employeeContract.findFirst({
    where: companyId ? { id, companyId } : { id },
    include: includeRelations,
  });
  if (!contract) {
    throw { status: 404, message: "Contract not found" };
  }
  return contract;
};

export const getContractsByEmployee = async (employeeId, companyId) => {
  return prisma.employeeContract.findMany({
    where: companyId ? { employeeId, companyId } : { employeeId },
    include: includeRelations,
    orderBy: { startDate: "desc" },
  });
};

export const updateContract = async (id, data, companyId) => {
  await getContractById(id, companyId);
  return prisma.employeeContract.update({
    where: { id },
    data: parseDates(data),
    include: includeRelations,
  });
};

export const deleteContract = async (id, companyId) => {
  await getContractById(id, companyId);
  await prisma.employeeContract.delete({ where: { id } });
};
