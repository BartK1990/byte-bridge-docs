---
title: Connect to a device
description: Examples for reading a Modbus TCP meter, a Siemens S7 PLC, an OPC UA server, an IEC 61850 IED, a DNP3 outstation and a Logix controller with the tester.
sidebar:
  order: 2
---

Every device is a **client** endpoint. Click **New endpoint** on the toolbar (or **+** next to
**Endpoints** in the explorer), choose the protocol and the role
**Client**, and fill in the settings below. The form only shows the settings of the chosen
protocol, each with its default value.

:::note
Make sure the laptop can reach the device: the same network, the right IP address and no
firewall in between. The endpoint shows its state (connecting, running, faulted) in the explorer
and on the **Overview**. If it stays *connecting*, use **Test connection** in the editor or the
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
| Byte order of multi-register values | `ABCD` | `CDAB`, `BADC` or `DCBA` if 32- and 64-bit values look wrong |

Address prefixes: `HR` holding register, `IR` input register, `CO` coil, `DI` discrete input.
The optional suffix sets the register type: `u16` (default), `i16`, `u32`, `i32`, `f32`, and the
64-bit `u64`, `i64`, `f64` (energy counters, doubles). A second suffix sets the byte order of one
point when it differs from the endpoint's: `HR:40011:f32:CDAB`.

Not sure where a value starts or which byte order the meter uses? **Read registers** in the editor
shows the registers in all four orders side by side: see [Finding the byte order](../byte-order/).

Protocol Bridge merges neighbouring addresses into one read request (**Max gap to merge reads**,
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

With **Browse for variables** on, you do not have to type addresses: Protocol Bridge browses the
server from **Browse root** (`i=85`, the Objects folder) and subscribes to what it finds.

With a secured policy, the server has to trust Protocol Bridge and Protocol Bridge has to trust the
server. The first connection is usually rejected; open **Certificates**, find the server's
certificate under **Rejected** and click **Trust**. Give the server the Protocol Bridge certificate
shown under **This application**.

## IEC 61850 IED

| Setting | Example | Notes |
|---|---|---|
| Host | `192.168.10.21` | the protection relay, bay controller or meter |
| Port | `102` | |
| Points to read | `IED1LD0/MMXU1.TotW[MX], IED1CTRL/XCBR1.Pos[CO]` | or use **Detect points** |
| Mode | `Reports` | values from the IED's reports; `Poll` to read every point each interval |

Reports, commands, point detection and the connection settings are explained in
[Connect an IEC 61850 IED](../iec61850/).

## DNP3 outstation (RTU, IED)

| Setting | Example | Notes |
|---|---|---|
| Host | `192.168.1.30` | the RTU, IED or DNP3 gateway |
| Port | `20000` | |
| Master link address / Outstation link address | `1` / `1024` | as configured in the outstation |
| Enable unsolicited reporting | on | the outstation sends class 1, 2 and 3 events by itself |
| Class 1 / 2 / 3 event poll interval (ms) | `1000` / `10000` / `60000` | `0`: disabled |
| Integrity poll interval (s) | `3600` | reads every value again (class 0); `0`: only after connecting and after an event buffer overflow |

After connecting, Protocol Bridge runs an integrity poll and then takes events as the outstation
reports them. Each event class can also be polled on its own interval, for example class 1
(often breaker and alarm states) every second and class 3 every minute. Classes that are due at
the same time are read in one request. The polls run whether unsolicited reporting is on or off,
so they also catch events of an outstation that reports unsolicited only for some classes. With
all three intervals at `0` and unsolicited reporting off, events are read when the outstation
says it has some.

Protocol Bridge confirms every unsolicited response, so the outstation removes those events from
its buffer.

## Allen-Bradley Logix controller (EtherNet/IP)

| Setting | Example | Notes |
|---|---|---|
| Host | `192.168.1.20` | the Ethernet module or the controller's built-in port |
| Port | `44818` | |
| Route path | `1,0` | backplane, slot of the controller; CompactLogix: `1,0` |
| Points to read | `Line1_Speed, Motors[3].Current, Program:MainProgram.Count` | or use **Detect points** |

Route paths, tag addresses, writing and point detection are explained in
[Connect an Allen-Bradley Logix controller](../ethernet-ip/).

## No device at hand?

Use a Protocol Bridge **server** endpoint fed by the simulator as the device, as in the
[quick start](../quick-start/): IEC 104, Modbus TCP, DNP3 and OPC UA have a server role. For
IEC 61850, see [No IED at hand?](../iec61850/#no-ied-at-hand); for EtherNet/IP, see
[No controller at hand?](../ethernet-ip/#no-controller-at-hand).
