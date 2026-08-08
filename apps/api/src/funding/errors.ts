export class FundingProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FundingProviderError";
  }
}
