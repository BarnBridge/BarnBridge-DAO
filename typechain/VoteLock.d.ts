/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface VoteLockInterface extends ethers.utils.Interface {
  functions: {
    "MAX_LOCK()": FunctionFragment;
    "balanceAtTs(address,uint256)": FunctionFragment;
    "balanceOf(address)": FunctionFragment;
    "bondCirculatingSupply()": FunctionFragment;
    "bondStaked()": FunctionFragment;
    "bondStakedAtTs(uint256)": FunctionFragment;
    "delegate(address)": FunctionFragment;
    "deposit(uint256)": FunctionFragment;
    "lock(uint256)": FunctionFragment;
    "lockCreatorBalance(address,uint256)": FunctionFragment;
    "multiplierAtTs(address,uint256)": FunctionFragment;
    "stakeAtTs(address,uint256)": FunctionFragment;
    "stopDelegate()": FunctionFragment;
    "totalVotingPowerAtTs(uint256)": FunctionFragment;
    "userLock(address)": FunctionFragment;
    "votingPower(address)": FunctionFragment;
    "votingPowerAtTs(address,uint256)": FunctionFragment;
    "withdraw(uint256)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "MAX_LOCK", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "balanceAtTs",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "balanceOf", values: [string]): string;
  encodeFunctionData(
    functionFragment: "bondCirculatingSupply",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "bondStaked",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "bondStakedAtTs",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "delegate", values: [string]): string;
  encodeFunctionData(
    functionFragment: "deposit",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "lock", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "lockCreatorBalance",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "multiplierAtTs",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "stakeAtTs",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "stopDelegate",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalVotingPowerAtTs",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "userLock", values: [string]): string;
  encodeFunctionData(functionFragment: "votingPower", values: [string]): string;
  encodeFunctionData(
    functionFragment: "votingPowerAtTs",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "MAX_LOCK", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "balanceAtTs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "bondCirculatingSupply",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "bondStaked", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "bondStakedAtTs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "delegate", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "lock", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "lockCreatorBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "multiplierAtTs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "stakeAtTs", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "stopDelegate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalVotingPowerAtTs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "userLock", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "votingPower",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "votingPowerAtTs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {};
}

export class VoteLock extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: VoteLockInterface;

  functions: {
    MAX_LOCK(
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "MAX_LOCK()"(
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    balanceAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "balanceAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    balanceOf(
      user: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "balanceOf(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    bondCirculatingSupply(
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "bondCirculatingSupply()"(
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    bondStaked(
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "bondStaked()"(
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    bondStakedAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "bondStakedAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    delegate(to: string, overrides?: Overrides): Promise<ContractTransaction>;

    "delegate(address)"(
      to: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    deposit(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    lock(
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "lock(uint256)"(
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    lockCreatorBalance(
      user: string,
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "lockCreatorBalance(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    multiplierAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "multiplierAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    stakeAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: {
        timestamp: BigNumber;
        amount: BigNumber;
        expiryTimestamp: BigNumber;
        0: BigNumber;
        1: BigNumber;
        2: BigNumber;
      };
    }>;

    "stakeAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: {
        timestamp: BigNumber;
        amount: BigNumber;
        expiryTimestamp: BigNumber;
        0: BigNumber;
        1: BigNumber;
        2: BigNumber;
      };
    }>;

    stopDelegate(overrides?: Overrides): Promise<ContractTransaction>;

    "stopDelegate()"(overrides?: Overrides): Promise<ContractTransaction>;

    totalVotingPowerAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "totalVotingPowerAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    userLock(
      user: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "userLock(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    votingPower(
      user: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "votingPower(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    votingPowerAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "votingPowerAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    withdraw(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  MAX_LOCK(overrides?: CallOverrides): Promise<BigNumber>;

  "MAX_LOCK()"(overrides?: CallOverrides): Promise<BigNumber>;

  balanceAtTs(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "balanceAtTs(address,uint256)"(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  balanceOf(user: string, overrides?: CallOverrides): Promise<BigNumber>;

  "balanceOf(address)"(
    user: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  bondCirculatingSupply(overrides?: CallOverrides): Promise<BigNumber>;

  "bondCirculatingSupply()"(overrides?: CallOverrides): Promise<BigNumber>;

  bondStaked(overrides?: CallOverrides): Promise<BigNumber>;

  "bondStaked()"(overrides?: CallOverrides): Promise<BigNumber>;

  bondStakedAtTs(
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "bondStakedAtTs(uint256)"(
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  delegate(to: string, overrides?: Overrides): Promise<ContractTransaction>;

  "delegate(address)"(
    to: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  deposit(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "deposit(uint256)"(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  lock(
    timestamp: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "lock(uint256)"(
    timestamp: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  lockCreatorBalance(
    user: string,
    timestamp: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "lockCreatorBalance(address,uint256)"(
    user: string,
    timestamp: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  multiplierAtTs(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "multiplierAtTs(address,uint256)"(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  stakeAtTs(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<{
    timestamp: BigNumber;
    amount: BigNumber;
    expiryTimestamp: BigNumber;
    0: BigNumber;
    1: BigNumber;
    2: BigNumber;
  }>;

  "stakeAtTs(address,uint256)"(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<{
    timestamp: BigNumber;
    amount: BigNumber;
    expiryTimestamp: BigNumber;
    0: BigNumber;
    1: BigNumber;
    2: BigNumber;
  }>;

  stopDelegate(overrides?: Overrides): Promise<ContractTransaction>;

  "stopDelegate()"(overrides?: Overrides): Promise<ContractTransaction>;

  totalVotingPowerAtTs(
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "totalVotingPowerAtTs(uint256)"(
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  userLock(user: string, overrides?: CallOverrides): Promise<BigNumber>;

  "userLock(address)"(
    user: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  votingPower(user: string, overrides?: CallOverrides): Promise<BigNumber>;

  "votingPower(address)"(
    user: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  votingPowerAtTs(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "votingPowerAtTs(address,uint256)"(
    user: string,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  withdraw(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "withdraw(uint256)"(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    MAX_LOCK(overrides?: CallOverrides): Promise<BigNumber>;

    "MAX_LOCK()"(overrides?: CallOverrides): Promise<BigNumber>;

    balanceAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "balanceAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    balanceOf(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    "balanceOf(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    bondCirculatingSupply(overrides?: CallOverrides): Promise<BigNumber>;

    "bondCirculatingSupply()"(overrides?: CallOverrides): Promise<BigNumber>;

    bondStaked(overrides?: CallOverrides): Promise<BigNumber>;

    "bondStaked()"(overrides?: CallOverrides): Promise<BigNumber>;

    bondStakedAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "bondStakedAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    delegate(to: string, overrides?: CallOverrides): Promise<void>;

    "delegate(address)"(to: string, overrides?: CallOverrides): Promise<void>;

    deposit(amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    lock(timestamp: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "lock(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    lockCreatorBalance(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "lockCreatorBalance(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    multiplierAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "multiplierAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    stakeAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      timestamp: BigNumber;
      amount: BigNumber;
      expiryTimestamp: BigNumber;
      0: BigNumber;
      1: BigNumber;
      2: BigNumber;
    }>;

    "stakeAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      timestamp: BigNumber;
      amount: BigNumber;
      expiryTimestamp: BigNumber;
      0: BigNumber;
      1: BigNumber;
      2: BigNumber;
    }>;

    stopDelegate(overrides?: CallOverrides): Promise<void>;

    "stopDelegate()"(overrides?: CallOverrides): Promise<void>;

    totalVotingPowerAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "totalVotingPowerAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    userLock(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    "userLock(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    votingPower(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    "votingPower(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    votingPowerAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "votingPowerAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdraw(amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    MAX_LOCK(overrides?: CallOverrides): Promise<BigNumber>;

    "MAX_LOCK()"(overrides?: CallOverrides): Promise<BigNumber>;

    balanceAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "balanceAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    balanceOf(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    "balanceOf(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    bondCirculatingSupply(overrides?: CallOverrides): Promise<BigNumber>;

    "bondCirculatingSupply()"(overrides?: CallOverrides): Promise<BigNumber>;

    bondStaked(overrides?: CallOverrides): Promise<BigNumber>;

    "bondStaked()"(overrides?: CallOverrides): Promise<BigNumber>;

    bondStakedAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "bondStakedAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    delegate(to: string, overrides?: Overrides): Promise<BigNumber>;

    "delegate(address)"(to: string, overrides?: Overrides): Promise<BigNumber>;

    deposit(amount: BigNumberish, overrides?: Overrides): Promise<BigNumber>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    lock(timestamp: BigNumberish, overrides?: Overrides): Promise<BigNumber>;

    "lock(uint256)"(
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    lockCreatorBalance(
      user: string,
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "lockCreatorBalance(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    multiplierAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "multiplierAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    stakeAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "stakeAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    stopDelegate(overrides?: Overrides): Promise<BigNumber>;

    "stopDelegate()"(overrides?: Overrides): Promise<BigNumber>;

    totalVotingPowerAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "totalVotingPowerAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    userLock(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    "userLock(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    votingPower(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    "votingPower(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    votingPowerAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "votingPowerAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdraw(amount: BigNumberish, overrides?: Overrides): Promise<BigNumber>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    MAX_LOCK(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "MAX_LOCK()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    balanceAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "balanceAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    balanceOf(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "balanceOf(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    bondCirculatingSupply(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "bondCirculatingSupply()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    bondStaked(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "bondStaked()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    bondStakedAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "bondStakedAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    delegate(to: string, overrides?: Overrides): Promise<PopulatedTransaction>;

    "delegate(address)"(
      to: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    deposit(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    lock(
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "lock(uint256)"(
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    lockCreatorBalance(
      user: string,
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "lockCreatorBalance(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    multiplierAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "multiplierAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    stakeAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "stakeAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    stopDelegate(overrides?: Overrides): Promise<PopulatedTransaction>;

    "stopDelegate()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    totalVotingPowerAtTs(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "totalVotingPowerAtTs(uint256)"(
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    userLock(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "userLock(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    votingPower(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "votingPower(address)"(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    votingPowerAtTs(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "votingPowerAtTs(address,uint256)"(
      user: string,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}
