# NanoFusion

NanoFusion is a trustless mixing protocol for the Nano cryptocurrency. It is loosely inspired by CashFusion (https://github.com/cashshuffle/spec/blob/master/CASHFUSION.md), the protocol developed by Jonald Fyookball for Bitcoin Cash.

Because Nano is account-based, rather than UTXO-based, some changes are required in order to created a trustless mixing protocol. In a UTXO-based currency, one transaction can have many inputs. CashFusion works by having these many inputs come from different owners. In contrast, each Nano transaction has exactly one sending account and one receiving account. This makes it difficult to mix coins without trusting a central server, because at some point, someone has to have the authority to cryptographically sign the send-transactions from the mixing account. Whoever can sign transactions from the mixing account can send all the money to themselves if they wish.

## Accounts with Aggregated Signatures

To get around this trust problem, we could modify the Nano protocol in some way so that nodes would require multiple signatures on some types transactions before accepting them. But that is ugly, it goes against the minimalist spirit of Nano, and it requires navigating the politics of a protocol change. A more ideal solution would be to do signature aggregation.

Nano uses the Ed25519 curve, which means its signatures are Schnorr signatures. Schnorr signatures have the useful property that aggregated signatures can exist which are indistinguishable from single signatures. An aggregate signature is a signature that is created by two or more parties collaborating to sign a message, without any of the parties having to reveal their private key to the others. This is useful, because once we create an account that can be signed with an aggregate signature, transactions can only occur on that account if all the signers individually agree to them. Because these aggregate signatures are indistinguishable from single signatures, a transaction for this type of joint account can be submitted to the Nano network and verified by the nodes as if it were any other transaction.

There is javascript code in this repository for creating an aggregate signature on the Ed25519 curve. It is currently incomplete and does not work. But there is no reason why it should not be possible to make it work, once the current issues are resolved. It is essentially an attempt at a javascript implementation of the Rust code from this repository: https://github.com/KZen-networks/multi-party-eddsa

The Rust code from KZen-networks does work. The problems that remain are something in the Javascript implementation, not the algorithm itself. The KZen-networks repository has details of the algorithm itself here: https://github.com/KZen-networks/multi-party-eddsa/wiki/Aggregated-Ed25519-Signatures

Once the kinks in the Javascript version are worked out, the last step is to convert it from using SHA-512 hashes to Blake2 hashes (which are the hashes used natively by Nano). Once this is done, it should be possible to use one of these aggregate signatures to sign a Nano block, which can be verified by any existing Nano node.

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

Mix -> A, Mix -> B
Mix -> A, Mix -> C
Mix -> B, Mix -> A
Mix -> B, Mix -> C
Mix -> C, Mix -> A
Mix -> C, Mix -> B

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
