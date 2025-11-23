<div align="center">
    <a href="https://github.com/mateocallec/vc-ban-monitor"><img src="./docs/icon.png?raw=true" alt="vc-ban-monitor" height="217" /></a>
</div>

<div>&nbsp;</div>

<div align="center">
    <a href="https://github.com/mateocallec/vc-ban-monitor/releases"><img src="https://img.shields.io/github/v/release/mateocallec/vc-ban-monitor?label=lastest%20release&color=white" alt="Latest release" /></a>
    <a href="https://chromewebstore.google.com/detail/vc-ban-monitor-for-roblox/akkppjbknlajdlinelokpklkenpecmen"><img src="https://img.shields.io/badge/platform-Chrome-blue?logo=google-chrome&logoColor=blue" alt="Chrome Extension" /></a>
</div>

<hr />

**VC Ban Monitor for Roblox** is a Chrome extension designed for Roblox players. It tracks your voice chat ban status directly on the Roblox website and displays a timer for when your ban will be lifted, saving you the hassle of repeatedly rejoining the game to check.

---

## Features

- Display your **voice chat ban status** on Roblox.
- Shows a **countdown timer** if you are banned.
- Lightweight and easy to use.

---

## Installation

1. Clone or download this repository:

   ```bash
   git clone https://github.com/mateocallec/vc-ban-monitor.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.

---

## File Structure

```
vc-ban-monitor/
│
├── manifest.json        # Extension manifest
├── background.js        # Background script (optional)
├── content_script.js    # Injected script for Roblox pages
├── inject.css           # Styles for the injected UI
├── icons/               # Extension icons (16x16, 48x48, 128x128)
├── docs/                # Documentation and additional resources
├── scripts/             # Development scripts
├── LICENSE              # Proprietary license
├── README.md            # This file
├── CHANGELOG.md         # Extension change history
└── SECURITY.md          # Security and reporting guidelines
```

---

## Contact

**Author:** Matéo Florian Callec
**Email:** [mateo@callec.net](mailto:mateo@callec.net)
**Repository:** [https://github.com/mateocallec/vc-ban-monitor](https://github.com/mateocallec/vc-ban-monitor)

---

## License

This project is **proprietary**. All rights reserved. You may **not** redistribute, modify, or use this software without permission from the author.
