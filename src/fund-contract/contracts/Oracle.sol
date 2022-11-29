pragma solidity ^0.8.16;

import "./interfaces/AggregatorV3Interface.sol";

contract Oracle {
    enum PriceOrigin {
        Stored,
        Chainlink
    }

    address public ownerAddress;

    struct PriceUpdate {
        address assetAddress;
        uint256 newPrice;
    }

    struct PriceInfo {
        uint256 price;
        uint256 updatedAt;
    }

    mapping(address => PriceInfo) assetPrices;
    mapping(address => PriceOrigin) public assetPriceOrigin;
    mapping(address => address) public chainlinkPriceFeeds;
    mapping(address => bool) public trustedAccounts;

    constructor(address _initTrustedAccount) {
        ownerAddress = msg.sender;
        addTrustedAccount(_initTrustedAccount);
        assetPrices[address(1)] = PriceInfo(1, block.timestamp);
    }

    function _onlyOwner() private view {
        require(
            msg.sender == ownerAddress,
            "Caller must be the contract owner!"
        );
    }

    function _onlyTrustedAccounts() private view {
        require(
            trustedAccounts[msg.sender],
            "Caller must be a trusted account!"
        );
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier onlyTrustedAccounts() {
        _onlyTrustedAccounts();
        _;
    }

    function addTrustedAccount(address _newAccount) public onlyOwner {
        trustedAccounts[_newAccount] = true;
    }

    function toggleTrustedAccount(address _account) external onlyOwner {
        trustedAccounts[_account] = !trustedAccounts[_account];
    }

    function setPriceOrigin(address assetAddress, uint8 priceOriginNr)
        external
        onlyOwner
    {
        {
            require(priceOriginNr <= 1, "PriceOrigin has to be lower than 1");
        }

        assetPriceOrigin[assetAddress] = priceOriginNr == 0
            ? PriceOrigin.Stored
            : PriceOrigin.Chainlink;
    }

    function setChainlinkPriceFeedAddress(
        address assetAddress,
        address chainlinkPriceFeedAddress
    ) external onlyOwner {
        chainlinkPriceFeeds[assetAddress] = chainlinkPriceFeedAddress;
    }

    function setPrice(address assetAddress, uint256 newPrice)
        public
        onlyTrustedAccounts
    {
        assetPrices[assetAddress] = PriceInfo(newPrice, block.timestamp);
    }

    function setPrices(PriceUpdate[] memory priceUpdates)
        external
        onlyTrustedAccounts
    {
        for (uint256 i = 0; i < priceUpdates.length; i++) {
            setPrice(priceUpdates[i].assetAddress, priceUpdates[i].newPrice);
        }
    }

    function getPrice(address assetAddress)
        external
        view
        returns (uint256 price, uint256 updatedAt)
    {
        PriceOrigin origin = assetPriceOrigin[assetAddress];
        if (origin == PriceOrigin.Chainlink) {
            address chainlinkAddress = chainlinkPriceFeeds[assetAddress];
            AggregatorV3Interface priceFeed = AggregatorV3Interface(
                chainlinkAddress
            );
            (, int256 _price, , uint256 _updatedAt, ) = priceFeed
                .latestRoundData();

            return (uint256(_price), _updatedAt);
        }
        PriceInfo memory pi = assetPrices[assetAddress];

        return (pi.price, pi.updatedAt);
    }
}