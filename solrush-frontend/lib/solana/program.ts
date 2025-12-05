import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, setProvider } from "@project-serum/anchor";
import { PROGRAM_ID } from "../anchor/setup";
import idl from "../../anchor.json";

// Anchor program instance
let program: Program | null = null;

export const getProgram = (connection: Connection, wallet: any): Program => {
  if (program) return program;

  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );

  // Set the provider as default
  setProvider(provider);

  // Initialize the program
  program = new Program(idl as Idl, PROGRAM_ID, provider);

  return program;
};

export const resetProgram = () => {
  program = null;
};

export const initializeProgram = async (
  connection: Connection,
  wallet: any
): Promise<Program> => {
  return getProgram(connection, wallet);
};
