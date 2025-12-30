module ContractType = {
  @genType
  type t = 
    | @as("SimpleVault") SimpleVault

  let name = "CONTRACT_TYPE"
  let variants = [
    SimpleVault,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("DailyStats") DailyStats
    | @as("VaultDeposit") VaultDeposit
    | @as("VaultWithdrawal") VaultWithdrawal
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    DailyStats,
    VaultDeposit,
    VaultWithdrawal,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
])
