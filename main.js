const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let ipcMain = require('electron').ipcMain;

function createWindow () {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: mainWindowState.width,
      height: mainWindowState.height,
      x: mainWindowState.x,
      y: mainWindowState.y,
      minHeight: 480,
      minWidth: 480,
      icon: __dirname + '/src/public/images/icon.png',
      show: false
  });

  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  ipcMain.on('setFilePath', function (event, arg) {
    mainWindow.setRepresentedFilename(arg);

    // opened a file, enabling save and export to CNTK menu items
    let p = (process.platform === 'darwin') ? 1 : 0;
    menu.items[p].submenu.items[1].enabled = true;
    menu.items[p].submenu.items[2].enabled = true;
    menu.items[p].submenu.items[3].enabled = true;
    menu.items[p+1].submenu.items[0].enabled = true;
    menu.items[p+1].submenu.items[1].enabled = true;
  });


  // do this independently for each object
  ipcMain.on('show-popup', function(event, arg) { 
      let popup = new BrowserWindow({
        parent: mainWindow, 
        modal: true, 
        show: false, 
        frame: false,
        autoHideMenuBar : true
      });
      
      switch (arg.type) {
        case "export":
            popup.setSize(359, 300);
            popup.loadURL(url.format({
              pathname: path.join(__dirname, 'src/public/html/export-configuration.html'),
              protocol: 'file:',
              slashes: true
            }));
          break;

        case "review":
          popup.setSize(359, 310);
          popup.loadURL(url.format({
            pathname: path.join(__dirname, 'src/public/html/review-configuration.html'),
            protocol: 'file:',
            slashes: true
          }));
          break;
          
        default: return; 
      }
      
      popup.once('ready-to-show', () => {
        popup.send('configs', arg);
        popup.show();
      });

  });

  ipcMain.on('export-tags', (event, arg) => {
    mainWindow.send('export-tags', arg);
  });

  ipcMain.on('review-model', (event, arg) => {
    mainWindow.send('review-model', arg);
  });

  mainWindow.on('ready-to-show', function() {
      mainWindow.show();
      mainWindow.focus();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  const {app, Menu} = require('electron');
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click () { mainWindow.webContents.send('openVideo'); }
        },
        {
          label: 'Open Image Directory...',
          accelerator: 'CmdOrCtrl+I',
          click () { mainWindow.webContents.send('openImageDirectory'); }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          enabled: false,
          click () { mainWindow.webContents.send('saveVideo'); }
        },
        {
          label: 'Toggle Tracking',
          accelerator: 'CmdOrCtrl+T',
          enabled: false,
          click () { mainWindow.webContents.send('toggleTracking'); }
        }
      ]
    },
    {
      label: 'Object Detection',
      submenu: [
        {
          label: 'Export Tags',
          accelerator: 'CmdOrCtrl+E',
          enabled: false,
          click () { mainWindow.webContents.send('export'); }
        },
        {
          label: 'Review Detection Model',
          accelerator: 'CmdOrCtrl+R',
          enabled: false,
          click () { mainWindow.webContents.send('review'); }
        }
      ]
    },
    {
    label: "Edit",
      submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    },
    {
      label: 'Debug',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+D',
          click () { mainWindow.webContents.toggleDevTools(); }
        },
        {
          label: 'Refresh App',
          accelerator: 'CmdOrCtrl+Space',
          click () { mainWindow.reload(); }
        }
      ]
    }
  ]

if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })
    template[1].submenu.push();
    template[2].submenu.push();
    
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.