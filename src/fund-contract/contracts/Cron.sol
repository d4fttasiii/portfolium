pragma solidity ^0.8.16;

import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./Fund.sol";
import "./Reserve.sol";
import "./Oracle.sol";
import "./Mirrored.sol";
import "./TokenERC20.sol";

contract Cron {
    enum Mode {
        Amount,
        Price
    }

    enum Operations {
        Buy,
        Sell
    }

    enum ContractTypes {
        Mirrored,
        ERC20,
        Portfolio
    }

    struct Job {
        address ownerAddress;
        bool isActive;
        Mode mode;
        ContractTypes contractType;
        address contractAddress;
        uint64 recurringInterval;
        uint256 amount;
        Operations operation;
        uint256 createdAt;
        uint256 lastExecution;
    }

    address public ownerAddress;
    address public applicationAddress;
    uint256 public commission;

    Fund public fund;
    Reserve public reserve;
    Oracle public oracle;
    IUniswapV2Router02 public uniswapRouter;

    mapping(address => uint256) jobUserBalances;
    mapping(address => uint32) jobUserCount;
    mapping(address => Job[]) jobs;

    constructor(
        Fund _fund,
        Reserve _reserve,
        Oracle _oracle,
        address _uniswapRouterAddress,
        uint256 _commission
    ) {
        ownerAddress = msg.sender;
        fund = _fund;
        reserve = _reserve;
        oracle = _oracle;
        uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);
        commission = _commission;
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
            msg.sender == applicationAddress,
            "Caller must be the application!"
        );
    }

    modifier onlyApplication() {
        _onlyApplication();
        _;
    }

    function _mustHaveCorrectInputs(uint64 _interval) private pure {
        require(
            _interval >= 5 && _interval <= 525960,
            "Interval should be between 5 and 525960 minutes"
        );
    }

    modifier mustHaveCorrectInputs(uint64 _interval) {
        _mustHaveCorrectInputs(_interval);
        _;
    }

    function _mustPayCommission() private view {
        require(msg.value >= commission, "Min. commission has to be paid!");
    }

    modifier mustPayCommission() {
        _mustPayCommission();
        _;
    }

    function updateApplicationAddress(address newApplicationAddress)
        public
        onlyOwner
    {
        applicationAddress = newApplicationAddress;
    }

    function updateCommission(uint256 newCommission) public onlyOwner {
        commission = newCommission;
    }

    function deposit() public payable {
        jobUserBalances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public payable {
        uint256 balance = jobUserBalances[msg.sender];
        {
            require(balance >= amount, "Insufficient balance!");
        }
        jobUserBalances[msg.sender] -= amount;
    }

    function createRecurringMirroredBuyJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _amount
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Mirrored,
            Operations.Buy,
            Mode.Amount,
            _contractAddress,
            _amount
        );
    }

    function createRecurringMirroredSellJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _amount
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Mirrored,
            Operations.Sell,
            Mode.Amount,
            _contractAddress,
            _amount
        );
    }

    function createRecurringErc20BuyJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _amount
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.ERC20,
            Operations.Buy,
            Mode.Amount,
            _contractAddress,
            _amount
        );
    }

    function createRecurringErc20SellJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _amount
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.ERC20,
            Operations.Sell,
            Mode.Amount,
            _contractAddress,
            _amount
        );
    }

    function createRecurringPortfolioBuyJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _amount
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Portfolio,
            Operations.Buy,
            Mode.Amount,
            _contractAddress,
            _amount
        );
    }

    function createRecurringPortfolioSellJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _amount
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Portfolio,
            Operations.Sell,
            Mode.Amount,
            _contractAddress,
            _amount
        );
    }

    function createRecurringMirroredPriceLimitedBuyJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _priceLimit
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Mirrored,
            Operations.Buy,
            Mode.Price,
            _contractAddress,
            _priceLimit
        );
    }

    function createRecurringMirroredPriceLimitedSellJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _priceLimit
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Mirrored,
            Operations.Sell,
            Mode.Price,
            _contractAddress,
            _priceLimit
        );
    }

    function createRecurringErc20PriceLimitedBuyJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _priceLimit
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.ERC20,
            Operations.Buy,
            Mode.Price,
            _contractAddress,
            _priceLimit
        );
    }

    function createRecurringErc20PriceLimitedSellJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _priceLimit
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.ERC20,
            Operations.Sell,
            Mode.Price,
            _contractAddress,
            _priceLimit
        );
    }

    function createRecurringPortfolioPriceLimitedBuyJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _priceLimit
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Portfolio,
            Operations.Buy,
            Mode.Price,
            _contractAddress,
            _priceLimit
        );
    }

    function createRecurringPortfolioPriceLimitedSellJob(
        uint64 _recurringInterval,
        address _contractAddress,
        uint256 _priceLimit
    )
        external
        payable
        mustPayCommission
        mustHaveCorrectInputs(_recurringInterval)
    {
        _createRecurringJob(
            _recurringInterval,
            ContractTypes.Portfolio,
            Operations.Sell,
            Mode.Price,
            _contractAddress,
            _priceLimit
        );
    }

    function toggleJobActiveState(uint32 jobIndex) external {
        Job memory job = jobs[msg.sender][jobIndex];
        require(job.createdAt > 0, "Job doesn't exist");
        jobs[msg.sender][jobIndex].isActive = !job.isActive;
    }

    function executeJob(address _jobUserAddress, uint32 _jobIndex)
        external
        onlyApplication
    {
        Job memory job = jobs[_jobUserAddress][_jobIndex];

        require(job.isActive, "Job must be active");
        require(
            job.lastExecution + job.recurringInterval <= block.timestamp,
            "Job not ready for execution yet"
        );

        if (job.mode == Mode.Amount) {
            if (job.contractType == ContractTypes.ERC20) {
                _executeErc20Job(job);
            } else if (job.contractType == ContractTypes.Portfolio) {
                _executePortfolioJob(job);
            } else if (job.contractType == ContractTypes.Mirrored) {
                _executeMirroredJob(job);
            }
        } else if (job.mode == Mode.Price) {
            if (job.contractType == ContractTypes.ERC20) {
                _executeErc20PriceLimitedJob(job);
            } else if (job.contractType == ContractTypes.Portfolio) {
                _executePortfolioPriceLimitedJob(job);
            } else if (job.contractType == ContractTypes.Mirrored) {
                _executeMirroredPriceLimitedJob(job);
            }
        }
        jobs[_jobUserAddress][_jobIndex].lastExecution = block.timestamp;
    }

    receive() external payable {}

    //** INTERNAL **/

    function _executeErc20Job(Job memory _job) internal {
        uint256 balance = jobUserBalances[_job.ownerAddress];
        uint256 cronCommission = commission;

        if (_job.operation == Operations.Buy) {
            (uint256 price, ) = oracle.getPrice(_job.contractAddress);
            uint256 estimatedCost = (price * _job.amount) +
                cronCommission +
                1 ether;

            require(estimatedCost <= balance, "Insufficient user balance!");

            uint256 actualCost = _convertToErc20(
                _job.contractAddress,
                _job.amount
            );
            _deductCommissionAndTransferTokenToOwner(
                _job.contractAddress,
                _job.ownerAddress,
                _job.amount,
                actualCost,
                cronCommission
            );
        } else if (_job.operation == Operations.Sell) {
            require(cronCommission <= balance, "Insufficient user balance!");
            uint256 received = _convertFromErc20(
                _job.contractAddress,
                _job.amount
            );
            _deductCommissionAndTransferNativeToOwner(
                _job.ownerAddress,
                received,
                cronCommission
            );
        }
    }

    function _executeMirroredJob(Job memory _job) internal {
        Mirrored mirroredAsset = Mirrored(_job.contractAddress);
        uint256 balance = jobUserBalances[_job.ownerAddress];
        uint256 cronCommission = commission;
        uint256 mirroredCommission = mirroredAsset.commission();
        (uint256 price, ) = oracle.getPrice(_job.contractAddress);

        if (_job.operation == Operations.Buy) {
            uint256 cost = price * _job.amount;
            uint256 estimatedCost = cost +
                cronCommission +
                mirroredCommission +
                1 ether;

            require(estimatedCost <= balance, "Insufficient user balance!");

            mirroredAsset.mint{value: cost + mirroredCommission}(_job.amount);
            _deductCommissionAndTransferTokenToOwner(
                _job.contractAddress,
                _job.ownerAddress,
                _job.amount,
                cost + mirroredCommission,
                cronCommission
            );
        } else if (_job.operation == Operations.Sell) {
            require(cronCommission <= balance, "Insufficient user balance!");
            uint256 received = mirroredAsset.burn(_job.amount);
            _deductCommissionAndTransferNativeToOwner(
                _job.ownerAddress,
                received,
                cronCommission
            );
        }
    }

    function _executePortfolioJob(Job memory _job) internal {
        uint256 balance = jobUserBalances[_job.ownerAddress];
        uint256 cronCommission = commission;
        (, , uint256 fundCommission, ) = fund.properties();

        if (_job.operation == Operations.Buy) {
            uint256 cost = (fund.getSharePrice() * _job.amount) +
                fundCommission;
            require(
                cost + cronCommission <= balance,
                "Insufficient user balance!"
            );

            fund.buyShares{value: cost}(_job.amount);
            _deductCommissionAndTransferTokenToOwner(
                _job.contractAddress,
                _job.ownerAddress,
                _job.amount,
                cost,
                cronCommission
            );
        } else if (_job.operation == Operations.Sell) {
            require(
                cronCommission + fundCommission <= balance,
                "Insufficient user balance!"
            );
            uint256 received = fund.sellShares(_job.amount);
            _deductCommissionAndTransferNativeToOwner(
                _job.ownerAddress,
                received,
                cronCommission
            );
        }
    }

    function _executeErc20PriceLimitedJob(Job memory _job) internal {
        uint256 balance = jobUserBalances[_job.ownerAddress];
        uint256 cronCommission = commission;

        if (_job.operation == Operations.Buy) {
            (uint256 price, ) = oracle.getPrice(_job.contractAddress);
            uint8 decimals = TokenERC20(_job.contractAddress).decimals();
            uint256 decimalScale = (10**decimals);
            uint256 amountToBuy = ((_job.amount / price) / decimalScale) *
                decimalScale;
            uint256 estimatedCost = (price * amountToBuy) +
                cronCommission +
                1 ether;

            require(estimatedCost <= balance, "Insufficient user balance!");

            uint256 actualCost = _convertToErc20(
                _job.contractAddress,
                amountToBuy
            );
            _deductCommissionAndTransferTokenToOwner(
                _job.contractAddress,
                _job.ownerAddress,
                amountToBuy,
                actualCost,
                cronCommission
            );
        } else if (_job.operation == Operations.Sell) {
            // require(cronCommission <= balance, "Insufficient user balance!");
            // uint256 received = _convertFromErc20(
            //     _job.contractAddress,
            //     _job.amount
            // );
            // _deductCommissionAndTransferNativeToOwner(
            //     _job.ownerAddress,
            //     received,
            //     cronCommission
            // );
            // TODO
        }
    }

    function _executeMirroredPriceLimitedJob(Job memory _job) internal {
        Mirrored mirroredAsset = Mirrored(_job.contractAddress);
        uint256 balance = jobUserBalances[_job.ownerAddress];
        uint256 cronCommission = commission;
        uint256 mirroredCommission = mirroredAsset.commission();
        (uint256 price, ) = oracle.getPrice(_job.contractAddress);

        // TODO
        // if (_job.operation == Operations.Buy) {
            // uint256 cost = price * _job.amount;
            // uint256 estimatedCost = cost +
            //     cronCommission +
            //     mirroredCommission +
            //     1 ether;

            // require(estimatedCost <= balance, "Insufficient user balance!");

            // mirroredAsset.mint{value: cost + mirroredCommission}(_job.amount);
        //     _deductCommissionAndTransferTokenToOwner(
        //         _job.contractAddress,
        //         _job.ownerAddress,
        //         _job.amount,
        //         cost + mirroredCommission,
        //         cronCommission
        //     );
        // } else if (_job.operation == Operations.Sell) {
        //     require(cronCommission <= balance, "Insufficient user balance!");
        //     uint256 received = mirroredAsset.burn(_job.amount);
        //     _deductCommissionAndTransferNativeToOwner(
        //         _job.ownerAddress,
        //         received,
        //         cronCommission
        //     );
        // }
    }

    function _executePortfolioPriceLimitedJob(Job memory _job) internal {
        uint256 balance = jobUserBalances[_job.ownerAddress];
        uint256 cronCommission = commission;
        (, , uint256 fundCommission, ) = fund.properties();
        // TODO
        // if (_job.operation == Operations.Buy) {
        //     uint256 cost = (fund.getSharePrice() * _job.amount) +
        //         fundCommission;
        //     require(
        //         cost + cronCommission <= balance,
        //         "Insufficient user balance!"
        //     );

        //     fund.buyShares{value: cost}(_job.amount);
        //     reserve.deposit{value: cronCommission}();
        //     fund.transfer(_job.ownerAddress, _job.amount);
        //     jobUserBalances[_job.ownerAddress] -= cost;
        // } else if (_job.operation == Operations.Sell) {
        //     require(
        //         cronCommission + fundCommission <= balance,
        //         "Insufficient user balance!"
        //     );
        //     uint256 received = fund.sellShares(_job.amount);
        //     _deductCommissionAndTransferNativeToOwner(
        //         _job.ownerAddress,
        //         received,
        //         cronCommission
        //     );
        // }
    }

    function _deductCommissionAndTransferNativeToOwner(
        address _ownerAddress,
        uint256 _received,
        uint256 _commission
    ) internal {
        reserve.deposit{value: _commission}();
        jobUserBalances[_ownerAddress] -= _commission;
        payable(_ownerAddress).transfer(_received - _commission);
    }

    function _deductCommissionAndTransferTokenToOwner(
        address _tokenAddress,
        address _ownerAddress,
        uint256 _received,
        uint256 _cost,
        uint256 _commission
    ) internal {
        reserve.deposit{value: _commission}();
        jobUserBalances[_ownerAddress] -= (_commission + _cost);
        IERC20(_tokenAddress).transfer(_ownerAddress, _received);
    }

    function _createRecurringJob(
        uint64 _recurringInterval,
        ContractTypes _contractType,
        Operations _opertaion,
        Mode _mode,
        address _contractAddress,
        uint256 _amount
    ) internal {
        Job memory newJob = Job(
            msg.sender,
            true,
            _mode,
            _contractType,
            _contractAddress,
            _recurringInterval,
            _amount,
            _opertaion,
            block.timestamp,
            0
        );

        jobUserCount[msg.sender]++;
        jobs[msg.sender].push(newJob);
    }

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
