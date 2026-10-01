# REX — India's Autonomous Student Exchange Agent

> *"Don't search the campus. Ask REX."*

Built for **Bharat Agentic 2026** (12-hour Agentic AI Hackathon).

REX is a **geo-aware, college-aware, autonomous student resource exchange network** for higher education institutions across India.

---

## 🚀 Key Highlights & Architectural Pivot

1. **Real Data, Zero Fabricated Metrics**:
   - All synthetic SaaS counters ("2,481 resources", "16 active nodes", "Top 3%") have been completely eliminated.
   - Institution directory is directly grounded in the **Government of India AISHE (All India Survey on Higher Education) / Open Government Data (data.gov.in)** directory.
   - Resource records and student counts reflect real database entries.
   - Demo records are clearly tagged with **`DEMO DATA` / `DEMO USER` / `DEMO RESOURCE`**.

2. **Real MapLibre GL Map**:
   - Powered by **MapLibre GL JS** and OpenStreetMap Carto vector tiles with visible attribution: `© OpenStreetMap contributors, © CARTO`.
   - Interactive zoom levels (`MY COLLEGE`, `NEARBY`, `CITY`, `STATE`, `INDIA`).
   - Real-time geodesic route drawing between the requester's college and resource owner's college with Haversine distance calculations.
   - Zero exposure of private addresses — uses approved public campus meetup safety hubs (CCTV zones, Central Library, Administrative Block).

3. **Stage-by-Stage Agent Expansion**:
   When a student submits a goal:
   - **STAGE 1**: Searches user's college (e.g. SRM IST).
   - **STAGE 2**: If no suitable match, autonomously expands across nearby colleges (< 20 km, e.g. VIT Chennai, SSN).
   - **STAGE 3**: Expands to city-wide institutions.
   - **STAGE 4/5**: Expands across state / all-India institutions.
   - Displays a collapsible **REX Decision Trace** showing action-level events (no internal hidden chain-of-thought).

4. **Realtime Multi-Tab Negotiation & Handshake**:
   - Real database interaction across `exchange_requests` and `exchange_messages`.
   - Supported by **Supabase PostgreSQL / Realtime** with automatic **BroadcastChannel** cross-tab reactive synchronization.
   - **Browser A** (Requester) makes an offer; **Browser B** (Owner) immediately sees the prompt in real time:
     `REX EXCHANGE REQUEST: [Item] • Offer: ₹X • [ ACCEPT ] [ COUNTER ] [ DECLINE ]`
   - Clicking `[ ACCEPT ]` immediately updates Browser A to `OFFER ACCEPTED ✓` without a page reload.

5. **AI Object Extraction for Resource Listing**:
   - When listing a resource, upload a photo or select a test item.
   - Analyzed via **Gemini 1.5 Flash Vision** (or fallback local vision classifier).
   - Detects: Item Title, Category, Brand, Condition, Description.
   - Displays: `REX DETECTED: [Title] • [Category] • [Condition]` for user confirmation before publishing.

---

## 🎬 Perfect Hackathon Demo Flow (Step-by-Step for Judges)

### Step 1: Login as Demo Student A
- Active User: **Aarav Sharma**
- Institution: **SRM Institute of Science and Technology (SRMIST)** (AISHE: `U-0473`)

### Step 2: Submit Natural Language Goal
On the **Home** or **Ask REX** page, enter:
> *"I need a Raspberry Pi for this weekend. Preferably from my college."*

### Step 3: Watch Autonomous Agent Execution
1. REX searches SRMIST -> finds no suitable local match.
2. REX autonomously expands to nearby colleges (< 20 km).
3. REX locates **Raspberry Pi 4 Model B (4GB RAM)** at **VIT Chennai** (~6.8 km away) owned by **Vikram Patel**.
4. REX displays the match, the geographic route on the MapLibre map, and explains:
   > *"REX selected this resource because no suitable match was available inside your college, but this candidate at nearby Vellore Institute of Technology (VIT Chennai) (6.8 km away) matches your requested specs, price (₹650), and availability window."*

### Step 4: Submit Exchange Offer
- Enter offer price (e.g., ₹650) and click **REQUEST EXCHANGE**.
- The request transitions to `PENDING` state.

### Step 5: Switch to Demo Student B (Owner)
- Click the user avatar in the top-right navbar and switch to **Vikram Patel** (VIT Chennai), or open a second browser window at `http://localhost:5173`.
- Navigate to **Requests** -> under **Incoming Requests**, Vikram sees:
  ```
  REX EXCHANGE REQUEST
  Raspberry Pi 4 Model B (4GB RAM)
  Offer: ₹650 • Duration: This weekend (3 days) • Student: Verified (Aarav Sharma - SRM)
  [ ACCEPT ]  [ COUNTER ]  [ DECLINE ]
  ```

### Step 6: Accept Offer & Coordinate Meetup
- Vikram clicks **[ ACCEPT ]**.
- In real time, the request transitions to `ACCEPTED ✓`.
- REX assigns an approved campus meetup location (e.g. *VIT Academic Block 1 Gazebo / SRM Central Library Foyer*).
- Both parties click **Confirm Handover** -> `EXCHANGE CONFIRMED ✓` with a celebratory confetti blast!

---

## 💻 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Geospatial & Map**: MapLibre GL JS, OpenStreetMap / CARTO raster basemaps
- **Database & Realtime**: Supabase PostgreSQL, Supabase Realtime, BroadcastChannel multi-tab sync
- **AI Engine**: Google Gemini 1.5 Flash (Vision & Intent extraction) with deterministic offline fallback
- **Data Source**: Government of India AISHE / Open Government Data directory

---

## 🛠 Local Development

```bash
cd /Users/manthan/Documents/REX

# Start development server
npm run dev

# Open http://localhost:5173
```
