---
title: Install the gateway
description: Run the ByteBridge gateway as a Windows service with its web UI.
sidebar:
  order: 1
---

The gateway is the same ByteBridge, without a desktop window. It runs as a Windows service,
starts with the machine, restarts after failures and serves its user interface in the browser.

## Install as a Windows service

1. Copy the gateway files to the machine, e.g. to `C:\ByteBridge`. (From source:
   `dotnet publish apps/ByteBridge.Gateway -c Release -r win-x64 -o C:\ByteBridge`.)
2. Open PowerShell **as Administrator** and run:

   ```powershell
   C:\ByteBridge\scripts\install-service.ps1 -Urls "http://localhost:5180"
   ```

3. Open http://localhost:5180 in a browser on that machine.

The service is called `ByteBridgeGateway` (display name *ByteBridge Gateway*). It starts
automatically, restarts 5 seconds after a crash (60 seconds after the third crash in a day)
and logs to the Windows Event Log.

| Parameter | Default | Meaning |
|---|---|---|
| `-Name` | `ByteBridgeGateway` | service name |
| `-Exe` | `..\ByteBridge.Gateway.exe` next to the script | the gateway program |
| `-Urls` | `http://localhost:5180` | where the web UI listens |

To remove the service, run `C:\ByteBridge\scripts\uninstall-service.ps1` as Administrator.

:::caution
The gateway UI has no sign-in yet. Keep it bound to `localhost`, or put it behind a reverse
proxy with authentication and TLS before you open it to the network.
:::

## Open the firewall for server endpoints

Systems that read from the gateway (SCADA, OPC UA clients, Modbus masters) connect to its
**server** endpoints, so their ports must be open:

```powershell
New-NetFirewallRule -DisplayName 'IEC 104' -Direction Inbound -Protocol TCP -LocalPort 2404 -Action Allow
New-NetFirewallRule -DisplayName 'OPC UA'  -Direction Inbound -Protocol TCP -LocalPort 4840 -Action Allow
New-NetFirewallRule -DisplayName 'Modbus'  -Direction Inbound -Protocol TCP -LocalPort 502  -Action Allow
```

Client endpoints connect outwards and need no inbound rule.

## Application settings

`appsettings.json` next to `ByteBridge.Gateway.exe`:

```json
{
  "Urls": "http://localhost:5180",
  "ByteBridge": {
    "AutoStart": true,
    "Runtime": "Process",
    "ConfigurationPath": "C:\\ProgramData\\ByteBridge\\gateway.json"
  }
}
```

| Setting | Default | Meaning |
|---|---|---|
| `ByteBridge:ConfigurationPath` | `%ProgramData%\ByteBridge\gateway.json` | the configuration file |
| `ByteBridge:AutoStart` | `true` | start enabled endpoints when the service starts |
| `ByteBridge:Runtime` | `Process` | `Process`: the gateway starts the protocol runtime itself. `Remote`: connect to a runtime that already runs (set `RuntimeUrl` and `RuntimeToken`) |

In `Process` mode the gateway starts `bytebridge-runtime.exe` from its folder on `127.0.0.1`
with a random port and token, and restarts it if it stops unexpectedly.

## Status API

For monitoring, the gateway has a read-only HTTP API next to its UI:

| Request | Returns |
|---|---|
| `GET /api/endpoints` | every endpoint with its state |
| `GET /api/endpoints/{id}/points` | the live points of one endpoint |
| `GET /api/mappings` | every mapping |
