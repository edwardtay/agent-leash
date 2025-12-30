/* TypeScript file generated from TestHelpers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpersJS = require('./TestHelpers.res.js');

import type {SimpleVault_Deposit_event as Types_SimpleVault_Deposit_event} from './Types.gen';

import type {SimpleVault_Withdrawal_event as Types_SimpleVault_Withdrawal_event} from './Types.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

/** The arguements that get passed to a "processEvent" helper function */
export type EventFunctions_eventProcessorArgs<event> = {
  readonly event: event; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

export type EventFunctions_eventProcessor<event> = (_1:EventFunctions_eventProcessorArgs<event>) => Promise<TestHelpers_MockDb_t>;

export type EventFunctions_MockBlock_t = {
  readonly hash?: string; 
  readonly number?: number; 
  readonly timestamp?: number
};

export type EventFunctions_MockTransaction_t = { readonly hash?: string };

export type EventFunctions_mockEventData = {
  readonly chainId?: number; 
  readonly srcAddress?: Address_t; 
  readonly logIndex?: number; 
  readonly block?: EventFunctions_MockBlock_t; 
  readonly transaction?: EventFunctions_MockTransaction_t
};

export type SimpleVault_Deposit_createMockArgs = {
  readonly user?: Address_t; 
  readonly amount?: bigint; 
  readonly timestamp?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type SimpleVault_Withdrawal_createMockArgs = {
  readonly user?: Address_t; 
  readonly amount?: bigint; 
  readonly timestamp?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersJS.MockDb.createMockDb as any;

export const Addresses_mockAddresses: Address_t[] = TestHelpersJS.Addresses.mockAddresses as any;

export const Addresses_defaultAddress: Address_t = TestHelpersJS.Addresses.defaultAddress as any;

export const SimpleVault_Deposit_processEvent: EventFunctions_eventProcessor<Types_SimpleVault_Deposit_event> = TestHelpersJS.SimpleVault.Deposit.processEvent as any;

export const SimpleVault_Deposit_createMockEvent: (args:SimpleVault_Deposit_createMockArgs) => Types_SimpleVault_Deposit_event = TestHelpersJS.SimpleVault.Deposit.createMockEvent as any;

export const SimpleVault_Withdrawal_processEvent: EventFunctions_eventProcessor<Types_SimpleVault_Withdrawal_event> = TestHelpersJS.SimpleVault.Withdrawal.processEvent as any;

export const SimpleVault_Withdrawal_createMockEvent: (args:SimpleVault_Withdrawal_createMockArgs) => Types_SimpleVault_Withdrawal_event = TestHelpersJS.SimpleVault.Withdrawal.createMockEvent as any;

export const Addresses: { mockAddresses: Address_t[]; defaultAddress: Address_t } = TestHelpersJS.Addresses as any;

export const SimpleVault: { Deposit: { processEvent: EventFunctions_eventProcessor<Types_SimpleVault_Deposit_event>; createMockEvent: (args:SimpleVault_Deposit_createMockArgs) => Types_SimpleVault_Deposit_event }; Withdrawal: { processEvent: EventFunctions_eventProcessor<Types_SimpleVault_Withdrawal_event>; createMockEvent: (args:SimpleVault_Withdrawal_createMockArgs) => Types_SimpleVault_Withdrawal_event } } = TestHelpersJS.SimpleVault as any;

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersJS.MockDb as any;
