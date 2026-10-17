---
title: Connect to a device
description: Examples for reading a Modbus TCP meter, a Siemens S7 PLC and an OPC UA server with the tester.
sidebar:
  order: 2
---

Every device is a **client** endpoint. Click **Add endpoint**, choose the protocol and the role
**Client**, and fill in the settings below. The form only shows the settings of the chosen
protocol, each with its default value.

:::note
Make sure the laptop can reach the device: the same network, the right IP address and no
firewall in between. The endpoint shows its state (connecting, running, faulted) in the menu
and on the **Dashboard**. If it stays *connecting*, use **Test connection** in the editor or the
**Troubleshoot** tab: see [Troubleshoot a connection](../troubleshoot/).
:::

## Modbus TCP energy meter

| Setting | Example | Notes |
|---|---|---|
| Host | `192.168.1.50` | the meter or the Modbus TCP gateway |
| Port | `502` | |
| Unit id | `1` | |
| Points to poll | `HR:40001:f32, HR:40003, IR:30001:u32, CO:1, DI:10001` | separated by commas |
| Poll interval (ms) | `1000` | |
| Word order of 32-bit values | `big` | change it if 32-bit values look wrong |

Address prefixes: `HR` holding register, `IR` input register, `CO` coil, `DI` discrete input.
The optional suffix sets the register type: `u16` (default), `i16`, `u32`, `i32`, `f32`.

ByteBridge merges neighbouring addresses into one read request (**Max gap to merge reads**,
**Registers per read request**), so a long point list stays fast.

## Siemens S7 PLC

Works with S7-300, S7-400, S7-1200 and S7-1500. On S7-1200/1500, allow **PUT/GET communication**
in the CPU properties and switch off *optimized block access* for the data blocks you read.

| Setting | Example | Notes |
|---|---|---|
| Host | `192.168.0.10` | the CPU or its communication processor |
| Port | `102` | |
| Rack / Slot | `0` / `1` | S7-300: slot `2` |
| Addresses to poll | `DB1.DBD0:REAL, DB1.DBD4:DINT, DB1.DBX8.0, DB1.DBW10:INT` | |
| Poll interval (ms) | `1000` | |

Besides the polled addresses, the point `CPU.Run` shows the CPU state.

## OPC UA server

| Setting | Example | Notes |
|---|---|---|
| Endpoint URL | `opc.tcp://192.168.0.20:4840` | |
| Security policy / mode | `Basic256Sha256` / `SignAndEncrypt` | `None` for a quick test |
| User name / Password | | empty: anonymous |
| Browse for variables | on | finds the server's variables by itself |
| Nodes | `ns=2;s=Pump1.Speed` | extra node ids to subscribe to |

With **Browse for variables** on, you do not have to type addresses: ByteBridge browses the
server from **Browse root** (`i=85`, the Objects folder) and subscribes to what it finds.

With a secured policy, the server has to trust ByteBridge and ByteBridge has to trust the
server. The first connection is usually rejected; open **Certificates**, find the server's
certificate under **Rejected** and click **Trust**. Give the server the ByteBridge certificate
shown under **This application**.

## No device at hand?

Each protocol comes with a tester device in the
[ByteBridge repository](https://github.com/BartK1990/byte-bridge), for example
`cargo run -p modbus --example server_sim -- 127.0.0.1:5020` for Modbus or
`cargo run -p s7 --example s7_server_sim -- 127.0.0.1:1102` for S7. Or use a ByteBridge
**server** endpoint fed by the simulator, as in the [quick start](../quick-start/).
