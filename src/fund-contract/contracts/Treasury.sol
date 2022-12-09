pragma solidity ^0.8.16;

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IERC721.sol";
import "./Mirrored.sol";

contract Treasury {
    enum AssetTypes {
        Native,
        ERC20,
        Mirrored
    }

    struct Asset {
        address assetAddress;
        AssetTypes assetType;
    }

    IUniswapV2Router02 public uniswapRouter;

    address public ownerAddress;
    address public portfoliumAddress;

    mapping(address => mapping(address => uint256)) public balances;
    mapping(address => Asset) public assets;

    constructor(address _uniswapRouterAddress) {
        ownerAddress = msg.sender;
        uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);
        assets[address(1)] = Asset(address(1), AssetTypes.Native);
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

    function _onlyPortfolium() private view {
        require(
            msg.sender == portfoliumAddress,
            "Caller must be the Portfolium contract!"
        );
    }

    modifier onlyPortfolium() {
        _onlyPortfolium();
        _;
    }

    function setPortfoliumAddress(address _portfoliumAddresss)
        public
        onlyOwner
    {
        portfoliumAddress = _portfoliumAddresss;
    }

    function addERC20Asset(address assetAddress) public onlyPortfolium {
        assets[assetAddress] = Asset(assetAddress, AssetTypes.ERC20);
    }

    function addMirroredAsset(address assetAddress) public onlyPortfolium {
        assets[assetAddress] = Asset(assetAddress, AssetTypes.Mirrored);
    }

    function buyAsset(
        address _ownerAddress,
        address _assetAddress,
        uint256 _amount,
        uint256 _cost
    ) external onlyPortfolium {
        Asset memory asset = assets[_assetAddress];
        if (asset.assetType == AssetTypes.Mirrored) {
            Mirrored mirrored = Mirrored(_assetAddress);
            uint256 cost = mirrored.mint{value: _cost}(_amount);
            balances[_ownerAddress][asset.assetAddress] += _amount;
            balances[_ownerAddress][address(1)] -= cost;
        }
        if (asset.assetType == AssetTypes.ERC20) {
            uint256 cost = _convertToErc20(_assetAddress, _amount);
            balances[_ownerAddress][asset.assetAddress] += _amount;
            balances[_ownerAddress][address(1)] -= cost;
        }
    }

    function sellAsset(
        address _ownerAddress,
        address _assetAddress,
        uint256 _amount
    ) external payable onlyPortfolium {
        // TODO: Check if balance available
        Asset memory asset = assets[_assetAddress];
        if (asset.assetType == AssetTypes.Mirrored) {
            Mirrored mirrored = Mirrored(_assetAddress);
            uint256 cost = mirrored.burn(_amount);
            balances[_ownerAddress][asset.assetAddress] -= _amount;
            balances[_ownerAddress][address(1)] += cost;
        }
        if (asset.assetType == AssetTypes.ERC20) {
            uint256 cost = _convertFromErc20(_assetAddress, _amount);
            balances[_ownerAddress][asset.assetAddress] -= _amount;
            balances[_ownerAddress][address(1)] += cost;
        }
    }

    function withdraw(
        address _ownerAddress,
        address _recipient,
        uint256 _amount
    ) public payable onlyPortfolium {
        balances[_ownerAddress][address(1)] -= _amount;
        payable(_recipient).transfer(_amount);
    }

    function deposit(address _ownerAddress) external payable {
        balances[_ownerAddress][address(1)] += msg.value;
    }

    receive() external payable {}

    function getBalanceOf(address assetAddress) public view returns (uint256) {
        Asset memory asset = assets[assetAddress];
        if (asset.assetAddress == address(0)) {
            return 0;
        }
        if (
            asset.assetType == AssetTypes.ERC20 ||
            asset.assetType == AssetTypes.Mirrored
        ) {
            IERC20 token = IERC20(assetAddress);
            return token.balanceOf(address(this));
        }

        return address(this).balance;
    }

    // ---------- HELPERS ----------

    function _convertToErc20(address assetAddress, uint256 amount)
        internal
        returns (uint256)
    {
        uint256 deadline = block.timestamp + 30;
        uint256[] memory amounts = uniswapRouter.swapETHForExactTokens(
            amount,
            _getPathForNativeToErc20(assetAddress),
            address(this),
            deadline
        );

        // refund leftover ETH to user
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "refund failed");

        return amounts[amounts.length - 1];
    }

    function _convertFromErc20(address assetAddress, uint256 amount)
        internal
        returns (uint256)
    {
        uint256 deadline = block.timestamp + 30;
        uint256[] memory amounts = uniswapRouter.swapExactTokensForETH(
            amount,
            1,
            _getPathForErc20ToNative(assetAddress),
            address(this),
            deadline
        );

        return amounts[amounts.length - 1];
    }

    function _getPathForNativeToErc20(address assetAddress)
        private
        view
        returns (address[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = assetAddress;

        return path;
    }

    function _getPathForErc20ToNative(address assetAddress)
        private
        view
        returns (address[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = assetAddress;
        path[1] = uniswapRouter.WETH();

        return path;
    }
}
