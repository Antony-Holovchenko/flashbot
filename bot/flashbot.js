const { ethers, JsonRpcProvider } = require("ethers");
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require("@flashbots/ethers-provider-bundle")
require("dotenv").config()

/*
  We are doing 2 transfers. Transfer from my 1st test account("0xfFD3d3C0f1a10A43eeFbEB440320D4D8d5139716") 
  to my 2nd account("0xD34B89262A8B9da21745c085F61502AFD6144066") and again the same transaction. 
  Combining these 2 txs into a bundle and send this bundle to flashbot(block builder), so that it is bypassing the public mempool.
*/

// Setup provider for Sepolia
const provider = new JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
)

// Create a unique flashbot id(simply a wallet).
// It is used to sign a bundles.
const signer = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    provider  
)

console.log(signer)
const sendTx = async() => {
    // create a flashbots provider(connection to flashbots, that's how we'll communicate with it)
    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        signer,
        process.env.FLASHBOTS_SEPOLIA_URL
    )

    // Setup required gas and block variables
    const GWEI = BigInt("1000000000")
    const LEGACY_GAS_PRICE = GWEI * 33n
    const PRIORITY_FEE = GWEI * 100n
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
              maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
              maxPriorityFeePerGas: PRIORITY_FEE,
              data: "0x",
              chainId: 11155111,
              value: ethers.parseEther('0.001')
            } 
        },
        {
            signer: signer,
            transaction: {
               to: "0xD34B89262A8B9da21745c085F61502AFD6144066",
               gasPrice: LEGACY_GAS_PRICE,
               data: "0x",
               chainId: 11155111,
               value: ethers.parseEther("0.001")
            }
        } 
    ])

    // Run a flashbot simulation, to make sure it works
    console.log(new Date())
    console.log("Starting the simulation")
    const simulation = await flashbotsProvider.simulate(signedTransactions, blockNumber + 1)
    console.log(new Date())

    // Check the result of the simulation
    if(simulation.firstRevert) {
        console.log(`Simulation failed with error: ${simulation.firstRevert.error}`)
    } else {
        console.log(`Simulation successfully completed in block number: ${blockNumber}`)
    }

    // Send a signed bundle with txs to Flashbots Relay, 10 times. So that we make sure,
    // and guarantee that our txs are included in the Flashbot generated block.
    for (var i = 0; i < 10; i++) {
        const submittedBundleTx = await flashbotsProvider.sendRawBundle(
            signedTransactions, 
            blockNumber + 1
        )
        console.log("Bundle was successfully submitted, processing ...")
        const submittedBundleReceipt = await submittedBundleTx.wait()
        console.log(`Wait response: ${FlashbotsBundleResolution[submittedBundleReceipt]}`)
        if(submittedBundleReceipt == FlashbotsBundleResolution.BundleIncluded || waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
            console.log("Bundle successfully included in block!")
            process.exit(0)
        } else {
            console.log({
                bundleStats: await flashbotsProvider.getBundleStats(
                    simulation.bundleHash,
                    blockNumber + 1
                ),
                userStats: await flashbotsProvider.getUserStats()
            })
        }
    }
    console.log("Bundles submitted!")
}

sendTx()
