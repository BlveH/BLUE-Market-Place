import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as chai from "chai";

import ChaiAsPromised from "chai-as-promised";
chai.use(ChaiAsPromised);
import { keccak256 } from "ethers/lib/utils";

const parseEther = (amount: Number) => {
  return ethers.utils.parseUnits(amount.toString(), 18);
};

describe("Vault", () => {
  let owner: SignerWithAddress,
      alice: SignerWithAddress,
      bob: SignerWithAddress,
      carol: SignerWithAddress;

  let vault: Contract;
  let token: Contract;

  beforeEach(async () => {
    await ethers.provider.send("hardhat_reset", []);
    [owner, alice, bob, carol] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault", owner);
    vault = await Vault.deploy();
    const Token = await ethers.getContractFactory("Floppy", owner);
    token = await Token.deploy();
    await vault.setToken(token.address);
  });

  it('Should deposit into the vault', async () => {
    await token.transfer(alice.address, parseEther(10 ** 6));
    await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
    await vault.connect(alice).deposit(parseEther(500*10**3));
    expect(await token.balanceOf(vault.address)).equal(parseEther(500*10**3));
  });

  it('Should withdraw', async () => {
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address)
  });

  it('Should not deposit', async () => {
    await token.transfer(alice.address, parseEther(10**6));
    await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
    await expect (vault.connect(alice).deposit(parseEther(2*10**6))).rejectedWith("Insufficient account balance");
  });

  it('Should not withdraw, Withdraw is not available ',async () => {
    //grant  withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    //setter vault functions
    await  vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(10**3));

    //alice deposit into the vault
    await token.transfer(alice.address, parseEther(10**6));
    await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
    await  vault.connect(alice).deposit(parseEther(500*10**3));


    //bob withdraw into alice address
    await  expect(vault.connect(carol).withdraw(parseEther(10**3), alice.address)).revertedWith("Caller is  not a withdrawer");
  });

  it('Should not withdraw, ERC20: transfer amount exceeds balance', async () => {
    //grant  withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    //setter vault functions
    await  vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(5*10**3));

    //alice deposit into the vault
    await token.transfer(alice.address, parseEther(10**6));
    await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
    await  vault.connect(alice).deposit(parseEther(2*10**3));

    //bob withdraw into alice address
    await  expect(vault.connect(bob).withdraw(parseEther(3*10**3), alice.address)).revertedWith("ERC20: transfer amount exceeds balance");
  });
});

