import * as companyService from "../services/companyService.js";
import {
  assertCompanyAccess,
  getCompanyContext,
} from "../middlewares/authenticate.js";

export const createCompany = async (req, res) => {
  try {
    res.status(201).json(await companyService.createCompany(req.body));
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    res.json(await companyService.getCompanies(getCompanyContext(req)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyCompany = async (req, res) => {
  try {
    const company = await companyService.getCompanyById(req.user.companyId, req.user.companyId);
    res.json([company]);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getCompany = async (req, res) => {
  try {
    assertCompanyAccess(req, req.params.id);
    res.json(await companyService.getCompanyById(req.params.id, getCompanyContext(req)));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    assertCompanyAccess(req, req.params.id);
    res.json(await companyService.updateCompany(req.params.id, req.body, getCompanyContext(req)));
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    await companyService.deleteCompany(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};
