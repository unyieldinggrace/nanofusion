# NanoFusion

NanoFusion is a trustless mixing protocol for the Nano cryptocurrency. It is loosely inspired by CashFusion (https://github.com/cashshuffle/spec/blob/master/CASHFUSION.md), the protocol developed by Jonald Fyookball for Bitcoin Cash.

### Getting Started

If you want to actually try running the software, see [GettingStarted.md](GettingStarted.md).

### See it in action
* Demo video: [https://www.youtube.com/watch?v=E-m64VPORbw](https://www.youtube.com/watch?v=E-m64VPORbw)
* Video whitepaper: [https://www.youtube.com/watch?v=CtMMETZcAQY](https://www.youtube.com/watch?v=CtMMETZcAQY)

### Status and Security Issues

NanoFusion is currently in an alpha (or even pre-alpha) state. The code published here is intended as a proof-of-concept ONLY. There are some outstanding security issues, meaning this software is not ready to be used for anything other than experimentation. You can see more information about these outstanding issues [in the GitHub issue tracker](https://github.com/unyieldinggrace/nanofusion/issues).

## Describing the Problem

Because Nano is account-based, rather than UTXO-based, some changes are required in order to created a trustless mixing protocol. In a UTXO-based currency, one transaction can have many inputs. CashFusion works by having these many inputs come from different owners. In contrast, each Nano transaction has exactly one sending account and one receiving account. This makes it difficult to mix coins without trusting a central server, because at some point, someone has to have the authority to cryptographically sign the send-transactions from the mixing account. Whoever can sign transactions from the mixing account can send all the money to themselves if they wish.

## Accounts with Aggregated Signatures

To get around this trust problem, we could modify the Nano protocol in some way so that nodes would require multiple signatures on some types transactions before accepting them. But that is ugly, it goes against the minimalist spirit of Nano, and it requires navigating the politics of a protocol change. A more ideal solution would be to do signature aggregation.

Nano uses the Ed25519 curve, which means its signatures are Schnorr signatures. Schnorr signatures have the useful property that aggregated signatures can exist which are indistinguishable from single signatures. An aggregate signature is a signature that is created by two or more parties collaborating to sign a message, without any of the parties having to reveal their private key to the others. This is useful, because once we create an account that can be signed with an aggregate signature, transactions can only occur on that account if all the signers individually agree to them. Because these aggregate signatures are indistinguishable from single signatures, a transaction for this type of joint account can be submitted to the Nano network and verified by the nodes as if it were any other transaction.

There is javascript code in this repository for creating an aggregate signature on the Ed25519 curve. The original [Rust implementation](https://github.com/KZen-networks/multi-party-eddsa) by KZen Networks uses a SHA-512 hash. This javascript implementation uses the Ed25519 implementation in the [elliptic](https://www.npmjs.com/package/elliptic) npm library, but replaces the SHA-512 hashes with Blake2B hashes (using [blakejs](https://www.npmjs.com/package/blakejs)) in order to be compatible with Nano.

## The trustless mixing algorithm

Aggregated signatures are a technical challenge, but on their own, they are not enough to enable trustless coin mixing. For that, we need a more detailed communication protocol, which will be described below.

### First Problem: Refunds

In order to allow a group of parties to trustlessly mix their Nano funds, we need to do the following:
* create an account that can only send funds if _all_ the parties sign the send transaction.
* get a list of accounts from each participant where their funds will be sent after they have gone through the mixing account.
* generate a series of send transactions from the mixing account which distribute all the funds to the accounts specified by the participants.
* Have all participants send _unsigned_ copies of the transactions that they will eventually broadcast to send their funds into the mixing account.
* Have all the participants sign the send transactions out of the mixing account.
* Once all the players have verified that there are signed send transactions _out_ of the mixing account, they can safely send all of their funds _to_ the mixing account, knowing that once everyone's funds have arrived, they will be able to get their own funds out, but no one will be able to steal funds from anyone else, because the outgoing send transactions have been pre-arranged.

This is the basic concept of trustless mixing. However, it presents a practical problem. What if one of the participants is malicious, or loses their network connection part-way through the process? What if they sign the transactions _out_ of the mixing account, but never send their funds _into_ the mixing account? Everyone else will have their funds burned. Nano transactions must happen in a specific order, since each transaction references the hash of the transaction before it. The transactions to distribute funds _out_ of the mixing account cannot be executed until all of the send transactions _into_ the mixing account have been completed. How then can we prevent funds from being burned if one party is malicious or their connection fails?

### Solving the refund problem

To solve the refund problem, we simply pre-sign multiple alternative sets of transactions which distribute the funds in the mixing account back to their original owners. Then the original owners can start the process over, without the "bad" party participating.

For instance, if we were going to mix accounts A, B and C, then we would have all players sign transactions that send out the mixed funds (the success case), but also sign the following sequences of transactions:

* Mix -> A, Mix -> B
* Mix -> A, Mix -> C
* Mix -> B, Mix -> A
* Mix -> B, Mix -> C
* Mix -> C, Mix -> A
* Mix -> C, Mix -> B

This way, no matter who drops out, the other participants will be able to redeem their funds. For example, if B drops out, then we could execute the sequence `Mix -> A, Mix -> C`. If both A and B drop out, then C can still redeem their funds, because they can execute the `Mix -> C` transaction from either the `Mix -> C, Mix -> A` sequence or the `Mix -> C, Mix -> B` sequence.

However, there is a problem with this strategy. The number of possible transaction sequences goes up dramatically with the number of participants. It is not even exponential, but actually combinatoric (an even steeper curve). If there are 10 input accounts, then there are over 3.6 million possible sequences in which those refund transactions might need to happen. Creating 3.6 million aggregated signatures for all those hypothetical transactions will take an annoyingly large amount of time and bandwidth. Having 20 input accounts is totally out the question.

To get around this, we create binary tree of aggregated accounts. This drastically reduces the number of exit paths for which we need to sign hypothetical transaction chains. Instead of A, B and C all paying directly into the mixing account, we do this:

* A and B pay into AB
* C and D pay into CD
* E and F pay into EF
* AB and CD pay into ABCD
* ABCD and EF pay into ABCDEF

Now, let's suppose that C drops out before sending funds to CD. Everyone else has published their send transaction. To get everyone's money back, we only need to execute these transactions:

* ABCD -> AB
* AB -> A
* AB -> B
* CD -> D
* ABCDEF -> EF
* EF -> E
* EF -> F

We don't need any path where ABCDEF pays to E, then to B, then to C. Since transactions are in a tree, not individual, there are fewer valid orders to execute them in. When everyone pays to one account, we need to be able to execute send transactions in any order, because no player can depend on any other in case one drops out. But with a tree, if C doesn't pay to CD, then CD cannot pay to ABCD, so the chain goes no further, and D can get execute a send transaction for a refund from CD without worrying about what A, B, E or F are doing.

## Hiding linkages between inputs and outputs

One problem that still remains is hiding the linkages between inputs and outputs. The mixing protocol above allows mixing funds, safe in the knowledge that no funds can be stolen at any point. However, mixing is much less useful if the other participants, or a server that coordinates the process, is able to tell that the same person owns input account A and output account B. The point of mixing is to obscure that information.

To make that happen, we need a way for all of the participants to communicate a list of input and output accounts to each other without knowing which participant provided which account (and ideally without the server knowing either). To do that, we implement a scheme called "ring communication".

Suppose that 3 participants connect to a server, and announce that they will be providing 1 input each (iA, iB, iC) and 2 outputs each (oA, oB, oC, oD, oE, oF).

Each participant supplies a public encryption key to the server, so that the server cannot read messages sent between players. To keep things anonymous, each participant supplies 6 new accounts, 18 accounts in total.

Ring communication occurs by the server notifying a random participant to start the ring by sending a message to their left-side neighbour. The participant does this by sending a message to the server, encrypted with their left-side neighbour's public key.

Participants start ring communication by sending sets of addresses to each other (say, 3 at a time), randomised from their own and others' lists. At any time, no player (except the initiator) knows whether the player before them is the initiator, so they do not know whether the first 3 addresses belong together. This goes on until all participants have seen 18 unique addresses, and  verified that all of their own desired outputs are present in that list of 18.

Ring communication begins again, this time with each player passing on the full list of 18 addresses, minus 1-4 addresses that are theirs, but which they do not wish to use. They randomly choose how many of their own to remove (1-4), so that it is not clear whether the list is down 2 because of 2 players, or one player removing 2 addresses. The first player in the ring must remove at least 2 to preserve the ambiguity.

Once the list of addresses is down to 6, all unwanted addresses have been discarded, and no player knows which addresses belong to any other player.

At this point, the server creates a binary tree for the input accounts, and sends messages to the participants to have them create aggregated-signature addresses matching the layers of the binary tree, down to the single root element, which is the mixing account. The server also constructs a set of transactions _out_ of the mixing account, which it asks all participants to sign.

Once all of these transactions have been created and signed, all participants can go ahead and send their funds out of their input accounts down to the first layer of the binary tree, safe in the knowledge that the only possible outcomes are that the mix succeeds (and no one else knows which output accounts are theirs), or all of their funds are refunded to their original input accounts.

