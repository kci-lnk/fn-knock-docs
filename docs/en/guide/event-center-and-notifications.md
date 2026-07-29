---
lang: en-US
title: "Event Center and Notifications"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: dc78b71224d6aea001fa1da5a522b5432c5af1604718c073190c444519d88479
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Event Center and Notifications

The Event Center records what has happened in the system; notification rules decide which events are sent and where. First make sure events are being recorded reliably, then create a small number of useful notifications so that routine access does not become alert noise.

## How the Data Relates

| Object | Purpose |
| --- | --- |
| Event | A structured record of one login, block, update, or state change |
| Provider | Connection settings and credentials for a Webhook, email, or push channel |
| Rule | Decides whether to notify based on event type, window, threshold, aggregation, and cooldown |
| Notification target | A provider referenced by a rule and that rule's provider-specific recipient |
| Delivery record | One send and retry record created for each target after a rule triggers |

Deleting events does not delete delivery records that have already been created. Clearing delivery records likewise does not delete events or rules. Deleting a rule only stops future notifications and does not affect existing events.

## Events

The Events page currently recognizes 21 system event types:

- Authentication: `Login success`, `Logout`, `Login failure`, and `Session IP drift`;
- Security: `Scanner blocked`, `Gateway throttle blocked`, `Gateway visibility blocked`, and `WAF blocked`;
- SSH: `SSH login success`, `SSH login failure`, and `SSH IP blocked`;
- Network: `DDNS updated`, FRP connected/disconnected, and Cloudflared connected/disconnected;
- System: `App update available`, CPU alert/recovered, and memory alert/recovered.

Event levels are `Info`, `Notice`, `Error`, and `Critical`. Source systems are `Admin console`, `Auth proxy`, and `System monitor`.

The page lets you:

- Search by event ID, IP, session, or credential;
- Filter by event type, level, and source system;
- Browse pages and open structured details;
- Delete one event or delete selected events in a batch;
- Clear all events.

`Clear events` deletes every event stored in the Event Center. The count shown in parentheses describes how many events match the current view; it does not mean that only filtered results will be cleared. This operation cannot be undone, but it does not clear notification rules or delivery records.

Depending on the event type, the details can include credential, authentication method, session, IP and location, failure count, block duration, DDNS address changes, Trace ID, WAF rule, tunnel PID, resource threshold, and other fields. A Gateway visibility block also records the request Host, path, method, and whether the effective scope was global or a custom Host rule. When troubleshooting, copy the details and compare them with request logs, WAF logs, or tunnel logs.

## CPU and Memory Monitoring

Resource monitoring starts only on platforms that provide the required runtime capability; current Windows deployments do not support it. On Linux-like environments, fn-knock uses system resource information to calculate CPU and available memory for either the whole machine or the scope visible to the container, then generates alert and recovery events. It is not a per-process performance profiler and cannot identify which specific process is causing the load.

The current defaults are:

| Metric | Alert threshold | Recovery threshold | Sample interval | Sustain duration |
| --- | ---: | ---: | ---: | ---: |
| CPU | 80% | 60% | 5 seconds | 30 seconds |
| Memory | 80% | 60% | 5 seconds | 30 seconds |

Usage must remain at or above the alert threshold before an alert is generated. After an alert, it must remain at or below the recovery threshold before a recovery event is generated. The `60%–80%` middle band prevents repeated alerts near the boundary. Brief spikes do not immediately create events, and the first CPU sample is used only to establish a calculation baseline.

The current admin interface can display resource events and configure notifications for them, but it has no controls for changing these sampling intervals or thresholds. Do not confuse a notification rule's window and trigger count with the resource sampling threshold: the former determines how existing events are sent, while the latter determines when an event is generated.

In Docker, the measurements reflect the CPU and memory limits visible to the container runtime. If you set resource limits when deploying, interpret alerts in relation to those limits. When no resource events appear, first confirm that the current platform supports the capability and that the event system is working, then check whether the load actually remained above the threshold.

## Configure Providers

Go to `Event center → Notifications → Providers`, then create and test a delivery channel. The current catalog includes:

- Webhook;
- WxPusher;
- ServerChan;
- PushPlus;
- WeCom group bot;
- DingTalk bot;
- Feishu bot;
- Email;
- PushDeer;
- HarmonyOSMeoW;
- MagicPush;
- Bark;
- Telegram.

Support for Markdown, action buttons, mentions, and message length differs by channel. Follow the fields and capability notes shown when adding a provider.

