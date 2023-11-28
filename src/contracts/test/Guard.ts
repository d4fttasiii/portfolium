import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { PortfoliumGuard } from "../typechain-types";

describe("PortfoliumGuard", function () {
  let guard: PortfoliumGuard;
  let admin: any,
    signer1: any,
    signer2: any,
    manager: any,
    nonSigner: any,
    portfolium: any,
    user: any;

  beforeEach(async function () {
    [admin, signer1, signer2, manager, nonSigner, portfolium, user] =
      await ethers.getSigners();
    const PortfoliumGuard = await ethers.getContractFactory("PortfoliumGuard");
    guard = await PortfoliumGuard.deploy([signer1.address, signer2.address], 2);

    const role = await guard.PORTFOLIUM_ROLE();
    const tx = await guard.createRequest(portfolium.address, role);
    const receipt = await tx.wait();

    if (receipt) {
      const requestId = (receipt.logs[0] as EventLog).args[0];
      await guard.connect(signer1).approveRequest(requestId);
    }
  });

  it("should not exceed max contract size of 24.576KB", async function () {
    const bytecode = guard.interface.format(false);
    expect(bytecode.length / 2).to.be.at.most(24576);
  });

  describe("createRequest()", function () {
    it("should allow admin to create a request", async function () {
      const tx = await guard.createRequest(
        signer1.address,
        "0x1111111111111111111111111111111111111111111111111111111111111111",
        { from: admin.address }
      );
      const receipt = await tx.wait();
      const requestId = (receipt?.logs[0] as EventLog).args[0];

      expect(requestId).to.not.be.undefined;
    });

    it("should not allow non-admin to create a request", async function () {
      await expect(
        guard
          .connect(nonSigner)
          .createRequest(
            signer1.address,
            "0x1111111111111111111111111111111111111111111111111111111111111111"
          )
      ).to.be.revertedWith("PortfoliumGuard: caller must be an admin");
    });
  });

  describe("approveRequest()", function () {
    let requestId: any;

    beforeEach(async function () {
      const tx = await guard.createRequest(
        signer1.address,
        "0x1111111111111111111111111111111111111111111111111111111111111111"
      );
      const receipt = await tx.wait();
      requestId = (receipt?.logs[0] as EventLog).args[0];
    });

    it("should allow signers to approve a request", async function () {
      const tx = await guard.connect(signer1).approveRequest(requestId, {});
      const receipt = await tx.wait();
      const approvedId = (receipt?.logs[0] as EventLog).args[0];

      expect(approvedId).to.be.eq(requestId);
    });

    it("should not allow non-signers to approve a request", async function () {
      await expect(
        guard.connect(nonSigner).approveRequest(requestId)
      ).to.be.revertedWith("PortfoliumGuard: caller must be an admin");
    });
  });

  describe("rejectRequest()", function () {
    let requestId: any;

    beforeEach(async function () {
      const tx = await guard
        .connect(admin)
        .createRequest(
          signer1.address,
          "0x1111111111111111111111111111111111111111111111111111111111111111"
        );
      const receipt = await tx.wait();
      requestId = (receipt?.logs[0] as EventLog).args[0];
    });

    it("should allow signers to reject a request", async function () {
      const tx = await guard.connect(signer1).rejectRequest(requestId, {
        from: signer1.address,
      });
      const receipt = await tx.wait();
      const rejectedId = (receipt?.logs[0] as EventLog).args[0];

      expect(rejectedId).to.be.eq(requestId);
    });

    it("should not allow non-signers to reject a request", async function () {
      await expect(
        guard.connect(nonSigner).rejectRequest(requestId)
      ).to.be.revertedWith("PortfoliumGuard: caller must be an admin");
    });
  });

  describe("addUser()", function () {
    it("should allow portfolium to add a new user", async function () {
      const tx = await guard.connect(portfolium).addUser(user.address, {});
      const role = await guard.USER_ROLE();
      const hasRole = await guard.hasPortfoliumRole(role, user.address);
      expect(hasRole).to.equal(true);
    });

    it("should not allow non-portfolium to add a new user", async function () {
      await expect(
        guard.connect(nonSigner).addUser(user.address)
      ).to.be.revertedWith(
        "PortfoliumGuard: caller must be the portfolium contract"
      );
    });
  });

  describe("removeRole()", function () {
    it("should allow admin to remove a role", async function () {
      const role = await guard.ADMIN_ROLE();
      const tx = await guard.removeRole(signer2.address, role);
      const receipt = await tx.wait();
      const requestId = (receipt?.logs[0] as EventLog).args[0];

      expect(requestId).to.not.be.undefined;
    });

    it("should not allow non-admin to remove a role", async function () {
      await expect(
        guard
          .connect(nonSigner)
          .removeRole(
            manager.address,
            "0x1111111111111111111111111111111111111111111111111111111111111111"
          )
      ).to.be.revertedWith("PortfoliumGuard: caller must be an admin");
    });
  });

  describe("hasPortfoliumRole()", function () {
    it("should correctly indicate role presence", async function () {
      const role = await guard.ADMIN_ROLE();
      const hasRole = await guard.hasPortfoliumRole(role, admin.address);
      expect(hasRole).to.equal(true);
    });
  });
});
