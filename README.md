# Flashbot basic project

With the help of the flashbot code, we can omit the mempool and send tx's directly to the miners.
In this way we can make our txs private, and add extra security in the project by omitting sandwich or frontrun attacks. All this is possible because of the private transaction pool of the Flashbots network and how these txs are managed on the way to be included in the block.
I hope the code will be useful for you.
Feel free to check more details in the [Flashbots documentation](https://docs.flashbots.net/flashbots-auction/overview)

## Setting Up The Project
### 1. Clone/Download the Repository:
`https://github.com/Antony-Holovchenko/flashbot.git`

### 2. Install Dependencies:
`$ npm install`

### 3. Create .env file and set up all global variables

`INFURA_API_KEY="your Infura api key or feel free to use your most preferred provider"`\
`PRIVATE_KEY=your account private key from Sepolia network or any other test network`\
`FLASHBOTS_SEPOLIA_URL=feel free to use the needed Flashbots Url`

### 4. Make sure your accounts in the testnet have enough Ether on the balance to run the script
If you need test Ether, you can easily request it on [Chainlink Faucet](https://faucets.chain.link/)

### 5. Change the target account in the transaction description
In the `signedTransactions` change the `to` value to your account in both txs:
```
    {
        signer: signer,
        transaction: {
          to: "paste here your account address",
          ...
        } 
    }
```


## Running The Project
### 1. Execute the command below:
Once all preconditions are done, you can run the script with `node flashbot.js`

### 2. Check the console:
In the console you should see that the simulation passed successfully.
And after this you will see information about successfull txs bundle 
submission to the the Flashbots network and inclusion in the block.\
Example below:

`Simulation successfully completed in block number: <some block number>`\
`Bundle was successfully submitted, processing ...`\
`Wait response: BundleIncluded`\
`Bundle successfully included in block!`

## Checking the results
### 1. Verify your metamask account balance:
Balance in the 1st account, from which you initiate a tx should be decreased
for the amount from 2 txs in the `signedTransactions` object. In my example 
this amount is 0.002 ETH. And in the 2nd account the balance should be increased  
for the amount from 2 txs.\
If you see this result, then congratulations. The flashbot is working as expected,
and you successfully sent tx directly to the miner omitting the public mempool.