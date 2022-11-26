pragma solidity ^0.8.16;

import "./TokenERC20.sol";
import "./Oracle.sol";
import "./Treasury.sol";
import "./Reserve.sol";

contract Fund is TokenERC20 {
    enum TradeTypes {
        Buy,
        Sell
    }

    struct Trade {
        TradeTypes tradeType;
        uint256 amount;
        uint256 price;
        uint256 createdAt;
    }

    struct Shareholder {
        address shareholderAddress;
        uint256 shares;
        bool isLocked;
        uint32 tradeCount;
    }

    enum AssetTypes {
        Native,
        ERC20,
        ERC721,
        Synthetic,
        Mirrored
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

    struct AssetAllocation {
        address assetAddress;
        uint256 perShareAmount;
    }

    struct AssetWeight {
        address assetAddress;
        uint16 weight;
    }

    struct MutableProperties {
        bool isLocked;
        uint16 rebalancingTolerance;
        uint256 commission;
        bool optInRequired;
    }

    address public ownerAddress;
    address public applicationAddress;
    address[] public assetAddresses;
    address[] public managerAddresses;
    address[] public shareholderAddresses;
    uint16 public assetCount = 0;
    uint16 public managerCount = 0;
    uint64 public shareholderCount = 0;

    MutableProperties public properties;
    Treasury public treasury;
    Reserve public reserve;
    Oracle public oracle;

    mapping(address => bool) public managers;
    mapping(address => Shareholder) public shareholders;
    mapping(address => Asset) public assets;
    mapping(address => Trade[]) public trades;
    mapping(string => address[]) public assetByCategory;

    constructor(
        Oracle _oracle,
        Treasury _treasury,
        Reserve _reserve,
        address _managerAddress,
        address _applicationAddress,
        string memory _name,
        string memory _symbol,
        string memory _nativeName,
        string memory _nativeSymbol
    ) {
        ownerAddress = msg.sender;
        oracle = _oracle;
        treasury = _treasury;
        reserve = _reserve;
        properties = MutableProperties(false, 500, 50 gwei, true);
        addManager(_managerAddress);
        applicationAddress = _applicationAddress;
        name = _name;
        symbol = _symbol;
        decimals = 0;
        assets[address(1)] = Asset(
            address(1),
            _nativeName,
            _nativeSymbol,
            18,
            0,
            AssetTypes.Native,
            10000
        );
        assetAddresses.push(address(1));
        assetCount++;
    }

    // ---------- EVENTS ----------

    event ShareBought(address caller, uint256 amount);
    event ShareSold(address caller, uint256 amount);
    event NeedsRebalancing();

    // ---------- MODIFIERS ----------

    function _onlyOwner() private view {
        require(
            msg.sender == ownerAddress,
            "Caller must be the contract owner!"
        );
    }

    function _onlyManagers() private view {
        require(managers[msg.sender], "Caller must be a manager!");
    }

    function _onlyApplication() private view {
        require(
            msg.sender == applicationAddress,
            "Caller must be the application!"
        );
    }

    function _onlyOwnerOrManager() private view {
        require(
            msg.sender == ownerAddress || managers[msg.sender],
            "Caller must be the owner or manager!"
        );
    }

    function _onlyApplicationOrManager() private view {
        require(
            msg.sender == applicationAddress || managers[msg.sender],
            "Caller must be the application or manager!"
        );
    }

    function _mustBeUnlockedShareholder(address addr) private view {
        if (properties.optInRequired) {
            require(
                shareholders[addr].shareholderAddress != address(0),
                "Caller must be an approved shareholder!"
            );
        }
        require(!shareholders[addr].isLocked, "Shareholder account is locked!");
    }

    function _mustNotBeShareholder(address addr) private view {
        require(
            shareholders[addr].shareholderAddress == address(0),
            "Caller is already a shareholder"
        );
    }

    function _contracNotLocked() private view {
        require(!properties.isLocked, "Contract was locked down!");
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier onlyManagers() {
        _onlyManagers();
        _;
    }

    modifier onlyApplication() {
        _onlyApplication();
        _;
    }

    modifier onlyOwnerOrManager() {
        _onlyOwnerOrManager();
        _;
    }

    modifier onlyApplicationOrManager() {
        _onlyApplicationOrManager();
        _;
    }

    modifier mustNotBeShareholder(address addr) {
        _mustNotBeShareholder(addr);
        _;
    }

    modifier mustBeUnlockedShareholder(address addr) {
        _mustBeUnlockedShareholder(addr);
        _;
    }

    modifier callermustBeUnlockedShareholder() {
        _mustBeUnlockedShareholder(msg.sender);
        _;
    }

    modifier contracNotLocked() {
        _contracNotLocked();
        _;
    }

    // ---------- ACCOUNTS ----------

    function addManager(address newManager)
        public
        onlyOwnerOrManager
        contracNotLocked
    {
        managers[newManager] = true;
        managerAddresses.push(newManager);
        managerCount++;
    }

    function removeManager(address manager)
        public
        onlyOwnerOrManager
        contracNotLocked
    {
        managers[manager] = false;
    }

    function addShareholder(address newShareholder)
        public
        contracNotLocked
        onlyOwnerOrManager
        mustNotBeShareholder(newShareholder)
        returns (uint256)
    {
        Shareholder memory shareholder;
        shareholder.shareholderAddress = newShareholder;
        shareholders[newShareholder] = shareholder;
        shareholderAddresses.push(newShareholder);
        shareholderCount++;

        return shareholderCount;
    }

    function toggleLockShareholderAccount(address shareholder)
        public
        onlyOwnerOrManager
    {
        shareholders[shareholder].isLocked = !shareholders[shareholder]
            .isLocked;
    }

    // ---------- MUTABLE PROPERTIES ----------

    function toggleLock() public onlyOwner {
        properties.isLocked = !properties.isLocked;
    }

    function toggleOptInRequired() public onlyOwner {
        properties.optInRequired = !properties.optInRequired;
    }

    function updateCommission(uint256 newCommission) public onlyOwner {
        properties.commission = newCommission;
    }

    function updateRebalancingTolerance(uint16 newRebalancingTolerance) public onlyOwner {
        properties.rebalancingTolerance = newRebalancingTolerance;
    }

    // ---------- ASSETS ----------

    function addAsset(
        address newAssetAddress,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint8 assetTypeNr
    ) public onlyManagers contracNotLocked {
        require(
            assets[newAssetAddress].assetAddress == address(0),
            "Asset already exists!"
        );
        require(
            assetTypeNr >= 1 && assetTypeNr <= 4,
            "assetType id should be between 1 and 4"
        );

        Asset memory asset = Asset(
            newAssetAddress,
            _name,
            _symbol,
            _decimals,
            0,
            assetTypeNr == 1 ? AssetTypes.ERC20 : assetTypeNr == 2
                ? AssetTypes.ERC721
                : assetTypeNr == 3
                ? AssetTypes.Synthetic
                : AssetTypes.Mirrored,
            0
        );

        assets[newAssetAddress] = asset;
        assetAddresses.push(newAssetAddress);
        assetCount++;
        treasury.addAsset(newAssetAddress, assetTypeNr);
    }

    function updateAllocation(address assetAddress, uint256 newAmount)
        public
        contracNotLocked
        onlyApplicationOrManager
    {
        uint256 prevAmount = assets[assetAddress].perShareAmount;
        uint256 diff = absDiff(prevAmount, newAmount);
        assets[assetAddress].perShareAmount = newAmount;

        if (totalSupply > 0) {
            if (prevAmount > newAmount) {
                treasury.sellAsset(assetAddress, diff * totalSupply);
            } else if (prevAmount < newAmount) {
                treasury.buyAsset(assetAddress, diff * totalSupply);
            }
        }
    }

    function absDiff(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? a - b : b - a;
    }

    function updateMultipleAllocations(AssetAllocation[] memory newAllocations)
        public
        contracNotLocked
        onlyApplicationOrManager
    {
        for (uint256 i = 0; i < newAllocations.length; i++) {
            address assetAddress = newAllocations[i].assetAddress;
            uint256 prevAmount = assets[assetAddress].perShareAmount;

            if (prevAmount != newAllocations[i].perShareAmount) {
                updateAllocation(
                    assetAddress,
                    newAllocations[i].perShareAmount
                );
            }
        }
    }

    function updateWeight(address assetAddress, uint16 newWeight)
        public
        contracNotLocked
        onlyManagers
    {
        assets[assetAddress].weight = newWeight;
    }

    function updateWeights(AssetWeight[] memory newAssetWeights)
        public
        contracNotLocked
        onlyManagers
    {
        uint16 sum = 0;
        for (uint256 i = 0; i < newAssetWeights.length; i++) {
            sum += newAssetWeights[i].weight;
        }
        require(sum == 10000, "Sum of weights has to be 10000.");

        for (uint256 i = 0; i < newAssetWeights.length; i++) {
            updateWeight(
                newAssetWeights[i].assetAddress,
                newAssetWeights[i].weight
            );
        }
    }

    // ---------- TRADING  ----------

    function getSharePrice() public view returns (uint256) {
        uint256 sharePrice = 0;
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            Asset memory asset = assets[assetAddresses[i]];
            (uint256 assetPrice, ) = oracle.getPrice(asset.assetAddress);
            uint256 price = (asset.perShareAmount * assetPrice) /
                (10**asset.decimals);
            sharePrice += price;
        }
        return sharePrice;
    }

    function buyShares(uint256 numShares)
        public
        payable
        contracNotLocked
        callermustBeUnlockedShareholder
    {
        uint256 price = getSharePrice();
        uint256 commission = properties.commission;
        uint256 cost = price * numShares + commission;
        require(
            cost <= msg.value,
            "Cost of shares is higher than transferred amount!"
        );
        Trade memory trade = Trade(
            TradeTypes.Buy,
            numShares,
            price,
            block.timestamp
        );
        totalSupply += numShares;
        balanceOf[msg.sender] += numShares;
        shareholders[msg.sender].shares += numShares;
        shareholders[msg.sender].tradeCount++;
        trades[msg.sender].push(trade);
        reserve.deposit{value: commission}();
        buyAssets(numShares);
        emit ShareBought(msg.sender, numShares);
    }

    function sellShares(uint256 numShares)
        public
        payable
        contracNotLocked
        callermustBeUnlockedShareholder
        returns (uint256)
    {
        require(
            balanceOf[msg.sender] >= numShares,
            "Insufficient number of shares!"
        );
        uint256 commission = properties.commission;
        uint256 price = getSharePrice();
        uint256 cost = (price * numShares) - commission;
        Trade memory trade = Trade(
            TradeTypes.Sell,
            numShares,
            price,
            block.timestamp
        );
        totalSupply -= numShares;
        balanceOf[msg.sender] -= numShares;
        shareholders[msg.sender].shares -= numShares;
        shareholders[msg.sender].tradeCount++;
        trades[msg.sender].push(trade);
        reserve.deposit{value: commission}();

        sellAssets(numShares);
        treasury.withdraw(msg.sender, cost);
        emit ShareSold(msg.sender, numShares);

        return cost;
    }

    function buyAssets(uint256 amount) internal {
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            Asset memory asset = assets[assetAddresses[i]];
            (uint256 price, ) = oracle.getPrice(asset.assetAddress);
            uint256 amountToMint = asset.perShareAmount * amount;
            uint256 cost = (amountToMint * price) / (10**asset.decimals);
            if (amountToMint > 0) {
                treasury.buyAsset{value: cost}(
                    asset.assetAddress,
                    amountToMint
                );
            }
        }
    }

    function sellAssets(uint256 amount) internal {
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            Asset memory asset = assets[assetAddresses[i]];
            uint256 amountToSell = (amount * asset.perShareAmount);
            if (amountToSell > 0) {
                treasury.sellAsset(asset.assetAddress, amountToSell);
            }
        }
    }

    function getFundValue() public view returns (uint256) {
        uint256 sharePrice = getSharePrice();
        return sharePrice * totalSupply;
    }

    receive() external payable {}
}
