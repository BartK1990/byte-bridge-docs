---
title: Calculations
description: Compute new points on the gateway from live values with short Rhai scripts, e.g. a total power or a deadband.
sidebar:
  order: 3
---

A calculation computes a point from the live values of other points. Use it when the target
system needs a value the devices do not have: a total, an average, a state derived from
several signals, or a value that only changes beyond a deadband.

Calculated points belong to a **Calculation** endpoint and are mapped onto server endpoints
like any device point.

## Example: total power of two feeders

1. Open **Calculations**. The first time, click **Create a calculation endpoint**.
2. Click **Add calculation** and fill in:

   | Field | Value |
   |---|---|
   | Point | `TotalPower` |
   | Type | `Float` |
   | Runs | **When an input changes** |
   | Inputs | `a` = *RTU Substation A* `4001`, `b` = *RTU Substation A* `4002` |
   | Script | `a + b` |

3. Click **Test with current values** to see the result with the inputs' live values.
4. Click **Save**.
5. On **Mappings**, map the calculation endpoint's point `TotalPower` onto a server endpoint,
   like any other point.

## Scripts

Scripts are written in [Rhai](https://rhai.rs), a small language that looks like JavaScript or
Rust. The value of the last expression is the result; returning `()` publishes nothing.

Every input is a variable with the name you gave it. Names use letters, digits and `_` and do
not start with a digit. Besides the inputs, a script can use:

| Name | Meaning |
|---|---|
| `state` | a map that is kept between runs |
| `now` | the current time, Unix milliseconds |
| `dt` | seconds since the previous run |

### Average of three temperatures

```rust
(t1 + t2 + t3) / 3.0
```

### Deadband: publish only changes larger than 0.5

```rust
if state.last == () || (x - state.last).abs() > 0.5 {
    state.last = x;
    x
} else {
    ()
}
```

### Alarm from two signals

```rust
pressure > 8.0 && pump_running
```

Use type `Boolean` for this result.

### Energy from power (periodic)

Set **Runs** to **Periodically** with a period of, for example, 1000 ms:

```rust
let kwh = if state.kwh == () { 0.0 } else { state.kwh };
kwh += power_kw * dt / 3600.0;
state.kwh = kwh;
kwh
```

## In the configuration file

```json
"calculations": [
  { "id": "c1", "endpointId": "calc", "address": "TotalPower", "type": "Float",
    "inputs": { "a": { "endpointId": "rtu-a", "address": "4001" },
                "b": { "endpointId": "rtu-a", "address": "4002" } },
    "expression": "a + b", "trigger": "OnChange" }
]
```

`trigger` is `OnChange` (default) or `Periodic` with `periodMs` (default 1000, at least 100).
The endpoint `calc` is an endpoint with `"protocol": "calculation"`.
