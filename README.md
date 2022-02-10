# defi-yield-ts

A library for fetching the latest rates from Solana-centric lending protocols, with the goal of supporting every active protocol.

To pull rates for a specific protocol:

```typescript
const rateObserver = new RateObserver();
const protocolRates: ProtocolRates = await rateObserver.fetch('jet');
```

To pull rates for all supported protocols at once:

```typescript
const rateObserver = new RateObserver();
const protocolRates: ProtocolRates[] = await rateObserver.fetchAll();
```

Currently supported protocols:

- 'apricot'
- 'francium'
- 'jet'
- 'larix'
- 'mango'
- 'port'
- 'solend'
- 'tulip'
