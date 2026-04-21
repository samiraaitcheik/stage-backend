import * as contractService from "../services/employeeContractService.js";
import * as pdfService from "../services/contractPdfService.js";

const resolveCompanyId = (req) => {
  if (req.user.isSuperAdmin || req.user.role === 'SUPER_ADMIN') {
    if (!req.body?.companyId) {
      throw { status: 400, message: 'Le super admin doit sélectionner une entreprise.' };
    }
    return req.body.companyId;
  }
  return req.user.companyId;
};

export const createContract = async (req, res) => {
  try {
    res.status(201).json(await contractService.createContract({ ...req.body, companyId: resolveCompanyId(req) }));
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};
const getCompanyContext = (req) =>
  req.user.isSuperAdmin || req.user.role === 'SUPER_ADMIN'
    ? undefined
    : req.user.companyId;

export const getContracts = async (req, res) => {
  try { res.json(await contractService.getContracts(getCompanyContext(req))); }
  catch (error) { res.status(500).json({ error: error.message }); }
};
export const getContract = async (req, res) => {
  try { res.json(await contractService.getContractById(req.params.id, getCompanyContext(req))); }
  catch (error) { res.status(error.status || 500).json({ error: error.message }); }
};
export const getContractsByEmployee = async (req, res) => {
  try { res.json(await contractService.getContractsByEmployee(req.params.employeeId, getCompanyContext(req))); }
  catch (error) { res.status(500).json({ error: error.message }); }
};
export const updateContract = async (req, res) => {
  try { res.json(await contractService.updateContract(req.params.id, req.body, getCompanyContext(req))); }
  catch (error) { res.status(error.status || 400).json({ error: error.message }); }
};
export const deleteContract = async (req, res) => {
  try { await contractService.deleteContract(req.params.id, getCompanyContext(req)); res.json({ message: "Deleted" }); }
  catch (error) { res.status(error.status || 400).json({ error: error.message }); }
};

/**
 * Generate contract PDF
 * POST /contracts/:id/generate-pdf
 */
export const generateContractPdf = async (req, res) => {
  try {
    const contract = await contractService.getContractById(req.params.id, getCompanyContext(req));
    const pdf = await pdfService.generateContractPdf(req.params.id);
    res.json({
      message: 'Contract PDF generated successfully',
      filename: pdf.filename,
      path: pdf.relativePath,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Download contract PDF
 * GET /contracts/pdf/:filename
 */
export const downloadContractPdf = async (req, res) => {
  try {
    const filepath = await pdfService.getContractPdf(req.params.filename);
    res.download(filepath, req.params.filename);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};