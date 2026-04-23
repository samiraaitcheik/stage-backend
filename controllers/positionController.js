import * as positionService from "../services/positionService.js";
import {
  getCompanyContext,
  resolveCompanyIdForWrite,
} from "../middlewares/authenticate.js";

export const createPosition = async (req, res) => {
  try {
    const position = await positionService.createPosition({
      ...req.body,
      companyId: resolveCompanyIdForWrite(req),
    });
    res.status(201).json(position);
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const getPositions = async (req, res) => {
  try {
    const positions = await positionService.getPositions(getCompanyContext(req));
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPosition = async (req, res) => {
  try {
    const position = await positionService.getPositionById(String(req.params.id), getCompanyContext(req));
    res.json(position);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const updatePosition = async (req, res) => {
  try {
    const updated = await positionService.updatePosition(
      String(req.params.id),
      req.body,
      getCompanyContext(req),
    );
    res.json(updated);
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

export const deletePosition = async (req, res) => {
  try {
    await positionService.deletePosition(String(req.params.id), getCompanyContext(req));
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};
