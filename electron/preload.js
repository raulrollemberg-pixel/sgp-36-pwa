'use strict';

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('sgpDesktop', {
  isElectron: true,
  version: '3.6.0',
  platform: process.platform
});
