---
title: Read values from an MQTT broker
description: Subscribe to an MQTT broker that publishes values as JSON documents or plain text, and decide in the endpoint's settings which part of a message is the point, the value, the time stamp and the quality.
sidebar:
  order: 2.7
---

Many systems publish their values on an MQTT broker as JSON documents instead of an industrial
protocol: a SCADA system feeding a cloud platform, energy meters, IoT gateways. Every publisher
picks its own JSON shape. Protocol Bridge reads them with an **MQTT** client endpoint:
you tell it, in the endpoint's settings, which field names the point, which holds the value and
which hold the time stamp, quality and unit. The values become ordinary points, so you can map
them to IEC 104, OPC UA or Modbus, use them in calculations, or send them to central.

The client is **read-only**: it subscribes and never publishes, and commands to its points are
refused before anything is sent; the live data page offers no commands for its points. It speaks MQTT 3.1.1 and 5.0, with or without TLS.

Add an endpoint with the protocol **MQTT** and the role **Client**.

## Connection

The endpoint form shows the settings in sections (*Broker*, *Login*, *Security (TLS)*, *Message
format*, *Tags*, *Time stamp and quality*, *Advanced*), and only the ones that apply: the TLS
fields only with TLS on, the JSON fields only for JSON payloads.

| Section | Setting | Example | Notes |
|---|---|---|---|
| Broker | Host | `mqtt.example.com` | |
| | Port | `8883` | `8883` is usual with TLS, `1883` without |
| | MQTT version | `5.0` | `5.0` or `3.1.1` |
| | Client ID | | must be **unique on the broker**. Empty: `protocolbridge-` and a code derived from the endpoint |
| Login | User name, Password | `mqtt-user` | the password is stored encrypted |
| Security (TLS) | TLS | on | `mqtts://`. Off sends the user name and password readable over the network |
| | Client certificate, Client key | | only for brokers that require client certificates: **Upload file** with the PEM files; the key is stored encrypted |
| Advanced | Keep alive, Clean start, Session expiry, Subscription QoS, timeouts | | the defaults suit most brokers |

### Trusting the broker

Protocol Bridge always checks the broker's certificate and the host name; there is no switch to
turn the check off. A broker with a certificate from a public CA needs nothing else.

For a self-signed certificate or a company CA, connect once (or click **Test connection**). The
connection is refused with *not trusted yet*, and the broker's certificate appears on the
**Certificates** page under **Rejected**. Check its subject and fingerprint, click **Trust**, and
the next attempt connects. You can also **import** the company's CA certificate there: it then
trusts every broker that CA issued. All MQTT endpoints share this trust list.

**Every client needs its own client ID.** When a second client connects with the same ID (MQTTX
and Protocol Bridge with one ID, or two endpoints), the broker disconnects the first one, which
reconnects and disconnects the second, and so on.

### Subscription QoS

**Subscription QoS** (in *Advanced*) is the delivery guarantee the endpoint asks the broker for.
A message is always delivered with the **lower** of the publisher's QoS and this one:

- **0, at most once** (the default): each message is sent once; one in flight when the connection
  drops is lost. Fine for values that are published again soon.
- **1, at least once**: the broker resends a message until the endpoint confirms it, so none is
  lost while connected; one can arrive twice, which does no harm to a value.

