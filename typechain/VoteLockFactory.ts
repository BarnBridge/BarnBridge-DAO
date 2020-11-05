/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { VoteLock } from "./VoteLock";

export class VoteLockFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _bond: string,
    _cv: string,
    _treasury: string,
    overrides?: Overrides
  ): Promise<VoteLock> {
    return super.deploy(_bond, _cv, _treasury, overrides || {}) as Promise<
      VoteLock
    >;
  }
  getDeployTransaction(
    _bond: string,
    _cv: string,
    _treasury: string,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(_bond, _cv, _treasury, overrides || {});
  }
  attach(address: string): VoteLock {
    return super.attach(address) as VoteLock;
  }
  connect(signer: Signer): VoteLockFactory {
    return super.connect(signer) as VoteLockFactory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VoteLock {
    return new Contract(address, _abi, signerOrProvider) as VoteLock;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_bond",
        type: "address",
      },
      {
        internalType: "address",
        name: "_cv",
        type: "address",
      },
      {
        internalType: "address",
        name: "_treasury",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "balanceAtTs",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bondCirculatingSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "lock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "lockCreatorBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "multiplierAtTs",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "stakeAtTs",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expiryTimestamp",
            type: "uint256",
          },
        ],
        internalType: "struct VoteLock.Stake",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stopDelegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "totalVotingPowerAtTs",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "votingPowerAtTs",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b50604051620018ba380380620018ba83398181016040528101906200003791906200012a565b826000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555081600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506969e10de76676d0800000600381905550505050620001ce565b6000815190506200012481620001b4565b92915050565b6000806000606084860312156200014057600080fd5b6000620001508682870162000113565b9350506020620001638682870162000113565b9250506040620001768682870162000113565b9150509250925092565b60006200018d8262000194565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b620001bf8162000180565b8114620001cb57600080fd5b50565b6116dc80620001de6000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c80636f1215781161008c5780637a141096116100665780637a14109614610210578063b6b55f2514610240578063cbf8eda91461025c578063dd4670641461028c576100cf565b80636f121578146101ba57806370a08231146101c457806371ef7663146101f4576100cf565b806318ab6a3c146100d45780632082b4d1146101045780632e1a7d4d14610122578063417edd4d1461013e57806350f3282b1461016e5780635c19a95c1461019e575b600080fd5b6100ee60048036038101906100e991906110d9565b6102a8565b6040516100fb919061154d565b60405180910390f35b61010c61046f565b6040516101199190611568565b60405180910390f35b61013c6004803603810190610137919061113e565b6106c2565b005b610158600480360381019061015391906110d9565b610955565b6040516101659190611568565b60405180910390f35b6101886004803603810190610183919061113e565b610979565b6040516101959190611568565b60405180910390f35b6101b860048036038101906101b391906110b0565b610980565b005b6101c2610983565b005b6101de60048036038101906101d991906110b0565b610985565b6040516101eb9190611568565b60405180910390f35b61020e600480360381019061020991906110d9565b610998565b005b61022a600480360381019061022591906110d9565b61099c565b6040516102379190611568565b60405180910390f35b61025a6004803603810190610255919061113e565b610a07565b005b610276600480360381019061027191906110d9565b610dc3565b6040516102839190611568565b60405180910390f35b6102a660048036038101906102a1919061113e565b610dd7565b005b6102b061103b565b6000600460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020905060008180549050148061032357508060008154811061030e57fe5b90600052602060002090600302016000015483105b1561034c5760405180606001604052804281526020016000815260200142815250915050610469565b6000806001838054905003905082818154811061036557fe5b90600052602060002090600302016000015485106103ca5782818154811061038957fe5b906000526020600020906003020160405180606001604052908160008201548152602001600182015481526020016002820154815250509350505050610469565b5b818111156104205760006002600184840101816103e457fe5b049050858482815481106103f457fe5b906000526020600020906003020160000154116104135780925061041a565b6001810391505b506103cb565b82828154811061042c57fe5b9060005260206000209060030201604051806060016040529081600082015481526020016001820154815260200160028201548152505093505050505b92915050565b60008062093a80635f8cd70042038161048457fe5b049050606481111561049557606490505b60006104c1826904a89f54ef0121c00000026a01d1de3d2d5c712f000000610f4190919063ffffffff16565b905060008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff166040518263ffffffff1660e01b815260040161054191906113c7565b60206040518083038186803b15801561055957600080fd5b505afa15801561056d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105919190611167565b905060008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff166040518263ffffffff1660e01b815260040161061191906113c7565b60206040518083038186803b15801561062957600080fd5b505afa15801561063d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106619190611167565b90506106b96003546106ab8361069d8661068f896a084595161401484a000000610f4190919063ffffffff16565b610f4190919063ffffffff16565b610f4190919063ffffffff16565b610f4190919063ffffffff16565b94505050505090565b60008111610705576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106fc906114ed565b60405180910390fd5b600061071033610985565b905081811015610755576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161074c9061150d565b60405180910390fd5b6000600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002090506000818054905090506000600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060018303815481106107f057fe5b906000526020600020906003020190506000610819868360010154610f4190919063ffffffff16565b905042826000015414156108355780826001018190555061089f565b8360405180606001604052804281526020018381526020018460020154815250908060018154018082558091505060019003906000526020600020906003020160009091909190915060008201518160000155602082015181600101556040820151816002015550505b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33886040518363ffffffff1660e01b81526004016108fa929190611442565b602060405180830381600087803b15801561091457600080fd5b505af1158015610928573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061094c9190611115565b50505050505050565b600061095f61103b565b61096984846102a8565b9050806020015191505092915050565b6000919050565b50565b565b60006109918242610955565b9050919050565b5050565b60006109a661103b565b6109b084846102a8565b90506000816040015142106109d157670de0b6b3a764000092505050610a01565b428260400151039050670de0b6b3a76400006301e13380670de0b6b3a76400008302816109fa57fe5b0401925050505b92915050565b60008111610a4a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a41906114ed565b60405180910390fd5b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b8152600401610aa89291906113e2565b60206040518083038186803b158015610ac057600080fd5b505afa158015610ad4573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610af89190611167565b905081811015610b3d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b34906114cd565b60405180910390fd5b6000600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002090506000818054905090506000811415610bfc578160405180606001604052804281526020018681526020014281525090806001815401808255809150506001900390600052602060002090600302016000909190919091506000820151816000015560208201518160010155604082015181600201555050610d0d565b6000600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206001830381548110610c4b57fe5b906000526020600020906003020190504281600001541415610c8b57610c7e858260010154610f8b90919063ffffffff16565b8160010181905550610d0b565b826040518060600160405280428152602001610cb4888560010154610f8b90919063ffffffff16565b81526020018360020154815250908060018154018082558091505060019003906000526020600020906003020160009091909190915060008201518160000155602082015181600101556040820151816002015550505b505b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166323b872dd3330876040518463ffffffff1660e01b8152600401610d6a9392919061140b565b602060405180830381600087803b158015610d8457600080fd5b505af1158015610d98573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610dbc9190611115565b5050505050565b6000610dcf8383610955565b905092915050565b6301e133804201811115610e20576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e179061148d565b60405180910390fd5b6000610e2b33610985565b11610e6b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e629061152d565b60405180910390fd5b6000600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000209050600081600183805490500381548110610ec357fe5b90600052602060002090600302019050816040518060600160405280428152602001836001015481526020018581525090806001815401808255809150506001900390600052602060002090600302016000909190919091506000820151816000015560208201518160010155604082015181600201555050505050565b6000610f8383836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f770000815250610fe0565b905092915050565b600080828401905083811015610fd6576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610fcd906114ad565b60405180910390fd5b8091505092915050565b6000838311158290611028576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161101f919061146b565b60405180910390fd5b5060008385039050809150509392505050565b60405180606001604052806000815260200160008152602001600081525090565b60008135905061106b81611661565b92915050565b60008151905061108081611678565b92915050565b6000813590506110958161168f565b92915050565b6000815190506110aa8161168f565b92915050565b6000602082840312156110c257600080fd5b60006110d08482850161105c565b91505092915050565b600080604083850312156110ec57600080fd5b60006110fa8582860161105c565b925050602061110b85828601611086565b9150509250929050565b60006020828403121561112757600080fd5b600061113584828501611071565b91505092915050565b60006020828403121561115057600080fd5b600061115e84828501611086565b91505092915050565b60006020828403121561117957600080fd5b60006111878482850161109b565b91505092915050565b611199816115e7565b82525050565b6111a88161159f565b82525050565b60006111b982611583565b6111c3818561158e565b93506111d381856020860161161d565b6111dc81611650565b840191505092915050565b60006111f460118361158e565b91507f74696d657374616d7020746f6f206269670000000000000000000000000000006000830152602082019050919050565b6000611234601b8361158e565b91507f536166654d6174683a206164646974696f6e206f766572666c6f7700000000006000830152602082019050919050565b600061127460198361158e565b91507f546f6b656e20616c6c6f77616e636520746f6f20736d616c6c000000000000006000830152602082019050919050565b60006112b4601d8361158e565b91507f416d6f756e74206d7573742062652067726561746572207468616e20300000006000830152602082019050919050565b60006112f460148361158e565b91507f496e73756666696369656e742062616c616e63650000000000000000000000006000830152602082019050919050565b600061133460158361158e565b91507f73656e64657220686173206e6f2062616c616e636500000000000000000000006000830152602082019050919050565b60608201600082015161137d60008501826113a9565b50602082015161139060208501826113a9565b5060408201516113a360408501826113a9565b50505050565b6113b2816115dd565b82525050565b6113c1816115dd565b82525050565b60006020820190506113dc600083018461119f565b92915050565b60006040820190506113f76000830185611190565b611404602083018461119f565b9392505050565b60006060820190506114206000830186611190565b61142d602083018561119f565b61143a60408301846113b8565b949350505050565b60006040820190506114576000830185611190565b61146460208301846113b8565b9392505050565b6000602082019050818103600083015261148581846111ae565b905092915050565b600060208201905081810360008301526114a6816111e7565b9050919050565b600060208201905081810360008301526114c681611227565b9050919050565b600060208201905081810360008301526114e681611267565b9050919050565b60006020820190508181036000830152611506816112a7565b9050919050565b60006020820190508181036000830152611526816112e7565b9050919050565b6000602082019050818103600083015261154681611327565b9050919050565b60006060820190506115626000830184611367565b92915050565b600060208201905061157d60008301846113b8565b92915050565b600081519050919050565b600082825260208201905092915050565b60006115aa826115bd565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b60006115f2826115f9565b9050919050565b60006116048261160b565b9050919050565b6000611616826115bd565b9050919050565b60005b8381101561163b578082015181840152602081019050611620565b8381111561164a576000848401525b50505050565b6000601f19601f8301169050919050565b61166a8161159f565b811461167557600080fd5b50565b611681816115b1565b811461168c57600080fd5b50565b611698816115dd565b81146116a357600080fd5b5056fea264697066735822122089a4060ebac1be52195813e1ae0042f76b016a2489eefcc2aaf794538f3b7d8064736f6c63430007030033";
