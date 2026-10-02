# Subscout

> **Finds forgotten subscriptions and trials in your receipts and cancels them with one tap.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success)](https://domdom007.github.io/subscout/)
[![Zero Server](https://img.shields.io/badge/Data%20Privacy-100%25%20Local-blue)](#privacy--architecture)

**Subscout** is an open-source, client-side web utility designed specifically for **Anyone with a bank card**. It solves a focused problem with zero friction: no login, no database, no recurring fees, and no data tracking.

---

## ⚡ Live Demo
**Try it online now:** [https://domdom007.github.io/subscout/](https://domdom007.github.io/subscout/)

---

## ✨ Features

- **Built for Purpose:** Directly addresses the need: *Finds forgotten subscriptions and trials in your receipts and cancels them with one tap.*
- **100% Client-Side:** Everything runs locally inside your web browser. No backend server is required.
- **Offline Capable:** Download or clone this repository and double-click `dist/index.html` to use it completely offline.
- **Local Persistence:** Changes are automatically remembered using your browser's `localStorage`.
- **Backup & Restore:** Easily export your data to a `.json` file and restore it anytime or across different computers.
- **Privacy-First:** Zero telemetry, zero analytics cookies, and zero external data sharing.

---

## 🚀 Quick Start

### Option 1: Run Instantly (No Node.js Required)
1. Download this repository as a `.zip` and extract it (or clone it).
2. Open the `dist/index.html` file directly in any modern browser (Chrome, Edge, Firefox, Safari).
3. The tool works immediately!

### Option 2: Run with Node.js & Vite (For Developers)

```bash
# 1. Clone the repository
git clone https://github.com/domdom007/subscout.git
cd subscout

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser at `http://localhost:5173`.

To build the optimized static distribution:
```bash
npm run build
```
The static output will be generated inside `dist/`.

---

## 🔒 Privacy & Architecture

- **No Remote Database:** All calculations and records remain exclusively on your device.
- **Zero Third-Party Tracking:** No Google Analytics, no tracking pixels, no advertising scripts.
- **Portable Backups:** Your data belongs to you. Use the built-in **Save Backup** button in the header to export all state into an unencrypted JSON format.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!
1. Fork this repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

Developed by [Mokhles Ben Moallem](https://github.com/domdom007) • [Meta Creative Tunisia](https://metatunisie.com)
