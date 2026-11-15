---
title: Connect an Allen-Bradley Logix controller (EtherNet/IP)
description: Read and write ControlLogix, CompactLogix and GuardLogix tags by name over EtherNet/IP, find the tags by browsing the controller, and read attributes of other CIP devices.
sidebar:
  order: 2.6
---

ByteBridge talks to Allen-Bradley **ControlLogix**, **CompactLogix** and **GuardLogix**
controllers directly over EtherNet/IP (CIP explicit messaging). It reads and writes tags **by
their names**, as Studio 5000 shows them, finds the tags by browsing the controller, and reads
attributes of other CIP devices such as drives, I/O adapters and power monitors.

No Rockwell data server (RSLinx, FactoryTalk Linx) is needed, nothing is installed on the
computer, and nothing has to be enabled on the controller. ByteBridge uses *unconnected*
messages only: it opens no CIP connection in the controller and does not change its I/O
configuration.

Add an endpoint with the protocol **EtherNet/IP (Allen-Bradley Logix)** and the role
**Client**. One endpoint is one controller; a chassis with three controllers gets three
endpoints.

## Connection

| Setting | Example | Notes |
|---|---|---|
| Host | `192.168.1.20` | the Ethernet module (1756-EN2T, EN2TR, EN4TR, ...) or the controller's built-in port |
| Port | `44818` | |
| Family | `Logix` | `Generic CIP` for drives, adapters and other CIP devices |
| Route path | `1,0` | see below |
| Poll interval | `1000` ms | every point is read each interval |
| Requests in flight | `1` | up to 4; the controller shares its message buffers with every HMI and client |
| Read controller state every | `5000` ms | for the `Controller.*` points and the *device faulted* flag |

**Route path** says how to get from the Ethernet port to the controller, as pairs of *port,
link*, the way Rockwell writes it:

| Route path | Meaning |
|---|---|
| `1,0` | backplane, slot 0. Also CompactLogix with a built-in Ethernet port |
| `1,3` | backplane, slot 3 (the controller sits in slot 3) |
| `1,2,2,192.168.2.10,1,0` | backplane slot 2 (a second Ethernet module), out of its port 2 to `192.168.2.10`, then that chassis' backplane, slot 0 |
| *(empty)* | the device the host points at, for generic CIP devices |

## Points

**Tags** are written as in Studio 5000; upper or lower case does not matter:

| Point | What it reads |
|---|---|
| `Line1_Speed` | a controller-scope tag |
| `Program:MainProgram.Count` | a program-scope tag |
| `Motors[3].Current` | a member of an element of a UDT array |
| `Grid[2,4]` | an element of a two-dimensional array (up to three dimensions) |
| `Status.7` | bit 7 of an integer tag |
| `Flags[37]` | one BOOL of a BOOL array |
| `T1.ACC`, `T1.DN` | members of a TIMER (also COUNTER, CONTROL and AOI members) |
| `Line1_Speed:REAL` | with the type it must have (optional) |

ByteBridge takes the type from the controller. If you add a type after a colon and the
controller's tag has another type, the point turns invalid and says both types: useful after a
program change, so a retyped tag does not silently give wrong numbers.

**Attributes of other CIP devices** are written `@class/instance/attribute:TYPE`, with the
type required: `@0x01/1/5:WORD` is the Identity object's status, `@0x0F/3/1:REAL` a Parameter
object. Endpoints of the family *Generic CIP* accept only this form.

**Controller points** come from the controller's Identity object: `Controller.Status` (the
status word), `Controller.Faulted` (a major fault), `Controller.MinorFault`, and for Logix
`Controller.Run`, `Controller.Mode` (6 Run, 7 Program) and `Controller.Keyswitch` (1 Run,
2 Program, 3 Remote). They are read-only.

| Logix type | Point type |
|---|---|
| BOOL, bits, BOOL array elements, `.DN`-style bits | Boolean |
| SINT, INT, DINT, LINT, USINT, UINT, UDINT, ULINT | Integer (LINT and ULINT exact above 2^53) |
| REAL, LREAL | Float |
| BYTE, WORD, DWORD, LWORD (CIP attributes) | Bitstring |

