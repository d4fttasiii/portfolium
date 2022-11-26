pragma solidity ^0.8.16;

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IERC721.sol";
import "./Synthetic.sol";
import "./Mirrored.sol";

contract Treasury {
    enum AssetTypes {
        Native,
        ERC20,
        ERC721,
        Synthetic,
        Mirrored
    }

    struct Asset {
        address assetAddress;
        AssetTypes assetType;
    }

    IUniswapV2Router02 public uniswapRouter;

    address public ownerAddress;
    address public fundAddress;

    mapping(address => Asset) assets;

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

    function _onlyFund() private view {
        require(msg.sender == fundAddress, "Caller must be the fund contract!");
    }

    modifier onlyFund() {
        _onlyFund();
        _;
    }

    function setFundAddress(address newfundAddress) public onlyOwner {
        fundAddress = newfundAddress;
    }

    function addAsset(address assetAddress, uint8 assetType) public onlyFund {
        require(
            assetType >= 1 && assetType <= 4,
            "assetType id should be between 1 and 4"
        );

        if (assetType == 1) {
            assets[assetAddress] = Asset(assetAddress, AssetTypes.ERC20);
        } else if (assetType == 2) {
            assets[assetAddress] = Asset(assetAddress, AssetTypes.ERC721);
        } else if (assetType == 3) {
            assets[assetAddress] = Asset(assetAddress, AssetTypes.Synthetic);
        } else if (assetType == 4) {
            assets[assetAddress] = Asset(assetAddress, AssetTypes.Mirrored);
        }
    }

    function buyAsset(address assetAddress, uint256 amount)
        public
        payable
        onlyFund
    {
        Asset memory asset = assets[assetAddress];
        if (asset.assetType == AssetTypes.Synthetic) {
            Synthetic synthetic = Synthetic(assetAddress);
            synthetic.mint{value: msg.value}(amount);
        }
        if (asset.assetType == AssetTypes.Mirrored) {
            Mirrored mirrored = Mirrored(assetAddress);
            mirrored.mint{value: msg.value}(amount);
        }
        if (asset.assetType == AssetTypes.ERC20) {
            convertToErc20(assetAddress, amount);
        }
        // if (asset.assetType == AssetTypes.ERC721) {
        //     // ignore for now
        // }
        if (asset.assetType == AssetTypes.Native) {
            // just hodl nothing TODO
        }
    }

    function sellAsset(address assetAddress, uint256 amount)
        public
        payable
        onlyFund
    {
        Asset memory asset = assets[assetAddress];
        if (asset.assetType == AssetTypes.Synthetic) {
            Synthetic synthetic = Synthetic(assetAddress);
            synthetic.burn(amount);
        }
        if (asset.assetType == AssetTypes.Mirrored) {
            Mirrored mirrored = Mirrored(assetAddress);
            mirrored.burn(amount);
        }
        if (asset.assetType == AssetTypes.ERC20) {
            convertFromErc20(assetAddress, amount);
        }
        // if (asset.assetType == AssetTypes.ERC721) {
        //     // ignore for now
        // }
        if (asset.assetType == AssetTypes.Native) {
            // just hodl nothing TODO
        }
    }

    function withdraw(address recipient, uint256 amount)
        public
        payable
        onlyFund
    {
        payable(recipient).transfer(amount);
    }

    function getBalanceOf(address assetAddress) public view returns (uint256) {
        Asset memory asset = assets[assetAddress];
        if (asset.assetAddress == address(0)) {
            return 0;
        }
        if (
            asset.assetType == AssetTypes.ERC20 ||
            asset.assetType == AssetTypes.Synthetic
        ) {
            IERC20 token = IERC20(assetAddress);
            return token.balanceOf(address(this));
        }
        if (asset.assetType == AssetTypes.ERC721) {
            IERC721 token = IERC721(assetAddress);
            return token.balanceOf(address(this));
        }

        return address(this).balance;
    }

    function convertToErc20(address assetAddress, uint256 amount) internal {
        uint256 deadline = block.timestamp + 30;
        uniswapRouter.swapETHForExactTokens(
            amount,
            getPathForNativeToErc20(assetAddress),
            address(this),
            deadline
        );

        // refund leftover ETH to user
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "refund failed");
    }

    function convertFromErc20(address assetAddress, uint256 amount) internal {
        uint256 deadline = block.timestamp + 30;
        uniswapRouter.swapExactTokensForETH(
            amount,
            1,
            getPathForErc20ToNative(assetAddress),
            address(this),
            deadline
        );
    }

    receive() external payable {}

    function getPathForNativeToErc20(address assetAddress)
        private
        view
        returns (address[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = assetAddress;

        return path;
    }

    function getPathForErc20ToNative(address assetAddress)
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
