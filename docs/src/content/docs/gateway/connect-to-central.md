---
title: Connect to central
description: Enroll a gateway with ByteBridge Central over MQTT (Sparkplug B) and receive signed configurations.
sidebar:
  order: 4
---

ByteBridge Central follows many gateways: which are online, their live values, commands from
operators and configurations deployed from one place. A gateway opens one outbound MQTT 5
connection to central's broker (TLS with its own client certificate) and publishes every
endpoint as a Sparkplug B device. No inbound port is needed on the gateway; see
[Security and NIS2](../security/) for the firewall rules and what protects the link.

## 1. Add the gateway in central

1. Sign in to central as an Admin.
2. On the **Gateways** page, click **Add a gateway**. Enter the **Gateway id** and the
   **Site** (1 to 32 characters: `a-z`, `0-9` and `-`).
3. Click **Create enrollment token** and copy the one-time token.

## 2. Enroll the gateway

On the gateway machine, in the gateway's folder:

```powershell
bytebridge-runtime enroll --central https://central.example --token <token> --dir C:\ByteBridge\link
```

This creates the gateway's key, gets a 90-day client certificate and writes `link.json`. The
gateway renews the certificate by itself 30 days before it expires.

## 3. Check `link.json`

```json title="link.json"
{
  "broker": "mqtts://central.example:8883",
  "site": "plant-a",
  "gateway": "gw-01",
  "caFile": "ca.pem",
  "certFile": "gateway.pem",
  "keyFile": "gateway.key",
  "configPublicKey": "<shown on central's Configuration page>",
  "allowRemoteControl": false
}
```

| Field | Default | Meaning |
|---|---|---|
| `broker` | (required) | `mqtts://host[:8883]` |
| `site`, `gateway` | (required) | the ids from central |
| `caFile`, `certFile`, `keyFile` | | written by `enroll`; paths are relative to `link.json` |
| `configPublicKey` | | the key that signs configurations; without it, configurations from central are refused |
| `allowRemoteControl` | `false` | accept commands from central's operators |
| `bufferMaxMb` | `100` | values kept on disk while central is unreachable |

Unknown fields are an error, so a misspelled security setting does not go unnoticed.

## 4. Start the runtime with the link

```powershell
bytebridge-runtime --config C:\ProgramData\ByteBridge\gateway.json --link C:\ByteBridge\link\link.json
```

To keep the gateway's web UI as well, run the runtime as its own service and set the gateway
to `"Runtime": "Remote"` with `RuntimeUrl` (e.g. `http://127.0.0.1:5104`) and `RuntimeToken`
in `appsettings.json` (see [Install the gateway](../install/#application-settings)).

The gateway appears in central as online. While central is unreachable, the gateway keeps
working and buffers values on disk; they are sent when the connection is back.

## Configurations from central

On the gateway's **Configuration** page in central, Engineers edit a draft with the same
endpoint, mapping and calculation editors as the tester. Each change is checked like the
gateway checks it. **Deploy** signs the version and announces it; the gateway downloads it,
verifies the signature and checksum, and applies it as a whole. Central shows each version as
sent, applied or rejected, and rolls back by deploying an older version again.

A configuration from central cannot change `link.json`, so a bad deployment never cuts the
gateway off from central.
