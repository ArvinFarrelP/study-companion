# Anime Pomodoro Study Companion

🎯 **Transform your work sessions into engaging anime adventures!**

## ✨ Features

- 🎨 Anime Character Companions (Arona & Plana)
- ⏱️ Customizable Pomodoro Timer
- 🎵 Background Music Player
- 🏆 Achievement System
- 📊 Focus Analytics
- 📱 Fully Responsive Design
- ♿ Accessibility Friendly
- 📲 **PWA Ready** - Install as app!

## 🚀 Quick Start

1. Download and extract files
2. Open `index.html` in browser
3. **For PWA**: Use "Add to Home Screen" on mobile

## 📁 File Structure

StudyCompanion-Pomodoro-Timer/
├── index.html # Main application file
├── sw.js # Service Worker (PWA)
├── manifest.json # Web App Manifest (PWA)
├── assets/
│ ├── images/
│ │ ├── arona.png # Arona character
│ │ ├── plana.png # Plana character
│ │ ├── icon-192.png # PWA icon small
│ │ ├── icon-512.png # PWA icon large
│ │ └── thankyou.png # Thank You screen
│ └── music/
│ ├── lofi-study.mp3 # Study music track 1
│ ├── rainy-coding.mp3 # Study music track 2
│ └── coffee-vibes.mp3 # Study music track 3
├── README.md # Documentation
└── screenshots/ # Marketing images

## 🛠️ Installation

### Option 1: Local Use

- Simply open `index.html` in web browser

### Option 2: Web Deployment

- Upload all files to web hosting
- Access via your domain

### Option 3: PWA Installation ✅

- Deploy to web server (required for PWA)
- Use "Add to Home Screen" on mobile
- Enjoy app-like experience with offline support

## 🔧 PWA Configuration

The app includes:

- `sw.js` - Service Worker for offline functionality
- `manifest.json` - App metadata and icons
- Automatic caching of assets
- Install prompt support

## 🎨 Customization

### Adding New Characters

1. Place image in `assets/images/`
2. Update image path in code
3. Add theme styles in CSS

### PWA Icons

Replace files in `assets/images/`:

- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

## ❓ FAQ

**Q: Why PWA files need to be in root?**
A: Service Worker scope is determined by its location. Root placement ensures full site coverage.

**Q: Can I use without PWA features?**
A: Yes! The app works perfectly as regular web page.

## 📞 Support

For technical support, contact: [cryvastudio@gmail.com]

## 📄 License

Licensed under MIT License. See LICENSE.txt for details.

<div align="center">
Made with ❤️ for the anime and productivity community

</div>
