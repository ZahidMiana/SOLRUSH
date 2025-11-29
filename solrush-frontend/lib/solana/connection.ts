import { Connection } from "@solana/web3.js";
import { DEVNET_RPC } from "./constants";

let connection: Connection | null = null;

export const getConnection = (): Connection => {
  if (!connection) {
    connection = new Connection(DEVNET_RPC, "confirmed");
  }
  return connection;
};

export const resetConnection = () => {
  connection = null;
};
