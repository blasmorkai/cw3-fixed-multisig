import { CosmWasmClient, SigningCosmWasmClient, Secp256k1HdWallet, GasPrice, Coin } from "cosmwasm";

import * as fs from 'fs';
import axios from 'axios';


const rpcEndpoint = "https://juno-testnet-rpc.polkachu.com/";

const config = {
    chainId: "uni-3",
    rpcEndpoint: rpcEndpoint,
    prefix: "juno",
};


const multisig_wasm = fs.readFileSync("../artifacts/cw3_fixed_multisig.wasm");



const mnemonic = "between anchor impact pact lazy custom rookie load ride ramp piece pony"; // juno1u0h22tk6hrtvulfhq22pcrz5fj9c0cnhqelcpx
//x const mnemonic = "prosper twelve menu smile canoe vacant stool moment rough weird avoid visual"; // juno1avqzvtvvxv67fje267y8zx9c65838nmjyrqgsh
//xconst mnemonic = "olympic multiply song tuna estate live fly stomach upon text test birth"; // juno19g70wvrnzavaw03d9szxk47n3aeeettchtzanq
//x const mnemonic = "squirrel cube entry gas then dignity lens very rigid duty shrimp moment"; // juno12dyghgkfh4vfmxqeh9y7sdw78zzeksll2aq2fs
//const mnemonic = "worry unveil bomb music pact final odor roof document excuse amazing flag"; // juno1e8q0t7lt5hnxjk7g5ec5f7t35x6jymxmunnqpd
//const mnemonic = "furnace best mimic know mixed december multiply airport giant donkey ostrich siren"; // juno1urcl7hkga3j9ek27lvwx784ax9452cn9492826
const prefix = "juno";

const multisig_code_id = 4074;

const multisig1_address = "juno1avqzvtvvxv67fje267y8zx9c65838nmjyrqgsh"; 
const multisig2_address = "juno19g70wvrnzavaw03d9szxk47n3aeeettchtzanq";
const multisig3_address = "juno12dyghgkfh4vfmxqeh9y7sdw78zzeksll2aq2fs";



async function setupClient(mnemonic: string, rpc: string, gas: string | undefined): Promise<SigningCosmWasmClient> {
    if (gas === undefined) {
        let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno'});
        let client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet);
        return client;
    } else {
        let gas_price = GasPrice.fromString(gas);
        let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno' });
        let client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet, { gasPrice: gas_price });
        return client;
    }
}

async function getAddress(mnemonic:string) {
    let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: prefix });
    let accounts = await wallet.getAccounts();
    return accounts[0].address;
}

describe("Cosmwasm Template Tests", () => {
    xit("Generate Wallet", async () => {
        let wallet = await Secp256k1HdWallet.generate(12);
        console.log(wallet.mnemonic);
    });

    xit("Get address", async () => {
        let sender = await getAddress(mnemonic);
        console.log(sender);
    });

    xit("Get Testnet Tokens", async () => {
        //let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno' });
        //console.log(await wallet.getAccounts());
        console.log(await getAddress(mnemonic));
        try {
            let res = await axios.post("https://faucet.uni.juno.deuslabs.fi/credit", { "denom": "ujunox", "address": await getAddress(mnemonic) });
            console.log(res);
        } catch (e) {
            console.log(e);
        }
    }).timeout(100000);

    xit("Send Testnet Tokens", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let coin:Coin = {denom: "ujunox", amount: "3000000"};
        client.sendTokens(await getAddress(mnemonic), "juno1jjeaun6mlrtv0wzfpt9u57hx6keqsvv7ltuj4j", [coin], "auto");
    }).timeout(100000);

    xit("Upload multisig_wasm to testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let sender = await getAddress(mnemonic);
        let res = await client.upload(sender, multisig_wasm, "auto", undefined);
        console.log(res);
    }).timeout(100000);

    // let cw3_instantiate_msg = InstantiateMsg {
    //     voters: vec![
    //         Voter {
    //             addr: addr1.to_string(),
    //             weight: 1,
    //         },
    //         Voter {
    //             addr: addr2.to_string(),
    //             weight: 1,
    //         },
    //         Voter {
    //             addr: addr3.to_string(),
    //             weight: 1,
    //         },
    //     ],
    //     threshold: Threshold::AbsoluteCount { weight: 2 },
    //     max_voting_period: Duration::Height(3),
    // };

    // pub struct InstantiateMsg {
    //     pub voters: Vec<Voter>,
    //     pub threshold: Threshold,
    //     pub max_voting_period: Duration,
    // }
    
    // #[cw_serde]
    // pub struct Voter {
    //     pub addr: String,
    //     pub weight: u64,
    // }
    it("Instantiate multisig on testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let sender = await getAddress(mnemonic);
        let cw3_instantiate_typescript_msg = {
            voters: [
                {
                    addr: multisig1_address,
                    weight: 1,
                },
                {
                    addr: multisig2_address,
                    weight: 1,
                },
                {
                    addr: multisig3_address,
                    weight: 1,
                },
            ],
            threshold: {
                absolute_count: 2
            },
            max_voting_period: {
                height: 3
            }
        };

        let res = await client.instantiate(sender, multisig_code_id, 
            cw3_instantiate_typescript_msg,
            "multisig-3", 
            "auto", 
            {admin:sender}
        );
        // let res = await client.instantiate(sender, multisig_code_id, 
        //     {
        //     voters:[{addr:multisig1_address, weight:"1"},{addr:multisig2_address, weight:"1"},{addr:multisig3_address, weight:"1"}], 
        //     threshold: {absolute_count: 2}, 
        //     max_voting_period: {duration: 3}, 
        //     },
        //     "multisig-3", 
        //     "auto", 
        //     {admin:sender}
        // );
        console.log(res);
    }).timeout(100000);


});
