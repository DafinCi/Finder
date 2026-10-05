# Authentication API

See [../architecture/system-architecture.md](../architecture/system-architecture.md)
for the flows this API implements.

## Public endpoints

### `POST /api/auth/signup`

- **Purpose**: create an email and password account.
- **Auth**: none.
- **Input**: email and password, validated by the route schema.
- **Output**: success or a validation error.
- **Side effects**: creates a Supabase Auth user; a database trigger provisions the
  matching `profiles` row.

### `POST /api/auth/signin`

- **Purpose**: sign in an existing email and password account.
- **Auth**: none.
- **Output**: Supabase session cookies through `@supabase/ssr`.

### `GET /api/auth/confirm`

- **Purpose**: complete email confirmation from the link Supabase sends.
- **Auth**: none; the token in the request is the proof.

### `GET /api/auth/sui/nonce`

- **Purpose**: issue a Sign-In with Sui challenge.
- **Auth**: none.
- **Rate limit**: yes.
- **Notes**: the nonce is single-use, and it is bound to a purpose
  (`SIWS_LOGIN` or `SIWS_LINK`) and to the configured Sui network. A nonce cannot
  be reused across purposes or networks.

### `POST /api/auth/sui/verify`

- **Purpose**: verify a signed SIWS message and start a session.
- **Auth**: none.
- **Rate limit**: yes.
- **Validation**: signature is verified cryptographically, the recovered address
  must match the address in the message, and the message domain and chain id must
  match configuration.
- **Side effects**: resolves or creates the account for that wallet, then issues a
  Supabase session.

## Product endpoints

### `POST /api/auth/sui/link`

- **Purpose**: attach a wallet to the signed-in account.
- **Auth**: session.
- **Ownership**: operates on the current session only.
- **Errors**: 409 when the wallet already belongs to another account.

### `POST /api/auth/sui/unlink`

- **Purpose**: detach the wallet from the signed-in account.
- **Auth**: session.
- **Errors**: 400 when the wallet is the only way to sign in for that account.

## Ownership and security notes

- A Sui address can belong to exactly one profile, enforced by a unique
  constraint.
- Nonces live in server memory and are consumed atomically, so a replayed request
  fails.
- Wallet sessions and login sessions are separate concerns. Do not treat a
  connected wallet in the browser as authentication.
