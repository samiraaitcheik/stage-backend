import { verifyToken } from "../services/authService.js";
import { prisma } from "../lib/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token manquant. Veuillez vous connecter." });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        permissions: true,
        status: true,
        company: { select: { id: true, name: true, status: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable." });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: `Compte ${user.status.toLowerCase()}.` });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(error.status || 401).json({ error: error.message });
  }
};

export const isSuperAdminUser = (user) =>
  Boolean(user?.isSuperAdmin || user?.role === "SUPER_ADMIN");

export const getCompanyContext = (req) =>
  isSuperAdminUser(req.user) ? undefined : req.user?.companyId;

export const resolveCompanyIdForWrite = (req, companyId = req.body?.companyId) => {
  if (isSuperAdminUser(req.user)) {
    if (!companyId) {
      throw { status: 400, message: "Le super admin doit selectionner une entreprise." };
    }
    return companyId;
  }

  if (!req.user?.companyId) {
    throw { status: 400, message: "Utilisateur sans entreprise associee." };
  }

  return req.user.companyId;
};

export const assertCompanyAccess = (req, companyId) => {
  if (companyId && !isSuperAdminUser(req.user) && req.user.companyId !== companyId) {
    throw { status: 403, message: "Acces refuse a cette entreprise." };
  }
  return companyId;
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifie." });
  }
  if (req.user.role !== "ADMIN" && !isSuperAdminUser(req.user)) {
    return res.status(403).json({ error: "Acces refuse. Role ADMIN requis." });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifie." });
  }
  if (!isSuperAdminUser(req.user)) {
    return res.status(403).json({ error: "Acces refuse. Role SUPER_ADMIN requis." });
  }
  next();
};

export const requireSameCompany = (companyIdExtractor) => (req, res, next) => {
  try {
    const companyId = typeof companyIdExtractor === "function"
      ? companyIdExtractor(req)
      : req.params.companyId || req.body.companyId;

    assertCompanyAccess(req, companyId);
    next();
  } catch (error) {
    res.status(error.status || 403).json({ error: error.message });
  }
};

export const blockAdminsFromLicenses = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifie." });
  }
  if (isSuperAdminUser(req.user) || req.user.role === "ADMIN") {
    return res.status(403).json({ error: "Acces refuse. Les admins ne peuvent pas gerer les licenses." });
  }
  next();
};
