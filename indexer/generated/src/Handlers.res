  @genType
module SimpleVault = {
  module Deposit = Types.MakeRegister(Types.SimpleVault.Deposit)
  module Withdrawal = Types.MakeRegister(Types.SimpleVault.Withdrawal)
}

@genType /** Register a Block Handler. It'll be called for every block by default. */
let onBlock: (
  Envio.onBlockOptions<Types.chain>,
  Envio.onBlockArgs<Types.handlerContext> => promise<unit>,
) => unit = (
  EventRegister.onBlock: (unknown, Internal.onBlockArgs => promise<unit>) => unit
)->Utils.magic
