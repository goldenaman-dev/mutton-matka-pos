import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Dashboard from './components/dashboard'
import Settings from './components/settings'
import Reports from './components/reports'
import NewOrder from './components/newOrder'
import PrintOrders from './components/printOrders'
import MenuManagement from './components/menuManagement'
import UserManagement from './components/userManagement'
import OrderHistory from './components/orderHistory'

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/login" element={<Login />} />
         <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders/new" element={<NewOrder />} />
        <Route path="/orders/print" element={<PrintOrders />} />
        <Route path="/orders/history" element={<OrderHistory />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
       
      </Routes>
    </BrowserRouter>
  )
}

export default App