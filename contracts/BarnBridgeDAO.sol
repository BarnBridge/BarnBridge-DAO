// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;


import "./interfaces/IERC173.sol";
import "./interfaces/IERC165.sol";
import "./lib/Diamond.sol";
import "./facets/Governance.sol";
import "./interfaces/IDiamondCut.sol";
contract BarnBridgeDAO is Diamond {
    constructor() payable {
        // set diamon cuts

        Governance governance = new Governance();

        bytes4[] memory governanceSelectors;
        governanceSelectors[0] = Governance.newProposal.selector;
        governanceSelectors[1] = Governance.executeProposal.selector;
        governanceSelectors[2] = Governance.vote.selector;
        governanceSelectors[3] = Governance.cancelVote.selector;


        FacetCut[] memory diamondCuts;

        FacetCut memory _diamondCut = FacetCut(address(governance), FacetCutAction.Add, governanceSelectors);
        diamondCuts[0] = _diamondCut;
        diamondCut(diamondCuts);




        DiamondStorage storage ds = diamondStorage();

        // adding ERC165 data
        // ERC165
//        ds.supportedInterfaces[IERC165.supportsInterface.selector] = true;

        // DiamondCut
        ds.supportedInterfaces[IDiamondCut.diamondCut.selector] = true;

        // DiamondLoupe
//        ds.supportedInterfaces[
//            IDiamondLoupe.facets.selector ^
//            IDiamondLoupe.facetFunctionSelectors.selector ^
//            IDiamondLoupe.facetAddresses.selector ^
//            IDiamondLoupe.facetAddress.selector
//        ] = true;

        // ERC173
//        ds.supportedInterfaces[
//            IERC173.transferOwnership.selector ^
//            IERC173.owner.selector
//        ] = true;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        DiamondStorage storage ds;
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
        address facet = address(bytes20(ds.facetAddressAndSelectorPosition[msg.sig].facetAddress));
        require(facet != address(0), "Diamond: Function does not exist");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }

    receive() external payable {}
}