QoS 1 only helps when the publisher also sends QoS 1 or 2. Together with **Clean start** off and a
**Session expiry**, the broker also keeps QoS 1 messages while the endpoint is disconnected and
delivers them, oldest first, after the reconnect. The connection check shows what the broker
grants and which QoS the messages actually arrive with (see [Connection check](#connection-check)).

## Message layout

These settings describe the documents and apply to every point of the endpoint. Changing them
takes effect with the next message, without reconnecting.

| Setting | Example | Notes |
|---|---|---|
| Payload format | `JSON` | `JSON`: a document (or an array of documents). `Text`: the payload is the value itself, such as `23.5` or `true`, one point per topic |
| Key field | `Tag` | the field that names the point inside a document. Empty: one document per topic |
| Value field | `Value` | a point can read another field (see *Points*) |
| Time stamp field | `Timestamp` | empty: the time of reception |
| Time stamp format | `RFC 3339` | `RFC 3339`, `Unix ms` or `Unix s` |
| Quality field | | empty: every value that can be read is good |
| Good quality values | `good,ok,0,192,true` | values of the quality field that mean good |
| Unit field | `Unit` | Detect points puts the unit in the point's description |
| Decimal separator | `,` | how numbers in **strings** are written; `"2,55"` needs `,`. JSON numbers always use `.` |
| Stale after | `0` s | a point without a message for this long becomes not topical; `0`: never |

With **Text** payloads there are no fields: leave **Key field** empty, and each point is just its
topic, for example `plant/pump1/speed`. The other formats a broker may use are added the same
way: their messages are read into the same structure, so the settings and points below work for
them unchanged.

Field names can go deeper with `.` and `[n]`: `data.value`, `readings[0].v`. Put a name with dots
or spaces in double quotes: `"meter.1".P`.

### Example

A broker publishes every tag on the topic `site1/telemetry`, one document per value:

```json
{ "Tag": "TANK1_LEVEL", "Value": "2,55", "Unit": "m", "Timestamp": "2026-03-02T12:35:20.127511Z" }
```

Set **Key field** `Tag`, **Value field** `Value`, **Time stamp field** `Timestamp`, **Unit
field** `Unit` and **Decimal separator** `,`. The point `site1/telemetry#TANK1_LEVEL`
then reads `2.55`, with the time from the document.

## Points

A point is written `topic#key|path`:

| Point | What it reads |
|---|---|
| `site1/telemetry#GEN1_POWER` | the document on `site1/telemetry` whose key field is `GEN1_POWER`, its value field |
| `plant/meter1` | without a key field: the document on `plant/meter1`, its value field (or the whole message when it is just a number) |
| `plant/meter1\|data.P` | the field `data.P` instead of the value field |
| `plant/meters#M7\|readings[2].v` | the document keyed `M7`, the `v` of its third reading |

The topic is exact: no `+` or `#` wildcards. Write a `#` or `|` that is part of a key, or a `|` in
a topic, as `\#` or `\|`. A message can also hold a JSON array of documents; each counts as one.

| JSON value | Float | Integer, Counter | Boolean |
|---|---|---|---|
| number, or a number in a string | the number | the number, exactly; a fraction makes it invalid | 0 is off, anything else on |
| `true`, `false`, `"true"`, `"false"` | 1 or 0 | 1 or 0 | the value |
| other text, `null`, an object or array | invalid, with the reason | | |

A value that cannot be read keeps its last value, turns **invalid** and says why, for example
*Value is text: "Running"* or *12.5 is not an integer*. When the connection is lost, every point
turns invalid and not topical until the broker is back.

:::note[One topic for all tags]
A broker keeps **one** retained message per topic. When every tag is published on one topic,
only the last tag's document is retained, so after connecting the other tags show values only
when the publisher sends them again. **Stale after** tells you when a tag has gone silent.
:::

## Detect points

**Detect points** listens to the broker for **Listen for (seconds)** (30 by default, up to 150)
and proposes what arrives: one point per topic and key, or, without a key field, one per number
or boolean in each document. It listens to **Detect points topic filter** (for example
`site1/#`), or to the points' topics, or to everything (`#`) when there are none yet. The key
becomes the point's name and the unit its description, for example *Unit: kW*.

Text values are not offered. When strings look like numbers with the other decimal separator,
the result says so: change **Decimal separator** and detect again. Tags that publish only when
they change need a listen time longer than their slowest change.

## Connection check

| Step | Fails when | Look at |
|---|---|---|
| TLS | the certificate is not trusted, is for another host name, or the port does not speak TLS | **Trust** it on the Certificates page, the host name, TLS on or off |
| MQTT connect | the broker refuses: wrong user name or password, not authorized, client ID refused, MQTT version | the login, the client ID, the MQTT version |
| Subscribe | the broker refuses a topic | read permission on the broker |
| Listen | (a warning) nothing arrives in 10 s, or nothing matches a point | the topics, the key and value fields; *Detect points* shows what arrives |

**What the broker offers.** With MQTT 5, *MQTT connect* lists the limits the broker states: the
highest QoS it accepts, whether it keeps retained messages, wildcard and shared subscriptions,
the session expiry it grants and more. It warns when **Subscription QoS** or **Session expiry**
asks for more than the broker gives. MQTT 3.1.1 brokers state no limits. *Subscribe* shows the QoS
granted for each topic, and *Listen* the QoS the messages arrived with: when every message
arrives with QoS 0, the publisher sends QoS 0 and Subscription QoS 1 changes nothing.

The check connects with the endpoint's client ID plus `-check`, so it never takes the endpoint's
session over, and it publishes nothing. MQTT has no frame trace. Instead, the endpoint's
status line counts the messages, how many gave a point a value, and those that did not (not JSON,
without the key field, a key no point has), with the last one of them.

## No broker at hand?

Install [Eclipse Mosquitto](https://mosquitto.org/download/), start it (`mosquitto -v` listens on
`127.0.0.1:1883` without a login), and publish a document like the example's:

```
mosquitto_pub -t site1/telemetry -r -m "{ \"Tag\": \"PUMP1_SPEED\", \"Value\": \"2,55\", \"Unit\": \"rpm\" }"
```

Point an endpoint at `127.0.0.1`, port `1883`, with TLS off and the layout of the example, then
**Detect points**.
