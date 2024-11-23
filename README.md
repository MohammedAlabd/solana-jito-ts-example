# jito-bundle-example

A simple example on how to use `jito-ts` to submit Jito bundles

## Prerequisites

An account with a little bit of sol that you have access to its keypair, `0.01 SOL` should be enough

## Usage

1. Install the dependencies:

```bash
bun install
```

1. create your `.env` file:

```bash
cp .env.example .env
```

In the .env file, replace the `AUTH_KEYPAIR_PATH` value with your keypair path

If you want to use mainnet, set `BLOCK_ENGINE_URL` and `RPC_URL` to a mainnet values

```env
BLOCK_ENGINE_URL=block-engine.mainnet.frankfurt.jito.wtf
RPC_URL=https://api.mainnet-beta.solana.com
```

1. Running the examples:

To run the embedded tip example:

```bash
bun embedded-tip-ix
```

To run the separated tip transaction example:

```bash
bun separated-tip-tx
```
