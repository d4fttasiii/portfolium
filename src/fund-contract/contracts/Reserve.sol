pragma solidity ^0.8.16;

contract Reserve {
    address public ownerAddress;
    mapping(address => bool) public accessingAccounts;
    address[] public accessingAccountAddresses;
    uint16 public accessingAccountCount; 

    constructor() {
        ownerAddress = msg.sender;
        addAcount(msg.sender);
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

    function _mustHaveAccess() private view {
        require(accessingAccounts[msg.sender], "Caller must have access!");
    }

    modifier mustHaveAccess() {
        _mustHaveAccess();
        _;
    }

    function addAcount(address accountAddress) public onlyOwner {
        accessingAccounts[accountAddress] = true;
        accessingAccountAddresses.push(accountAddress);
        accessingAccountCount++;
    }

    function removeAccount(address accountAddress) external onlyOwner {
        accessingAccounts[accountAddress] = false;
    }

    function deposit() external payable {}

    function withdraw(address recipient, uint256 amount)
        external
        payable
        mustHaveAccess
    {
        payable(recipient).transfer(amount);
    }
}
