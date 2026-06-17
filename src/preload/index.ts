import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', username, password),


  getItems: () =>
    ipcRenderer.invoke('menu:getItems'),

  saveItem: (item: any) =>
    ipcRenderer.invoke('menu:saveItem', item),

  updateItem: (item: any) =>
    ipcRenderer.invoke('menu:updateItem', item),


  importMenu: (menuJson: any) =>
  ipcRenderer.invoke(
    'menu:import',
    menuJson
  ),
  deleteAllItems: () =>
  ipcRenderer.invoke('menu:deleteAll'),

  deleteItem: (id: number) =>
  ipcRenderer.invoke(
    'menu:deleteItem',
    id
  ),

  printBill: (html: string) =>
  ipcRenderer.invoke('print:html', html),

  getOrderHistory: (filters) =>
  ipcRenderer.invoke(
    'orders:getHistory',
    filters
  ),
  createOrder: (order) =>
  ipcRenderer.invoke(
    'orders:create',
    order
  ),
  getDashboardStats: () =>
  ipcRenderer.invoke(
    'dashboard:getStats'
  ),

  getNextOrderNumber: () =>
  ipcRenderer.invoke(
    'orders:getNextOrderNumber'
  ),



  
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI

  // @ts-ignore
  window.api = api
}