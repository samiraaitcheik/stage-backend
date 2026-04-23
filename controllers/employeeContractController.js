import * as contractService from "../services/employeeContractService.js";
import * as pdfService from "../services/contractPdfService.js";
import {
  getCompanyContext,
  resolveCompanyIdForWrite,
} from "../middlewares/authenticate.js";

export const createContract = async (req, res) => {
  try {
    res.status(201).json(await contractService.createContract({
      ...req.body,
      companyId: resolveCompanyIdForWrite(req),
    }));
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const getContracts = async (req, res) => {
  try {
    res.json(await contractService.getContracts(getCompanyContext(req)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getContract = async (req, res) => {
  try {
    res.json(await contractService.getContractById(req.params.id, getCompanyContext(req)));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getContractsByEmployee = async (req, res) => {
  try {
    res.json(await contractService.getContractsByEmployee(req.params.employeeId, getCompanyContext(req)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateContract = async (req, res) => {
  try {
    res.json(await contractService.updateContract(req.params.id, req.body, getCompanyContext(req)));
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const deleteContract = async (req, res) => {
  try {
    await contractService.deleteContract(req.params.id, getCompanyContext(req));
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const generateContractPdf = async (req, res) => {
  try {
    await contractService.getContractById(req.params.id, getCompanyContext(req));
    const pdf = await pdfService.generateContractPdf(req.params.id);
    res.json({
      message: "Contract PDF generated successfully",
      filename: pdf.filename,
      path: pdf.relativePath,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const downloadContractPdf = async (req, res) => {
  try {
    const filepath = await pdfService.getContractPdf(req.params.filename);
    res.download(filepath, req.params.filename);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
