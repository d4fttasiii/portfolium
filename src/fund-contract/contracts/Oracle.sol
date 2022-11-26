pragma solidity ^0.8.16;

import "./interfaces/AggregatorV3Interface.sol";

contract Oracle {
    enum PriceOrigin {
        Stored,
        Chainlink
    }

    address public ownerAddress;
    address public applicationAddress;

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

    constructor(address _applicationAddress) {
        ownerAddress = msg.sender;
        applicationAddress = _applicationAddress;
        assetPrices[address(1)] = PriceInfo(1, block.timestamp);
    }

    function _onlyOwner() private view {
        require(
            msg.sender == ownerAddress,
            "Caller must be the contract owner!"
        );
    }

    function _onlyApplication() private view {
        require(
            applicationAddress == msg.sender,
            "Caller must be the application account!"
        );
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier onlyApplication() {
        _onlyApplication();
        _;
    }

    function setApplicationAddress(address newApplicationAddress)
        public
        onlyOwner
    {
        applicationAddress = newApplicationAddress;
    }

    function setPriceOrigin(address assetAddress, uint8 priceOriginNr)
        public
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
    ) public onlyOwner {
        chainlinkPriceFeeds[assetAddress] = chainlinkPriceFeedAddress;
    }

    function setPrice(address assetAddress, uint256 newPrice)
        public
        onlyApplication
    {
        assetPrices[assetAddress] = PriceInfo(newPrice, block.timestamp);
    }

    function setPrices(PriceUpdate[] memory priceUpdates)
        public
        onlyApplication
    {
        for (uint256 i = 0; i < priceUpdates.length; i++) {
            setPrice(priceUpdates[i].assetAddress, priceUpdates[i].newPrice);
        }
    }

    function getPrice(address assetAddress)
        public
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
