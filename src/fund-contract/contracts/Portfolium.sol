pragma solidity ^0.8.16;

import "./Oracle.sol";
import "./Treasury.sol";
import "./Reserve.sol";

contract Portfolium {
    enum AssetTypes {
        Native,
        ERC20,
        Mirrored
    }

    enum PortfolioInteractions {
        None,
        Like,
        Dislike
    }

    struct AssetAllocation {
        address assetAddress;
        uint256 perShareAmount;
    }

    struct Asset {
        address assetAddress;
        string name;
        string symbol;
        uint8 decimals;
        AssetTypes assetType;
    }

    struct Portfolio {
        address owner;
        string name;
        string symbol;
        uint16 assetCount;
        uint256 totalSupply;
        uint64 likes;
        uint64 dislikes;
        uint256 commission;
    }

    address public ownerAddress;
    uint256 public platformCommission;

    uint64 public availableAssetCount;
    mapping(address => Asset) public availableAssets;
    mapping(address => bool) public availableAssetAddresses;

    mapping(address => Portfolio) public portfolios;
    mapping(address => mapping(address => bool)) public portfolioAssets;
    mapping(address => address[]) public portfolioAssetAddresses;
    mapping(address => mapping(address => AssetAllocation)) portfolioAssetAllocations;
    mapping(address => mapping(address => uint256)) public portfolioBalanceOf;
    mapping(address => mapping(address => PortfolioInteractions)) portfolioInteractions;

    Treasury public treasury;
    Reserve public reserve;
    Oracle public oracle;

    constructor(
        Oracle _oracle,
        Treasury _treasury,
        Reserve _reserve,
        uint256 _platformCommission,
        string memory _nativeName,
        string memory _nativeSymbol,
        uint8 _nativeDecimals
    ) {
        ownerAddress = msg.sender;
        oracle = _oracle;
        treasury = _treasury;
        reserve = _reserve;
        platformCommission = _platformCommission;
        availableAssetAddresses[address(1)] = true;
        availableAssets[address(1)] = Asset(
            address(1),
            _nativeName,
            _nativeSymbol,
            _nativeDecimals,
            AssetTypes.Native
        );
        availableAssetCount = 1;
    }

    // ---------- EVENTS ----------

    // ---------- MODIFIERS ----------

    function _mustPayPlatformCommission() private view {
        require(
            msg.value >= platformCommission,
            "Min. platformCommission has to be paid!"
        );
    }

    modifier mustPayPlatformCommission() {
        _mustPayPlatformCommission();
        _;
    }

    function _mustBeNewAsset(address _assetAddress) private view {
        require(
            !availableAssetAddresses[_assetAddress],
            "Asset already exists!"
        );
    }

    modifier mustBeNewAsset(address _assetAddress) {
        _mustBeNewAsset(_assetAddress);
        _;
    }

    function _mustBeAvailableAsset(address _assetAddress) private view {
        require(
            availableAssetAddresses[_assetAddress],
            "Asset is not available!"
        );
    }

    modifier mustBeAvailableAsset(address _assetAddress) {
        _mustBeAvailableAsset(_assetAddress);
        _;
    }

    function _mustBeExistingPortfolio(address _portfolioAddress) private view {
        require(
            portfolios[_portfolioAddress].assetCount > 0,
            "Portfolio doesn't exists!"
        );
    }

    modifier mustBeExistingPortfolio(address _portfolioAddress) {
        _mustBeExistingPortfolio(_portfolioAddress);
        _;
    }

    function _onlyOwner() private view {
        require(
            msg.sender == ownerAddress,
            "Caller must be the contract owner!"
        );
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyPortfolioOwner() private view {
        require(
            portfolios[msg.sender].owner == msg.sender,
            "Call must be the portfolio owner!"
        );
    }

    modifier onlyPortfolioOwner() {
        _onlyPortfolioOwner();
        _;
    }

    // ---------- CONTRACT MANAGEMENT ----------

    function updatePlatformCommission(uint256 _platformCommission)
        external
        onlyOwner
    {
        platformCommission = _platformCommission;
    }

    function addSupportedERC20Asset(
        address _assetAddress,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external onlyOwner mustBeNewAsset(_assetAddress) {
        require(_decimals <= 18, "Max number of decimals is 18!");

        Asset memory asset = Asset(
            _assetAddress,
            _name,
            _symbol,
            _decimals,
            AssetTypes.ERC20
        );
        availableAssetAddresses[_assetAddress] = true;
        availableAssets[_assetAddress] = asset;
        availableAssetCount++;
    }

    function addSupportedMirroredAsset(
        address _assetAddress,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external onlyOwner mustBeNewAsset(_assetAddress) {
        require(_decimals <= 18, "Max number of decimals is 18!");

        Asset memory asset = Asset(
            _assetAddress,
            _name,
            _symbol,
            _decimals,
            AssetTypes.Mirrored
        );
        availableAssetAddresses[_assetAddress] = true;
        availableAssets[_assetAddress] = asset;
        availableAssetCount++;
    }

    function removeSupportedAsset(address _assetAddress) external onlyOwner {
        availableAssetAddresses[_assetAddress] = false;
        availableAssetCount--;
    }

    // ---------- PORTFOLIO MANAGEMENT ----------

    function createPortfolio(
        string memory _name,
        string memory _symbol,
        uint256 _initCommission
    ) external payable mustPayPlatformCommission {
        require(
            portfolios[msg.sender].assetCount == 0,
            "Portfolio already exists"
        );

        Portfolio memory portfolio = Portfolio({
            name: _name,
            symbol: _symbol,
            assetCount: 1,
            totalSupply: 0,
            likes: 0,
            dislikes: 0,
            commission: _initCommission,
            owner: msg.sender
        });
        portfolios[msg.sender] = portfolio;
        portfolioAssets[msg.sender][address(1)] = true;
        portfolioAssetAddresses[msg.sender].push(address(1));
    }

    function addAsset(address _assetAddress)
        external
        mustBeAvailableAsset(_assetAddress)
        onlyPortfolioOwner
    {
        {
            require(
                !portfolioAssets[msg.sender][_assetAddress],
                "Asset already added to this portfolio!"
            );
        }
        portfolioAssets[msg.sender][_assetAddress] = true;
        portfolios[msg.sender].assetCount++;
        portfolioAssetAddresses[msg.sender].push(_assetAddress);
        portfolioAssetAllocations[msg.sender][_assetAddress] = AssetAllocation(
            _assetAddress,
            0
        );
    }

    function updateAllocation(address _assetAddress, uint256 _perShareAmount)
        external
        onlyPortfolioOwner
    {
        {
            require(
                portfolioAssets[msg.sender][_assetAddress],
                "Asset must be added to portfolio!"
            );
        }
        uint256 totalSupply = portfolios[msg.sender].totalSupply;
        uint256 prevAmount = portfolioAssetAllocations[msg.sender][
            _assetAddress
        ].perShareAmount;
        uint256 diff = _absDiff(prevAmount, _perShareAmount);
        portfolioAssetAllocations[msg.sender][_assetAddress]
            .perShareAmount = _perShareAmount;

        if (totalSupply > 0) {
            if (prevAmount > _perShareAmount) {
                treasury.sellAsset(
                    msg.sender,
                    _assetAddress,
                    diff * totalSupply
                );
            } else if (prevAmount < _perShareAmount) {
                treasury.buyAsset(
                    msg.sender,
                    _assetAddress,
                    diff * totalSupply
                );
            }
        }
    }

    // ---------- PORTFOLIO INTERACTIONS ----------

    function likePortfolio(address _portfolioAddress) external {
        PortfolioInteractions currentPortfolioInteraction = portfolioInteractions[
                _portfolioAddress
            ][msg.sender];

        require(
            currentPortfolioInteraction == PortfolioInteractions.None ||
                currentPortfolioInteraction == PortfolioInteractions.Dislike,
            ""
        );

        portfolios[_portfolioAddress].likes++;
        if (currentPortfolioInteraction == PortfolioInteractions.Dislike) {
            portfolios[_portfolioAddress].dislikes--;
        }
        portfolioInteractions[_portfolioAddress][
            msg.sender
        ] = PortfolioInteractions.Like;
    }

    function dislikePortfolio(address _portfolioAddress) external {
        PortfolioInteractions currentPortfolioInteraction = portfolioInteractions[
                _portfolioAddress
            ][msg.sender];

        require(
            currentPortfolioInteraction == PortfolioInteractions.None ||
                currentPortfolioInteraction == PortfolioInteractions.Like,
            ""
        );

        portfolios[_portfolioAddress].dislikes++;
        if (currentPortfolioInteraction == PortfolioInteractions.Like) {
            portfolios[_portfolioAddress].likes--;
        }
        portfolioInteractions[_portfolioAddress][
            msg.sender
        ] = PortfolioInteractions.Dislike;
    }

    function resetPortfolioInteraction(address _portfolioAddress) external {
        PortfolioInteractions currentPortfolioInteraction = portfolioInteractions[
                _portfolioAddress
            ][msg.sender];
        require(
            currentPortfolioInteraction == PortfolioInteractions.Dislike ||
                currentPortfolioInteraction == PortfolioInteractions.Like,
            ""
        );
        if (currentPortfolioInteraction == PortfolioInteractions.Like) {
            portfolios[_portfolioAddress].likes--;
        } else if (
            currentPortfolioInteraction == PortfolioInteractions.Dislike
        ) {
            portfolios[_portfolioAddress].dislikes--;
        }

        portfolioInteractions[_portfolioAddress][
            msg.sender
        ] = PortfolioInteractions.None;
    }

    // ---------- TRADING ----------

    function buyShares(address _portfolioAddress, uint256 _amount)
        external
        payable
        mustBeExistingPortfolio(_portfolioAddress)
    {
        uint256 price = getSharePrice(_portfolioAddress);
        uint256 cost = (price * _amount) + platformCommission;
        {
            require(
                cost <= msg.value,
                "Cost of shares is exceeds transferred amount!"
            );
        }
        portfolios[_portfolioAddress].totalSupply += _amount;
        portfolioBalanceOf[_portfolioAddress][msg.sender] += _amount;
        reserve.deposit{value: platformCommission}();
        _buyAssets(_portfolioAddress, _amount);
    }

    function sellShares(address _portfolioAddress, uint256 _amount)
        external
        payable
        mustPayPlatformCommission
        mustBeExistingPortfolio(_portfolioAddress)
        returns (uint256)
    {
        uint256 price = getSharePrice(_portfolioAddress);
        uint256 received = (price * _amount);
        portfolios[_portfolioAddress].totalSupply -= _amount;
        portfolioBalanceOf[_portfolioAddress][msg.sender] -= _amount;

        reserve.deposit{value: platformCommission}();
        _sellAssets(_portfolioAddress, _amount);
        treasury.withdraw(msg.sender, received);

        return received;
    }

    // ---------- GETTERS ----------

    function getPortfolioValue(address _portfolioAddress)
        public
        view
        returns (uint256)
    {
        uint256 totalSupply = portfolios[_portfolioAddress].totalSupply;
        uint256 price = getSharePrice(_portfolioAddress);
        return price * totalSupply;
    }

    function getSharePrice(address _portfolioAddress)
        public
        view
        returns (uint256)
    {
        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        address[]
            memory selectedPortfolioAssetAddresses = portfolioAssetAddresses[
                _portfolioAddress
            ];
        uint256 sharePrice = 0;

        for (uint256 i = 0; i < selectedPortfolioAssetCount; i++) {
            Asset memory asset = availableAssets[
                selectedPortfolioAssetAddresses[i]
            ];
            (uint256 assetPrice, ) = oracle.getPrice(asset.assetAddress);
            uint256 perShareAmount = portfolioAssetAllocations[
                _portfolioAddress
            ][asset.assetAddress].perShareAmount;
            // TODO: Test scaling with 10+ decimal assets
            uint256 price = (perShareAmount * assetPrice) /
                (10**asset.decimals);
            sharePrice += price;
        }
        return sharePrice;
    }

    // ---------- HELPERS ----------

    function _buyAssets(address _portfolioAddress, uint256 _amount) internal {
        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        address[]
            memory selectedPortfolioAssetAddresses = portfolioAssetAddresses[
                _portfolioAddress
            ];
        for (uint256 i = 0; i < selectedPortfolioAssetCount; i++) {
            Asset memory asset = availableAssets[
                selectedPortfolioAssetAddresses[i]
            ];
            uint256 perShareAmount = portfolioAssetAllocations[
                _portfolioAddress
            ][asset.assetAddress].perShareAmount;
            if (perShareAmount > 0) {
                (uint256 price, ) = oracle.getPrice(asset.assetAddress);
                uint256 amountToBuy = perShareAmount * _amount;
                // TODO: Test scaling with 10+ decimal assets
                uint256 cost = (amountToBuy * price) / (10**asset.decimals);
                treasury.buyAsset{value: cost}(
                    _portfolioAddress,
                    asset.assetAddress,
                    amountToBuy
                );
            }
        }
    }

    function _sellAssets(address _portfolioAddress, uint256 _amount) internal {
        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        address[]
            memory selectedPortfolioAssetAddresses = portfolioAssetAddresses[
                _portfolioAddress
            ];
        for (uint256 i = 0; i < selectedPortfolioAssetCount; i++) {
            Asset memory asset = availableAssets[
                selectedPortfolioAssetAddresses[i]
            ];
            uint256 perShareAmount = portfolioAssetAllocations[
                _portfolioAddress
            ][asset.assetAddress].perShareAmount;
            uint256 amountToSell = (_amount * perShareAmount);
            if (amountToSell > 0) {
                treasury.sellAsset(
                    _portfolioAddress,
                    asset.assetAddress,
                    amountToSell
                );
            }
        }
    }

    function _absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a - b : b - a;
    }
}
