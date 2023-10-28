const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const PortfoliumTokenStore = artifacts.require('PortfoliumTokenStore');
const PortfoliumGuard = artifacts.require('PortfoliumGuard');
const MockERC20 = artifacts.require('MockERC20');

contract('PortfoliumTokenStore', (accounts) => {
  let tokenStore;
  let guard;
  let mockERC20
  const [admin, signer1, signer2, portfolium, nonExistingToken, nonPortfolium] = accounts;

  before(async () => {
    guard = await PortfoliumGuard.new([signer1, signer2], 2, { from: admin });
    const role = await guard.PORTFOLIUM_ROLE();
    const tx = await guard.createRequest(portfolium, role);
    const id = tx.logs[0].args.requestId;
    await guard.approveRequest(id, { from: signer1 });
    mockERC20 = await MockERC20.new('Mock Token', 'MTK');
    tokenStore = await PortfoliumTokenStore.new(guard.address);
  });

  describe('addToken', () => {
    it('should revert if caller is not the portfolium address', async () => {
      await truffleAssert.reverts(
        tokenStore.addToken(mockERC20.address, 1, { from: nonPortfolium }),
        'PortfoliumTokenStore: Caller must be the portfolium contract',
      );
    });

    it('should add a new token', async () => {
      const tx = await tokenStore.addToken(mockERC20.address, 1, { from: portfolium });
      truffleAssert.eventEmitted(tx, 'TokenAdded', (ev) => {
        return ev.tokenAddress === mockERC20.address && ev.name === 'Mock Token';
      });

      const token = await tokenStore.getToken(mockERC20.address);
      assert.equal(token.name, 'Mock Token');
      assert.equal(token.symbol, 'MTK');
      assert.equal(token.decimals, 18);
    });

    it('should revert if token already exists', async () => {
      await truffleAssert.reverts(
        tokenStore.addToken(mockERC20.address, 1, { from: portfolium }),
        'PortfoliumTokenStore: Token already exists!',
      );
    });
  });

  describe('removeToken', () => {
    it('should revert if caller is not the portfolium address', async () => {
      await truffleAssert.reverts(
        tokenStore.removeToken(mockERC20.address, { from: nonPortfolium }),
        'PortfoliumTokenStore: Caller must be the portfolium contract',
      );
    });

    it('should remove a token', async () => {
      const tx = await tokenStore.removeToken(mockERC20.address, { from: portfolium });
      truffleAssert.eventEmitted(tx, 'TokenRemoved', (ev) => {
        return ev.tokenAddress === mockERC20.address && ev.name === 'Mock Token';
      });

      const tokenExists = await tokenStore.tokenExists(mockERC20.address);
      assert.equal(tokenExists, false);
    });

    it('should revert if token does not exist', async () => {
      await truffleAssert.reverts(
        tokenStore.removeToken(nonExistingToken, { from: portfolium }),
        'PortfoliumTokenStore: Token already removed!',
      );
    });
  });
});
