import * as auditLogService from "../services/auditLogService.js";
import {
  assertCompanyAccess,
  getCompanyContext,
  resolveCompanyIdForWrite,
} from "../middlewares/authenticate.js";

export const createLog = async (req, res) => {
  try {
    res.status(201).json(await auditLogService.createLog({
      ...req.body,
      companyId: resolveCompanyIdForWrite(req, req.body?.companyId || req.user?.companyId),
    }));
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    res.json(await auditLogService.getLogs(getCompanyContext(req)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLog = async (req, res) => {
  try {
    res.json(await auditLogService.getLogById(req.params.id, getCompanyContext(req)));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getLogsByCompany = async (req, res) => {
  try {
    assertCompanyAccess(req, req.params.companyId);
    res.json(await auditLogService.getLogsByCompany(req.params.companyId));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const deleteLog = async (req, res) => {
  try {
    await auditLogService.deleteLog(req.params.id, getCompanyContext(req));
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};
