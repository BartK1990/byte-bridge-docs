---
title: Concepts
description: Endpoints, mappings, calculations and points, the building blocks of every ByteBridge configuration.
---

The tester and the gateway share one model. Learn these four words and every screen makes sense.

## Endpoint

An **endpoint** is one configured instance of a protocol driver. It has a name, a protocol, a
role and the driver's settings (host, port, poll interval, ...).

| Role | What it does | Examples |
|---|---|---|
| **Client** | connects to a device and reads its data | IEC 104 controlling station, Modbus master, DNP3 master, OPC UA client, S7 client |
| **Server** | exposes data to other systems | IEC 104 controlled station, Modbus slave, DNP3 outstation, OPC UA server |

The *Simulator* client produces changing test values, so you can try everything without hardware.

## Point

A **point** is one value of an endpoint: its address, type, value, quality and time stamp.
Points are protocol-neutral, so a value read over IEC 104 can be published over OPC UA.

| Type | Values |
|---|---|
| `Boolean` | on / off |
| `DoublePoint` | 0 intermediate, 1 off, 2 on, 3 indeterminate |
| `Integer`, `Counter` | whole numbers |
| `Float` | measured values |
| `Bitstring` | 32 bits |

Quality follows IEC 104: **IV** invalid, **NT** not topical, **SB** substituted, **BL** blocked,
**OV** overflow.

Each protocol writes addresses its own way:

| Protocol | Address examples |
|---|---|
| IEC 60870-5-104 | information object address, `1` to `16777215` |
| Modbus TCP | `HR:40001:f32`, `IR:30001`, `CO:1`, `DI:10001` |
| DNP3 | `BI:0`, `DBI:0`, `BO:0`, `CT:0`, `FC:0`, `AI:0`, `AO:0` |
| OPC UA | node id, e.g. `ns=2;s=Pump1.Speed` |
| OPC DA | item ID, e.g. `Random.Int4` or `Plant.Line1.Speed` |
| OPC XML-DA | `ItemName`, or `ItemPath\|ItemName` |
| Siemens S7 | `DB1.DBX0.0`, `DB1.DBW2:INT`, `DB1.DBD4:REAL`, `MW10`, `I0.0`, `Q0.1`, `T5`, `C3` |
| Simulator | point number, `1` to N |

## Mapping

A **mapping** routes points from a client endpoint (the source) to a server endpoint (the target):

- **Source address** `*` maps every point and keeps its address. Or pick one address.
- **Target address** and **target type** are optional; empty means the same as the source.
- **Scale** and **offset** convert numbers: `target = source × scale + offset`.
- **Forward commands** sends commands that the server receives (for example from SCADA) back to
  the source device. The device's confirmation or rejection goes back to the sender.

## Calculation

A **calculation** computes a new point from the live values of other points with a short
[Rhai](https://rhai.rs) script, such as `p1 + p2`. Calculated points belong to a *Calculation*
endpoint and are mapped like device points. See [Calculations](../gateway/calculations/).

## The configuration file

Endpoints, mappings and calculations are stored together in one JSON file:

| App | File |
|---|---|
| Desktop tester | `%LOCALAPPDATA%\ByteBridge\desktop.json` |
| Gateway | `%ProgramData%\ByteBridge\gateway.json` |

Because the format is the same, a configuration built in the tester runs on a gateway as it is.
