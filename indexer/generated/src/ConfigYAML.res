
type hyperSyncConfig = {endpointUrl: string}
type hyperFuelConfig = {endpointUrl: string}

@genType.opaque
type rpcConfig = {
  syncConfig: Config.sourceSync,
}

@genType
type syncSource = HyperSync(hyperSyncConfig) | HyperFuel(hyperFuelConfig) | Rpc(rpcConfig)

@genType.opaque
type aliasAbi = Ethers.abi

type eventName = string

type contract = {
  name: string,
  abi: aliasAbi,
  addresses: array<string>,
  events: array<eventName>,
}

type configYaml = {
  syncSource,
  startBlock: int,
  confirmedBlockThreshold: int,
  contracts: dict<contract>,
  lowercaseAddresses: bool,
}

let publicConfig = ChainMap.fromArrayUnsafe([
  {
    let contracts = Js.Dict.fromArray([
      (
        "SimpleVault",
        {
          name: "SimpleVault",
          abi: Types.SimpleVault.abi,
          addresses: [
            "0x93fc90a3Fb7d8c15bbaF50bFCc612B26CA8E68c8",
          ],
          events: [
            Types.SimpleVault.Deposit.name,
            Types.SimpleVault.Withdrawal.name,
          ],
        }
      ),
    ])
    let chain = ChainMap.Chain.makeUnsafe(~chainId=84532)
    (
      chain,
      {
        confirmedBlockThreshold: 200,
        syncSource: HyperSync({endpointUrl: "https://84532.hypersync.xyz"}),
        startBlock: 22000000,
        contracts,
        lowercaseAddresses: false
      }
    )
  },
  {
    let contracts = Js.Dict.fromArray([
      (
        "SimpleVault",
        {
          name: "SimpleVault",
          abi: Types.SimpleVault.abi,
          addresses: [
            "0x9acec7011519F89C59d9A595f9829bBb79Ed0d4b",
          ],
          events: [
            Types.SimpleVault.Deposit.name,
            Types.SimpleVault.Withdrawal.name,
          ],
        }
      ),
    ])
    let chain = ChainMap.Chain.makeUnsafe(~chainId=11155111)
    (
      chain,
      {
        confirmedBlockThreshold: 200,
        syncSource: HyperSync({endpointUrl: "https://11155111.hypersync.xyz"}),
        startBlock: 9940000,
        contracts,
        lowercaseAddresses: false
      }
    )
  },
])

@genType
let getGeneratedByChainId: int => configYaml = chainId => {
  let chain = ChainMap.Chain.makeUnsafe(~chainId)
  if !(publicConfig->ChainMap.has(chain)) {
    Js.Exn.raiseError(
      "No chain with id " ++ chain->ChainMap.Chain.toString ++ " found in config.yaml",
    )
  }
  publicConfig->ChainMap.get(chain)
}