STRING tags are not numbers and cannot be points.

### Quality and the *device faulted* flag

EtherNet/IP carries no quality and no time stamp: a point is good when it is read, with the
time it arrived. A tag that fails turns only its own point invalid, with the reason in words,
for example *path segment error (tag or object not found)*. A REAL that reads as NaN or
infinity is invalid. When the connection is lost, every point turns invalid.

While the controller reports a **major fault**, its program does not run. ByteBridge still
reads the values, and every point carries the [flag](../live-data-and-commands/#flags)
*device faulted*.

## Writing

A command writes the tag with its type from the controller. Single bits (`Status.7`,
`Flags[37]`) are changed with a read-modify-write in the controller, so the other bits of the
word are not touched. Numbers are rounded to whole numbers for integer tags and refused before
anything is sent when they do not fit the type. Generic attributes are set with
Set_Attribute_Single.

A refused write says why: the tag does not exist, its **External Access** is *Read Only* or
*None*, it is a constant or a safety tag, or the type does not match. There is no
select-before-operate; writes take effect at once.

## Detect points

**Detect points** on the endpoint's page lists the controller's tags and proposes one point per
value: every atomic tag, every member of a structure or AOI and every array element. The tag's
name is the point's name, so no other name is proposed. Options:

- **Controller scope only**: leave out the programs' tags.
- **Include module-defined I/O tags** (`Local:1:I.Data`, ...): off by default.
- **Include status bits of timers, counters and controls** (`.EN`, `.TT`, `.DN`): on by default.

Arrays offer their first 64 elements, with a note on how many were left out. System tags,
STRING tags and tags with External Access *None* are left out; read-only tags are offered and
listed in a note. Detection stops at 20,000 points. With **Detect points on connect** the
endpoint adds the controller's points by itself each time it connects.

Tag descriptions cannot be read from the controller. Export the tags from Studio 5000 and
import their descriptions with the `description` column of a
[point CSV](../import-export-points/).

## When it does not connect

**Test connection** (or the **Troubleshoot** tab) walks through the steps and stops at the first
one that fails, with what to change:

| Step | Typical failure | What to check |
|---|---|---|
| List Identity | the device does not answer, or answers with something else | host and port; the device speaks EtherNet/IP |
| RegisterSession | the session is refused | CIP Security enforced on the module (not supported), or no free sessions |
| Route to target | *port not available*, *link address not valid*, *invalid segment in path* | **Route path**: the controller's slot |
| Target identity | not a Logix controller; a Micro800 | **Route path**, or **Family** *Generic CIP*; Micro800 controllers are not supported |
| Configured points | a tag that does not exist, an index beyond the end of an array, External Access | the tag name and its program, the array size, the tag's External Access |

A busy controller (*resource unavailable*, *unconnected request timed out*) shares its message
buffers with every HMI and client: lower **Requests in flight** or raise **Poll interval**. The
frame trace shows every message with its meaning: the route path, the packed requests with
their tag names and the values read and written.

## Not supported

Micro800 controllers, SLC 500, MicroLogix and PLC-5 (PCCC), CIP Security, I/O connections and
produced/consumed tags. ByteBridge cannot act as a target that a controller's MSG instruction
reads.

## No controller at hand?

The ByteBridge source has a test controller with tags of every type, arrays, UDTs, a TIMER and
two programs: `cargo run -p enip --example enip_server_sim -- 127.0.0.1:44818`. Connect an
endpoint to host `127.0.0.1` with route path `1,0` and detect its points, or use `DintTag`,
`Motors[1].Current` and `Program:MainProgram.Count`.

---

EtherNet/IP and CIP are trademarks of ODVA, Inc.; Allen-Bradley, Logix, ControlLogix,
CompactLogix and GuardLogix are trademarks of Rockwell Automation, Inc. ByteBridge is not
affiliated with or endorsed by either.
