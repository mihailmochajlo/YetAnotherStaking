// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/IERC20.sol";
import "./Ownable.sol";

contract TetherToken is IERC20, Ownable {
    string public name;
    string public symbol;
    uint8 public decimals;

    uint256 private _totalSupply;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint)) public allowances;

    constructor(
        uint256 _initialSupply,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) {
        _totalSupply = _initialSupply;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        balances[owner()] = _initialSupply;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(
            amount <= balances[msg.sender],
            "ERC20: Token balance is less then amount"
        );
        require(to != address(0), "ERC20: Transfer to the zero address");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256) {
        return allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(
            !((amount != 0) && (allowances[msg.sender][spender] != 0)),
            "To reduce/increase allowance, first set to 0"
        );
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(
            from != msg.sender,
            "ERC20: trying to use transferFrom by owner"
        );
        require(
            allowances[from][msg.sender] >= amount,
            "ERC20: Amount exceeds allowance"
        );
        require(
            balances[from] >= amount,
            "ERC20: Token balance is less then amount"
        );
        require(to != address(0), "ERC20: Transfer to the zero address");
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function issue(uint256 amount) public onlyOwner {
        balances[owner()] += amount;
        _totalSupply += amount;
        emit Issue(amount);
    }

    function redeem(uint256 amount) public onlyOwner {
        require(
            balances[owner()] >= amount,
            "Owner balance is less then amount to redeem"
        );
        balances[owner()] -= amount;
        _totalSupply -= amount;
        emit Redeem(amount);
    }

    event Issue(uint256 amount);
    event Redeem(uint256 amount);
}
