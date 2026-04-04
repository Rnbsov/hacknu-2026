
It’s a **hackathon case** for building a **Visual Digital Twin of a Locomotive** (Визуальный цифровой двойник локомотива). The goal is a **fullstack prototype dashboard** that turns raw, noisy telemetry into a clean, actionable “health index” for drivers and dispatchers.

### Slide-by-Slide Summary

**Slide 1 – Title**  
- **Main title**: Visual Digital Twin of the Locomotive  
- **Hackathon case**: Health Index + streaming telemetry  
- Shows a locomotive diagram with live sensor points:  
  - Temperature (orange)  
  - Fuel (orange)  
  - Pressure (green)  
  - Speed (green)

**Slide 2 – Noise vs Signal**  
- Left side (“ШУМ” / Noise): chaotic raw telemetry graph with hundreds of parameters per second → critical signals get lost, diagnostics are only “after the fact”.  
- Right side (“СИГНАЛ” / Signal): clean dashboard with a big green gauge **95 / A**, showing:  
  - Healthy systems: 95%  
  - Voltage: normal  
  - Performance: optimal  
- Key message: “We turn the data stream into intelligence.”

**Slide 3 – Global Task: Fullstack Dashboard Prototype**  
Three core pillars:  
1. **Real-time Aggregation**  
   - Ingest telemetry (speed, fuel, nodes, errors) with low latency  
   - Handle highload spikes (bursts of events)  
2. **Health Index Engine**  
   - Calculate one single score (0–100 or A–E)  
   - Show which factors influence it  
3. **Interactive Visualization**  
   - Charts, trends, route map, alerts  
   - Diagnostic replay + export

**Slide 4 – Functionality (Everything Under Control)**  
Dashboard unites critical data for driver + dispatcher:  
- **Traction & Movement**: speed trends, tractive effort, brake line pressure  
- **Resources**: fuel level & instant consumption, voltage, electricity  
- **Node Monitoring**: oil/engine temperatures, system pressures, alerts, error codes  
- **Context**: interactive route map with current position + speed limits

**Slide 5 – Under the Hood (Non-functional Requirements)**  
- **Low-latency UI**: graphs must update visibly in < 500 ms  
- **Highload Resistance**: simulate ×10 event spikes; UI must stay responsive  
- **Security Standards**: basic auth, restricted settings, secrets in ENV variables  
- **Engineering Culture**: mandatory OpenAPI/Swagger docs, service logs, metrics, basic healthcheck

**Slide 6 – Evaluation Criteria (How We Judge)**  
| Weight | Category                  | What matters |
|--------|---------------------------|--------------|
| **35%** | Real-time Engine         | WebSocket/SSE, stability under load, minimal delays, fault tolerance |
| **30%** | Frontend & UX            | Clear signals (no noise), informative graphs, accessibility |
| **25%** | Backend & Architecture   | Clean modules, history storage, scalability, transparent Health Index logic |
| **10%** | Engineering Culture      | Clean Git repo, run instructions, logs/metrics, presentation quality |
