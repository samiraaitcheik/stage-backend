import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import * as companyService from "../services/companyService.js";

/**
 * Créer un nouvel utilisateur super admin
 */
export const createSuperAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = await prisma.user.create({
      data: {
        firstName, lastName, fullName: `${firstName} ${lastName}`,
        email, phone, passwordHash,
        role: "SUPER_ADMIN", isSuperAdmin: true, status: "ACTIVE",
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, isSuperAdmin: true },
    });

    res.status(201).json({ message: "Super admin created successfully", user: superAdmin });
  } catch (error) {
    console.error("Create super admin error:", error);
    res.status(500).json({ error: "Failed to create super admin" });
  }
};

/**
 * Créer une nouvelle entreprise
 * CORRIGÉ: tous les champs du schema Prisma sont pris en compte
 */
export const createCompany = async (req, res) => {
  try {
    if (!(req.user?.isSuperAdmin || req.user?.role === "SUPER_ADMIN")) {
      return res.status(403).json({ error: "Only super admins can create companies" });
    }

    const {
      name, legalName, taxIdentifier, rcNumber, iceNumber, cnssNumber,
      email, phone, address, city, country, timezone, currency,
      medicalSector, status,
    } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Le nom de l'entreprise est obligatoire." });
    }

    const company = await companyService.createCompany({
      name, legalName, taxIdentifier, rcNumber, iceNumber, cnssNumber,
      email, phone, address, city, country, timezone, currency,
      medicalSector, status,
    });

    res.status(201).json({ message: "Company created successfully", company });
  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
};

/**
 * Créer un admin pour une entreprise
 */
export const createCompanyAdmin = async (req, res) => {
  try {
    if (!(req.user?.isSuperAdmin || req.user?.role === "SUPER_ADMIN")) {
      return res.status(403).json({ error: "Only super admins can create company admins" });
    }

    const { companyId, firstName, lastName, email, password, phone } = req.body;

    if (!companyId || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        companyId, firstName, lastName,
        fullName: `${firstName} ${lastName}`,
        email, phone, passwordHash,
        role: "ADMIN", status: "ACTIVE",
        permissions: [
          "dashboard", "employees", "organisation", "attendance",
          "contracts", "payroll", "reports", "users",
        ],
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, status: true,
        company: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: "Company admin created successfully", user: admin });
  } catch (error) {
    console.error("Create company admin error:", error);
    res.status(500).json({ error: "Failed to create company admin" });
  }
};

/**
 * Créer / mettre à jour une licence pour une entreprise
 * CORRIGÉ: tous les champs du schema License sont inclus + upsert logic
 */
