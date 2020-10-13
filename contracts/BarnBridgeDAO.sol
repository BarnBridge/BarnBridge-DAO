// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;


import "./interfaces/IERC173.sol";
import "./interfaces/IERC165.sol";
import "./lib/Diamond.sol";
import "./facets/DiamondLoupeFacet.sol";
import "./interfaces/IDiamondCut.sol";
contract BarnBridgeDAO is Diamond {
    constructor() payable {
        // set diamond cuts for DiamondLoupe

        DiamondLoupeFacet diamondLoupe = new DiamondLoupeFacet();

        bytes4[] memory diamondLoupeSelectors = new bytes4[](4);
        diamondLoupeSelectors[0] = DiamondLoupeFacet.facets.selector;
        diamondLoupeSelectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        diamondLoupeSelectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        diamondLoupeSelectors[3] = DiamondLoupeFacet.facetAddress.selector;


        FacetCut[] memory diamondCuts = new FacetCut[](1);

        FacetCut memory _diamondCut = FacetCut(address(diamondLoupe), FacetCutAction.Add, diamondLoupeSelectors);
        diamondCuts[0] = _diamondCut;
        diamondCut(diamondCuts);

        DiamondStorage storage ds = diamondStorage();

        // DiamondCut
        ds.supportedInterfaces[IDiamondCut.diamondCut.selector] = true;

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
