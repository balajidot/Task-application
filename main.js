const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // EXPERT FIX: பில்ட் ஆன பிறகு dist ஃபோல்டரில் உள்ள ஃபைலைத் துல்லியமாக லோட் செய்யும்
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // EXPERT FIX: 'reading send' எரரை நீக்கச் சரிசெய்யப்பட்ட லாஜிக்
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // சிஸ்டம் டிரே செட்டிங்ஸ்
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Task Planner', click: () => mainWindow.show() },
      { type: 'separator' },
      { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
  } catch (err) {
    console.log("Tray error.");
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});