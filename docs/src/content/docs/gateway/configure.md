---
title: Configure the gateway
description: Example gateway configuration that exposes an IEC 104 RTU through OPC UA and Modbus TCP, with scaling and command forwarding.
sidebar:
  order: 2
---

This example connects a substation RTU over IEC 104 and makes its data available to two
systems: an OPC UA client (a historian or MES) and a Modbus master (a PLC). Commands from the
OPC UA side go back to the RTU.

```text
                     ┌─────── Gateway ───────┐ ──OPC UA──▶ Historian
 RTU ───IEC 104────▶ │ client ─▶ 2 servers   │
 192.168.10.5:2404   └───────────────────────┘ ──Modbus──▶ Line PLC
```

You can build it in the gateway's web UI, or in the [desktop tester](../../tester/quick-start/)
first and copy the configuration file over (see [Move a configuration](#move-a-configuration-from-the-tester)).

## 1. The source: an IEC 104 client

**Add endpoint**, name `RTU Substation A`, protocol **IEC 60870-5-104**, role **Client**:

| Setting | Value |
|---|---|
| Host | `192.168.10.5` |
| Port | `2404` |
| Common address (ASDU) | `1` |
| General interrogation on connect | on |
| Start automatically | on |

Save it and open the endpoint. Check that the values arrive before you go on.

## 2. The targets: an OPC UA server and a Modbus server

**OPC UA server** (`OPC UA for historian`, protocol **OPC UA**, role **Server**):

| Setting | Value | Notes |
|---|---|---|
| Port | `4840` | |
| Folder | `ByteBridge` | the points appear below *Objects/ByteBridge* |
| Clients may write | on | writes become commands |
| Security | `None and secured` | |
| Allow anonymous users | off | add **Users** instead |

**Modbus server** (`Modbus for PLC`, protocol **Modbus TCP**, role **Server**): **Port** `502`,
**Unit id** `0` (answers every unit id).

## 3. The mappings

Open **Mappings** and add:

| Source | Source address | Target | Target address | Target type | Scale / offset | Forward commands |
|---|---|---|---|---|---|---|
| RTU Substation A | `*` | OPC UA for historian | (same) | (same) | 1 / 0 | on |
| RTU Substation A | `4001` | Modbus for PLC | `HR:40001` | `Integer` | 10 / 0 | off |
| RTU Substation A | `1001` | Modbus for PLC | `CO:1` | (same) | 1 / 0 | off |

- The first mapping publishes every RTU point on OPC UA under its IEC 104 address, and sends
  OPC UA writes back to the RTU as IEC 104 commands. The RTU's confirmation or rejection is
  returned to the OPC UA client.
- The second turns the measured value at IOA 4001 (e.g. `49.97` Hz) into a whole number for
  the PLC: `49.97 × 10 = 499.7`, rounded to `500` in holding register 40001.
- The third exposes the breaker state at IOA 1001 as coil 1.

The **Last value** column shows what passes through each mapping.

## 4. The configuration file

Everything is saved in `%ProgramData%\ByteBridge\gateway.json`. The example above looks like
this (driver settings that keep their defaults are left out):

```json title="gateway.json"
{
  "endpoints": [
    { "id": "rtu-a", "name": "RTU Substation A", "protocol": "iec104", "role": "Client",
      "settings": { "host": "192.168.10.5", "port": "2404", "common_address": "1" } },
    { "id": "opcua", "name": "OPC UA for historian", "protocol": "opcua", "role": "Server",
      "settings": { "port": "4840", "allow_anonymous": "false" } },
    { "id": "plc", "name": "Modbus for PLC", "protocol": "modbus", "role": "Server",
      "settings": { "port": "502", "unit_id": "0" } }
  ],
  "mappings": [
    { "id": "m1", "sourceEndpointId": "rtu-a", "sourceAddress": "*",
      "targetEndpointId": "opcua", "forwardCommands": true },
    { "id": "m2", "sourceEndpointId": "rtu-a", "sourceAddress": "4001",
      "targetEndpointId": "plc", "targetAddress": "HR:40001", "targetType": "Integer", "scale": 10 },
    { "id": "m3", "sourceEndpointId": "rtu-a", "sourceAddress": "1001",
      "targetEndpointId": "plc", "targetAddress": "CO:1" }
  ],
  "calculations": []
}
```

Settings are text, and their keys are the driver's setting names. Missing fields take their
defaults; unknown fields are ignored.

## Move a configuration from the tester

1. Build and test the configuration in the desktop app.
2. Copy `%LOCALAPPDATA%\ByteBridge\desktop.json` from the laptop to the gateway as
   `%ProgramData%\ByteBridge\gateway.json`.
3. Change the addresses that differ on site (for example, server endpoints that listened on
   `127.0.0.1` during the test).
4. Restart the service: `Restart-Service ByteBridgeGateway`.

:::tip
Gateways connected to [central](../connect-to-central/) get their configuration from central
instead: edited there, checked, signed and deployed with one click.
:::
