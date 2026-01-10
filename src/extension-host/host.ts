export type ExtensionHostContribution = {
  id: string;
  description: string;
};

export const registeredContributions: ExtensionHostContribution[] = [];

export const registerContribution = (contribution: ExtensionHostContribution) => {
  registeredContributions.push(contribution);
};
