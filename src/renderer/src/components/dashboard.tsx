import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../assets/dashboard.css'

function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    menuItems: 0,
    users: 0,
    recentOrders: []
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const data =
        await window.api.getDashboardStats()

      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo-section">
          <h2>Mutton Matka</h2>
          <p>Taste of Tradition</p>
        </div>

        <nav>
          <button onClick={() => navigate('/dashboard')}>
            🏠 Dashboard
          </button>

          <button onClick={() => navigate('/orders/new')}>
            🛒 New Order
          </button>

          <button onClick={() => navigate('/orders/history')}>
            📖 Order History
          </button>

          <button onClick={() => navigate('/menu')}>
            🍲 Menu Management
          </button>

          <button onClick={() => navigate('/users')}>
            👥 User Management
          </button>

          <button onClick={() => navigate('/reports')}>
            📊 Reports
          </button>

          <button onClick={() => navigate('/settings')}>
            ⚙️ Settings
          </button>

          <button
            className="logout-btn"
            onClick={() => navigate('/login')}
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      <main className="content">
        <h1>Dashboard</h1>

        <div className="stats-grid">
          <div className="card">
            <h3>Today's Orders</h3>
            <span>{stats.todayOrders}</span>
          </div>

          <div className="card revenue-card">
            <h3>Today's Revenue</h3>
            <span>
              ₹
              {Number(
                stats.todayRevenue
              ).toLocaleString()}
            </span>
          </div>

          <div className="card">
            <h3>Menu Items</h3>
            <span>{stats.menuItems}</span>
          </div>

          <div className="card">
            <h3>Users</h3>
            <span>{stats.users}</span>
          </div>
        </div>

        <div className="recent-orders">
          <div className="section-header">
            <h2>Recent Orders</h2>

            <button
              onClick={() =>
                navigate(
                  '/orders/history'
                )
              }
            >
              View All
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order No</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {stats.recentOrders.map(
                (
                  order: any,
                  index
                ) => (
                  <tr key={index}>
                    <td>
                      {
                        order.order_number
                      }
                    </td>

                    <td>
                      ₹
                      {
                        order.total_amount
                      }
                    </td>

                    <td>
                      {new Date(
                        order.created_at
                      ).toLocaleString()}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default Dashboard