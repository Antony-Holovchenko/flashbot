const { Wallet, BigNumber, ethers, providers } = require("ethers");
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require("@flashbots/ethers-provider-bundle")
require("dotenv").config()

/*
We doing 2 transfers. Transfer from me to another user and again the same transaction 
both of them into a bundle and sends it to flashbot, so that it is bypassing the mempool.
*/


// Setup provider for Sepolia
const provider = new providers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
)

// Create a unique flashbot id(simply a wallet)
// It is used to sign a bundles
const signer = new Wallet(
    process.env.PRIVATE_KEY,
    provider  
)

const start = async() => {
    // create a flashbots provider(connection to flashbots, that's how we'll communicate with it)
    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        signer,
        process.env.FLASHBOTS_SEPOLIA_URL
    )

    // Setup required gas and block variables
    const GWEI = BigNumber.from(10).pow(9)
    const LEGACY_GAS_PRICE = GWEI.mul(12)
    const PRIORITY_FEE = GWEI.mul(100)
    const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    const maxBaseFeeInFutureBlock = 
        FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 6) // we take the base fee of the current block(block.baseFeePerGas), and calculate teh potential increase of the baseFee in the next 6 blocks

    //Create the signed transfer transaction using both types
    const signedTransactions = await flashbotsProvider.signBundle([
       {
            signer: signer,
            transaction: {
              to: "0xD34B89262A8B9da21745c085F61502AFD6144066",
              type: 2,
              maxFeePerGas: PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
              maxPriorityFeePerGas: PRIORITY_FEE,
              data: "0x",
              chainId: 5,
              value: ethers.utils.parseEther('0.001')
            } 
        },
        {
            signer: signer,
            transaction: {
               to: "0xD34B89262A8B9da21745c085F61502AFD6144066",
               gasPrice: LEGACY_GAS_PRICE,
               data: "0x",
               value: ethers.utils.parseEther('0.001')
            }
        } 
        
        // Run a flashbot simulation, to make sure it works
    ])
}
