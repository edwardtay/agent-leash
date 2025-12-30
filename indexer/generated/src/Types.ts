// This file is to dynamically generate TS types
// which we can't get using GenType
// Use @genType.import to link the types back to ReScript code

import type { Logger, EffectCaller } from "envio";
import type * as Entities from "./db/Entities.gen.ts";

export type LoaderContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * True when the handlers run in preload mode - in parallel for the whole batch.
   * Handlers run twice per batch of events, and the first time is the "preload" run
   * During preload entities aren't set, logs are ignored and exceptions are silently swallowed.
   * Preload mode is the best time to populate data to in-memory cache.
   * After preload the handler will run for the second time in sequential order of events.
   */
  readonly isPreload: boolean;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly DailyStats: {
    /**
     * Load the entity DailyStats from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.DailyStats_t | undefined>,
    /**
     * Load the entity DailyStats from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.DailyStats_t>,
    readonly getWhere: Entities.DailyStats_indexedFieldOperations,
    /**
     * Returns the entity DailyStats from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.DailyStats_t) => Promise<Entities.DailyStats_t>,
    /**
     * Set the entity DailyStats in the storage.
     */
    readonly set: (entity: Entities.DailyStats_t) => void,
    /**
     * Delete the entity DailyStats from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VaultDeposit: {
    /**
     * Load the entity VaultDeposit from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VaultDeposit_t | undefined>,
    /**
     * Load the entity VaultDeposit from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VaultDeposit_t>,
    readonly getWhere: Entities.VaultDeposit_indexedFieldOperations,
    /**
     * Returns the entity VaultDeposit from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VaultDeposit_t) => Promise<Entities.VaultDeposit_t>,
    /**
     * Set the entity VaultDeposit in the storage.
     */
    readonly set: (entity: Entities.VaultDeposit_t) => void,
    /**
     * Delete the entity VaultDeposit from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VaultWithdrawal: {
    /**
     * Load the entity VaultWithdrawal from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VaultWithdrawal_t | undefined>,
    /**
     * Load the entity VaultWithdrawal from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VaultWithdrawal_t>,
    readonly getWhere: Entities.VaultWithdrawal_indexedFieldOperations,
    /**
     * Returns the entity VaultWithdrawal from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VaultWithdrawal_t) => Promise<Entities.VaultWithdrawal_t>,
    /**
     * Set the entity VaultWithdrawal in the storage.
     */
    readonly set: (entity: Entities.VaultWithdrawal_t) => void,
    /**
     * Delete the entity VaultWithdrawal from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};

export type HandlerContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly DailyStats: {
    /**
     * Load the entity DailyStats from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.DailyStats_t | undefined>,
    /**
     * Load the entity DailyStats from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.DailyStats_t>,
    /**
     * Returns the entity DailyStats from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.DailyStats_t) => Promise<Entities.DailyStats_t>,
    /**
     * Set the entity DailyStats in the storage.
     */
    readonly set: (entity: Entities.DailyStats_t) => void,
    /**
     * Delete the entity DailyStats from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VaultDeposit: {
    /**
     * Load the entity VaultDeposit from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VaultDeposit_t | undefined>,
    /**
     * Load the entity VaultDeposit from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VaultDeposit_t>,
    /**
     * Returns the entity VaultDeposit from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VaultDeposit_t) => Promise<Entities.VaultDeposit_t>,
    /**
     * Set the entity VaultDeposit in the storage.
     */
    readonly set: (entity: Entities.VaultDeposit_t) => void,
    /**
     * Delete the entity VaultDeposit from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VaultWithdrawal: {
    /**
     * Load the entity VaultWithdrawal from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VaultWithdrawal_t | undefined>,
    /**
     * Load the entity VaultWithdrawal from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VaultWithdrawal_t>,
    /**
     * Returns the entity VaultWithdrawal from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VaultWithdrawal_t) => Promise<Entities.VaultWithdrawal_t>,
    /**
     * Set the entity VaultWithdrawal in the storage.
     */
    readonly set: (entity: Entities.VaultWithdrawal_t) => void,
    /**
     * Delete the entity VaultWithdrawal from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};
