import { prisma } from "../prismaClient.js";

const includeRelations = {
  company: { select: { id: true, name: true } },
};

const sanitize = (data) => ({
  ...data,
  startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
  endsAt: data.endsAt && data.endsAt !== "" ? new Date(data.endsAt) : undefined,
  maxUsers: data.maxUsers ? Number(data.maxUsers) : undefined,
  maxEmployees: data.maxEmployees ? Number(data.maxEmployees) : undefined,
  maxStorageMb: data.maxStorageMb ? Number(data.maxStorageMb) : undefined,
});

export const createLicense = async (data) => {
  return prisma.license.create({
    data: sanitize(data),
    include: includeRelations,
  });
};

export const getLicenses = async (companyId) => {
  return prisma.license.findMany({
    where: companyId ? { companyId } : {},
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });
};

export const getLicenseById = async (id, companyId) => {
  const license = await prisma.license.findFirst({
    where: companyId ? { id, companyId } : { id },
    include: includeRelations,
  });
  if (!license) {
    throw { status: 404, message: "License not found" };
  }
  return license;
};

export const getLicenseByCompany = async (companyId) => {
  let license = await prisma.license.findUnique({
    where: { companyId },
    include: includeRelations,
  });
  if (!license) {
    throw { status: 404, message: "License not found for this company" };
  }

  const now = new Date();
  if (license.endsAt && license.endsAt < now && license.status !== "EXPIRED") {
    license = await prisma.license.update({
      where: { id: license.id },
      data: { status: "EXPIRED" },
      include: includeRelations,
    });

    await prisma.user.updateMany({
      where: { companyId, isSuperAdmin: false },
      data: { status: "BLOCKED" },
    });
  }

  return license;
};

export const getActiveLicenseByCompany = async (companyId) => {
  let license = await prisma.license.findUnique({
    where: { companyId },
    select: {
      id: true,
      status: true,
      endsAt: true,
      maxUsers: true,
      maxEmployees: true,
    },
  });
  if (!license) {
    throw { status: 403, message: "Company has no valid license" };
  }

  const now = new Date();
  const isExpired = license.endsAt && license.endsAt < now;

  if (isExpired && license.status !== "EXPIRED") {
    license = await prisma.license.update({
      where: { id: license.id },
      data: { status: "EXPIRED" },
      select: {
        id: true,
        status: true,
        endsAt: true,
        maxUsers: true,
        maxEmployees: true,
      },
    });

    await prisma.user.updateMany({
      where: { companyId, isSuperAdmin: false },
      data: { status: "BLOCKED" },
    });
  }

  const isInvalidStatus = !["ACTIVE", "TRIAL"].includes(license.status);
  if (isExpired || isInvalidStatus) {
    throw {
      status: 403,
      message: "License is expired or inactive. Access to the application has been blocked.",
    };
  }

  return license;
};

const countCompanyUsers = async (companyId) =>
  prisma.user.count({ where: { companyId, isSuperAdmin: false } });

const countCompanyEmployees = async (companyId) =>
  prisma.employee.count({ where: { companyId } });

export const enforceLicenseLimit = async (companyId, type) => {
  const license = await getActiveLicenseByCompany(companyId);

  if (type === "users" && typeof license.maxUsers === "number") {
    const currentUsers = await countCompanyUsers(companyId);
    if (currentUsers >= license.maxUsers) {
      throw {
        status: 403,
        message: `La limite de ${license.maxUsers} utilisateurs a ete atteinte pour cette licence.`,
      };
    }
  }

  if (type === "employees" && typeof license.maxEmployees === "number") {
    const currentEmployees = await countCompanyEmployees(companyId);
    if (currentEmployees >= license.maxEmployees) {
      throw {
        status: 403,
        message: `La limite de ${license.maxEmployees} employes a ete atteinte pour cette licence.`,
      };
    }
  }

  return true;
};

export const updateLicense = async (id, data) => {
  await getLicenseById(id);
  return prisma.license.update({
    where: { id },
    data: sanitize(data),
    include: includeRelations,
  });
};

export const deleteLicense = async (id) => {
  await getLicenseById(id);
  await prisma.license.delete({ where: { id } });
};