When creating a provider, set its name, type, enabled state, and connection configuration. Some channels also have a default recipient. If the matching target field in a rule is empty, that provider default is used. WxPusher currently requires its official app to be installed and signed in; it can no longer rely on receiving messages directly in WeChat.

You can test the draft configuration before saving, and test it again from the provider list afterward. When editing, sensitive fields display `Already configured. Leave blank to keep it.` Do not paste an old secret again just to preserve it.

Webhook URLs, Tokens, SMTP passwords, and recipient identifiers are sensitive configuration and must not be included in public logs or screenshots. The backend prevents a provider from being deleted while a rule references it; adjust or delete those rules first.

## HarmonyOSMeoW

After selecting `HarmonyOSMeoW`, enter:

| Field | Description |
| --- | --- |
| `Service URL` | Keep the default `https://api.chuckfang.com` for the official API, or enter the root URL of a self-hosted compatible service |
| `Recipient nickname` | The user nickname configured in the MeoW app; it cannot contain `/` and should be protected like a sensitive recipient identifier |
| `Timeout seconds` | Defaults to 5 seconds and can be set from 1 to 30 seconds |

This channel sends Markdown notifications and supports notification actions, but not mentions. After saving, send a test message and confirm that it reaches the HarmonyOS device before adding the provider to a notification rule.

## Create Notification Rules

Go to `Event center → Notifications → Rules`. You need at least one provider before you can create a rule. Each event type currently allows only one rule. When adding rules, the page lists only events that do not already have one, and you can select multiple events for batch creation.

Batch creation uses these default trigger conditions:

| Field | Default for a new rule | Description |
| --- | --- | --- |
| `Window (seconds)` | 60 seconds | Accumulates events in the same group within this window |
| `Trigger count` | 1 | Generates a notification when the count is reached |
| `Aggregation` | Recommended for each event | Determines which events count toward the same group |
| `Cooldown (seconds)` | 60 seconds | Suppresses duplicate notifications after the same group triggers |

After creating rules, you can edit their trigger conditions individually. Aggregation options are `Global`, `IP`, `Session`, `Subject`, `Hostname`, and `Provider`. Examples of the automatic recommendations are:

- Login failures, scanner, gateway throttle, WAF, and SSH events are grouped by IP;
- Gateway visibility blocks are grouped globally;
- Session IP drift is grouped by session;
- DDNS updates are grouped by provider;
- CPU and memory events are grouped by hostname;
- Tunnel and app update events are grouped by subject;
- Login success and logout are grouped globally.

A rule can contain multiple providers, but each provider can be added to that rule only once. Some providers require a recipient, Topic, Chat ID, or another destination field in the rule target. These fields apply only to the current rule.

### Recommended Starter Rules

- Login failure: group by IP and notify after several failures within a short window;
- Scanner, gateway throttle, WAF, and SSH blocks: group by IP;
- Gateway visibility blocks: group globally by default; for busy gateways, raise the threshold or extend cooldown to prevent one policy from producing a notification storm;
- DDNS: group by provider and pay attention to failed results;
- FRP and Cloudflared: group by subject to distinguish tunnels;
- CPU and memory: configure rules for both alert and recovery events;
- App update: send one notification grouped by subject.

High-frequency events such as login success and SSH login success can generate many notifications when the threshold is 1. Tune the window, trigger count, and cooldown for your actual traffic.

## Review Delivery Results

The `Deliveries` tab shows trigger time, rule, provider, status, message summary, and attempt count. Statuses are `Queued`, `Sending`, `Success`, `Failed, retrying`, `Failed, gave up`, and `Skipped`.

The details show:

- The rule, provider, and current status;
- Attempt count, trigger time, send time, and next retry time;
- The failure or skip reason;
- Frozen snapshots of the title, summary, and body at send time;
- Redacted request and response summaries.

When troubleshooting either “the rule did not trigger” or “the provider did not receive it,” check in this order:

1. Confirm that the event itself was generated.
2. Check that the event type has a rule and that the rule and target remain enabled.
3. Check the window, trigger count, aggregation, and cooldown.
4. If a delivery record exists, review its status, failure reason, attempt count, and next retry time.
5. Check provider connectivity, credentials, recipient target, and rate limiting at the receiving service.

Clearing delivery records deletes all delivery history and cannot be undone, but it does not affect events or future rule triggers. Copy any relevant details first when you need an audit trail.

Notifications support incident response; they do not replace request logs, WAF logs, or backups.

- [Request Logs](/en/guide/request-logs)
- [Web Application Firewall (WAF)](/en/guide/waf)
- [SSH Hardening](/en/guide/ssh-security)
