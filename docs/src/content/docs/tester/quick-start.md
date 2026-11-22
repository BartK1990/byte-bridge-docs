---
title: Quick start
description: Install the Protocol Bridge desktop tester and try it without hardware.
sidebar:
  order: 1
---

This walk-through builds a small loop on your own laptop: a simulator produces values, an
IEC 104 server exposes them and an IEC 104 client reads them back. No hardware or other
software is needed.

## Install

1. Download the latest Protocol Bridge Desktop zip from the
   [download section](../../../#download) of the website.
2. Unzip it to a folder of your choice and start `ByteBridge.Desktop.exe`.

Requirements: Windows 10 or 11 (64-bit) with the Microsoft Edge WebView2 runtime, which is
preinstalled on current Windows.

## 1. Add a simulator

1. Click **New endpoint** on the toolbar.
2. Enter a **Name**, e.g. `Simulator`.
3. Choose the protocol **Simulator** and the role **Client**.
4. Keep the defaults (12 points, updated every 1000 ms) and click **Save**.

The endpoint appears under **Endpoints** in the explorer on the left. Open it to see its points change.

## 2. Add an IEC 104 server

1. Click **New endpoint** again.
2. Name it `IEC 104 server`, choose **IEC 60870-5-104** and the role **Server**.
3. Keep **Listen address** `0.0.0.0`, **Port** `2404` and **Common address (ASDU)** `1`.
4. Click **Save**.

## 3. Map the simulator onto the server

Mappings are an editable table: you add and change rows in place, then review and apply all
the changes at once.

1. Under **Data flow** in the explorer, open **Mappings** and click **Add row**. A new row
   appears, marked **new**.
2. Fill in its cells (click a cell, choose or type the value, press **Enter**):
   - **Source endpoint**: `Simulator`, **Source address**: `*` (every point of the source);
   - **Target endpoint**: `IEC 104 server`. Leave **Target address** empty: every point keeps
     its address on the server.
3. Tick **Forward commands** in the same row, so commands sent to the server reach the
   simulator.
4. Click **Review and apply** on the toolbar, check the line it lists and click **Apply 1 change**.

Every simulator point is now published by the IEC 104 server under the same address: open
**IEC 104 server** in the explorer to see the values on its **Points** tab. (The mapping's
**Last value** column shows a value for a mapping of a single point; with `*` it stays empty.)

## 4. Read it back with an IEC 104 client

1. Click **New endpoint**, name it `IEC 104 client`, and choose protocol **IEC 60870-5-104**
   and role **Client**.
2. Set **Host** `127.0.0.1` and **Port** `2404`; keep **General interrogation on connect** on.
3. Click **Save** and open the endpoint from the explorer.

The values arrive on the **Points** tab with their quality and time stamp. Send a command to
one of the points with the **command** link in its row (see
[Live data and commands](../live-data-and-commands/)): it travels through the server and the
mapping back to the simulator, and the client shows the confirmation.

:::tip[Next step]
This configuration is already a working gateway. See
[Configure the gateway](../../gateway/configure/) to run it unattended.
:::
