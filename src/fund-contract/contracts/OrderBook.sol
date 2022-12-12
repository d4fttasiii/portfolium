pragma solidity ^0.8.16;

import "./Mirrored.sol";
import "./interfaces/IERC20.sol";

contract OrderBook {

    enum AssetTypes {
        Native,
        ERC20,
        Mirrored
    }

    enum OrderTypes {
        Buy,
        Sell
    }

    enum OrderExecutionTypes {
        Limit
    }

    enum OrderStatus {
        Open,
        PartiallyCompleted,
        Completed
    }

    struct Order {
        uint256 id;
        uint64 marketId;
        address ownerAddress;
        OrderTypes orderType;
        OrderExecutionTypes orderExecutionType;
        uint256 price;
        uint256 volume;
        uint256 volumeRemaining;
        uint256 timestamp;
        OrderStatus status;
        uint256 completedTimestamp;
    }

    struct Market {
        uint64 id;
        address assetOneAddress;
        address assetTwoAddress;
    }

    uint64 public marketCounter;
    uint256 public orderCounter;
    uint256 public commission;

    address public ownerAddress;
    mapping(uint64 => Market) public markets;
    mapping(uint256 => Order) public orders;
    mapping(address => AssetTypes) assetTypes;

    event OrderCreated(uint256 indexed id);

    constructor(uint256 _initCommission) {
        ownerAddress = msg.sender;
        commission = _initCommission;
    }

    // ---------- HELPERS ----------

    function _executeBuyOrder(uint256 _orderId, uint256[] memory _fullfillingOrderIds) external {
        Order memory order = orders[_orderId];
        require(
            order.status == OrderStatus.Open || 
            order.status == OrderStatus.PartiallyCompleted, 
            ""
        );
        require(
            order.orderType == OrderTypes.Buy,
            "Order must be a buy order"
        );

        Market memory market = markets[order.marketId];

        for (uint256 i = 0; i <= _fullfillingOrderIds.length; i++) {
            Order memory fullfillingOrder = orders[_fullfillingOrderIds[i]];
            if (fullfillingOrder.volumeRemaining > order.volumeRemaining) {
                _completeOrder(_orderId);
                _partiallyCompleteOrder(_fullfillingOrderIds[i], order.volumeRemaining);
            } else if (fullfillingOrder.volumeRemaining == order.volumeRemaining) {
                _completeOrder(_orderId);
                _completeOrder(_fullfillingOrderIds[i]);
            } else {
                _completeOrder(_fullfillingOrderIds[i]);
                _partiallyCompleteOrder(_orderId, fullfillingOrder.volumeRemaining);
            }
        }
    }

    function _completeOrder(uint256 _orderId) internal {
        orders[_orderId].volumeRemaining = 0;
        orders[_orderId].status = OrderStatus.Completed;
        orders[_orderId].completedTimestamp = block.timestamp;
    }

    function _partiallyCompleteOrder(uint256 _orderId, uint256 _volumeDeduction) internal {        
        orders[_orderId].volumeRemaining -= _volumeDeduction;
        orders[_orderId].status = OrderStatus.PartiallyCompleted;
    }

    function _createOrder(
        uint64 _marketId, 
        OrderTypes _orderType, 
        OrderExecutionTypes _orderExecutionType,
        uint256 _price,
        uint256 _volume
    ) internal returns(uint256) {
        Order memory order = Order({
            id: orderCounter,
            marketId: _marketId,
            ownerAddress: msg.sender,
            orderType: _orderType,
            orderExecutionType: _orderExecutionType,
            price: _price,
            volume: _volume,
            volumeRemaining: _volume,
            timestamp: block.timestamp,
            status: OrderStatus.Open,
            completedTimestamp: 0
        });
        orders[orderCounter] = order;
        orderCounter++;

        emit OrderCreated(order.id);

        return order.id;
    }

    function _createMarket(address _assetOneAddress, address _assetTwoAddress) internal {
        markets[marketCounter] = Market({
            id: marketCounter,
            assetOneAddress: _assetOneAddress,
            assetTwoAddress: _assetTwoAddress
        });
        marketCounter++;
    }
}