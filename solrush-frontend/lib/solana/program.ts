import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

// Anchor program instance stub
// Full implementation requires Anchor library at runtime
let program: any = null;

export const getProgram = (connection: Connection): any => {
  // TODO: Initialize Anchor program when connection is ready
  // This will be implemented during the contract interaction phase
  return program;
};

export const resetProgram = () => {
  program = null;
};

export const initializeProgram = async (
  connection: Connection,
  wallet: any
): Promise<any> => {
  // This function will initialize the Anchor program at runtime
  // Called when wallet is connected and ready
  return program;
};
