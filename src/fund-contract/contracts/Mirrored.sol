pragma solidity ^0.8.16;

import "./TokenERC20.sol";
import "./Reserve.sol";
import "./Oracle.sol";

contract Mirrored is TokenERC20 {
    struct AssetDetails {
        string assetName;
        string assetSymbol;
        uint8 decimals;
    }

    uint256 public commission;
    address public ownerAddress;
    AssetDetails public assetDetails;
    Oracle public oracle;
    Reserve public reserve;

    constructor(
        Oracle _oracle,
        Reserve _reserve,
        uint256 _commission,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) {
        ownerAddress = msg.sender;
        oracle = _oracle;
        reserve = _reserve;
        commission = _commission;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        assetDetails = AssetDetails(_name, _symbol, _decimals);
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

    function updateCommission(uint256 newcommission) external onlyOwner {
        commission = newcommission;
    }

    function mint(uint256 amount) external payable returns (uint256) {
        (uint256 price, ) = oracle.getPrice(address(this));
        uint256 cost = (price * amount) / (10**decimals) + commission;

        require(cost <= msg.value, "Insufficient amount transferred!");

        totalSupply += amount;
        balanceOf[msg.sender] += amount;
        reserve.deposit{value: msg.value}();
        emit Transfer(address(0), address(this), amount);
        emit Transfer(address(this), msg.sender, amount);

        return cost;
    }

    function burn(uint256 amount) external payable returns (uint256) {
        require(
            balanceOf[msg.sender] >= amount,
            "Must have sufficient balance"
        );

        (uint256 price, ) = oracle.getPrice(address(this));
        uint256 withdrawalAmount = (price * amount) /
            (10**decimals) -
            commission;

        require(
            withdrawalAmount > commission,
            "commission price exceeds withdrawal amount!"
        );

        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;
        reserve.withdraw(msg.sender, withdrawalAmount);
        emit Transfer(msg.sender, address(this), amount);
        emit Transfer(address(this), address(0), amount);

        return withdrawalAmount;
    }
}
