declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BARN: string;
      CHAIN: string;
      CHAINID: string;
      PROVIDER: string;
      MNEMONIC: string;
    }
  }
}

// convert file into a module by adding an empty export statement.
export {}
