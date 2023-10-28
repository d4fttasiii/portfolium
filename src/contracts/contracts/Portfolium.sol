// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IGuard.sol";
import "./PortfoliumRoles.sol";

contract Portfolium is Pausable, ReentrancyGuard, PortfoliumRoles {
    enum AssetTypes {
        Native,
        ERC20
    }

    struct Asset {
        address assetAddress;
        string name;
        string symbol;
        uint8 decimals;
        uint256 perShareAmount;
        AssetTypes assetType;
        uint16 weight;
    }

    IGuard private _guard;
    ITreasury private _treasury;
    IOracle private _oracle;

    uint16 public assetCount;
    uint16 public rebalancingTolerance;
    address[] public assetAddresses;
    mapping(address => Asset) public assets;

    constructor(
        address oracle,
        address treasury,
        address guard,
        string memory nativeName,
        string memory nativeSymbol
    ) {
        _oracle = IOracle(oracle);
        _treasury = ITreasury(treasury);
        _guard = IGuard(guard);
        rebalancingTolerance = 500;
        assets[address(1)] = Asset(
            address(1),
            nativeName,
            nativeSymbol,
            18,
            0,
            AssetTypes.Native,
            10000
        );
        assetAddresses.push(address(1));
    }
}
