pragma solidity ^0.8.16;

import "./Oracle.sol";
import "./Treasury.sol";
import "./Reserve.sol";
import "./Mirrored.sol";

contract Portfolium {
    enum AssetTypes {
        Native,
        ERC20,
        Mirrored
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
    mapping(address => mapping(address => AssetAllocation))
        public portfolioAssetAllocations;
    mapping(address => mapping(address => uint256)) public portfolioBalanceOf;

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

    event PortfolioCreated(address indexed owner, string name);

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

    function addSupportedERC20Asset(address _assetAddress)
        external
        onlyOwner
        mustBeNewAsset(_assetAddress)
    {
        TokenERC20 token = TokenERC20(_assetAddress);
        Asset memory asset = Asset(
            _assetAddress,
            token.name(),
            token.symbol(),
            token.decimals(),
            AssetTypes.ERC20
        );
        availableAssetAddresses[_assetAddress] = true;
        availableAssets[_assetAddress] = asset;
        availableAssetCount++;
        treasury.addERC20Asset(_assetAddress);
    }

    function addSupportedMirroredAsset(address _assetAddress)
        external
        onlyOwner
        mustBeNewAsset(_assetAddress)
    {
        Mirrored mirrored = Mirrored(_assetAddress);
        (
            string memory assetName,
            string memory assetSymbol,
            uint8 decimals
        ) = mirrored.assetDetails();

        Asset memory asset = Asset(
            _assetAddress,
            assetName,
            assetSymbol,
            decimals,
            AssetTypes.Mirrored
        );
        availableAssetAddresses[_assetAddress] = true;
        availableAssets[_assetAddress] = asset;
        availableAssetCount++;
        treasury.addMirroredAsset(_assetAddress);
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
            commission: _initCommission,
            owner: msg.sender
        });
        portfolios[msg.sender] = portfolio;
        portfolioAssets[msg.sender][address(1)] = true;
        portfolioAssetAddresses[msg.sender].push(address(1));
        emit PortfolioCreated(msg.sender, _name);
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
        uint256 amount = diff * totalSupply;

        if (totalSupply > 0) {
            if (prevAmount > _perShareAmount) {
                treasury.sellAsset(
                    msg.sender,
                    _assetAddress,
                    amount
                );
            } else if (prevAmount < _perShareAmount) {
                uint256 assetCost = oracle.getBuyingCost(
                    _assetAddress,
                    amount
                );
                treasury.buyAsset(
                    msg.sender,
                    _assetAddress,
                    amount,
                    assetCost
                );
            }
        }
    }

    // ---------- TRADING ----------

    function buyShares(address _portfolioAddress, uint256 _amount)
        external
        payable
        mustBeExistingPortfolio(_portfolioAddress)
        mustPayPlatformCommission
    {
        uint256 cost = calculateBuyingCost(_portfolioAddress, _amount);
        require(
            cost <= msg.value,
            "Cost of shares is exceeds transferred amount!"
        );
        portfolios[_portfolioAddress].totalSupply += _amount;
        portfolioBalanceOf[_portfolioAddress][msg.sender] += _amount;
        reserve.deposit{value: platformCommission}();
        treasury.depositFor{value: msg.value - platformCommission}(msg.sender);

        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        for (uint256 i = 1; i < selectedPortfolioAssetCount; i++) {
            address assetAddress = portfolioAssetAddresses[_portfolioAddress][
                i
            ];
            uint256 amountToBuy = _getAssetAmount(
                _portfolioAddress,
                assetAddress,
                _amount
            );

            if (amountToBuy > 0) {
                uint256 assetCost = oracle.getBuyingCost(
                    assetAddress,
                    amountToBuy
                );
                treasury.buyAsset(
                    msg.sender,
                    assetAddress,
                    amountToBuy,
                    assetCost
                );
            }
        }
    }

    function sellShares(address _portfolioAddress, uint256 _amount)
        external
        payable
        mustBeExistingPortfolio(_portfolioAddress)
        mustPayPlatformCommission
        returns (uint256)
    {
        uint256 payout = _calculatePayoutPrice(_portfolioAddress, _amount);
        portfolios[_portfolioAddress].totalSupply -= _amount;
        portfolioBalanceOf[_portfolioAddress][msg.sender] -= _amount;

        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        for (uint256 i = 1; i < selectedPortfolioAssetCount; i++) {
            address assetAddress = portfolioAssetAddresses[_portfolioAddress][
                i
            ];
            uint256 amountToSell = _getAssetAmount(
                _portfolioAddress,
                assetAddress,
                _amount
            );
            if (amountToSell > 0) {
                treasury.sellAsset(
                    msg.sender,
                    assetAddress,
                    amountToSell
                );
            }
        }

        treasury.withdraw(msg.sender, msg.sender, payout);
        reserve.deposit{value: platformCommission}();

        return payout;
    }

    // ---------- GETTERS ----------

    function calculateBuyingCost(address _portfolioAddress, uint256 _amount)
        public
        view
        returns (uint256)
    {
        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        uint256 totalCost = 0;

        for (uint256 i = 0; i < selectedPortfolioAssetCount; i++) {
            address assetAddress = portfolioAssetAddresses[_portfolioAddress][
                i
            ];
            uint256 amountToBuy = _getAssetAmount(
                _portfolioAddress,
                assetAddress,
                _amount
            );
            uint256 buyingCost = oracle.getBuyingCost(
                assetAddress,
                amountToBuy
            );
            totalCost += buyingCost;
        }

        return (totalCost += platformCommission);
    }

    function getTokenPrice(address _portfolioAddress)
        public
        view
        returns (uint256)
    {
        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        uint256 tokenPrice = 0;

        for (uint256 i = 0; i < selectedPortfolioAssetCount; i++) {
            address assetAddress = portfolioAssetAddresses[_portfolioAddress][
                i
            ];
            uint256 perShareAmount = _getAssetAmount(
                _portfolioAddress,
                assetAddress,
                1
            );
            (uint256 assetPrice, ) = oracle.getPrice(assetAddress);
            uint256 price = (perShareAmount * assetPrice);
            tokenPrice += price;
        }
        return tokenPrice;
    }

    // ---------- HELPERS ----------

    function _calculatePayoutPrice(address _portfolioAddress, uint256 _amount)
        internal
        view
        returns (uint256)
    {
        uint16 selectedPortfolioAssetCount = portfolios[_portfolioAddress]
            .assetCount;
        uint256 payoutTotal = 0;

        for (uint256 i = 0; i < selectedPortfolioAssetCount; i++) {
            address assetAddress = portfolioAssetAddresses[_portfolioAddress][
                i
            ];
            uint256 amountToSell = _getAssetAmount(
                _portfolioAddress,
                assetAddress,
                _amount
            );
            uint256 payoutAmount = oracle.getPayoutAmount(
                assetAddress,
                amountToSell
            );
            payoutTotal += payoutAmount;
        }
        return payoutTotal;
    }

    function _getAssetAmount(
        address _portfolioAddress,
        address _assetAddress,
        uint256 _amount
    ) public view returns (uint256) {
        return
            portfolioAssetAllocations[_portfolioAddress][_assetAddress]
                .perShareAmount * _amount;
    }

    function _absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a - b : b - a;
    }
}
