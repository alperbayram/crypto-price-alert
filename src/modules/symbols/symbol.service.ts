import Symbol from "./symbol.model";

export class SymbolService {
  async findAll() {
    return await Symbol.find();
  }

  async create(symbolData: { symbol: string }[]) {
    return await Symbol.insertMany(symbolData);
  }

  async findBySymbol(symbol: string) {
    return await Symbol.findOne({ symbol });
  }

  async deleteBySymbol(symbol: string) {
    return await Symbol.findOneAndDelete({ symbol });
  }
}
