---
title: Live data and commands
description: Read the live data table, send commands to a device and simulate values towards a SCADA system.
sidebar:
  order: 3
---

Open an endpoint from the **Endpoints** list in the menu to see its live data. The page is the
same for every protocol.

## The points table

| Column | Meaning |
|---|---|
| Address | the point's address in the protocol's own format |
| Type | `Boolean`, `DoublePoint`, `Integer`, `Float`, `Counter` or `Bitstring` |
| Value | the latest value |
| Quality | flags such as **IV** (invalid) or **NT** (not topical); empty means good |
| Time | the device's time stamp, or the time the value arrived |
| Trend | the recent history of the value |

Type in **Filter by address or type** to find points in a long list. **Refresh all** asks the
device for all its values again (for IEC 104 this is a general interrogation). **Stop** and
**Start** disconnect and reconnect the endpoint.

## Send a command (client endpoints)

1. Click **control** on a point, or type its address in the **Send command** form.
2. Pick the **Type** and enter the **Value**; `Boolean` and `DoublePoint` have **ON** and **OFF**.
3. Tick **Select before operate** if the device expects a select first (IEC 104, DNP3).
4. Click **Send**.

The result comes back from the device: *Confirmed*, *Rejected*, *Timeout* or *Not connected*.
That tells you not only that the command was sent, but whether the device accepted it. To see the
frames of a command, start the frame trace on the **Troubleshoot** tab first: the result then
offers **Show frames**, which opens the trace with only that command's frames (the same for
**Refresh**). See [Troubleshoot a connection](../troubleshoot/#frames-of-a-command-or-refresh).

Examples:

- IEC 104: a single command to IOA `2001`.
- Modbus: write coil `CO:1` or holding register `HR:40101`.
- DNP3: a control to `BO:0` or an analog output to `AO:0`.
- S7: write `DB1.DBW10:INT`.

## Publish a value (server endpoints)

On a **server** endpoint the same form is called **Publish value**. Use it to play the
device's part towards a SCADA system under test: publish `1` on an alarm point and check that
SCADA raises the alarm, or set a measured value out of range.

Click **edit** on a point to fill the form with it, change the value and click **Publish**.
Tick **Invalid quality** to check how SCADA shows a failed measurement. Commands that SCADA sends
to the server show up as new values; with a mapping that has *forward commands* on, they are
sent on to the real device.

## Replay a recorded or simulated source

Map any client endpoint onto a server endpoint (see [Concepts](../../concepts/#mapping)).
A *Simulator* client gives changing values, and a mapping with a target type, scale and offset
shapes them into what the SCADA system expects.
