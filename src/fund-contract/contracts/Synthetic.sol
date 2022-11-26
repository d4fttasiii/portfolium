pragma solidity ^0.8.16;

import "./TokenERC20.sol";
import "./Oracle.sol";

contract Synthetic is TokenERC20 {
    enum OrderStates {
        Open,
        Completed
    }

    struct Order {
        uint256 amount;
        OrderStates state;
        uint256 createdAt;
        uint256 completedAt;
    }

    struct AssetDetails {
        string companyName;
        string companyId;
        string depotId;
        string assetName;
        string assetSymbol;
        uint8 decimals;
    }

    address public ownerAddress;
    address public applicationAddress;
    address public treasuryAddress;

    Order[] public buyOrders;
    Order[] public sellOrders;
    AssetDetails public assetDetails;
    Oracle public oracle;

    uint256 public sellOrderCount;
    uint256 public buyOrderCount;
    uint256 public openOrderCount;
    bool public rebalancingRequired;

    constructor(
        Oracle _oracle,
        address _treasuryAddress,
        address _applicationAddress,
        string memory _companyName,
        string memory _companyId,
        string memory _depotId,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) {
        ownerAddress = msg.sender;
        oracle = _oracle;
        treasuryAddress = _treasuryAddress;
        applicationAddress = _applicationAddress; 
        assetDetails = AssetDetails(
            _companyName,
            _companyId,
            _depotId,
            _name,
            _symbol,
            _decimals
        );
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
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

    function _onlyApplication() private view {
        require(
            applicationAddress == msg.sender,
            "Caller must be the application account!"
        );
    }

    modifier onlyApplication() {
        _onlyApplication();
        _;
    }

    function _onlyTreasury() private view {
        require(
            msg.sender == treasuryAddress,
            "Caller must be the treasury contract!"
        );
    }

    modifier onlyTreasury() {
        _onlyTreasury();
        _;
    }

    event NewBuyOrder(uint256 index);
    event NewSellOrder(uint256 index);

    function setApplicationAddress(address newApplicationAddress)
        public
        onlyOwner
    {
        applicationAddress = newApplicationAddress;
    }

    function setTreasuryAddress(address newTreasuryAddress) public onlyOwner {
        treasuryAddress = newTreasuryAddress;
    }

    function mint(uint256 amount) public payable onlyTreasury {
        totalSupply += amount;
        balanceOf[msg.sender] += amount;
        buyOrders.push(Order(amount, OrderStates.Open, block.timestamp, 0));
        buyOrderCount++;
        openOrderCount++;
        emit NewBuyOrder(buyOrderCount - 1);
        emit Transfer(address(0), address(this), amount);
        emit Transfer(address(this), msg.sender, amount);
    }

    function burn(uint256 amount)
        public
        payable
        onlyTreasury
        returns (uint256)
    {
        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;
        sellOrders.push(Order(amount, OrderStates.Open, block.timestamp, 0));
        sellOrderCount++;
        openOrderCount++;
        (uint256 price, ) = oracle.getPrice(address(this));
        uint256 cost = price * amount / (10**decimals);
        payable(treasuryAddress).transfer(cost);
        emit NewSellOrder(sellOrderCount - 1);
        emit Transfer(msg.sender, address(this), amount);
        emit Transfer(address(this), address(0), amount);
        return cost;
    }

    function buyOrderCompleted(uint256 index) public onlyApplication {
        buyOrders[index].state = OrderStates.Completed;
        buyOrders[index].completedAt = block.timestamp;
        openOrderCount -= 1;
    }

    function sellOrderCompleted(uint256 index) public onlyApplication {
        sellOrders[index].state = OrderStates.Completed;
        sellOrders[index].completedAt = block.timestamp;
        openOrderCount -= 1;
    }

    function withdraw(uint256 amount) public payable onlyApplication {
        payable(applicationAddress).transfer(amount);
    }
}
