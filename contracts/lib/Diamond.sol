// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

/******************************************************************************\
* Author: Nick Mudge
*
* Implementation of Diamond facet.
* This is gas optimized by reducing storage reads and storage writes.
/******************************************************************************/

import { DiamondStorageContract } from '../storage/DiamondStorageContract.sol';


contract Diamond is DiamondStorageContract {
    event DiamondCut(FacetCut[] _diamondCut);
    enum FacetCutAction {Add, Replace, Remove}

    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    function diamondCut(
        FacetCut[] memory _diamondCut
    ) internal {
        uint256 selectorCount = diamondStorage().selectors.length;
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            selectorCount = addReplaceRemoveFacetSelectors(
                selectorCount,
                _diamondCut[facetIndex].facetAddress,
                _diamondCut[facetIndex].action,
                _diamondCut[facetIndex].functionSelectors
            );
        }
        emit DiamondCut(_diamondCut);
    }

    function addReplaceRemoveFacetSelectors(
        uint256 _selectorCount,
        address _newFacetAddress,
        FacetCutAction _action,
        bytes4[] memory _selectors
    ) internal returns (uint256) {
        DiamondStorage storage ds = diamondStorage();
        require(_selectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        // add or replace functions
        if (_newFacetAddress != address(0)) {
            enforceHasContractCode(_newFacetAddress, "LibDiamondCut: facet has no code");
            for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
                bytes4 selector = _selectors[selectorIndex];
                address oldFacetAddress = ds.facetAddressAndSelectorPosition[selector].facetAddress;
                // add
                if (_action == FacetCutAction.Add) {
                    require(oldFacetAddress == address(0), "LibDiamondCut: Can't add function that already exists");
                    ds.facetAddressAndSelectorPosition[selector] = FacetAddressAndSelectorPosition(
                        _newFacetAddress,
                        uint16(_selectorCount)
                    );
                    ds.selectors.push(selector);
                    _selectorCount++;
                } else if (_action == FacetCutAction.Replace) {
                    // replace
                    // only useful if immutable functions exist
                    require(oldFacetAddress != address(this), "LibDiamondCut: Can't replace immutable function");
                    require(oldFacetAddress != _newFacetAddress, "LibDiamondCut: Can't replace function with same function");
                    require(oldFacetAddress != address(0), "LibDiamondCut: Can't replace function that doesn't exist");
                    // replace old facet address
                    ds.facetAddressAndSelectorPosition[selector].facetAddress = _newFacetAddress;
                } else {
                    revert("LibDiamondCut: Incorrect FacetCutAction");
                }
            }
        } else {
            require(_action == FacetCutAction.Remove, "LibDiamondCut: action not set to FacetCutAction.Remove");
            // remove functions
            for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
                bytes4 selector = _selectors[selectorIndex];
                FacetAddressAndSelectorPosition memory oldFacetAddressAndSelectorPosition = ds.facetAddressAndSelectorPosition[selector];
                require(oldFacetAddressAndSelectorPosition.facetAddress != address(0), "LibDiamondCut: Can't remove function that doesn't exist");
                // only useful if immutable functions exist
                require(oldFacetAddressAndSelectorPosition.facetAddress != address(this), "LibDiamondCut: Can't remove immutable function.");
                // replace selector with last selector
                if (oldFacetAddressAndSelectorPosition.selectorPosition != _selectorCount - 1) {
                    bytes4 lastSelector = ds.selectors[_selectorCount - 1];
                    ds.selectors[oldFacetAddressAndSelectorPosition.selectorPosition] = lastSelector;
                    ds.facetAddressAndSelectorPosition[lastSelector].selectorPosition = oldFacetAddressAndSelectorPosition.selectorPosition;
                }
                // delete last selector
                ds.selectors.pop();
                delete ds.facetAddressAndSelectorPosition[selector];
                _selectorCount--;
            }
        }
        return _selectorCount;
    }

    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, _errorMessage);
    }
}
