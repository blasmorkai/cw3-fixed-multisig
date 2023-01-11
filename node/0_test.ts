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

/*

pub struct InstantiateMsg {
    pub voters: Vec<Voter>,
    pub threshold: Threshold,
    pub max_voting_period: Duration,
}

*/
    /*
        let msg = cw20_base::msg::InstantiateMsg {
        name,
        symbol,
        decimals: 6,
        initial_balances: vec![Cw20Coin {
            address: owner.to_string(),
            amount: balance,
        }],
        mint: None,
        marketing: None,
    };*/

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


    it("Instantiate multisig on testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let sender = await getAddress(mnemonic);
        let res = await client.instantiate(sender, multisig_code_id, 
            {
            voters:[{addr:multisig1_address, weight:"1"},{addr:multisig2_address, weight:"1"},{addr:multisig3_address, weight:"1"}], 
            threshold: {absolute_count: 2}, 
            max_voting_period: {duration: 3}, 
            },
            "multisig-3", 
            "auto", 
            {admin:sender});
        console.log(res);
    }).timeout(100000);

/*
    xit("Instantiate token2 cw20-base on testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let sender = await getAddress(mnemonic);
        let res = await client.instantiate(sender, cw20_code_id, {name:"test token", symbol:"TTKN", decimals:6, initial_balances:[{address:sender, amount:"5000000"}]}, "token2", "auto", {admin:sender});
        console.log(res);
    }).timeout(100000);

*/
    /*
        let msg = InstantiateMsg {
        token1_denom: Denom::Native(native_denom),
        token2_denom: Denom::Cw20(cash.addr()),
        lp_token_code_id: cw20_id,
        owner: Some(owner.to_string()),
        lp_fee_percent,
        protocol_fee_percent,
        protocol_fee_recipient,
    };*/
/*
    xit("Instantiate token1-token2 wasm-swap on testnet", async () => {
        let client = await setupClient(mnemonic);
        let sender = await getAddress(mnemonic);
        let res = await client.instantiate(sender, amm_code_id, 
            {
            token1_denom: {cw20: cw20_token1_address},
            token2_denom: {cw20: cw20_token2_address},
            lp_token_code_id: cw20_code_id,
            lp_fee_percent: "0.2",
            protocol_fee_percent: "0.1",
            protocol_fee_recipient: sender,
            }, 
            "token1-token2-amm", "auto", 
            {admin:sender});
        console.log(res);
    }).timeout(100000);
*/
    /*    AddLiquidity {
        token1_amount: Uint128,
        min_liquidity: Uint128,
        max_token2: Uint128,
        expiration: Option<Expiration>,
    },*/
/*
    xit("add token1-token2 liquidity to swap on testnet", async () => {
        //using contract address mint a NFT on the testnet.
        let client = await setupClient(mnemonic);
        let sender = await getAddress(mnemonic);

        //look at increase allowance msg for cw20.
        //add and allowance token1 and token2
        let res1 = await client.execute(sender, 
        cw20_token1_address, { increase_allowance: 
            {
            spender: amm_token1_token2,
            amount: "10000",
            expires: null
            }},

        "auto", "");

        let res2 = await client.execute(sender, 
            cw20_token2_address, { increase_allowance: 
                {
            spender: amm_token1_token2,
            amount: "10000",
            expires: null
            }},
    
            "auto", "");
        console.log(res1);
        console.log(res2);


        //add liquidity
    //  AddLiquidity {
    //     token1_amount: Uint128,
    //     min_liquidity: Uint128,
    //     max_token2: Uint128,
    //     expiration: Option<Expiration>,
    // },
    let res3 = await client.execute(sender, 
        amm_token1_token2, { add_liquidity: 
            {
                token1_amount: "5000",
                min_liquidity: "500",
                max_token2: "5000"
        }},
        "auto", "");
    console.log(res1);
    console.log(res2);
    console.log(res3);
    }).timeout(100000);


    xit("Query info for token1-token2 amm", async () => {
        let client = await setupClient(mnemonic);
        let sender = await getAddress(mnemonic);
        let res = await client.queryContractSmart(amm_token1_token2, { info: {} });
        console.log(res);
    }).timeout(100000);

    xit("Query balance from amm", async () => {
        let client = await setupClient(mnemonic);
        let sender = await getAddress(mnemonic);
        let res = await client.queryContractSmart(amm_token1_token2, { balance:{address:sender} });
        console.log(res);
    }).timeout(100000);

    xit("Query price for token1", async () => {
        let client = await setupClient(mnemonic);
        let sender = await getAddress(mnemonic);
        let res = await client.queryContractSmart(amm_token1_token2, { token1_for_token2_price:{token1_amount:"5000"} });
        console.log(res);
    }).timeout(100000);

    xit("Query price for token2", async () => {
        let client = await setupClient(mnemonic);
        let sender = await getAddress(mnemonic);
        let res = await client.queryContractSmart(amm_token1_token2, { token2_for_token1_price:{token2_amount:"5000"} });
        console.log(res);
    }).timeout(100000);

    /*
        Swap {
        input_token: TokenSelect,
        input_amount: Uint128,
        min_output: Uint128,
        expiration: Option<Expiration>,
    },*/
/*
    xit("swap on testnet", async () => {
        //using contract address mint a NFT on the testnet.
        let client = await setupClient(mnemonic);
        let sender = await getAddress(mnemonic);
    }).timeout(100000);
  */  
});
