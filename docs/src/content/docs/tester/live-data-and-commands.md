---
title: Live data and commands
description: Read the live data table and the connection health, send commands to a device and simulate values towards a SCADA system.
sidebar:
  order: 3
---

Open an endpoint from the **Endpoints** list in the menu to see its live data. The page is the
same for every protocol.

## Connection health

Above the points of a **client** endpoint, four tiles show whether the data is fresh, without
starting a trace:

| Tile | What it says |
|---|---|
| Connection | *Online for 2 h 5 min*, since when, and how many times the connection was lost since the endpoint started. While not online: the state (*Connecting*, *Stopped*) and why. |
| Last update | how long ago the device last delivered data, changed or not: a completed poll, or a received message. For a polling protocol also the poll interval and how long the last poll cycle took. More than three poll intervals without a poll is marked **stale**. |
| Points | how many points there are, how many are good and bad, and how many changed in the last 10 s. |
| Errors | while an error goes on (the same Modbus exception every poll, for example): *Failing for 2 min*, with its message and when it started. Otherwise how many errors began in the last 10 minutes and when the last one was. **Show frames** opens the [Troubleshoot](../troubleshoot/) tab. |

Errors are exceptions, timeouts, negative confirmations, refused or unanswered commands and lost
connections. An error that every
poll repeats counts **once**, from the first poll that had it to the first poll without it, so a
missing register does not fill the counter; a one-off failure counts each time it happens.

Every client protocol reports polls, updates and errors. What counts as an update depends on how
the protocol gets its data:

| Protocol | Polls? | *Last update* advances on |
|---|---|---|
| Modbus TCP, Siemens S7 | yes | every poll |
| OPC XML-DA | yes, in both modes | every Read cycle, or every SubscriptionPolledRefresh answer |
| OPC DA | in Read mode | every read cycle (Read), every data change (Subscription) |
| IEC 104 | no | every received data message |
| DNP3 | no | every answer from the outstation, also an event poll without events |
| OPC UA | no | every publish response, also a keep-alive without changes |
| Simulator | no | every tick, changed values or not |

Only polling endpoints show a poll interval and cycle time, and only their values turn
**stale**. Server endpoints have no health strip.

## The points table

| Column | Meaning |
|---|---|
| Address | the point's address in the protocol's own format |
| Name | the point's description, if it has one (see *Names* below); a long name is cut, the whole name is its tooltip |
| Type | `Boolean`, `DoublePoint`, `Integer`, `Float`, `Counter` or `Bitstring` |
| Value | the latest value; `—` for a defined point that has not been received yet |
| Quality | **Good**, or the quality bits such as **IV** (invalid) or **NT** (not topical); then the value's flags as small labels (see *Flags* below). For a bad point also why, and when it was last good |
| Time | the device's time stamp, or the time the value arrived |
| Age | how fresh the value is (client endpoints, see below) |
| Trend | the recent history of the value |

### Age: is the value fresh?

*Age* measures freshness, not activity. For a polled point (Modbus, S7, XML-DA, OPC DA in Read
mode) it is the time since the last
poll that read the value, **changed or not**: a register that has held `21.5` for an hour but is
read every second has an age under a second. For a point the device sends by itself (an IEC 104
spontaneous value, a DNP3 event, an OPC UA data change) it is the time since the value's time stamp. The column header's tooltip says
which applies.

When the device stops answering, the ages of a polled endpoint keep growing, and after three poll
intervals they read **stale**, in words as well as in colour. That is how a frozen value is told
apart from a value that just does not change.

### Why a point is bad

Under a bad point's quality the table shows the reason in the device's terms, for example
*Modbus exception: Illegal data address* for a register the device does not have, *object does
not exist* for a missing S7 data block, *BadNodeIdUnknown* for an OPC UA variable the server does
not know, *Bad: Comm Failure* for an OPC DA item or *Flags from the outstation: COMM_LOST* for a
DNP3 point, and when the
point was last good: *last good 12:38:02 (1 min ago)*, or *no good value since the endpoint started*.

### Flags

Some devices say more about a value than good or bad. These facts are shown as small labels
next to the quality; hover over a label for its meaning. A value with flags but no quality bits
is still **good**: mappings, calculations, the health tiles and *Age* treat it like any good
value.

| Flag | Meaning |
|---|---|
| test | the value comes from a device in test mode |
| failure | the device reports an internal failure for this value |
| oscillatory | the value oscillates; the device suppresses changes |
| inconsistent | the device found the value inconsistent |
| inaccurate | the value is inaccurate |
| out of range | outside the value's configured range |
| bad reference | the device's reference (calibration) is bad |
| clock not synchronized | the time stamp comes from an unsynchronised clock |
| clock failure | the device's clock has failed |
| polled | read by polling because the device's preferred delivery (reports) is not available |

Today IEC 61850 sets them (see [IEC 61850](../iec61850/#quality-time-stamps-and-flags)). Server
endpoints do not send flags on; a mapping keeps them in the gateway and in central.

### Names

Give a point a name when you add it (the **Name** field of **Add point**), in a CSV file (the
`name` column, see [Import and export points](../import-export-points/)), or take the name the
device proposes in **Detect points**. In **Multiple points**, `{n}` in the name numbers the
points: with an address pattern it is the number in the address (start index and padding
included), otherwise 1, 2, 3, ... So *Pump {n} speed* gives *Pump 1 speed*, *Pump 2 speed*, ... Names
have up to 255 characters; shorter ones read better in tables.

### Find points

The **All / Bad quality / Changed < 10 s** buttons, each with its count, narrow the table to the
points that need attention or the ones that are moving. Type in **Filter by address, name or
type** to find points in a long list; the column filters under the headers work per column, and
the Quality filter also finds flags (`test`). **Refresh all** asks the device for all its values again (for IEC 104
this is a general interrogation). **Stop** and **Start** disconnect and reconnect the endpoint.

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
