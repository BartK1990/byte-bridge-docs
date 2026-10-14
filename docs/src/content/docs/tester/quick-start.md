---
title: Quick start
description: Install the ByteBridge desktop tester and try it without hardware.
sidebar:
  order: 1
---

This walk-through builds a small loop on your own laptop: a simulator produces values, an
IEC 104 server exposes them and an IEC 104 client reads them back. No hardware or other
software is needed.

## Install

1. Download the latest ByteBridge Desktop zip from the
   [download section](../../../#download) of the website.
2. Unzip it to a folder of your choice and start `ByteBridge.Desktop.exe`.

Requirements: Windows 10 or 11 (64-bit) with the Microsoft Edge WebView2 runtime, which is
preinstalled on current Windows.

## 1. Add a simulator

1. Click **Add endpoint**.
2. Enter a **Name**, e.g. `Simulator`.
3. Choose the protocol **Simulator** and the role **Client**.
4. Keep the defaults (12 points, updated every 1000 ms) and click **Save**.

The endpoint appears under **Endpoints** in the menu. Open it to see its points change.

## 2. Add an IEC 104 server

1. Click **Add endpoint** again.
2. Name it `IEC 104 server`, choose **IEC 60870-5-104** and the role **Server**.
3. Keep **Listen address** `0.0.0.0`, **Port** `2404` and **Common address (ASDU)** `1`.
4. Click **Save**.

## 3. Map the simulator onto the server

1. Open **Mappings** and click **Add mapping**.
2. **Source endpoint (client)**: `Simulator`, **Source address**: `*`.
3. **Target endpoint (server)**: `IEC 104 server`. Leave the target address empty.
4. Tick **Forward commands from the target back to the source** and click **Save**.

Every simulator point is now published by the IEC 104 server under the same address. The
**Last value** column of the mapping shows the values passing through.

## 4. Read it back with an IEC 104 client

1. Add an endpoint `IEC 104 client` with protocol **IEC 60870-5-104** and role **Client**.
2. Set **Host** `127.0.0.1` and **Port** `2404`; keep **General interrogation on connect** on.
3. Click **Save** and open the endpoint.

The values arrive with their quality and time stamp. Send a command to one of the points from
the live view (see [Live data and commands](../live-data-and-commands/)): it travels through
the server and the mapping back to the simulator, and the client shows the confirmation.

:::tip[Next step]
This configuration is already a working gateway. See
[Configure the gateway](../../gateway/configure/) to run it unattended.
:::
