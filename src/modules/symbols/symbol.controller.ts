import { Request, Response } from "express";
import { SymbolService } from "./symbol.service";

export class SymbolController {
  private symbolService: SymbolService;

  constructor() {
    this.symbolService = new SymbolService();
  }

  getAllSymbols = async (req: Request, res: Response): Promise<void> => {
    try {
      const symbols = await this.symbolService.findAll();
      res.json(symbols);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching symbols",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  createSymbols = async (req: Request, res: Response): Promise<void> => {
    try {
      const symbols = req.body;
      const createdSymbols = await this.symbolService.create(
        symbols.map((item: { symbol: string }) => ({ symbol: item.symbol }))
      );
      res.status(201).json(createdSymbols);
    } catch (error) {
      res.status(500).json({
        message: "Error creating symbols",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getSymbolByName = async (req: Request, res: Response): Promise<void> => {
    try {
      const symbol = await this.symbolService.findBySymbol(req.params.symbol);
      if (!symbol) {
        res.status(404).json({ message: "Symbol not found" });
        return;
      }
      res.json(symbol);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching symbol",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  deleteSymbol = async (req: Request, res: Response): Promise<void> => {
    try {
      const symbol = await this.symbolService.deleteBySymbol(req.params.symbol);
      if (!symbol) {
        res.status(404).json({ message: "Symbol not found" });
        return;
      }
      res.json({ message: "Symbol deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Error deleting symbol",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
