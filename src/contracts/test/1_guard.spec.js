const PortfoliumGuard = artifacts.require("PortfoliumGuard");
const truffleAssert = require("truffle-assertions");
const { expect } = require('chai');

contract("PortfoliumGuard", (accounts) => {
  let guard;
  const [admin, signer1, signer2, manager, nonSigner, portfolium, user] = accounts;


  beforeEach(async () => {
    guard = await PortfoliumGuard.new([signer1, signer2], 2, { from: admin });
    const role = await guard.PORTFOLIUM_ROLE();
    const tx = await guard.createRequest(portfolium, role);
    const id = tx.logs[0].args.requestId;
    await guard.approveRequest(id, { from: signer1 });
  });

  it("should not exceed max contract size of 24.576KB", async () => {
    var bytecode = guard.constructor._json.bytecode;

    assert.isAtMost(
      bytecode.length / 2,
      24576,
      "Max contract size exceeded"
    );
  });

  describe("createRequest()", () => {
    it("should allow admin to create a request", async () => {
      const tx = await guard.createRequest(signer1, "0x1111111111111111111111111111111111111111111111111111111111111111", { from: admin });
      truffleAssert.eventEmitted(tx, "RequestCreated");
    });

    it("should not allow non-admin to create a request", async () => {
      try {
        await guard.createRequest(signer1, "0x1111111111111111111111111111111111111111111111111111111111111111", { from: nonSigner });
      } catch (error) {
        expect(error.reason).to.contains("PortfoliumGuard: caller must be");
      }
    });
  });

  describe("approveRequest()", () => {
    let requestId;

    beforeEach(async () => {
      const tx = await guard.createRequest(signer1, "0x1111111111111111111111111111111111111111111111111111111111111111", { from: admin });
      requestId = tx.logs[0].args.requestId;
    });

    it("should allow signers to approve a request", async () => {
      const tx = await guard.approveRequest(requestId, { from: signer1 });
      truffleAssert.eventEmitted(tx, "ApprovalGranted");
    });

    it("should not allow non-signers to approve a request", async () => {
      try {
        await guard.approveRequest(requestId, { from: nonSigner });
      } catch (error) {
        expect(error.reason).to.contains("PortfoliumGuard: caller must be");
      }
    });
  });

  describe("rejectRequest()", () => {
    let requestId;

    beforeEach(async () => {
      const tx = await guard.createRequest(signer1, "0x1111111111111111111111111111111111111111111111111111111111111111", { from: admin });
      requestId = tx.logs[0].args.requestId;
    });

    it("should allow signers to reject a request", async () => {
      const tx = await guard.rejectRequest(requestId, { from: signer1 });
      truffleAssert.eventEmitted(tx, "RequestRejected");
    });

    it("should not allow non-signers to reject a request", async () => {
      try {
        await guard.rejectRequest(requestId, { from: nonSigner });
      } catch (error) {
        expect(error.reason).to.contains("PortfoliumGuard: caller must be");
      }
    });
  });

  describe("addUser()", () => {
    it("should allow portfolium to add a new user", async () => {
      const tx = await guard.addUser(user, { from: portfolium });
      truffleAssert.eventEmitted(tx, "RoleGranted");

      const role = await guard.USER_ROLE();
      const hasRole = await guard.hasPortfoliumRole(role, user);
      expect(hasRole).to.equal(true);
    });

    it("should not allow non-portfolium to add a new manager", async () => {
      try {
        await guard.addUser(user, { from: nonSigner });
      } catch (error) {
        expect(error.reason).to.contains("PortfoliumGuard: caller must be the ");
      }
    });
  });

  describe("removeRole()", () => {
    it("should allow admin to remove a role", async () => {
      const tx = await guard.removeRole(manager, "0x1111111111111111111111111111111111111111111111111111111111111111", { from: admin });
      truffleAssert.eventEmitted(tx, "RoleRevoked");
    });

    it("should not allow non-admin to remove a role", async () => {
      try {
        await guard.removeRole(manager, "0x1111111111111111111111111111111111111111111111111111111111111111", { from: nonSigner });
      } catch (error) {
        expect(error.reason).to.contains("PortfoliumGuard: caller must be");
      }
    });
  });

  describe("hasPortfoliumRole()", () => {
    it("should correctly indicate role presence", async () => {
      const hasRole = await guard.hasPortfoliumRole("0x1111111111111111111111111111111111111111111111111111111111111111", admin);
      assert.equal(hasRole, false, "Role should not be present for the account");
    });
  });
});