export const createLicense = async (req, res) => {
  try {
    if (!(req.user?.isSuperAdmin || req.user?.role === "SUPER_ADMIN")) {
      return res.status(403).json({ error: "Only super admins can manage licenses" });
    }

    const {
      companyId, planCode, billingCycle, status,
      maxUsers, maxEmployees, maxStorageMb,
      startsAt, endsAt,
      payrollEnabled, rhEnabled, cnssEnabled, taxEnabled, damancomEnabled,
      notes,
    } = req.body;

    if (!companyId || !planCode || !startsAt) {
      return res.status(400).json({ error: "companyId, planCode et startsAt sont obligatoires." });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const licenseData = {
      planCode,
      billingCycle:    billingCycle    || "MONTHLY",
      status:          status          || "ACTIVE",
      maxUsers:        maxUsers        ? Number(maxUsers)        : null,
      maxEmployees:    maxEmployees    ? Number(maxEmployees)    : null,
      maxStorageMb:    maxStorageMb    ? Number(maxStorageMb)    : null,
      startsAt:        new Date(startsAt),
      endsAt:          endsAt && endsAt !== "" ? new Date(endsAt) : null,
      payrollEnabled:  payrollEnabled  !== false  && payrollEnabled  !== "false",
      rhEnabled:       rhEnabled       !== false  && rhEnabled       !== "false",
      cnssEnabled:     cnssEnabled     === true   || cnssEnabled     === "true",
      taxEnabled:      taxEnabled      === true   || taxEnabled      === "true",
      damancomEnabled: damancomEnabled === true   || damancomEnabled === "true",
      notes:           notes           || null,
    };

    const existing = await prisma.license.findUnique({ where: { companyId } });

    if (existing) {
      const updated = await prisma.license.update({
        where: { companyId },
        data: licenseData,
        include: { company: { select: { id: true, name: true } } },
      });
      return res.status(200).json({ message: "License updated successfully", license: updated });
    }

    const license = await prisma.license.create({
      data: { companyId, ...licenseData },
      include: { company: { select: { id: true, name: true } } },
    });

    res.status(201).json({ message: "License created successfully", license });
  } catch (error) {
    console.error("Create license error:", error);
    res.status(500).json({ error: "Failed to manage license" });
  }
};

/**
 * Obtenir toutes les entreprises avec stats
 */
export const getAllCompanies = async (req, res) => {
  try {
    if (!(req.user?.isSuperAdmin || req.user?.role === "SUPER_ADMIN")) {
      return res.status(403).json({ error: "Only super admins can view all companies" });
    }

    const companies = await prisma.company.findMany({
      select: {
        id: true, name: true, legalName: true, taxIdentifier: true,
        rcNumber: true, iceNumber: true, cnssNumber: true,
        email: true, phone: true, address: true, city: true,
        country: true, timezone: true, currency: true,
        medicalSector: true, status: true, createdAt: true,
        license: {
          select: {
            id: true, planCode: true, status: true, billingCycle: true,
            startsAt: true, endsAt: true, maxUsers: true, maxEmployees: true,
          },
        },
        _count: { select: { users: true, employees: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ total: companies.length, companies });
  } catch (error) {
    console.error("Get all companies error:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

/**
 * Obtenir les utilisateurs d'une entreprise spécifique
 * NOUVEAU: GET /super-admin/companies/:companyId/users
 */
export const getCompanyUsers = async (req, res) => {
  try {
    if (!(req.user?.isSuperAdmin || req.user?.role === "SUPER_ADMIN")) {
      return res.status(403).json({ error: "Only super admins can view company users" });
    }

    const { companyId } = req.params;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const users = await prisma.user.findMany({
      where: { companyId, isSuperAdmin: false },
      select: {
        id: true, firstName: true, lastName: true, fullName: true,
        email: true, phone: true, role: true, permissions: true,
        status: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ company: { id: company.id, name: company.name }, total: users.length, users });
  } catch (error) {
    console.error("Get company users error:", error);
    res.status(500).json({ error: "Failed to fetch company users" });
  }
};

/**
 * Stats globales du super admin
 * NOUVEAU: GET /super-admin/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    if (!(req.user?.isSuperAdmin || req.user?.role === "SUPER_ADMIN")) {
      return res.status(403).json({ error: "Access denied" });
    }

    const now = new Date();

    const [
      totalCompanies, activeCompanies,
      totalUsers,
      totalLicenses, activeLicenses, trialLicenses, expiredLicenses,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { isSuperAdmin: false } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: "ACTIVE" } }),
      prisma.license.count({ where: { status: "TRIAL" } }),
      prisma.license.count({ where: { OR: [{ status: "EXPIRED" }, { endsAt: { lt: now } }] } }),
    ]);

    res.json({
      companies: { total: totalCompanies, active: activeCompanies, inactive: totalCompanies - activeCompanies },
      users:     { total: totalUsers },
      licenses:  { total: totalLicenses, active: activeLicenses, trial: trialLicenses, expired: expiredLicenses },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

/**
 * Créer une entreprise avec licence et utilisateurs en une seule opération
 * NOUVEAU: POST /super-admin/companies-with-license-and-users
 */
export const createCompanyWithLicenseAndUsers = async (req, res) => {
  try {
    if (!(req.user?.isSuperAdmin || req.user?.role === "SUPER_ADMIN")) {
      return res.status(403).json({ error: "Only super admins can create companies" });
    }

    const { company, license, users } = req.body;

    // Validation des données requises
    if (!company || !company.name || company.name.trim() === "") {
      return res.status(400).json({ error: "Les données de l'entreprise sont obligatoires (nom requis)" });
    }
    if (!license || !license.planCode || !license.startsAt) {
      return res.status(400).json({ error: "Les données de la licence sont obligatoires (planCode et startsAt requis)" });
    }
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Au moins un utilisateur doit être fourni" });
    }

    // Validation des utilisateurs
    for (const user of users) {
      if (!user.firstName || !user.lastName || !user.email || !user.password) {
        return res.status(400).json({ error: "Chaque utilisateur doit avoir firstName, lastName, email et password" });
      }
    }

    const result = await companyService.createCompanyWithLicenseAndUsers(req.body);

    res.status(201).json({
      message: "Entreprise, licence et utilisateurs créés avec succès",
      data: result
    });
  } catch (error) {
    console.error("Create company with license and users error:", error);
    res.status(500).json({ error: "Échec de la création de l'entreprise avec licence et utilisateurs" });
  }
};