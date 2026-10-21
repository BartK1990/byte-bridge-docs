---
title: Security and NIS2
description: How a ByteBridge gateway connects from the OT network to central from the inside out, and which NIS2 measures it supports.
sidebar:
  order: 5
---

A gateway sits on the boundary between the OT network (devices, PLCs, local SCADA) and the rest
of the company. It is designed so that this boundary only has to let traffic **out**: the
gateway opens every connection to ByteBridge Central itself, and central never connects to a
gateway.

## Inside out: the connections a gateway makes

```
 OT network (level 0-2)    Edge / OT DMZ    firewall   IT / data centre / cloud
┌────────────────────┐   ┌──────────────┐     ║     ┌─────────────────────┐
│ RTU    IEC 104     │──▶│              │ (1) ║     │                     │
│ PLC    Siemens S7  │──▶│   Gateway    │─────╫────▶│ ByteBridge Central  │
│ Meter  Modbus TCP  │──▶│              │ (2) ║     │ broker · CA · audit │
│ SCADA  OPC UA      │──▶│              │─────╫────▶│                     │
└────────────────────┘   └──────────────┘     ║     └─────────────────────┘
                                              ║◀──✕── inbound connections are refused

 (1) MQTT 5, mutual TLS, port 8883    (2) HTTPS, port 443
```

| Connection | Direction | Port | Used for | Protection |
|---|---|---|---|---|
| MQTT 5 to the broker | gateway → central | 8883 | live values (Sparkplug B), online state, commands, configuration notices | TLS 1.2/1.3, a client certificate per gateway, topic rules per gateway |
| HTTPS to central | gateway → central | 443 | enrollment, certificate renewal, configuration downloads | TLS; every configuration checked against a SHA-256 hash and an Ed25519 signature |
| Device protocols | gateway → devices | per protocol | IEC 104, Modbus, S7, DNP3, OPC UA, OPC XML-DA | stay inside the OT network |
| Server endpoints | OT clients → gateway | as configured | SCADA, HMI or historians reading the gateway | open only the ports of the servers you configure, on the OT side |

Commands from central and configuration notices travel back over the MQTT connection the
gateway opened, so no inbound rule is needed for them either.

### Firewall rules

On the plant firewall, allow only these outbound connections from the gateway, and nothing
inbound from the IT network or the internet:

| From | To | Port | Protocol |
|---|---|---|---|
| gateway | central's broker | 8883/TCP | MQTT over TLS |
| gateway | central (`Central:PublicUrl`) | 443/TCP | HTTPS |

The gateway's web UI listens on `localhost` by default (see
[Install the gateway](../install/)), and the protocol engine's API on `127.0.0.1` with a token.

## What protects the link

- **Identity.** Each gateway has its own key, created on the gateway; it never leaves the
  machine. Central's certificate authority issues a 90-day client certificate during
  [enrollment](../connect-to-central/) with a one-time token, and the gateway renews it by itself.
- **Isolation between gateways.** The broker requires the MQTT client id to equal the
  certificate's name, and a gateway can only publish as itself and receive its own commands.
- **Revocation.** Revoke a gateway's certificate in central and the built-in broker drops the
  connection at once.
- **Signed configurations.** A configuration from central is signed over gateway, version and
  file hash. The gateway refuses unsigned, foreign and older versions, and applies a file as a
  whole or not at all.
- **The site keeps control.** Central cannot change `link.json`: the broker, the certificates,
  the signing key and whether remote commands are allowed are set on the gateway only.
- **Remote commands are opt-in.** They are off unless `allowRemoteControl` is `true` on the
  gateway, expire after 30 seconds, are never carried out twice, are allowed only to Operators
  and Admins, and each one is in central's audit log.
- **Secrets at rest.** Passwords a server endpoint checks are stored as PBKDF2 hashes;
  passwords a client endpoint sends are encrypted with AES-256-GCM.
- **Resilience.** When central is unreachable, the gateway keeps running and buffers values on
  disk; they are sent once the link is back.

## NIS2

The NIS2 directive (EU 2022/2555) requires essential and important entities, among them energy,
water, transport and manufacturing, to take risk-management measures for their network and
information systems, OT included (Article 21). The obligations rest with the operator; no product
makes an organisation compliant on its own. ByteBridge supports these measures for the link
between the plants and central:

| NIS2 Article 21(2) | How ByteBridge supports it |
|---|---|
| (b) Incident handling | Audit log of commands and deployments in central; online and offline state of every gateway; immediate revocation of a gateway |
| (c) Business continuity | Gateways keep running without central and buffer values on disk; versioned configurations with rollback |
| (h) Cryptography and encryption | TLS on every connection, mutual authentication with certificates, Ed25519-signed configurations, encrypted secrets |
| (i) Access control and asset management | Viewer, Engineer, Operator and Admin roles with single sign-on; one identity per gateway; central lists every gateway with its runtime and configuration version |
| (j) Secured communications | All traffic between gateways and central is authenticated and encrypted |

## IEC 62443

The design fits the *zones and conduits* model of IEC 62443: the OT network is a zone of its
own, and the gateway is the single conduit out of it, with two outbound connections that can be
documented and enforced on the firewall. Protocols without built-in security, such as Modbus TCP
or IEC 104, stay inside the zone.
