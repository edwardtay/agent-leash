open Table
open Enums.EntityType
type id = string

type internalEntity = Internal.entity
module type Entity = {
  type t
  let index: int
  let name: string
  let schema: S.t<t>
  let rowsSchema: S.t<array<t>>
  let table: Table.table
  let entityHistory: EntityHistory.t<t>
}
external entityModToInternal: module(Entity with type t = 'a) => Internal.entityConfig = "%identity"
external entityModsToInternal: array<module(Entity)> => array<Internal.entityConfig> = "%identity"
external entitiesToInternal: array<'a> => array<Internal.entity> = "%identity"

@get
external getEntityId: internalEntity => string = "id"

// Use InMemoryTable.Entity.getEntityIdUnsafe instead of duplicating the logic
let getEntityIdUnsafe = InMemoryTable.Entity.getEntityIdUnsafe

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {
  eq: 'fieldType => promise<array<'entity>>,
  gt: 'fieldType => promise<array<'entity>>,
  lt: 'fieldType => promise<array<'entity>>
}

module DailyStats = {
  let name = (DailyStats :> string)
  let index = 0
  @genType
  type t = {
    chainId: int,
    date: string,
    id: id,
    totalDeposits: int,
    totalVolume: bigint,
    totalWithdrawals: int,
    uniqueUsers: int,
  }

  let schema = S.object((s): t => {
    chainId: s.field("chainId", S.int),
    date: s.field("date", S.string),
    id: s.field("id", S.string),
    totalDeposits: s.field("totalDeposits", S.int),
    totalVolume: s.field("totalVolume", BigInt.schema),
    totalWithdrawals: s.field("totalWithdrawals", S.int),
    uniqueUsers: s.field("uniqueUsers", S.int),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("date") date: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "chainId", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "date", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "totalDeposits", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "totalVolume", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalWithdrawals", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "uniqueUsers", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module VaultDeposit = {
  let name = (VaultDeposit :> string)
  let index = 1
  @genType
  type t = {
    amount: bigint,
    blockNumber: int,
    chainId: int,
    id: id,
    timestamp: bigint,
    txHash: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    blockNumber: s.field("blockNumber", S.int),
    chainId: s.field("chainId", S.int),
    id: s.field("id", S.string),
    timestamp: s.field("timestamp", BigInt.schema),
    txHash: s.field("txHash", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "blockNumber", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "chainId", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "txHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module VaultWithdrawal = {
  let name = (VaultWithdrawal :> string)
  let index = 2
  @genType
  type t = {
    amount: bigint,
    blockNumber: int,
    chainId: int,
    id: id,
    timestamp: bigint,
    txHash: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    blockNumber: s.field("blockNumber", S.int),
    chainId: s.field("chainId", S.int),
    id: s.field("id", S.string),
    timestamp: s.field("timestamp", BigInt.schema),
    txHash: s.field("txHash", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "blockNumber", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "chainId", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "txHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

let userEntities = [
  module(DailyStats),
  module(VaultDeposit),
  module(VaultWithdrawal),
]->entityModsToInternal

let allEntities =
  userEntities->Js.Array2.concat(
    [module(InternalTable.DynamicContractRegistry)]->entityModsToInternal,
  )

let byName =
  allEntities
  ->Js.Array2.map(entityConfig => {
    (entityConfig.name, entityConfig)
  })
  ->Js.Dict.fromArray
