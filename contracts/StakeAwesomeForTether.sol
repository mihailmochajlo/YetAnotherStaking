// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./AwesomeToken.sol";
import "./TetherToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakeAwesomeForTether is Ownable {
    AwesomeToken public awesomeTokenContract;
    TetherToken public tetherTokenContract;

    mapping(address => uint256) stakeValues;
    mapping(address => uint256) stakeTimes;
    mapping(address => uint256) stakeClaimTimes;

    uint256 public stakeDuration;
    uint public stakeAnnualRate;

    uint immutable SECONDS_IN_YEAR = 31536000;

    constructor(
        address awesomeTokenAddress,
        address tetherTokenAddress,
        uint256 duration,
        uint annualRate
    ) {
        awesomeTokenContract = AwesomeToken(awesomeTokenAddress);
        tetherTokenContract = TetherToken(tetherTokenAddress);
        stakeDuration = duration;
        stakeAnnualRate = annualRate;
    }

    function stake(uint256 amount) internal returns (bool) {
        require(stakeValues[msg.sender] == 0, "Already staking");
        awesomeTokenContract.mint(address(this), amount);
        stakeValues[msg.sender] = amount;
        stakeTimes[msg.sender] = block.timestamp;
        stakeClaimTimes[msg.sender] = block.timestamp;
        return true;
    }

    function stakeToken(uint256 amount) public returns (bool) {
        require(stakeValues[msg.sender] == 0, "Already staking");
        require(
            awesomeTokenContract.balanceOf(msg.sender) >= amount,
            "Insufficient balance to stake"
        );
        awesomeTokenContract.transferFrom(msg.sender, address(this), amount);
        stakeValues[msg.sender] = amount;
        stakeTimes[msg.sender] = block.timestamp;
        stakeClaimTimes[msg.sender] = block.timestamp;
        return true;
    }

    function buyToken(uint256 amount) public returns (bool) {
        tetherTokenContract.transferFrom(msg.sender, address(this), amount);
        stake(amount);
        return true;
    }

    function claim() public returns (bool) {
        require(stakeValues[msg.sender] > 0, "Not staking");
        uint256 rewardAmount = reward(msg.sender);
        awesomeTokenContract.mint(msg.sender, rewardAmount);
        stakeClaimTimes[msg.sender] = block.timestamp;
        return true;
    }

    function withdraw() public returns (bool) {
        require(stakeValues[msg.sender] > 0, "Not staking");
        require(
            block.timestamp - stakeTimes[msg.sender] >= stakeDuration,
            "Staked amount still locked"
        );
        claim();
        awesomeTokenContract.transfer(msg.sender, stakeValues[msg.sender]);
        stakeValues[msg.sender] = 0;
        stakeClaimTimes[msg.sender] = 0;
        stakeTimes[msg.sender] = 0;
        return true;
    }

    function reward(address staker) public view returns (uint256) {
        require(stakeValues[staker] > 0, "Not staking");
        return
            (stakeValues[staker] *
                (block.timestamp - stakeClaimTimes[staker]) *
                stakeAnnualRate) /
            100 /
            SECONDS_IN_YEAR;
    }

    function staked(address staker) public view returns (uint256) {
        return stakeValues[staker];
    }

    function stakedAt(address staker) public view returns (uint256) {
        return stakeTimes[staker];
    }

    function claimedAt(address staker) public view returns (uint256) {
        return stakeClaimTimes[staker];
    }
}
